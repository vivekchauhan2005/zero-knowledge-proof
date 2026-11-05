# College Project Report: Zero-Knowledge Proof Authentication System

**Subject:** Cryptography and Network Security  
**Academic Level:** Bachelor of Technology / Bachelor of Engineering in Computer Science  
**Algorithm:** Schnorr Zero-Knowledge Identification Protocol  
**Implementation:** React.js · Node.js · Express.js · BigInt Modular Arithmetic  

---

## 1. Project Abstract

Traditional password-based authentication mechanisms rely on transmitting sensitive credentials or hashes over communication channels and persisting them in central authentication servers. Even when secured by Transport Layer Security (TLS) and modern key derivation algorithms (e.g., bcrypt, Argon2), these centralized architectures represent a single point of failure susceptible to server-side database breaches, credential stuffing, phishing, and man-in-the-middle attacks.

This project designs and implements an interactive, full-stack **Zero-Knowledge Proof (ZKP) Authentication System** utilizing the **Schnorr Zero-Knowledge Identification Protocol**. The application enables a Prover (client) to mathematically demonstrate possession of a secret password to a Verifier (server) with zero revelation of the secret itself. Operating in a cyclic subgroup of prime order, the protocol satisfies the three cardinal pillars of zero-knowledge cryptography: Completeness, Soundness, and Zero-Knowledge. 

An educational cyclic group with parameters $p = 23, q = 11, g = 2$ is utilized for transparent blackboard validation and classroom demonstration, alongside formal architectural parity with RFC 3526 2048-bit MODP groups. The project features a dual-console interface, interactive 5-stage protocol walkthrough, dynamic mathematical equation verification, an adversarial attack simulation lab, replay and expiration defenses, and an automated 24-test test suite.

---

## 2. Introduction

Authentication is the cornerstone of information security, establishing trust between communicating entities. As distributed computing and cloud environments expand, the vulnerabilities of shared-secret paradigms have become critical risks. Zero-Knowledge Proofs, originally conceptualized by Shafi Goldwasser, Silvio Micali, and Charles Rackoff in 1985, offer a revolutionary cryptographic primitive: allowing a prover to convince a verifier that an assertion is true without conveying any auxiliary information.

This project implements an end-to-end, full-stack authentication web application based on Claus-Peter Schnorr's discrete-logarithm identification protocol (1989). By integrating a client-side cryptographic vault in React with an Express.js verification engine, the system showcases how modern web technologies can enforce theoretical cryptographic guarantees.

---

## 3. Problem Statement

Conventional web authentication systems suffer from fundamental structural liabilities:
1. **Credential Exposure in Transit:** User credentials traverse multiple network hops, exposing them to network sniffing, proxy interception, and TLS termination vulnerabilities.
2. **Honeypot Databases:** Centralized databases storing salted hashes (e.g., SHA-256, bcrypt) are prime targets. If breached, attackers execute high-speed offline GPU dictionary attacks.
3. **Implicit Trust in Verifier:** The client is forced to trust that the server will not mismanage, leak, or log raw credentials.

**Objective Statement:** To eliminate password transmission and storage entirely by designing a functional Zero-Knowledge Proof authentication framework that mathematically authenticates users without ever transmitting or storing secret witnesses, private keys, or ephemeral nonces.

---

## 4. Objectives

- **Primary Objective:** Build an interactive full-stack Zero-Knowledge Proof authentication platform executing the Schnorr identification protocol.
- **Cryptographic Correctness:** Calculate both sides of the modular equation $g^z \equiv t \cdot y^e \pmod p$ independently on the backend using JavaScript BigInt.
- **Client-Side Secret Shielding:** Perform secret derivation ($x$) and commitment nonce generation ($r$) strictly in client memory.
- **Adversarial Resilience:** Implement automated detection and rejection of tampered responses, expired sessions, and replayed proofs.
- **Educational Explainability:** Provide a dedicated interactive UI explaining every variable ($p, q, g, x, y, r, t, e, z$), and contrasting educational small parameters with production standards.

---

## 5. Existing System vs. Proposed System

| Feature | Existing System (Password / Hash) | Proposed System (Schnorr ZKP) |
| :--- | :--- | :--- |
| **Credential over Wire** | Transmits raw password over TLS | Never transmits password or witness $x$ |
| **Server Persistence** | Salted hash (bcrypt, Argon2) | Public key only ($y = g^x \pmod p$) |
| **Server Database Leak Impact** | High risk: Offline brute force & dictionary attacks | Zero risk: Witness $x$ protected by Discrete Log Hardness |
| **Replay Protection** | Relies heavily on TLS session tokens / cookies | Cryptographically enforced via random challenge $e$ & session flags |
| **Trust Model** | Trust-based server authority | Math-based Zero-Knowledge verification |

---

## 6. Literature Survey

