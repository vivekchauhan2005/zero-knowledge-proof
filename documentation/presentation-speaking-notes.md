# Presentation Speaking Notes: 10-Minute Faculty Presentation

**Project:** Zero-Knowledge Proof (ZKP) Authentication System  
**Subject:** Cryptography and Network Security  
**Speaker Notes Format:** Slide-by-slide script with cues and key emphasis points.

---

### Slide 1: Title & Introduction
- **Visual:** Project Title, Technology Stack (React, Node.js, Express, Schnorr ZKP), Student Details.
- **Speaking Script:**
  > *"Good morning, respected faculty and external examiners. Today, I am presenting our capstone project in Cryptography and Network Security: a fully functional **Zero-Knowledge Proof Authentication System** based on the **Schnorr Identification Protocol**. Our goal is to demonstrate that web authentication can be achieved with mathematical certainty without ever transmitting, hashing, or storing passwords on a server."*

---

### Slide 2: The Core Problem with Conventional Authentication
- **Visual:** Comparison graphic showing password transmission over TLS vs honeypot server database.
- **Speaking Script:**
  > *"Every day, we hear about massive database leaks where millions of password hashes are dumped online. Even with bcrypt or Argon2, GPUs can test billions of combinations per second. Furthermore, transmitting passwords over the wire—even encrypted with TLS—relies completely on trusting the server and intermediaries. If the server is malicious or compromised, the user's password is stolen."*

---

### Slide 3: What is Zero-Knowledge Proof?
- **Visual:** The 3 Pillars: Completeness, Soundness, Zero-Knowledge.
- **Speaking Script:**
  > *"Zero-Knowledge Proofs allow a Prover to prove possession of a secret to a Verifier without revealing any information about the secret itself. Any valid ZKP system must satisfy three theoretical requirements:  
  > 1) **Completeness:** An honest prover is always accepted.  
  > 2) **Soundness:** A malicious prover without the secret is caught with high probability.  
  > 3) **Zero-Knowledge:** The verifier learns nothing except that the claim is true."*

---

### Slide 4: Mathematical Foundation — The Schnorr Protocol
- **Visual:** Prime subgroup parameters ($p=23, q=11, g=2$) and Discrete Logarithm equation $y = g^x \pmod p$.
- **Speaking Script:**
  > *"We chose Claus-Peter Schnorr's protocol based on the Discrete Logarithm Problem. For transparent blackboard verification, our demonstration uses prime modulus $p=23$, subgroup order $q=11$, and generator $g=2$. This allows anyone to verify calculations by hand in under ten seconds. The user's password is mapped to a private scalar $x$. The server only stores the public key $y = 2^x \pmod{23}$. Reversing $y$ to find $x$ requires solving the discrete logarithm."*

---

### Slide 5: The 5-Step Protocol Workflow
- **Visual:** Sequential flowchart showing Commitment $t$, Challenge $e$, and Response $z$.
- **Speaking Script:**
  > *"The protocol operates in five distinct phases:  
  > First, Alice derives her private witness $x$ locally in her browser.  
  > Second, Alice generates a random nonce $r$ and commits to $t = g^r \pmod p$.  
  > Third, Bob issues a cryptographically secure random challenge $e$.  
  > Fourth, Alice responds with $z = (r + e \cdot x) \pmod q$. Notice that $r$ acts as a one-time pad masking $x$.  
  > Fifth, Bob verifies: does $g^z \pmod p$ equal $t \cdot y^e \pmod p$? If yes, authentication succeeds!"*

---

### Slide 6: System Architecture & Separation of Concerns
- **Visual:** Client Prover Vault (React) separated from Server Verifier (Express).
- **Speaking Script:**
  > *"Our architecture strictly enforces the zero-knowledge boundary. The private witness $x$ and nonce $r$ live solely in the client browser's memory using the Web Crypto API. The REST API only transmits public keys, commitments, challenges, and responses. The server independently verifies both sides using Node.js BigInt modular arithmetic."*

---

### Slide 7: Live Demonstration (Switch to Browser)
- **Visual:** Browser showing Dual Console and Step Walkthrough.
- **Speaking Script:**
  > *[Action: Open http://localhost:5173]*  
  > *"Let us see the live implementation. On the left is the Prover Vault (Alice); on the right is the Verifier API (Bob). When I click 'Send Commitment', Alice generates nonce $r$, computes $t$, registers her public key, and receives challenge $e=4$ from Bob. Alice computes $z=6$. When she submits $z$, Bob computes LHS $= 2^6 \pmod{23} = 18$ and RHS $= 9 \times 8^4 \pmod{23} = 18$. The match is exact, and authentication succeeds!"*

---

### Slide 8: Negative Testing & Attack Simulation Lab
- **Visual:** Browser showing the Attack Lab with red rejected badges.
- **Speaking Script:**
  > *"An authentication system is only as good as its defenses against malicious actors. In our Attack Lab, we simulate real attacks against the backend:  
  > If an attacker tampers with response $z$ from 6 to 7, the equation fails ($13 \ne 18$) and the proof is REJECTED.  
  > If an eavesdropper captures the proof and replays it, our backend blocks it because each session challenge is consumed on first use.  
  > If an attacker submits a response after 60 seconds, it is rejected due to session expiration."*

---

### Slide 9: Automated Testing & Verification
- **Visual:** Jest terminal output showing 24/24 tests passing.
- **Speaking Script:**
  > *"We verified the cryptographic engine and API endpoints with 24 automated unit and integration tests using Jest and Supertest. All tests pass with 100% coverage across modular exponentiation, scalar derivation, replay prevention, and expiration handling."*

---

### Slide 10: Conclusion & Q&A
- **Visual:** Summary of benefits, thank you slide.
- **Speaking Script:**
  > *"In conclusion, this project proves that Zero-Knowledge Proofs provide a practical, mathematically sound alternative to password-based authentication. We thank our faculty for their guidance and welcome your questions."*

