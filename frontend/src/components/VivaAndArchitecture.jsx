import React, { useState } from 'react';
import { GraduationCap, HelpCircle, Network, ChevronDown, ChevronUp, Shield, Cpu, Server, Key, Lock } from 'lucide-react';

export default function VivaAndArchitecture() {
  const [openIndex, setOpenIndex] = useState(0);

  const vivaQuestions = [
    {
      q: "1. What is a Zero-Knowledge Proof (ZKP) in the context of authentication?",
      a: "A Zero-Knowledge Proof is an interactive cryptographic protocol where one party (the Prover) proves to another party (the Verifier) that a specific mathematical statement is true (e.g. 'I know the private password scalar x') without revealing any information about the secret itself other than the veracity of the claim."
    },
    {
      q: "2. Why is ZKP authentication superior to conventional password hashing (bcrypt, PBKDF2)?",
      a: "In traditional authentication, the user sends their password across the wire (even over TLS), and the server stores a salted hash in a database. If the server database is breached, attacker can perform offline GPU dictionary attacks. With ZKP: 1) The password/secret is NEVER sent over the network. 2) The server database stores only public keys y = g^x mod p. Even if the server database is leaked to an adversary, the adversary cannot impersonate users because of the Discrete Logarithm Problem (DLP)."
    },
    {
      q: "3. What mathematical problem provides the hardness guarantee for the Schnorr protocol?",
      a: "The Discrete Logarithm Problem (DLP) in prime order cyclic subgroups. Given public generator g, prime modulus p, and public key y = g^x mod p, finding x is computationally infeasible in polynomial time for sufficiently large groups (e.g. 2048-bit MODP or 256-bit elliptic curves)."
    },
    {
      q: "4. Explain the 3 core properties of Zero Knowledge Proofs.",
      a: "1) Completeness: If the prover knows the secret and behaves honestly, the verifier always accepts (100% probability). 2) Soundness: If the prover does not know the secret, no cheating strategy can fool the verifier except with negligible probability (1/q). 3) Zero-Knowledge: The verifier gains zero computational advantage or information about the secret scalar x from observing the protocol transcript."
    },
    {
      q: "5. Why can't the Verifier (Bob) calculate secret x from response z = (r + e · x) mod q?",
      a: "Because r is a uniformly distributed, single-use random nonce (ephemeral secret). In modular arithmetic, r acts like a One-Time Pad mask. As long as r is freshly generated for every session and never reused, z appears uniformly distributed in Z_q, revealing 0 bits of information about x."
    },
    {
      q: "6. What is a Replay Attack and how does this application prevent it?",
      a: "A Replay Attack occurs when an eavesdropper captures an authentic transcript (t, e, z) and attempts to submit it to authenticate as the user in a future session. This implementation prevents replays via two layers: 1) Fresh Verifier Challenge: Bob generates a new random challenge e for every session. 2) One-Time Challenge Consumption: Each session state has an `isConsumed: boolean` flag in the backend service that is marked true upon the first verification attempt. Any subsequent attempt with the same session token is immediately blocked."
    },
    {
      q: "7. Why did we use p=23, q=11, g=2 for this educational project?",
      a: "p=23 (with subgroup order q=11 and generator g=2) is a small cyclic group where calculations can be executed on a blackboard by faculty or students in under 10 seconds. In production, 2048-bit safe primes (RFC 3526) or elliptic curves (secp256k1 / Ed25519) are used to prevent brute force discrete logarithm attacks."
    },
    {
      q: "8. What is the difference between Interactive Schnorr and Non-Interactive (Fiat-Shamir)?",
      a: "In the Interactive Schnorr protocol, Prover and Verifier communicate in 3 passes: Commitment t -> Challenge e -> Response z. In Non-Interactive ZKP, the challenge e is replaced by a cryptographic hash of the commitment and message: e = H(g, y, t, m). This transforms the interactive identification protocol into the Schnorr Digital Signature algorithm."
    }
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* System Architecture Section */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-700 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 pb-3 border-b border-navy-700">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">System Architecture & Threat Boundary</h2>
            <p className="text-xs text-slate-400 font-mono">End-to-End Cryptographic Component Topology</p>
          </div>
        </div>

        {/* Visual Architecture Topology Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs mb-2">
              <Key className="w-4 h-4" />
              <span>Client Prover Engine</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li>• Browser Client (React.js)</li>
              <li>• Web Crypto API (SHA-256)</li>
              <li>• Private Witness Vault (x)</li>
              <li>• Secure Nonce Generator (r)</li>
              <li>• Commitment Calculator (t = g^r)</li>
              <li>• Response Engine (z = r + e·x)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs mb-2">
              <Shield className="w-4 h-4" />
              <span>Network Wire Layer</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li>• REST API over HTTP/JSON</li>
              <li>• Public Key payload (y)</li>
              <li>• Commitment payload (t)</li>
              <li>• Verifier Challenge (e)</li>
              <li>• Proof Response (z)</li>
              <li>• ZERO SECRET EXPOSURE</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs mb-2">
              <Server className="w-4 h-4" />
              <span>Verifier Server Engine</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li>• Express.js / Node.js</li>
              <li>• Session Expiry Manager (TTL)</li>
              <li>• Replay Prevention Engine</li>
              <li>• BigInt Modular Math Evaluator</li>
              <li>• Equality Check: g^z == t·y^e</li>
              <li>• Audit Trail Logger</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Faculty Viva Preparation Q&A */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-700 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 pb-3 border-b border-navy-700">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Faculty Viva Questions & Technical Defense</h2>
            <p className="text-xs text-slate-400 font-mono">Curated Q&A for external examiner presentation</p>
          </div>
        </div>

        <div className="space-y-3">
          {vivaQuestions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-navy-750 bg-navy-950/60 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold text-white hover:text-blue-400 transition cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-blue-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-1 border-t border-navy-800 text-xs text-slate-300 leading-relaxed font-sans bg-navy-900/50">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