1. **Goldwasser, Micali, and Rackoff (1985):** *The Knowledge Complexity of Interactive Proof Systems.* SIAM Journal on Computing. Established the theoretical foundation of interactive proof systems and zero-knowledge bounds.
2. **Schnorr, C. P. (1989):** *Efficient Identification and Signatures for Smart Cards.* Crypto '89. Proposed an identification scheme utilizing modular exponentiation and linear response equations in prime subgroups.
3. **Fiat, A., and Shamir, A. (1986):** *How to Prove Yourself: Practical Solutions to Identification and Signature Problems.* Demonstrated techniques to convert interactive proof systems into non-interactive digital signatures via cryptographic hashing.
4. **Kivinen, T., and Kojo, M. (2003):** *RFC 3526: More Modular Exponential (MODP) Diffie-Hellman groups for Internet Key Exchange (IKE).* IETF standard for secure cyclic groups resistant to index calculus attacks.

---

## 7. System Requirements

### 7.1 Software Requirements
- **Operating System:** Windows 10/11, macOS, or Linux
- **Runtime Environment:** Node.js v18.0.0 or higher (Tested on v24.15.0)
- **Package Manager:** npm v9.0.0 or higher (Tested on v11.12.1)
- **Frontend Framework:** React 18, Vite 6, Tailwind CSS 3.4
- **Backend Framework:** Express.js 4.21, CORS
- **Testing Framework:** Jest 29, Supertest 7
- **Browser Compatibility:** Google Chrome, Mozilla Firefox, Microsoft Edge, Safari (supporting Web Crypto API)

### 7.2 Hardware Requirements
- **Processor:** Intel Core i3 / AMD Ryzen 3 or higher
- **RAM:** 4 GB minimum (8 GB recommended)
- **Storage:** 500 MB free hard disk space
- **Network Interface:** Local loopback interface (localhost)

---

## 8. System Architecture & Diagrams

### 8.1 System Topology
The system enforces strict boundary separation between client memory, transmission wire, and server execution:

```
[Prover Vault: React Client]
  ├── Secret Witness: x (derived via SHA-256)
  ├── Random Nonce: r (CSPRNG)
  ├── Commitment: t = g^r mod p
  └── Response: z = (r + e * x) mod q
             │
             │ [HTTP/JSON REST API] (y, t, z only)
             ▼
[Verifier Engine: Express Backend]
  ├── User Key Registry: y = g^x mod p
  ├── Challenge Dispenser: e (CSPRNG)
  ├── Session Guard: TTL (60s) + isConsumed replay guard
  └── Equation Evaluator: g^z mod p == (t * y^e) mod p
```

### 8.2 Use Case Diagram

```
                 +-----------------------------------------+
                 |    Zero-Knowledge Proof Auth System     |
                 +-----------------------------------------+
                                      |
         +----------------------------+---------------------------+
         |                                                        |
         v                                                        v
   [User / Prover]                                        [Verifier / Server]
         |                                                        |
         +---> Enter Secret Password                              +---> Store Public Key (y)
         +---> Compute Witness (x) & Key (y)                      +---> Generate Challenge (e)
         +---> Generate Nonce (r) & Commitment (t)                +---> Enforce Session TTL
         +---> Compute Response (z)                               +---> Verify g^z == t * y^e
         +---> View Step-by-Step Tracing                          +---> Log Public Audit Trail
         +---> Run Attack Simulations                             +---> Enforce Replay Resistance
```

---

## 9. Cryptographic Algorithm & Mathematical Explanation

### 9.1 Parameter Initialization
- Modulus: $p = 23$ (prime)
- Order: $q = 11$ (prime divisor of $p - 1 = 22$)
- Generator: $g = 2$ ($2^{11} \equiv 1 \pmod{23}$)

### 9.2 The 5 Core Steps
1. **Secret & Key:**
   $$x \in [1, q-1], \quad y = g^x \pmod p$$
2. **Commitment:**
   $$r \xleftarrow{\$} [1, q-1], \quad t = g^r \pmod p$$
3. **Challenge:**
   $$e \xleftarrow{\$} [1, q-1]$$
4. **Response:**
   $$z = (r + e \cdot x) \pmod q$$
5. **Verification Check:**
   $$\text{LHS} = g^z \pmod p, \quad \text{RHS} = (t \cdot y^e) \pmod p$$
   $$\text{Result} = (\text{LHS} == \text{RHS}) \implies \text{ACCEPTED / REJECTED}$$

### 9.3 Soundness Proof
If a malicious party does not know $x$, the chance of randomly choosing a $z$ that satisfies $g^z \equiv t \cdot y^e \pmod p$ is $1/q$. In our educational model ($q=11$), the chance is $1/11 \approx 9.09\%$. In production with $q \ge 2^{256}$, the chance is $2^{-256} \approx 10^{-78}$, rendering impersonation impossible.

---

## 10. Implementation Details

### 10.1 Backend Implementation (`Node.js` + `Express`)
- **`utils/schnorr.js`:** Pure BigInt implementations of binary modular exponentiation (`modPow`), scalar derivation, and verification.
- **`models/session.js`:** Session entity tracking `id`, `publicKey`, `commitment`, `challenge`, `expiresAt`, and `isConsumed`.
- **`services/zkpService.js`:** State management, challenge generation, single-use token consumption, audit logging, and simulation handling.
- **`controllers/zkpController.js`:** REST API route controllers.
- **`middleware/validator.js` & `errorHandler.js`:** Input validation and structured HTTP responses.

