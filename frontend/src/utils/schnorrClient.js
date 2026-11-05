/**
 * Client-Side Schnorr ZKP Cryptographic Engine
 * 
 * Public parameters for educational demonstration:
 * p = 23n (prime modulus)
 * q = 11n (subgroup order)
 * g = 2n  (generator)
 * 
 * In this client engine:
 * - Secret x and random nonce r remain STRICTLY on the Prover's device (browser memory).
 * - Only public key y, commitment t, and response z are ever transmitted to the Verifier.
 */

export const EDUCATIONAL_PARAMS = {
  p: 23n,
  q: 11n,
  g: 2n,
  name: "Educational Small Group (p=23, q=11, g=2)"
};

/**
 * Standard non-negative modulo helper
 */
export function mod(a, m) {
  const bigA = BigInt(a);
  const bigM = BigInt(m);
  if (bigM <= 0n) throw new Error('Modulus must be positive');
  const res = bigA % bigM;
  return res >= 0n ? res : res + bigM;
}

/**
 * Modular Exponentiation: (base^exponent) mod modulus
 */
export function modPow(base, exponent, modulus) {
  const modVal = BigInt(modulus);
  if (modVal <= 0n) throw new Error('Modulus must be positive');
  if (modVal === 1n) return 0n;

  let exp = BigInt(exponent);
  if (exp < 0n) throw new Error('Negative exponents not supported in direct modular exponentiation');

  let result = 1n;
  let b = mod(BigInt(base), modVal);

  while (exp > 0n) {
    if (exp & 1n) {
      result = mod(result * b, modVal);
    }
    exp >>= 1n;
    b = mod(b * b, modVal);
  }

  return result;
}

/**
 * Compute SHA-256 hash asynchronously using Web Crypto API
 */
export async function sha256Hex(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive private scalar x from user's demo secret (password/passphrase)
 * Maps uniform SHA-256 hash into scalar range [1, q - 1].
 */
export async function deriveScalarFromSecret(secret, q = EDUCATIONAL_PARAMS.q) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Secret must be a valid string');
  }

  const hashHex = await sha256Hex(secret);
  const hashBigInt = BigInt('0x' + hashHex);

  // Map into [1, q - 1]
  const qBig = BigInt(q);
  const scalar = (hashBigInt % (qBig - 1n)) + 1n;

  return {
    secret,
    hashHex,
    hashDecimal: hashBigInt.toString(),
    scalar
  };
}

/**
 * Compute Public Key y = g^x mod p
 */
export function computePublicKey(x, p = EDUCATIONAL_PARAMS.p, g = EDUCATIONAL_PARAMS.g) {
  const xBig = BigInt(x);
  if (xBig <= 0n) throw new Error('Scalar x must be positive');
  return modPow(BigInt(g), xBig, BigInt(p));
}

/**
 * Generate cryptographically secure random nonce r in range [1, q - 1]
 * Generated locally on the client.
 */
export function generateRandomNonce(q = EDUCATIONAL_PARAMS.q) {
  const qBig = BigInt(q);
  const max = Number(qBig - 1n);
  const randomArray = new Uint32Array(1);
  window.crypto.getRandomValues(randomArray);
  const r = BigInt((randomArray[0] % max) + 1);
  return r;
}

/**
 * Compute commitment t = g^r mod p
 */
export function computeCommitment(r, p = EDUCATIONAL_PARAMS.p, g = EDUCATIONAL_PARAMS.g) {
  const rBig = BigInt(r);
  if (rBig <= 0n) throw new Error('Nonce r must be positive');
  return modPow(BigInt(g), rBig, BigInt(p));
}

/**
 * Compute Prover response z = (r + e * x) mod q
 */
export function computeResponse(r, e, x, q = EDUCATIONAL_PARAMS.q) {
  return mod(BigInt(r) + BigInt(e) * BigInt(x), BigInt(q));
}

/**
 * Independent Client-Side Verification Checker
 * Allows the browser to visualize both LHS and RHS independently before or alongside backend check
 */
export function verifyEquation(y, t, e, z, p = EDUCATIONAL_PARAMS.p, g = EDUCATIONAL_PARAMS.g) {
  const yBig = BigInt(y);
  const tBig = BigInt(t);
  const eBig = BigInt(e);
  const zBig = BigInt(z);
  const pBig = BigInt(p);
  const gBig = BigInt(g);

  const gz = modPow(gBig, zBig, pBig); // LHS
  const ye = modPow(yBig, eBig, pBig);
  const rhs = mod(tBig * ye, pBig);     // RHS

  return {
    lhs: gz,
    rhs,
    isValid: gz === rhs,
    steps: {
      gz,
      ye,
      rhs
    }
  };
}

