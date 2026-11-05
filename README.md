# Zero-Knowledge Proof (ZKP) Authentication System

An academic full-stack web application implementing the **Schnorr Zero-Knowledge Identification Protocol** for passwordless, leak-proof authentication.

Built for **Cryptography and Network Security** (3rd-Year Computer Science Engineering Capstone).

---

## 🚀 Features

- **Actual Schnorr Protocol Implementation:** Pure BigInt modular exponentiation and arithmetic ($p=23, q=11, g=2$) with transparent blackboard verifiability.
- **Client-Side Secret Shielding:** Private witness scalar ($x$) and ephemeral nonce ($r$) are derived and sealed exclusively in client browser memory (Web Crypto API).
- **Dual-Console Live Authentication:** Split-screen interactive console showing Prover Vault (Alice) and Verifier API (Bob) communicating over REST.
- **5-Stage Interactive Walkthrough:** Animated data packet transmission illustrating public wire data versus private vault secrets.
- **Dynamic Mathematical Verifier:** Dynamic algebraic evaluator computing both $\text{LHS} = g^z \pmod p$ and $\text{RHS} = (t \cdot y^e) \pmod p$ in real-time.
- **Adversarial Attack Simulation Lab:** 8 real attack scenarios (tampered response, replay attack, expired session, blind guesser) tested against the backend.
- **Privacy-Compliant Audit Log:** Zero-leakage audit log recording only public session metadata.
- **Academic Preparation Suite:** College project report, 25+ viva questions & answers, presentation speaking notes, and architecture diagrams.
- **Automated Test Suite:** 24 unit and integration tests passing with 100% success rate.

---

## 🛠️ Technology Stack

- **Frontend:** React.js 18, Vite 6, Tailwind CSS 3.4, Lucide React, Web Crypto API
- **Backend:** Node.js, Express.js 4.21, JavaScript BigInt, Node.js Crypto module
- **Testing:** Jest 29, Supertest 7
- **Operating System:** Windows, macOS, Linux (Ready to run in VS Code)

---

## 📐 Public Cryptographic Parameters

For classroom educational demonstration:
- **Prime Modulus ($p$):** `23`
- **Subgroup Order ($q$):** `11` (where $11 \mid (23 - 1 = 22)$)
- **Generator ($g$):** `2` ($\text{ord}(g) = 11$, since $2^{11} \equiv 2048 \equiv 1 \pmod{23}$)

> **Note on Security:** These small parameters are designed for blackboard hand calculations and student tracing. Production deployments require 2048-bit MODP groups (RFC 3526) or elliptic curves (Ed25519).

---

## ⚡ Quick Start Guide (Windows / VS Code)

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Run Automated Test Suite
Verify that all 24 cryptographic and API integration tests pass:
```bash
npm run test:backend
# or: cd backend && npm test
```

### 3. Start the Application
Open two terminal windows in VS Code:

**Terminal 1 (Backend Verifier API):**
```bash
npm run start:backend
# -> Running at http://localhost:5000
```

**Terminal 2 (Frontend React App):**
```bash
npm run start:frontend
# -> Running at http://localhost:5173
```

---

## 🌐 Localhost URLs

