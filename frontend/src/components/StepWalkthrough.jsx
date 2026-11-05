import React, { useState, useEffect } from 'react';
import { 
  Key, Lock, Send, ShieldCheck, ChevronRight, ChevronLeft, Play, Pause, 
  RotateCcw, ArrowRight, UserCheck, Server, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { EDUCATIONAL_PARAMS } from '../utils/schnorrClient';

export default function StepWalkthrough() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Concrete example values for crystal clear classroom explanation
  const demoValues = {
    p: 23,
    q: 11,
    g: 2,
    secretPass: "AliceSecret2026",
    x: 3,       // Private witness
    y: 8,       // Public key: 2^3 mod 23 = 8
    r: 5,       // Private nonce
    t: 9,       // Commitment: 2^5 mod 23 = 32 mod 23 = 9
    e: 4,       // Challenge from Verifier
    z: 6,       // Response: (5 + 4*3) mod 11 = 17 mod 11 = 6
    lhs: 18,    // 2^6 mod 23 = 64 mod 23 = 18
    rhs: 18     // (9 * 8^4) mod 23 = (9 * 2) mod 23 = 18
  };

  const stepsData = [
    {
      step: 1,
      title: "Secret Derivation & Public Key Registration",
      actor: "Prover (Alice / Client)",
      actorType: "prover",
      whatIsHappening: "Alice possesses a secret password or private key. She derives a private scalar x in Z_q* and computes public key y = g^x mod p. She sends public key y to Bob (or registers it once). Her secret x remains sealed in her private memory.",
      calculation: "y = g^x mod p = 2^3 mod 23 = 8",
      publicInfo: "p = 23, q = 11, g = 2, and Public Key y = 8",
      privateInfo: "Password 'AliceSecret2026', Private Witness x = 3",
      networkPacket: { from: "Alice", to: "Bob", data: "Register Public Key y = 8" }
    },
    {
      step: 2,
      title: "Commitment Generation",
      actor: "Prover (Alice / Client)",
      actorType: "prover",
      whatIsHappening: "To initiate an authentication round, Alice generates a fresh, unpredictable random nonce r. She computes commitment t = g^r mod p and transmits t to Bob. Nonce r is temporary and NEVER sent.",
      calculation: "t = g^r mod p = 2^5 mod 23 = 32 mod 23 = 9",
      publicInfo: "Commitment t = 9",
      privateInfo: "Random secret nonce r = 5, Witness x = 3",
      networkPacket: { from: "Alice", to: "Bob", data: "Commitment t = 9" }
    },
    {
      step: 3,
      title: "Challenge Generation",
      actor: "Verifier (Bob / Server)",
      actorType: "verifier",
      whatIsHappening: "Bob receives commitment t. To ensure Alice cannot precompute an answer, Bob generates a cryptographically random challenge e and sends it back to Alice over the network.",
      calculation: "e = RandomInt(1, q - 1) = 4",
      publicInfo: "Challenge value e = 4",
      privateInfo: "Alice's secret x and nonce r remain unknown to Bob",
      networkPacket: { from: "Bob", to: "Alice", data: "Challenge e = 4" }
    },
    {
      step: 4,
      title: "Cryptographic Response Calculation",
      actor: "Prover (Alice / Client)",
      actorType: "prover",
      whatIsHappening: "Alice receives challenge e. She combines her secret nonce r, challenge e, and private witness x into a single scalar response z modulo q: z = (r + e·x) mod q. She sends ONLY z to Bob.",
      calculation: "z = (r + e * x) mod q = (5 + 4 * 3) mod 11 = 17 mod 11 = 6",
      publicInfo: "Response z = 6",
      privateInfo: "x = 3 and r = 5 are still shielded by modulo arithmetic!",
      networkPacket: { from: "Alice", to: "Bob", data: "Response z = 6" }
    },
    {
      step: 5,
      title: "Mathematical Verification",
      actor: "Verifier (Bob / Server)",
      actorType: "verifier",
      whatIsHappening: "Bob receives response z. Using only public values (g, p, y, t, e, z), Bob computes LHS = g^z mod p and RHS = (t · y^e) mod p. If LHS === RHS, the proof is mathematically sound and Alice is authenticated!",
      calculation: "LHS = 2^6 mod 23 = 18  |  RHS = (9 * 8^4) mod 23 = (9 * 2) mod 23 = 18  ==> 18 === 18 (MATCH!)",
      publicInfo: "LHS = 18, RHS = 18, Verdict = PROOF ACCEPTED",
      privateInfo: "Bob validated identity with ZERO knowledge of secret x!",
      networkPacket: { from: "Bob", to: "System", data: "VERDICT: PROOF ACCEPTED (200 OK)" }
    }
  ];

  // Auto-play timer
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev >= 5 ? 1 : prev + 1));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeData = stepsData[currentStep - 1];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-navy-900 border border-navy-700">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Interactive 5-Stage Schnorr Protocol Walkthrough</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Follow the live data flow and inspect public vs private state transitions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>
          <button
            onClick={() => { setCurrentStep(1); setIsPlaying(false); }}
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-5 gap-2">
        {stepsData.map((s) => {
          const isCurrent = s.step === currentStep;
          const isPassed = s.step < currentStep;
          return (
            <button
              key={s.step}
              onClick={() => { setCurrentStep(s.step); setIsPlaying(false); }}
              className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                isCurrent
                  ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500 shadow-md text-white'
                  : isPassed
                  ? 'bg-navy-900/80 border-navy-700 text-slate-300'
                  : 'bg-navy-950/60 border-navy-800 text-slate-400 hover:bg-navy-900/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                <span>Stage 0{s.step}</span>
                {isPassed && <span className="text-emerald-400 text-[10px]">DONE</span>}
                {isCurrent && <span className="text-blue-400 text-[10px] animate-pulse">ACTIVE</span>}
              </div>
              <div className="text-xs font-semibold truncate">{s.title}</div>
            </button>
          );
        })}
      </div>

      {/* Network Animation Diagram */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-navy-900 to-navy-950 border border-navy-700 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          {/* Prover Node */}
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">Prover (Alice)</span>
              <span className="text-[11px] font-mono text-purple-300">Vault: x={demoValues.x}, r={demoValues.r}</span>
            </div>
          </div>

          {/* Wire Transmission Line */}
          <div className="flex-1 mx-4 sm:mx-8 relative">
            <div className="h-1 bg-navy-700 rounded-full w-full"></div>
            {/* Animated traveling packet */}
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-600 text-white font-mono text-xs font-bold shadow-lg shadow-blue-500/50 flex items-center space-x-1.5 whitespace-nowrap animate-pulse">
              <span>{activeData.networkPacket.data}</span>
              {activeData.networkPacket.from === 'Alice' ? (
                <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 text-amber-300" />
              )}
            </div>
          </div>

          {/* Verifier Node */}
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
            <div className="w-10 h-10 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white">Verifier (Bob)</span>
              <span className="text-[11px] font-mono text-cyan-300">Public: y={demoValues.y}, p={demoValues.p}</span>
            </div>
          </div>
        </div>

        {/* Step Breakdown Card */}
        <div className="p-5 rounded-xl bg-navy-850/80 border border-navy-700 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <div>
              <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
                Stage {activeData.step} of 5
              </span>
              <h3 className="text-base font-bold text-white">{activeData.title}</h3>
            </div>
            <span className={`text-xs font-mono px-3 py-1 rounded-full font-semibold border ${
              activeData.actorType === 'prover'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            }`}>
              Executed by: {activeData.actor}
            </span>
          </div>

          {/* What is Happening */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">What is happening?</h4>
            <p className="text-sm text-slate-200 leading-relaxed">{activeData.whatIsHappening}</p>
          </div>

          {/* Mathematical Calculation */}
          <div className="p-3.5 rounded-lg bg-navy-950 border border-indigo-500/30">
            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Mathematical Formula & Calculation:</h4>
            <div className="font-mono text-sm font-bold text-emerald-400 break-all">
              {activeData.calculation}
            </div>
          </div>

          {/* Public vs Private Information Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
              <div className="flex items-center space-x-1.5 text-cyan-300 text-xs font-bold mb-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Public Information (Over the wire):</span>
              </div>
              <p className="text-xs font-mono text-slate-200">{activeData.publicInfo}</p>
            </div>

            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30">
              <div className="flex items-center space-x-1.5 text-rose-300 text-xs font-bold mb-1">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Private Information (Never Leaked):</span>
              </div>
              <p className="text-xs font-mono text-slate-200">{activeData.privateInfo}</p>
            </div>
          </div>
        </div>

        {/* Step Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium border border-navy-600 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Stage</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            {currentStep} / 5
          </span>

          <button
            onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            disabled={currentStep === 5}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow disabled:opacity-30 cursor-pointer"
          >
            <span>Next Stage</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

