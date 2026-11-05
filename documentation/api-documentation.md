# REST API Documentation

## Zero Knowledge Proof (Schnorr) Authentication Verifier API

### Base URL
- Local Backend: `http://localhost:5000/api/zkp`
- Health check alias: `http://localhost:5000/api/health`

---

### Endpoint Reference

#### 1. System Health Check
`GET /api/zkp/health`

Returns operational status of the Verifier server.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "Zero Knowledge Proof (Schnorr) Authentication Verifier API",
  "version": "1.0.0",
  "timestamp": "2026-11-05T05:39:00.000Z"
}
```

---

#### 2. Get Public Cryptographic Parameters
`GET /api/zkp/params`

Fetches public prime modulus, subgroup order, generator, and educational description.

**Response (200 OK):**
```json
{
  "educational": {
    "p": "23",
    "q": "11",
    "g": "2",
    "name": "Educational Small Group (p=23, q=11, g=2)",
    "description": "Designed for classroom blackboard calculations and step-by-step tracing."
  },
  "rfc3526": {
    "pBits": 2048,
    "qBits": 256,
    "generator": 2,
    "name": "RFC 3526 2048-bit MODP Group (Production Standard)",
    "description": "Standard discrete logarithm group resistant to index calculus and Pollard's rho attacks."
  }
}
```

---

#### 3. Register User Public Key
`POST /api/zkp/register`

Registers a user identity with their public key $y = g^x \pmod p$. **The private witness $x$ is never sent.**

**Request Body:**
```json
{
  "username": "alice",
  "publicKey": "8"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "username": "alice",
  "publicKey": "8",
  "message": "User 'alice' registered with public key y = 8"
}
```

---

#### 4. Submit Commitment & Initialize Session
`POST /api/zkp/commitment`

Prover begins an authentication session by transmitting commitment $t = g^r \pmod p$.

**Request Body:**
```json
{
  "username": "alice",
  "publicKey": "8",
  "commitment": "9",
  "ttlMs": 60000
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Commitment received. Session initialized.",
  "session": {
    "id": "c71a3964-b5da-48c0-bc66-318e87ad3999",
    "username": "alice",
    "publicKey": "8",
    "commitment": "9",
    "challenge": null,
    "response": null,
    "createdAt": "2026-11-05T05:39:10.000Z",
    "expiresAt": "2026-11-05T05:40:10.000Z",
    "isExpired": false,
    "isConsumed": false,
    "status": "COMMITTED"
  }
}
```

---

#### 5. Request Verifier Challenge
`POST /api/zkp/challenge`

Verifier generates a fresh, unpredictable random challenge $e \in [1, q-1]$ for the active session.

**Request Body:**
```json
{
  "sessionId": "c71a3964-b5da-48c0-bc66-318e87ad3999"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cryptographically secure challenge generated",
  "sessionId": "c71a3964-b5da-48c0-bc66-318e87ad3999",
  "challenge": "4",
  "expiresAt": "2026-11-05T05:40:10.000Z",
  "status": "CHALLENGED"
}
```

---

#### 6. Submit Proof Response & Verify
`POST /api/zkp/verify`

Verifier performs the modular equation check $g^z \pmod p \stackrel{?}{=} (t \cdot y^e) \pmod p$.

**Request Body:**
```json
{
  "sessionId": "c71a3964-b5da-48c0-bc66-318e87ad3999",
  "response": "6"
}
```

**Response (200 OK - Successful Verification):**
```json
{
  "isValid": true,
  "status": "ACCEPTED",
  "sessionId": "c71a3964-b5da-48c0-bc66-318e87ad3999",
  "equation": {
    "lhs": "18",
    "rhs": "18",
    "formula": "g^z mod p == (t * y^e) mod p",
    "detailed": {
      "g": "2",
      "p": "23",
      "q": "11",
      "z": "6",
      "t": "9",
      "y": "8",
      "e": "4",
      "lhsCalculation": "(2^6) mod 23 = 18",
      "rhsCalculation": "(9 * (8^4 mod 23)) mod 23 = 18",
      "match": true
    }
  },
  "audit": {
    "sessionId": "c71a3964-b5da-48c0-bc66-318e87ad3999",
    "status": "ACCEPTED",
    "reason": "Proof accepted: LHS === RHS (g^z mod p === t * y^e mod p)",
    "durationMs": 1
  }
}
```

---

#### 7. Direct Attack Simulation
`POST /api/zkp/simulate`

Evaluates arbitrary mathematical parameters directly to test attack vectors.

**Request Body:**
```json
{
  "y": "8",
  "t": "9",
  "e": "4",
  "z": "7",
  "scenario": "Modified Response Attack"
}
```

**Response (200 OK - Failed Verification):**
```json
{
  "scenario": "Modified Response Attack",
  "isValid": false,
  "status": "REJECTED",
  "equation": {
    "lhs": "13",
    "rhs": "18",
    "match": false
  },
  "audit": {
    "status": "REJECTED",
    "reason": "Simulation: Verification equation mismatch (LHS != RHS)",
    "durationMs": 1
  }
}
```

---

#### 8. Audit Trail History
- `GET /api/zkp/history?filter=ALL` (or `ACCEPTED`, `REJECTED`)
- `DELETE /api/zkp/history` (clears logs)

