# System Architecture Specification

## Zero Knowledge Proof (Schnorr) Authentication System

### 1. Architectural Overview

The application follows a client-server distributed architecture designed to uphold the fundamental zero-knowledge property: **the prover's private secret witness ($x$) and ephemeral nonce ($r$) never cross the network boundary**.

```mermaid
flowchart LR
    subgraph Client["Client (Prover Vault / React.js)"]
        direction TB
        PW["User Secret (Password)"] -->|SHA-256| X["Private Scalar (x)"]
        X -->|g^x mod p| Y["Public Key (y)"]
        Nonce["CSPRNG Nonce (r)"] -->|g^r mod p| T["Commitment (t)"]
        RespEngine["Response Engine: z = (r + e*x) mod q"]
    end

    subgraph Network["REST API (HTTP/JSON)"]
        direction TB
        Pkt1["1. Register y"]
        Pkt2["2. Send Commitment t"]
        Pkt3["3. Return Challenge e"]
        Pkt4["4. Send Response z"]
    end

    subgraph Server["Server (Verifier / Express.js)"]
        direction TB
        RegStore["User Key Registry (y)"]
        ChalGen["CSPRNG Challenge (e)"]
        SessionMgr["Session Store (TTL & Replay Flag)"]
        VerifEngine["Verifier: g^z mod p == (t * y^e) mod p"]
        AuditLog["Audit History Store"]
    end

    Y --> Pkt1 --> RegStore
    T --> Pkt2 --> SessionMgr
    SessionMgr --> ChalGen --> Pkt3 --> RespEngine
    RespEngine --> Pkt4 --> VerifEngine
    VerifEngine --> AuditLog
```

---

### 2. Component Identification & Separation of Duties

| Component | Host / Environment | Primary Responsibility | Data Retained | Never Disclosed |
| :--- | :--- | :--- | :--- | :--- |
| **Prover Engine** | Client Browser (`React.js`) | Derives scalar $x$ from password, generates random nonce $r$, computes commitment $t = g^r \pmod p$, computes response $z = (r + e \cdot x) \pmod q$. | Secret $x$, Nonce $r$, Public Key $y$, Session Token | $x$ (witness), $r$ (ephemeral nonce) |
| **Network Layer** | HTTP / JSON REST API | Carries public registration and verification messages. | Transmitted packet payloads ($y, t, e, z$) | Raw secrets or unmasked nonces |
| **Challenge Dispenser** | Express Backend (`Node.js`) | Generates cryptographically secure challenge $e \in [1, q-1]$, tracks session TTL (60s), sets replay prevention flags. | Active sessions, TTL timestamps, `isConsumed` flag | N/A |
| **Verification Engine** | Express Backend (`Node.js`) | Calculates $LHS = g^z \pmod p$ and $RHS = (t \cdot y^e) \pmod p$, enforces equality check, returns ACCEPTED / REJECTED. | Session outcome, timing latency | N/A |
| **Audit Logger** | In-Memory / Persistence | Records session ID, timestamp, public parameters, LHS, RHS, verification verdict, and latency. | Non-sensitive public metadata | Plaintext passwords, witnesses, nonces |

---

### 3. Data Flow Diagrams (DFD)

#### 3.1 DFD Level 0 (Context Diagram)

```mermaid
flowchart TD
    User([User / Prover]) -->|1. Enters Password| ClientApp[ZKP Client App]
    ClientApp -->|2. Transmits y, t, z| VerifierServer[ZKP Verifier Server]
    VerifierServer -->|3. Issues Challenge e| ClientApp
    VerifierServer -->|4. Returns Verification Verdict| ClientApp
    ClientApp -->|5. Displays Accepted / Rejected| User
```

#### 3.2 DFD Level 1 (Detailed Subsystem Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Prover (Alice)
    participant ClientCrypto as Client Crypto Engine
    participant API as Express Verifier API
    participant Store as Session & Audit Store

    Alice->>ClientCrypto: Enters Password "student-crypto-2026"
    Note over ClientCrypto: x = (SHA256(pass) mod 10) + 1<br/>y = g^x mod p = 2^x mod 23
    ClientCrypto->>API: POST /api/zkp/register { username: "alice", publicKey: y }
    API->>Store: Save user public key (alice -> y)
    API-->>ClientCrypto: 201 Created

    Note over ClientCrypto: r = CSPRNG(1..10)<br/>t = g^r mod p = 2^r mod 23
    ClientCrypto->>API: POST /api/zkp/commitment { username: "alice", commitment: t }
    API->>Store: Initialize Session (ID, y, t, TTL=60s)
    API-->>ClientCrypto: 201 Session Created

    ClientCrypto->>API: POST /api/zkp/challenge { sessionId }
    Note over API: e = CSPRNG(1..10)
    API->>Store: Save challenge e in session
    API-->>ClientCrypto: 200 OK { challenge: e }

    Note over ClientCrypto: z = (r + e * x) mod 11
    ClientCrypto->>API: POST /api/zkp/verify { sessionId, response: z }
    Note over API: 1. Check Session Expiration<br/>2. Check Replay: isConsumed == false<br/>3. Compute LHS = g^z mod p<br/>4. Compute RHS = (t * y^e) mod p
    API->>Store: Mark isConsumed = true, log to Audit Trail
    API-->>ClientCrypto: 200 OK { isValid: true, status: "ACCEPTED", equation: { lhs, rhs } }
    ClientCrypto-->>Alice: Visual Confirmation (Proof Accepted)
```

---

### 4. Security Boundaries & Threat Model

1. **Passive Eavesdropper (Network Sniffer):**
   - Intercepts $y, t, e, z$.
   - **Defense:** Finding $x$ from $y = g^x \pmod p$ requires solving DLP. Finding $x$ from $z = (r + e \cdot x) \pmod q$ is impossible because $r$ acts as a one-time pad mask.

2. **Active Impostor (Cheating Prover):**
   - Attempts to authenticate without knowing $x$.
   - **Defense:** By the Special Soundness property, a prover who can pass two different challenges $e_1 \ne e_2$ for the same commitment $t$ must know $x$. Without $x$, probability of guessing valid $z$ is $1/q = 1/11 \approx 9\%$ in demo ($2^{-256}$ in production).

3. **Replay Attacker:**
   - Eavesdrops valid proof transcript $(t, e, z)$ and resubmits it.
   - **Defense:** Every session is single-use. The `isConsumed` guard invalidates the session token immediately upon first check.

4. **Compromised Server Database:**
   - Server database stores only usernames and public keys ($y$).
   - **Defense:** No plaintext passwords or password hashes exist on the server to crack offline.

