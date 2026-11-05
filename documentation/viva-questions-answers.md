# Comprehensive Viva Questions & Answers

## Subject: Cryptography and Network Security
### Topic: Zero-Knowledge Proof (ZKP) Authentication System using Schnorr Protocol

---

### Section 1: Core Cryptographic Foundations

#### Q1: What is a Zero-Knowledge Proof (ZKP)?
**Answer:** A Zero-Knowledge Proof is an interactive cryptographic protocol where a Prover proves to a Verifier that a specific statement is true (e.g., knowledge of a secret witness $x$) without revealing any information about the statement itself, beyond its validity.

#### Q2: What are the three fundamental properties of any ZKP system?
**Answer:**
1. **Completeness:** If the statement is true and both parties follow the protocol honestly, the Verifier will always accept the proof ($P = 1.0$).
2. **Soundness:** If the statement is false, no cheating prover can convince the Verifier, except with a negligible probability (bounded by $1/q$).
3. **Zero-Knowledge:** If the statement is true, no verifier learns anything from the proof beyond the fact that the statement is true. This is formally proven by demonstrating that an efficient simulator can generate an indistinguishable transcript without knowing the secret.

#### Q3: Why is ZKP authentication safer than traditional password hashing (bcrypt, PBKDF2)?
**Answer:** In traditional password authentication:
- The plaintext password is sent over the network (relying solely on TLS encryption).
- The server stores password hashes. If the server database is breached, attackers can perform high-speed offline dictionary or GPU brute-force attacks.
In ZKP authentication:
- The secret password is **never sent** over the network.
- The server only stores public keys $y = g^x \pmod p$. Due to the hardness of the Discrete Logarithm Problem, recovering $x$ from $y$ is computationally infeasible.

---

### Section 2: Mathematical Framework & Number Theory

#### Q4: What is the Discrete Logarithm Problem (DLP)?
**Answer:** Given a cyclic group $G$ with generator $g$, prime modulus $p$, and an element $y \in G$, the Discrete Logarithm Problem is to find an integer $x$ such that:
$$g^x \equiv y \pmod p$$
While exponentiation $g^x \pmod p$ is fast (via binary exponentiation in $O(\log x)$ multiplications), finding $x$ from $y$ requires super-polynomial time algorithms (like Index Calculus or General Number Field Sieve) for large primes.

#### Q5: Why did we choose $p=23, q=11, g=2$?
**Answer:**
- $p = 23$ is a prime number.
- $q = 11$ is prime and divides $p - 1 = 22$.
- $g = 2$ generates a cyclic subgroup of order $q = 11$, since $2^{11} \equiv 2048 \equiv 1 \pmod{23}$.
These small numbers allow examiners, faculty, and students to calculate every step on a whiteboard in seconds. In production, 2048-bit safe primes (RFC 3526) or 256-bit elliptic curves (Ed25519) are used.

#### Q6: Why must the response $z = (r + e \cdot x)$ be calculated modulo $q$ and not modulo $p$?
**Answer:** Because the exponent operations in the cyclic group $\langle g \rangle$ behave according to Fermat's Little Theorem and Euler's totient theorem. Since the order of generator $g$ is $q$ (meaning $g^q \equiv 1 \pmod p$), any integer addition or multiplication in the exponent is naturally isomorphic to arithmetic in $\mathbb{Z}_q$. Thus:
$$g^{a \pmod q} \equiv g^a \pmod p$$

---

### Section 3: Schnorr Protocol Execution

#### Q7: Walk through the 5 steps of the Schnorr protocol.
**Answer:**
1. **Secret & Key:** Prover chooses $x \in [1, q-1]$ and computes public key $y = g^x \pmod p$.
2. **Commitment:** Prover picks random nonce $r \in [1, q-1]$, computes commitment $t = g^r \pmod p$, and sends $t$ to Verifier.
3. **Challenge:** Verifier chooses random challenge $e \in [1, q-1]$ and sends $e$ to Prover.
4. **Response:** Prover calculates $z = (r + e \cdot x) \pmod q$ and sends $z$ to Verifier.
5. **Verification:** Verifier checks if $g^z \pmod p = (t \cdot y^e) \pmod p$.

