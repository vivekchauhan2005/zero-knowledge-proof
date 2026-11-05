import React from 'react';
import { ShieldCheck, Lock, Key, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Sparkles, Server, UserCheck } from 'lucide-react';

export default function LandingHero({ onStartDemo, onLearnMore }) {
  return (
    <div className="relative overflow-hidden mb-12">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Hero Header */}
      <div className="text-center max-w-4xl mx-auto pt-6 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cryptography & Network Security Academic Capstone Project</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
          Zero-Knowledge Proof <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Authentication System
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          Prove possession of a secret password without transmitting the secret, storing plaintext credentials, 
          or risking credential theft. Powered by the mathematically sound <span className="text-blue-400 font-semibold">Schnorr Identification Protocol</span> based on the discrete logarithm problem.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-10">
          <button
            onClick={onStartDemo}
            className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Launch Interactive Authentication</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onLearnMore}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-navy-800/80 hover:bg-navy-700/80 border border-navy-600/80 text-slate-200 font-semibold text-sm transition-all duration-200 hover:border-slate-400 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Step-by-Step Protocol Breakdown</span>
          </button>
        </div>

        {/* Educational Parameter Badge */}
        <div className="inline-flex items-center space-x-2 text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Classroom Educational Parameters: <strong>p = 23</strong> (prime), <strong>q = 11</strong> (subgroup order), <strong>g = 2</strong> (generator). Small numbers allow exact blackboard calculations. Production requires 2048-bit MODP or Ed25519 curves.
          </span>
        </div>
      </div>

      {/* Three Fundamental Pillars of ZKP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
        <div className="p-6 rounded-2xl bg-gradient-to-b from-navy-850 to-navy-900 border border-navy-700/80 shadow-md hover:border-blue-500/40 transition">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-4">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">1. Completeness</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            If the statement is true and both the Prover and Verifier follow the protocol honestly, 
            the Verifier will always be convinced and accept the proof with 100% probability: 
            <span className="block mt-1 font-mono text-blue-400">g^z ≡ t · y^e (mod p)</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-navy-850 to-navy-900 border border-navy-700/80 shadow-md hover:border-indigo-500/40 transition">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">2. Soundness</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            If the statement is false (the prover does not possess the secret scalar <span className="font-mono text-indigo-300">x</span>), 
            no cheating prover can convince the verifier, except with negligible probability equal to 
            <span className="font-mono text-indigo-400"> 1/q</span>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-b from-navy-850 to-navy-900 border border-navy-700/80 shadow-md hover:border-purple-500/40 transition">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">3. Zero-Knowledge</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The verifier learns <span className="text-purple-300 font-semibold">nothing</span> beyond the fact that the prover knows the secret. 
            A polynomial-time simulator can reproduce an indistinguishable conversation transcript without knowing the witness.
          </p>
        </div>
      </div>

      {/* Prover vs Verifier Role Definition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <div className="p-5 rounded-2xl bg-navy-900/90 border border-purple-500/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">The Prover (Alice / Client)</h4>
              <p className="text-[11px] text-purple-400 font-mono">Possesses Secret x · Client Browser Vault</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Derives private scalar <span className="font-mono text-purple-300">x</span> via SHA-256. Generates random nonce <span className="font-mono text-purple-300">r</span>, 
            computes commitment <span className="font-mono text-purple-300">t = g^r mod p</span>, and calculates response <span className="font-mono text-purple-300">z = (r + e·x) mod q</span>. 
            Never leaks <span className="font-mono text-rose-400">x</span> or <span className="font-mono text-rose-400">r</span>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-navy-900/90 border border-cyan-500/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">The Verifier (Bob / Express Server)</h4>
              <p className="text-[11px] text-cyan-400 font-mono">Holds Public Key y · Challenge Dispenser</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Stores registered public key <span className="font-mono text-cyan-300">y</span>. Issues unpredictable random challenge <span className="font-mono text-cyan-300">e</span>. 
            Independently calculates both sides of <span className="font-mono text-cyan-300">g^z ≡ t · y^e mod p</span> to accept or reject the proof.
          </p>
        </div>
      </div>
    </div>
  );
}

