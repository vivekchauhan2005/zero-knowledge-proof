const {
  mod,
  modPow,
  deriveScalar,
  computePublicKey,
  generateNonce,
  computeCommitment,
  generateChallenge,
  computeResponse,
  verifyProof
} = require('../utils/schnorr');
const { EDUCATIONAL_PARAMS } = require('../config/constants');

describe('Schnorr ZKP Cryptographic Primitives Unit Tests', () => {
  const { p, q, g } = EDUCATIONAL_PARAMS;

  test('1. Modular arithmetic mod(a, m) handles positive and negative integers', () => {
    expect(mod(7n, 5n)).toBe(2n);
    expect(mod(-1n, 11n)).toBe(10n);
    expect(mod(-13n, 11n)).toBe(9n);
    expect(mod(0n, 11n)).toBe(0n);
  });

  test('2. Modular exponentiation modPow(base, exponent, modulus) computes correct values', () => {
    // 2^0 mod 23 = 1
    expect(modPow(2n, 0n, 23n)).toBe(1n);
    // 2^1 mod 23 = 2
    expect(modPow(2n, 1n, 23n)).toBe(2n);
    // 2^4 mod 23 = 16
    expect(modPow(2n, 4n, 23n)).toBe(16n);
    // 2^5 mod 23 = 32 mod 23 = 9
    expect(modPow(2n, 5n, 23n)).toBe(9n);
    // 2^11 mod 23 = 2048 mod 23 = 1 (Order of generator g=2 is q=11)
    expect(modPow(2n, 11n, 23n)).toBe(1n);
    // Euler's theorem: 2^22 mod 23 = 1
    expect(modPow(2n, 22n, 23n)).toBe(1n);
  });

  test('3. Secret-to-scalar derivation generates valid non-zero scalar in [1, q - 1]', () => {
    const derived = deriveScalar('my-secret-passphrase-2026', q);
    expect(derived).toHaveProperty('secret', 'my-secret-passphrase-2026');
    expect(derived).toHaveProperty('hash');
    expect(derived.hash).toHaveLength(64); // SHA-256 hex string
    expect(typeof derived.scalar).toBe('bigint');
    expect(derived.scalar).toBeGreaterThanOrEqual(1n);
    expect(derived.scalar).toBeLessThanOrEqual(q - 1n);

    // Deterministic: Same secret gives same scalar
    const derived2 = deriveScalar('my-secret-passphrase-2026', q);
    expect(derived2.scalar).toBe(derived.scalar);

    // Different secret gives different hash
    const derivedOther = deriveScalar('different-password', q);
    expect(derivedOther.hash).not.toBe(derived.hash);
  });

  test('4. Public key generation y = g^x mod p', () => {
    // For x = 3, y = 2^3 mod 23 = 8
    expect(computePublicKey(3n, p, g)).toBe(8n);

    // For x = 5, y = 2^5 mod 23 = 32 mod 23 = 9
    expect(computePublicKey(5n, p, g)).toBe(9n);

    // For x = 11, y = 2^11 mod 23 = 1
    expect(computePublicKey(11n, p, g)).toBe(1n);
  });

  test('5. Commitment generation t = g^r mod p with random nonce r in [1, q-1]', () => {
    const r = generateNonce(q);
    expect(r).toBeGreaterThanOrEqual(1n);
    expect(r).toBeLessThanOrEqual(q - 1n);

    const t = computeCommitment(r, p, g);
    expect(t).toBeGreaterThanOrEqual(1n);
    expect(t).toBeLessThan(p);

    // If r = 4, t = 2^4 mod 23 = 16
    expect(computeCommitment(4n, p, g)).toBe(16n);
  });

  test('6. Challenge generation e in range [1, q - 1]', () => {
    for (let i = 0; i < 20; i++) {
      const e = generateChallenge(q);
      expect(e).toBeGreaterThanOrEqual(1n);
      expect(e).toBeLessThanOrEqual(q - 1n);
    }
  });

  test('7. Response generation z = (r + e * x) mod q', () => {
    // r = 5, e = 4, x = 3
    // z = (5 + 4 * 3) mod 11 = 17 mod 11 = 6
    const z = computeResponse(5n, 4n, 3n, q);
    expect(z).toBe(6n);
  });

  test('8. Successful verification: Honest prover produces valid proof (Completeness)', () => {
    // Setup secret and public key
    const x = 3n; // private secret scalar
    const y = computePublicKey(x, p, g); // y = 2^3 mod 23 = 8

    // Prover commitment
    const r = 5n; // private random nonce
    const t = computeCommitment(r, p, g); // t = 2^5 mod 23 = 9

    // Verifier challenge
    const e = 4n;

    // Prover response
    const z = computeResponse(r, e, x, q); // z = (5 + 12) mod 11 = 6

    // Verifier verification
    const result = verifyProof(y, t, e, z, p, g);
    expect(result.isValid).toBe(true);
    expect(result.lhs).toBe(result.rhs);
    // Check actual values: 2^6 mod 23 = 64 mod 23 = 18
    expect(result.lhs).toBe(18n);
    // RHS = (9 * 8^4) mod 23 = (9 * 2) mod 23 = 18
    expect(result.rhs).toBe(18n);
  });

  test('9. Failed verification: Modified response is rejected (Soundness)', () => {
    const x = 3n;
    const y = computePublicKey(x, p, g);
    const r = 5n;
    const t = computeCommitment(r, p, g);
    const e = 4n;
    const validZ = computeResponse(r, e, x, q); // 6n

    // Attacker modifies response to 7n
    const tamperedZ = mod(validZ + 1n, q);
    const result = verifyProof(y, t, e, tamperedZ, p, g);

    expect(result.isValid).toBe(false);
    expect(result.lhs).not.toBe(result.rhs);
  });

  test('10. Failed verification: Attacker with wrong secret is rejected', () => {
    const honestSecret = 3n;
    const honestPublicKey = computePublicKey(honestSecret, p, g); // y = 8

    const attackerSecret = 7n; // Attacker doesn't know x=3
    const r = 5n;
    const t = computeCommitment(r, p, g);
    const e = 4n;

    // Attacker responds using their wrong secret
    const attackerZ = computeResponse(r, e, attackerSecret, q);

    const result = verifyProof(honestPublicKey, t, e, attackerZ, p, g);
    expect(result.isValid).toBe(false);
    expect(result.lhs).not.toBe(result.rhs);
  });

  test('11. Input validation handles out-of-range public parameters safely', () => {
    const result = verifyProof(0n, 9n, 4n, 6n, p, g);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Public key y must be in range');

    const resultCommitment = verifyProof(8n, 25n, 4n, 6n, p, g);
    expect(resultCommitment.isValid).toBe(false);
    expect(resultCommitment.error).toContain('Commitment t must be in range');
  });
});