#### Q8: Show algebraically why $g^z \pmod p = (t \cdot y^e) \pmod p$.
**Answer:**
$$\text{LHS} = g^z = g^{r + e \cdot x} = g^r \cdot (g^x)^e \pmod p$$
Since $t = g^r \pmod p$ and $y = g^x \pmod p$:
$$\text{LHS} = t \cdot y^e \pmod p = \text{RHS}$$

#### Q9: Why doesn't the Verifier learn $x$ from the response $z = (r + e \cdot x) \pmod q$?
**Answer:** The ephemeral nonce $r$ is a fresh, uniformly distributed random value chosen by the Prover for that single session. It acts exactly like a **One-Time Pad**. Because $r$ is completely unknown to the Verifier, observing $z$ provides zero information about $x$. Without $r$, $z$ is statistically independent of $x$.

#### Q10: What happens if a Prover reuses the same nonce $r$ across two different challenges $e_1$ and $e_2$?
**Answer:** Reusing nonce $r$ is a catastrophic security failure! An eavesdropper or Verifier can extract secret $x$ using basic algebra:
$$z_1 = r + e_1 \cdot x \pmod q$$
$$z_2 = r + e_2 \cdot x \pmod q$$
Subtracting the equations:
$$z_1 - z_2 = (e_1 - e_2) \cdot x \pmod q$$
$$x = (z_1 - z_2) \cdot (e_1 - e_2)^{-1} \pmod q$$
This is why our system generates a fresh cryptographically secure nonce using `window.crypto.getRandomValues()` for every single proof attempt.

---

### Section 4: Security, Threats & Mitigations

#### Q11: What is a Replay Attack and how is it mitigated here?
**Answer:** A replay attack occurs when an attacker intercepts a valid transcript $(t, e, z)$ and resubmits it later. Our backend mitigates this via:
1. **Dynamic Challenge:** The Verifier issues a fresh random $e$ for each session.
2. **One-Time Consumption Flag:** Each session state has an `isConsumed` boolean flag. Once checked, it is marked `true`. Any subsequent request with that session ID is rejected.
3. **Time-To-Live (TTL):** Sessions expire after 60 seconds.

#### Q12: How does the system handle an attacker who tries to guess $z$ at random?
**Answer:** If an attacker picks a random $z_{guess}$, the chance that $g^{z_{guess}} \equiv t \cdot y^e \pmod p$ is $1/q$. In our educational model ($q=11$), the chance is $1/11 \approx 9\%$. In production ($q \approx 2^{256}$), the chance is $1/2^{256} \approx 10^{-78}$, which is cryptographically impossible.

#### Q13: What is the Fiat-Shamir Heuristic?
**Answer:** The Fiat-Shamir Heuristic converts an interactive 3-pass ZKP into a **Non-Interactive Zero-Knowledge (NIZK)** proof. Instead of receiving challenge $e$ from the Verifier, the Prover computes the challenge using a cryptographic hash function:
$$e = H(g, y, t, m)$$
This turns the Schnorr identification protocol into the **Schnorr Digital Signature** scheme.

---

### Section 5: Implementation & Architecture

#### Q14: Why did we implement client-side Prover cryptography in React?
**Answer:** To guarantee that the private witness $x$ and random nonce $r$ never leave the client's memory. If the server derived $x$ or generated $r$, it would violate the core definition of Zero-Knowledge Proofs.

#### Q15: Why is JavaScript `BigInt` necessary instead of standard `Number`?
**Answer:** JavaScript's default `Number` type is an IEEE 754 double-precision float with safe integer limit of $2^{53} - 1$ (9,007,199,254,740,991). In modular exponentiation and cryptography, intermediate products easily overflow $2^{53}$. `BigInt` provides arbitrary-precision arithmetic, ensuring exact modular evaluations without precision loss.

