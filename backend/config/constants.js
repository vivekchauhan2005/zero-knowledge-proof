/**
 * Cryptographic and System Constants
 * 
 * Public parameters for educational demonstration:
 * p = 23 (prime number modulus)
 * q = 11 (order of generator g in Z_p*, where 11 divides 23 - 1 = 22)
 * g = 2  (generator element of order 11 modulo 23)
 * 
 * WARNING: These small parameters are exclusively for academic and educational
 * demonstration so that calculations can be manually verified on paper.
 * In production systems, standard RFC 3526 2048-bit or 3072-bit MODP groups
 * or elliptic curve groups (e.g. Ed25519, secp256k1) must be used.
 */

const EDUCATIONAL_PARAMS = {
  p: 23n, // Prime modulus
  q: 11n, // Subgroup order
  g: 2n,  // Generator
  name: "Educational Small Group (p=23, q=11, g=2)",
  description: "Designed for classroom blackboard calculations and step-by-step tracing."
};

// RFC 3526 2048-bit MODP Group representation metadata for academic comparison
const RFC_3526_PARAMS = {
  pBits: 2048,
  qBits: 256,
  generator: 2,
  name: "RFC 3526 2048-bit MODP Group (Production Standard)",
  description: "Standard discrete logarithm group resistant to index calculus and Pollard's rho attacks."
};

const SESSION_CONFIG = {
  CHALLENGE_EXPIRY_MS: 60 * 1000, // 60 seconds TTL
  MAX_HISTORY_ENTRIES: 100,
};

module.exports = {
  EDUCATIONAL_PARAMS,
  RFC_3526_PARAMS,
  SESSION_CONFIG
};

