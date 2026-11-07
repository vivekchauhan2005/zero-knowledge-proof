const crypto = require('crypto');
const ZkpSession = require('../models/session');
const {
  deriveScalar,
  computePublicKey,
  generateNonce,
  computeCommitment,
  generateChallenge,
  computeResponse,
  verifyProof,
  modPow
} = require('../utils/schnorr');
const { EDUCATIONAL_PARAMS, RFC_3526_PARAMS, SESSION_CONFIG } = require('../config/constants');

class ZkpService {
  constructor() {
    // In-memory registered users store: username -> { username, publicKey, registeredAt }
    this.users = new Map();

    // In-memory active sessions store: sessionId -> ZkpSession
    this.sessions = new Map();

    // In-memory audit log store: Array of audit records
    this.auditHistory = [];

    // Pre-populate with standard demo user "Alice" with default secret "student-crypto-2026"
    this.initializeDemoUsers();
  }

  initializeDemoUsers() {
    try {
      const demoSecret = "student-crypto-2026";
      const derived = deriveScalar(demoSecret, EDUCATIONAL_PARAMS.q);
      const y = computePublicKey(derived.scalar, EDUCATIONAL_PARAMS.p, EDUCATIONAL_PARAMS.g);
      
      this.users.set("alice", {
        username: "alice",
        publicKey: y.toString(),
        registeredAt: new Date().toISOString(),
        demoNote: "Standard demonstration user (secret: student-crypto-2026, x=derived)"
      });
    } catch (e) {
      console.error("Failed to initialize demo users:", e.message);
    }
  }

  /**
   * Get public parameters
   */
  getParameters() {
    return {
      educational: {
        p: EDUCATIONAL_PARAMS.p.toString(),
        q: EDUCATIONAL_PARAMS.q.toString(),
        g: EDUCATIONAL_PARAMS.g.toString(),
        name: EDUCATIONAL_PARAMS.name,
        description: EDUCATIONAL_PARAMS.description
      },
      rfc3526: RFC_3526_PARAMS
    };
  }

  /**
   * Register a user's public key (Prover sends y, NEVER sends secret x)
   */
  registerUser(username, publicKey) {
    if (!username || typeof username !== 'string') {
      throw new Error('Valid username is required');
    }
    const yBig = BigInt(publicKey);
    if (yBig <= 0n || yBig >= EDUCATIONAL_PARAMS.p) {
      throw new Error(`Public key must be in range [1, p-1] (1 <= y <= ${EDUCATIONAL_PARAMS.p - 1n})`);
    }

    const cleanUsername = username.trim().toLowerCase();
    this.users.set(cleanUsername, {
      username: cleanUsername,
      publicKey: yBig.toString(),
      registeredAt: new Date().toISOString()
    });

    return {
      success: true,
      username: cleanUsername,
      publicKey: yBig.toString(),
      message: `User '${cleanUsername}' registered with public key y = ${yBig.toString()}`
    };
  }

  getUser(username) {
    if (!username) return null;
    return this.users.get(username.trim().toLowerCase()) || null;
  }

  listUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Prover initiates authentication session with commitment t = g^r mod p
   */
  createSession(username, publicKey, commitment, ttlMs = SESSION_CONFIG.CHALLENGE_EXPIRY_MS) {
    const cleanUsername = username ? username.trim().toLowerCase() : 'demo-prover';
    let y = null;

    // In secure authentication, server verifies against the user's registered public key
    if (this.users.has(cleanUsername)) {
      y = this.users.get(cleanUsername).publicKey;
    } else if (publicKey) {
      y = publicKey.toString();
      // Register newly seen user
      this.users.set(cleanUsername, {
        username: cleanUsername,
        publicKey: BigInt(publicKey).toString(),
        registeredAt: new Date().toISOString()
      });
    }

    if (!y) {
      throw new Error(`Public key not found for user '${cleanUsername}'. Please provide publicKey or register first.`);
    }

    const sessionId = crypto.randomUUID();
    const session = new ZkpSession({
      id: sessionId,
      username: cleanUsername,
      publicKey: y,
      commitment,
      ttlMs
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Verifier generates and issues cryptographically secure challenge e
   */
  issueChallenge(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found or invalid session ID');
    }
    if (session.isExpired()) {
      session.status = 'EXPIRED';
      throw new Error('Session has expired. Cannot issue challenge.');
    }
    if (session.challenge !== null) {
      return {
        sessionId: session.id,
        challenge: session.challenge.toString(),
        expiresAt: new Date(session.expiresAt).toISOString(),
        note: 'Existing active challenge returned'
      };
    }

    const e = generateChallenge(EDUCATIONAL_PARAMS.q);
    session.setChallenge(e);

    return {
      sessionId: session.id,
      challenge: e.toString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      status: session.status
    };
  }

  /**
   * Verifier verifies Prover's response z
   */
  verifySessionResponse(sessionId, responseZ) {
    const startTime = Date.now();
    const session = this.sessions.get(sessionId);

    if (!session) {
      const auditEntry = this.recordAudit({
        sessionId: sessionId || 'unknown',
        username: 'unknown',
        publicKey: 'N/A',
        commitment: 'N/A',
        challenge: 'N/A',
        response: responseZ ? responseZ.toString() : 'N/A',
        lhs: 'N/A',
        rhs: 'N/A',
        status: 'REJECTED',
        reason: 'Session not found or invalid session ID',
        durationMs: Date.now() - startTime
      });
      return {
        isValid: false,
        status: 'REJECTED',
        error: 'Session not found or invalid session ID',
        audit: auditEntry
      };
    }

    // 1. Check expiration
    if (session.isExpired()) {
      session.status = 'EXPIRED';
      const auditEntry = this.recordAudit({
        sessionId: session.id,
        username: session.username,
        publicKey: session.publicKey.toString(),
        commitment: session.commitment.toString(),
        challenge: session.challenge ? session.challenge.toString() : 'N/A',
        response: responseZ ? responseZ.toString() : 'N/A',
        lhs: 'N/A',
        rhs: 'N/A',
        status: 'REJECTED',
        reason: 'Challenge session expired (Time-To-Live exceeded)',
        durationMs: Date.now() - startTime
      });
      return {
        isValid: false,
        status: 'REJECTED',
        error: 'Challenge session has expired. Re-authenticate with a fresh commitment.',
        audit: auditEntry
      };
    }

    // 2. Check replay attack
    if (session.isConsumed) {
      const auditEntry = this.recordAudit({
        sessionId: session.id,
        username: session.username,
        publicKey: session.publicKey.toString(),
        commitment: session.commitment.toString(),
        challenge: session.challenge ? session.challenge.toString() : 'N/A',
        response: responseZ ? responseZ.toString() : 'N/A',
        lhs: 'N/A',
        rhs: 'N/A',
        status: 'REJECTED',
        reason: 'Replay attack prevented: Challenge was already consumed for this session',
        durationMs: Date.now() - startTime
      });
      return {
        isValid: false,
        status: 'REJECTED',
        error: 'Replay attack prevented: Challenge has already been used.',
        audit: auditEntry
      };
    }

    // Mark session as consumed to prevent replays
    session.consume();
    session.response = BigInt(responseZ);

    // 3. Cryptographic Mathematical Verification
    const z = BigInt(responseZ);
    const verification = verifyProof(
      session.publicKey,
      session.commitment,
      session.challenge,
      z,
      EDUCATIONAL_PARAMS.p,
      EDUCATIONAL_PARAMS.g
    );

    session.status = verification.isValid ? 'ACCEPTED' : 'REJECTED';
    session.verificationDetails = {
      lhs: verification.lhs.toString(),
      rhs: verification.rhs.toString(),
      steps: {
        gz: verification.steps.gz.toString(),
        ye: verification.steps.ye.toString(),
        t_ye: verification.steps.t_ye.toString()
      },
      durationMs: Date.now() - startTime
    };

    const auditEntry = this.recordAudit({
      sessionId: session.id,
      username: session.username,
      publicKey: session.publicKey.toString(),
      commitment: session.commitment.toString(),
      challenge: session.challenge.toString(),
      response: z.toString(),
      lhs: verification.lhs.toString(),
      rhs: verification.rhs.toString(),
      status: session.status,
      reason: verification.isValid 
        ? 'Proof accepted: LHS === RHS (g^z mod p === t * y^e mod p)' 
        : 'Proof rejected: LHS !== RHS (Mathematical verification equation failed)',
      durationMs: Date.now() - startTime
    });

    return {
      isValid: verification.isValid,
      status: session.status,
      sessionId: session.id,
      equation: {
        lhs: verification.lhs.toString(),
        rhs: verification.rhs.toString(),
        formula: "g^z mod p == (t * y^e) mod p",
        detailed: {
          g: EDUCATIONAL_PARAMS.g.toString(),
          p: EDUCATIONAL_PARAMS.p.toString(),
          q: EDUCATIONAL_PARAMS.q.toString(),
          z: z.toString(),
          t: session.commitment.toString(),
          y: session.publicKey.toString(),
          e: session.challenge.toString(),
          lhsCalculation: `(${EDUCATIONAL_PARAMS.g}^${z}) mod ${EDUCATIONAL_PARAMS.p} = ${verification.lhs.toString()}`,
          rhsCalculation: `(${session.commitment} * (${session.publicKey}^${session.challenge} mod ${EDUCATIONAL_PARAMS.p})) mod ${EDUCATIONAL_PARAMS.p} = ${verification.rhs.toString()}`,
          match: verification.isValid
        }
      },
      audit: auditEntry
    };
  }

  /**
   * Helper to execute direct cryptographic verification on arbitrary inputs
   * Useful for negative testing / attack simulation scenarios.
   */
  verifyDirect({ y, t, e, z }) {
    const startTime = Date.now();
    try {
      const yBig = BigInt(y);
      const tBig = BigInt(t);
      const eBig = BigInt(e);
      const zBig = BigInt(z);

      const verification = verifyProof(yBig, tBig, eBig, zBig, EDUCATIONAL_PARAMS.p, EDUCATIONAL_PARAMS.g);
      const status = verification.isValid ? 'ACCEPTED' : 'REJECTED';

      const auditEntry = this.recordAudit({
        sessionId: 'sim-' + crypto.randomUUID().slice(0, 8),
        username: 'attack-simulator',
        publicKey: yBig.toString(),
        commitment: tBig.toString(),
        challenge: eBig.toString(),
        response: zBig.toString(),
        lhs: verification.lhs.toString(),
        rhs: verification.rhs.toString(),
        status,
        reason: verification.isValid 
          ? 'Simulation: Valid parameters verified successfully'
          : 'Simulation: Verification equation mismatch (LHS != RHS)',
        durationMs: Date.now() - startTime
      });

      return {
        isValid: verification.isValid,
        status,
        equation: {
          lhs: verification.lhs.toString(),
          rhs: verification.rhs.toString(),
          match: verification.isValid
        },
        audit: auditEntry
      };
    } catch (err) {
      return {
        isValid: false,
        status: 'REJECTED',
        error: err.message,
        equation: { lhs: '0', rhs: '0', match: false }
      };
    }
  }

  /**
   * Audit logging - guarantees NO private secret or private nonce is ever logged
   */
  recordAudit(record) {
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: record.sessionId,
      username: record.username,
      publicKey: record.publicKey,
      commitment: record.commitment,
      challenge: record.challenge,
      response: record.response,
      lhs: record.lhs,
      rhs: record.rhs,
      status: record.status, // 'ACCEPTED' | 'REJECTED'
      reason: record.reason,
      durationMs: record.durationMs || 0
    };

    this.auditHistory.unshift(entry);

    if (this.auditHistory.length > SESSION_CONFIG.MAX_HISTORY_ENTRIES) {
      this.auditHistory.pop();
    }

    return entry;
  }

  getAuditHistory(filter) {
    if (!filter || filter === 'ALL') {
      return this.auditHistory;
    }
    return this.auditHistory.filter(item => item.status === filter);
  }

  clearAuditHistory() {
    this.auditHistory = [];
    return { success: true, message: 'Audit history cleared' };
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return session.toJSON();
  }
}

module.exports = new ZkpService();