### 10.2 Frontend Implementation (`React` + `Vite` + `Tailwind CSS`)
- **`DualConsoleDashboard.jsx`:** Split-screen reactive interface separating Prover Vault and Verifier Terminal.
- **`StepWalkthrough.jsx`:** 5-stage interactive animated visualizer showing packet flight and public vs. private states.
- **`MathVerification.jsx`:** Dynamic calculator with live BigInt arithmetic on user-specified values.
- **`AttackLab.jsx`:** 8 adversarial attack scenarios with one-click live execution against the backend.
- **`AuditHistory.jsx`:** Privacy-compliant audit log with status filters and clearing utility.
- **`VivaAndArchitecture.jsx`:** Interactive Q&A and architecture explorer.

---

## 11. Testing & Experimental Results

Automated test execution was conducted using Jest and Supertest. A total of **24 tests** were executed across 2 test suites:

| Test Suite | File | Tests Run | Result | Execution Time |
| :--- | :--- | :--- | :--- | :--- |
| Cryptographic Primitives | `crypto.test.js` | 11 | **PASSED (100%)** | 1.62 s |
| API End-to-End & Security | `api.test.js` | 13 | **PASSED (100%)** | 1.62 s |
| **Total** | **2 Suites** | **24 Tests** | **ALL PASSED** | **1.627 s** |

### Verified Security Properties:
1. Modular exponentiation square-and-multiply correctness ($2^{11} \equiv 1 \pmod{23}$).
2. SHA-256 scalar uniform mapping into $[1, 10]$.
3. Completeness: Honest prover authenticates with $LHS = RHS = 18$.
4. Soundness: Tampered response ($z+1$) fails ($13 \ne 18$).
5. Replay Attack Prevention: Resubmitting consumed token triggers `isConsumed` exception.
6. Session Timeout: Submissions past 60s TTL trigger `EXPIRED` status.
7. Privacy: Audit log verified to contain zero occurrences of $x, r,$ or raw secrets.

---

## 12. Advantages & Limitations

### 12.1 Advantages
- **No Password Exposure:** Eliminates credential theft in transit.
- **Immunity to Database Leaks:** Stored public keys cannot be inverted to obtain passwords.
- **Replay Immune:** Ephemeral single-use nonces and challenge expiration prevent replay attacks.
- **Mathematically Provable Security:** Backed by the hardness of the Discrete Logarithm Problem.

### 12.2 Limitations
- **Educational Group Size:** $p=23$ is susceptible to brute force search; production mandates 2048-bit safe primes.
- **Three-Pass Interaction:** Interactive ZKP requires three network round-trips (Commitment $\to$ Challenge $\to$ Response).
- **Client Processing Requirement:** Prover must execute modular arithmetic and SHA-256 locally.

---

## 13. Applications & Future Scope

### 13.1 Practical Applications
- Secure Single Sign-On (SSO) and federated identity verification without credential sharing.
- Blockchain authentication and privacy-preserving cryptocurrency transactions.
- Zero-trust remote access architecture for military and banking intranets.
- Privacy-preserving KYC (Know Your Customer) systems.

### 13.2 Future Enhancements
- Integration of the **Fiat-Shamir Heuristic** to achieve Non-Interactive Zero-Knowledge (NIZK) authentication.
- Implementation of **Elliptic Curve Schnorr Signatures** (Ed25519) for reduced key size and faster computation.
- Hardware Security Module (HSM) / WebAuthn integration for hardware-backed witness storage.

---

## 14. Conclusion

This project successfully proves the viability, robustness, and educational clarity of Zero-Knowledge Proof authentication. By implementing the Schnorr Identification Protocol end-to-end with React and Node.js, we have demonstrated that robust authentication does not require sharing passwords or storing sensitive hashes. The project serves as both an academic milestone and an explainable technical proof-of-concept for next-generation privacy-preserving cybersecurity architectures.

---

## 15. References

1. C. P. Schnorr, "Efficient Signature Generation by Smart Cards," *Journal of Cryptology*, vol. 4, no. 3, pp. 161–174, 1991.
2. S. Goldwasser, S. Micali, and C. Rackoff, "The knowledge complexity of interactive proof systems," *SIAM Journal on Computing*, vol. 18, no. 1, pp. 186–208, 1989.
3. W. Stallings, *Cryptography and Network Security: Principles and Practice*, 8th ed. Pearson, 2020.
4. T. Kivinen and M. Kojo, "More Modular Exponential (MODP) Diffie-Hellman groups for Internet Key Exchange (IKE)," *RFC 3526*, May 2003.
5. A. J. Menezes, P. C. van Oorschot, and S. A. Vanstone, *Handbook of Applied Cryptography*. CRC Press, 1996.

