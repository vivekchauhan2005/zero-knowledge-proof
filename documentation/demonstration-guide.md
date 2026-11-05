# Live Demonstration Guide for College Faculty & External Examiners

This guide provides a structured, high-impact demonstration script for your Cryptography & Network Security project presentation.

---

## 1. Pre-Demonstration Checklist

1. Open PowerShell or Terminal in VS Code.
2. Start the application:
   ```bash
   # In terminal 1 (Backend):
   npm run start:backend
   # -> Running on http://localhost:5000

   # In terminal 2 (Frontend):
   npm run start:frontend
   # -> Running on http://localhost:5173
   ```
3. Open browser at `http://localhost:5173`.
4. Ensure the top-right indicator shows: `Verifier API Live` (green).

---

## 2. Live Demo Script (Step-by-Step)

### Phase 1: High-Level Problem & Architecture (2 minutes)
1. **Explain the Vulnerability of Conventional Auth:**
   - *"Respected faculty, in conventional authentication (such as passwords hashed with bcrypt on servers), users must transmit their raw password over the wire, and servers store password hashes. If a database is breached or a man-in-the-middle occurs, credentials are compromised."*
2. **Introduce Zero-Knowledge Proofs:**
   - *"Our system eliminates passwords from transmission and server databases entirely. We implement the Schnorr Zero-Knowledge Identification Protocol over prime group $p=23, q=11, g=2$."*
3. **Show the 3 ZKP Pillars on Screen:**
   - Point out **Completeness**, **Soundness**, and **Zero-Knowledge** cards on the landing page.

---

### Phase 2: Dual Console Live Authentication (3 minutes)
1. Navigate to the **ZKP Dual Console** tab.
2. Highlight the **Prover Vault (Client / Alice)** on the left and **Verifier API (Bob / Server)** on the right.
3. Show the demo secret: `"student-crypto-2026"`.
   - Point out: *"Notice that the private witness $x$ is derived locally in the client browser using SHA-256 and mapped into $\mathbb{Z}_q^*$. It NEVER crosses the network!"*
4. Click **"1. Generate Nonce & Send Commitment (t)"**:
   - Show that Alice picked random nonce $r$, calculated $t = g^r \pmod p$, and sent $t$ to Bob.
   - Show Bob issuing challenge $e$.
   - Show Alice computing response $z = (r + e \cdot x) \pmod q$.
5. Click **"2. Transmit Response (z) to Verifier API"**:
   - The backend Verifier independently computes:
     - $\text{LHS} = g^z \pmod p$
     - $\text{RHS} = (t \cdot y^e) \pmod p$
   - Show the green **PROOF ACCEPTED** badge with equation confirmation ($\text{LHS} = \text{RHS}$).

---

### Phase 3: Whiteboard Math Verification (2 minutes)
1. Click **"Switch to Direct Scalar x (1-10)"** and set $x = 3$.
2. Navigate to the **Math Verification** tab.
3. Show faculty that they can check every calculation on paper or on the blackboard:
   - $p = 23, q = 11, g = 2$
   - $y = 2^3 \pmod{23} = 8$
   - Let $r = 5 \implies t = 2^5 \pmod{23} = 9$
   - Let $e = 4$
   - $z = (5 + 4 \times 3) \pmod{11} = 17 \pmod{11} = 6$
   - $\text{LHS} = 2^6 \pmod{23} = 64 \pmod{23} = 18$
   - $\text{RHS} = (9 \times 8^4) \pmod{23} = (9 \times 2) \pmod{23} = 18$
   - $\text{LHS} \equiv \text{RHS} = 18 \implies$ **MATCH!**

---

### Phase 4: Negative Testing & Attack Simulation Lab (3 minutes)
1. Navigate to the **Attack Simulation Lab** tab.
2. Click **"SIMULATE INVALID PROOF"** or select **"2. Tampered / Modified Response (z + 1)"**:
   - Click **"Execute Scenario Against Backend"**.
   - Show the red **PROOF REJECTED** badge.
   - Explain: *"An active adversary modified $z$ in transit from 6 to 7. The backend calculates $\text{LHS} = 2^7 \pmod{23} = 13$, while $\text{RHS} = 18$. Because $13 \ne 18$, the mathematical verification rejects the forged proof immediately."*
3. Demonstrate **Replay Attack Resistance**:
   - Select scenario 6.
   - Show that resubmitting an intercepted proof fails with: `Replay attack prevented: Challenge was already consumed for this session`.
4. Demonstrate **Expired Challenge Session**:
   - Select scenario 5.
   - Show that time-to-live expiration rejects delayed submissions.

---

### Phase 5: Privacy Compliance in Audit History (1 minute)
1. Navigate to the **Audit History** tab.
2. Show the log table:
   - Point out that every authentication attempt is recorded with session ID, timestamp, public parameters, $y, t, e, z$, and LHS/RHS verdict.
   - Emphasize to the faculty: *"Notice that columns for private witness $x$ or random nonce $r$ do not exist. Even if the server log is subpoenaed or leaked, zero secret material is exposed."*

---

## 3. Quick Answers to Expected Faculty Questions

- **Q: Why is p=23 secure enough?**
  - *A: p=23 is strictly for academic and classroom demonstration so that faculty can verify each modular exponentiation by hand. In production, we substitute RFC 3526 2048-bit MODP parameters or elliptic curve cryptography (Ed25519).*
- **Q: What is the cheating probability?**
  - *A: In our small demo group ($q=11$), an attacker has a $1/11 \approx 9\%$ chance of lucky guessing. In production with a 256-bit prime order $q$, the probability is $1/2^{256} \approx 8.6 \times 10^{-78}$, which is cryptographically negligible.*
- **Q: Does this use Fiat-Shamir?**
  - *A: This is the interactive 3-pass Schnorr Identification protocol. Fiat-Shamir heuristic transforms it into a non-interactive digital signature by computing $e = H(g, y, t, m)$.*

