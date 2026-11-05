/**
 * ZKP Session Data Model
 * 
 * Represents an ephemeral proof session initiated by a Prover with a commitment.
 * Enforces security constraints:
 * - Challenge expiration (TTL)
 * - Single-use challenge token (Replay Attack prevention)
 * - Session state machine: CREATED -> CHALLENGED -> VERIFIED / EXPIRED
 * - Never stores private witness (x) or secret nonce (r).
 */

class ZkpSession {
  /**
   * @param {Object} params
   * @param {string} params.id - Unique Session UUID
   * @param {string} params.username - Identified Prover
   * @param {bigint} params.publicKey - Prover's registered public key y
   * @param {bigint} params.commitment - Prover's commitment t
   * @param {number} [params.ttlMs=60000] - Expiration duration in milliseconds
   */
  constructor({ id, username, publicKey, commitment, ttlMs = 60000 }) {
    this.id = id;
    this.username = username || 'Anonymous Prover';
    this.publicKey = BigInt(publicKey);
    this.commitment = BigInt(commitment);
    this.challenge = null;
    this.response = null;
    this.createdAt = Date.now();
    this.expiresAt = this.createdAt + ttlMs;
    this.status = 'COMMITTED'; // 'COMMITTED' | 'CHALLENGED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
    this.isConsumed = false;
    this.verificationDetails = null;
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  setChallenge(challenge) {
    if (this.isExpired()) {
      this.status = 'EXPIRED';
      throw new Error('Session has expired. Cannot issue challenge.');
    }
    this.challenge = BigInt(challenge);
    this.status = 'CHALLENGED';
  }

  consume() {
    if (this.isConsumed) {
      throw new Error('Challenge replay detected! Challenge has already been consumed.');
    }
    this.isConsumed = true;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      publicKey: this.publicKey.toString(),
      commitment: this.commitment.toString(),
      challenge: this.challenge ? this.challenge.toString() : null,
      response: this.response ? this.response.toString() : null,
      createdAt: new Date(this.createdAt).toISOString(),
      expiresAt: new Date(this.expiresAt).toISOString(),
      isExpired: this.isExpired(),
      isConsumed: this.isConsumed,
      status: this.isExpired() ? 'EXPIRED' : this.status,
      verificationDetails: this.verificationDetails
    };
  }
}

module.exports = ZkpSession;