| Component | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Interactive ZKP Authentication Dashboard |
| **Backend API Root** | [http://localhost:5000](http://localhost:5000) | Express Verifier Root |
| **API Health Check** | [http://localhost:5000/api/zkp/health](http://localhost:5000/api/zkp/health) | Verifier Status Endpoint |
| **API Parameters** | [http://localhost:5000/api/zkp/params](http://localhost:5000/api/zkp/params) | Public Parameters ($p, q, g$) |

---

## 🧪 Test Execution Results

```text
PASS tests/api.test.js
  Schnorr ZKP API End-to-End Integration Tests
    √ 1. GET /api/zkp/health returns healthy status
    √ 2. GET /api/zkp/params returns public mathematical parameters
    √ 3. POST /api/zkp/register registers a user public key
    √ 4. POST /api/zkp/register rejects invalid inputs
    √ 5. POST /api/zkp/commitment initializes session with commitment t
    √ 6. POST /api/zkp/challenge issues a random challenge for active session
    √ 7. POST /api/zkp/verify successfully verifies honest response (ACCEPTED)
    √ 8. POST /api/zkp/verify rejects replayed challenge on already consumed session
    √ 9. POST /api/zkp/verify rejects modified / tampered response
    √ 10. POST /api/zkp/verify rejects expired challenge session
    √ 11. POST /api/zkp/verify rejects nonexistent / invalid session ID
    √ 12. POST /api/zkp/simulate verifies arbitrary parameters directly for attack lab
    √ 13. GET /api/zkp/history returns recorded audit trail and DELETE clears it

PASS tests/crypto.test.js
  Schnorr ZKP Cryptographic Primitives Unit Tests
    √ 1. Modular arithmetic mod(a, m) handles positive and negative integers
    √ 2. Modular exponentiation modPow(base, exponent, modulus) computes correct values
    √ 3. Secret-to-scalar derivation generates valid non-zero scalar in [1, q - 1]
    √ 4. Public key generation y = g^x mod p
    √ 5. Commitment generation t = g^r mod p with random nonce r in [1, q-1]
    √ 6. Challenge generation e in range [1, q - 1]
    √ 7. Response generation z = (r + e * x) mod q
    √ 8. Successful verification: Honest prover produces valid proof (Completeness)
    √ 9. Failed verification: Modified response is rejected (Soundness)
    √ 10. Failed verification: Attacker with wrong secret is rejected
    √ 11. Input validation handles out-of-range public parameters safely

Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        1.627 s
```

---

## 📁 Project Structure

```text
zero_knowledge/
├── backend/
│   ├── config/
│   │   └── constants.js             # Cryptographic constants (p=23, q=11, g=2)
│   ├── controllers/
│   │   └── zkpController.js         # REST route controller
│   ├── middleware/
│   │   ├── errorHandler.js          # Centralized error handler
│   │   └── validator.js             # Input validation middleware
│   ├── models/
│   │   └── session.js               # Ephemeral proof session model (TTL & replay guard)
│   ├── routes/
│   │   └── zkpRoutes.js             # API route definitions
│   ├── services/
│   │   └── zkpService.js            # Schnorr verification service & audit history
│   ├── utils/
│   │   └── schnorr.js               # BigInt modular exponentiation & primitives
│   ├── tests/
│   │   ├── api.test.js              # Integration test suite (13 tests)
│   │   └── crypto.test.js           # Unit test suite (11 tests)
│   ├── server.js                    # Express application entrypoint
│   ├── package.json                 # Backend dependencies & test scripts
│   └── .env.example                 # Environment configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Global navigation & live Verifier status
│   │   │   ├── LandingHero.jsx      # Module 1: Hero, 3 ZKP pillars & overview
│   │   │   ├── DualConsoleDashboard.jsx # Module 2: Split Prover & Verifier console
│   │   │   ├── StepWalkthrough.jsx  # Module 3: 5-step interactive workflow
│   │   │   ├── MathVerification.jsx # Module 4: Dynamic equation calculator
│   │   │   ├── AttackLab.jsx        # Module 5: 8 adversarial attack vectors
│   │   │   ├── AuditHistory.jsx     # Module 6: Privacy-compliant audit log
│   │   │   └── VivaAndArchitecture.jsx # Module 7: Viva Q&A & architecture diagram
│   │   ├── services/
│   │   │   └── api.js               # REST client for backend API
│   │   ├── utils/
│   │   │   └── schnorrClient.js     # Client-side cryptographic engine & Web Crypto
│   │   ├── App.jsx                  # Main application container
│   │   ├── main.jsx                 # React root DOM mount
│   │   └── index.css                # Tailwind directives & glow effects
│   ├── index.html                   # HTML template
│   ├── vite.config.js               # Vite configuration with /api proxy
│   ├── tailwind.config.js           # Tailwind theme & color extensions
│   ├── postcss.config.js            # PostCSS configuration
│   └── package.json                 # Frontend dependencies & build scripts
├── documentation/
│   ├── architecture.md              # System architecture & Data Flow Diagrams
│   ├── cryptography.md              # Mathematical proofs (Completeness, Soundness, ZK)
│   ├── api-documentation.md         # Full REST API specification with curl examples
│   ├── demonstration-guide.md       # Step-by-step script for faculty demo
│   ├── college-project-report.md    # 15-section university-grade academic project report
│   ├── viva-questions-answers.md    # 25 curated viva questions & answers
│   └── presentation-speaking-notes.md # Slide-by-slide 10-minute presentation script
├── .gitignore
├── .env.example
├── package.json                     # Root orchestrator scripts
└── README.md                        # Master project documentation
```

---

## 📚 Complete Academic Documentation

All academic deliverables required for university presentation are located in the `documentation/` folder:
- [College Project Report](documentation/college-project-report.md)
- [System Architecture & DFD](documentation/architecture.md)
- [Cryptographic Proofs](documentation/cryptography.md)
- [REST API Documentation](documentation/api-documentation.md)
- [Live Demonstration Guide](documentation/demonstration-guide.md)
- [Viva Questions & Answers](documentation/viva-questions-answers.md)
- [Presentation Speaking Notes](documentation/presentation-speaking-notes.md)

