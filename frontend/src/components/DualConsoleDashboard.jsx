import React, { useState, useEffect } from 'react';
import { 
  Key, Lock, Send, RefreshCw, CheckCircle2, XCircle, ShieldAlert, 
  ArrowRight, ArrowLeft, Terminal, Shield, Eye, EyeOff, Hash, Clock,
  Sparkles, AlertTriangle, ShieldCheck, UserX, UserCheck, Flame
} from 'lucide-react';
import { 
  deriveScalarFromSecret, 
  computePublicKey, 
  generateRandomNonce, 
  computeCommitment, 
  computeResponse, 
  EDUCATIONAL_PARAMS 
} from '../utils/schnorrClient';
import { api } from '../services/api';

export default function DualConsoleDashboard({ onProofComplete }) {
  // Demo Mode: 'honest' | 'impostor' | 'tampered'
  const [demoMode, setDemoMode] = useState('honest');

  // Prover States
  const [username, setUsername] = useState('alice');
  const [secretInput, setSecretInput] = useState('student-crypto-2026');
  const [showSecret, setShowSecret] = useState(false);
  const [derivedData, setDerivedData] = useState(null);
  const [manualScalarMode, setManualScalarMode] = useState(false);
  const [manualScalar, setManualScalar] = useState('8');

  // Protocol Execution States
  const [nonceR, setNonceR] = useState(null);
  const [commitmentT, setCommitmentT] = useState(null);
  const [challengeE, setChallengeE] = useState(null);
  const [responseZ, setResponseZ] = useState(null);
  const [honestZ, setHonestZ] = useState(null);
  const [isTampered, setIsTampered] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Status & Verification Result
  const [step, setStep] = useState(0); // 0: Init, 2: Response Computed (Ready to submit), 3: Verified
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [replayBlockedMsg, setReplayBlockedMsg] = useState(null);

  // Derive private witness scalar x on Prover client whenever input changes
  useEffect(() => {
    async function updateDerived() {
      try {
        if (manualScalarMode) {
          const val = BigInt(manualScalar || '1');
          const clamped = ((val - 1n) % (EDUCATIONAL_PARAMS.q - 1n)) + 1n;
          const y = computePublicKey(clamped);
          setDerivedData({
            secret: `Direct scalar x = ${clamped.toString()}`,
            hashHex: 'N/A (Whiteboard direct scalar)',
            hashDecimal: clamped.toString(),
            scalar: clamped,
            publicKey: y
          });
        } else {
          const data = await deriveScalarFromSecret(secretInput, EDUCATIONAL_PARAMS.q);
          const y = computePublicKey(data.scalar);
          setDerivedData({
            ...data,
            publicKey: y
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    updateDerived();
  }, [secretInput, manualScalarMode, manualScalar]);

  // Quick Scenario Selectors
  const selectHonestMode = () => {
    setDemoMode('honest');
    setUsername('alice');
    setSecretInput('student-crypto-2026');
    setManualScalar('8');
    handleReset();
  };

  const selectImpostorMode = () => {
    setDemoMode('impostor');
    setUsername('alice');
    setSecretInput('wrong-impostor-password-999');
    setManualScalar('5');
    handleReset();
  };

  const selectTamperedMode = () => {
    setDemoMode('tampered');
    setUsername('alice');
    setSecretInput('student-crypto-2026');
    setManualScalar('8');
    handleReset();
  };

  // Step 1: Prover generates commitment t and requests challenge e from Verifier
  const handleCommitAndRequestChallenge = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);
      setReplayBlockedMsg(null);

      // 1. Generate random nonce r on Prover client
      const r = generateRandomNonce(EDUCATIONAL_PARAMS.q);
      const t = computeCommitment(r);
      setNonceR(r);
      setCommitmentT(t);

      // 2. Submit commitment t to Verifier
      // If user is 'alice', server checks against Alice's pre-registered key (y=3)
      const commitRes = await api.submitCommitment(username, derivedData.publicKey.toString(), t.toString());
      const sId = commitRes.session.id;
      setSessionId(sId);

      // 3. Verifier generates and issues unpredictable challenge e
      const chalRes = await api.requestChallenge(sId);
      const e = BigInt(chalRes.challenge);
      setChallengeE(e);

      // 4. Prover computes response z = (r + e * x) mod q locally
      const honestCalc = computeResponse(r, e, derivedData.scalar, EDUCATIONAL_PARAMS.q);
      setHonestZ(honestCalc);

      if (demoMode === 'tampered') {
        const tamperedCalc = (honestCalc + 1n) % EDUCATIONAL_PARAMS.q;
        setResponseZ(tamperedCalc);
        setIsTampered(true);
      } else {
        setResponseZ(honestCalc);
        setIsTampered(false);
      }

      setStep(2); // Ready to submit response
    } catch (err) {
      setErrorMsg(err.message || 'Commitment step failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Prover submits response z to Verifier for verification
  const handleSubmitProof = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setReplayBlockedMsg(null);

      const result = await api.submitProof(sessionId, responseZ.toString());
      setVerificationResult(result);
      setStep(3);

      if (onProofComplete) onProofComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Proof verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Simulate Replay Attack right after verification
  const handleSimulateReplay = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      // Attempt to resubmit the exact same proof for the already consumed session
      const result = await api.submitProof(sessionId, responseZ.toString());
      setVerificationResult(result);
      if (!result.isValid) {
        setReplayBlockedMsg(result.error || 'Replay attack prevented: Challenge was already consumed!');
      }
    } catch (err) {
      setReplayBlockedMsg(err.message || 'Replay attack detected and blocked!');
    } finally {
      setLoading(false);
    }
  };

  // Manual Tamper Toggle
  const toggleTamper = () => {
    if (isTampered) {
      setResponseZ(honestZ);
      setIsTampered(false);
    } else {
      const tamperedVal = (honestZ + 1n) % EDUCATIONAL_PARAMS.q;
      setResponseZ(tamperedVal);
      setIsTampered(true);
    }
  };

  // Quick reset
  const handleReset = () => {
    setNonceR(null);
    setCommitmentT(null);
    setChallengeE(null);
    setResponseZ(null);
    setHonestZ(null);
    setIsTampered(false);
    setSessionId(null);
    setVerificationResult(null);
    setReplayBlockedMsg(null);
    setErrorMsg(null);
    setStep(0);
  };

  return (
    <div className="space-y-6">
      {/* ================= LIVE PRESENTATION SPEAKING ASSISTANT ================= */}
      <div className={`p-4 rounded-2xl border transition-all ${
        verificationResult
          ? verificationResult.isValid
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-rose-950/30 border-rose-500/40'
          : 'bg-indigo-950/30 border-indigo-500/30'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-300">
                🎓 Presentation Speaking Assistant (What to say to faculty / client right now):
              </h3>
            </div>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed font-sans">
              {step === 0 && (
                <>
                  <strong className="text-white">To demonstrate ACCEPT:</strong> Click Scenario 1 (Honest Prover), then click "1. Generate Nonce & Send Commitment". Alice's secret will satisfy the mathematical equation.<br/>
                  <strong className="text-white">To demonstrate REJECT:</strong> Click Scenario 2 (Impostor) or Scenario 3 (Tampered Response). The equation will fail and the server will reject it!
                </>
              )}
              {step === 2 && !isTampered && (
                <>
                  <em>"Now Alice computed response <span className="font-mono text-emerald-400 font-bold">z = (r + e·x) mod q</span>. Notice that secret nonce <span className="font-mono text-amber-300">r</span> masks password <span className="font-mono text-purple-300">x</span> like a one-time pad. Click 'Submit Response' to watch the server verify it!"</em>
                </>
              )}
              {step === 2 && isTampered && (
                <>
                  <em className="text-rose-300">"Notice: The response has been tampered with (<span className="font-mono font-bold text-rose-400">z changed to {responseZ?.toString()}</span>). When we submit this, the discrete logarithm check will mismatch and the server will REJECT the proof!"</em>
                </>
              )}
              {step === 3 && verificationResult?.isValid && (
                <>
                  <strong className="text-emerald-400">PROOF ACCEPTED! Say this: </strong>
                  <em>"Respected professors, the server computed LHS = 2^{responseZ?.toString()} mod 23 = {verificationResult.equation.lhs} and RHS = (t · y^e) mod 23 = {verificationResult.equation.rhs}. Because both equal <strong>{verificationResult.equation.lhs}</strong>, Alice is authenticated with 100% mathematical certainty, while her secret never left her browser!"</em>
                </>
              )}
              {step === 3 && !verificationResult?.isValid && (
                <>
                  <strong className="text-rose-400">PROOF REJECTED! Say this: </strong>
                  <em>"Respected professors, notice the rejection! The server independently evaluated LHS ({verificationResult.equation.lhs}) and RHS ({verificationResult.equation.rhs}). Because <strong>{verificationResult.equation.lhs} ≠ {verificationResult.equation.rhs}</strong>, the server mathematically proves the user entered the wrong secret or tampered with the proof!"</em>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ================= ONE-CLICK SCENARIO SELECTORS ================= */}
      <div className="p-4 rounded-xl bg-navy-900 border border-navy-700 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <span>Select Demonstration Scenario:</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setManualScalarMode(!manualScalarMode)}
              className="text-[11px] font-mono px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 transition"
            >
              {manualScalarMode ? 'Mode: Direct Scalar x' : 'Mode: Password (SHA-256)'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 text-[11px] font-mono px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Scenario 1: ACCEPT */}
          <button
            onClick={selectHonestMode}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              demoMode === 'honest'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : 'bg-navy-950/60 border-navy-800 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-1">
              <UserCheck className="w-4 h-4" />
              <span>1. Honest Alice (Will ACCEPT)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Valid password: <code className="text-emerald-300">student-crypto-2026</code>. LHS will equal RHS!
            </p>
          </button>

          {/* Scenario 2: REJECT (Wrong Password) */}
          <button
            onClick={selectImpostorMode}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              demoMode === 'impostor'
                ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/10'
                : 'bg-navy-950/60 border-navy-800 hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs mb-1">
              <UserX className="w-4 h-4" />
              <span>2. Wrong Password (Will REJECT)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Impostor enters wrong key: <code className="text-rose-300">wrong-impostor-password</code>.
            </p>
          </button>

          {/* Scenario 3: REJECT (Tampered Response) */}
          <button
            onClick={selectTamperedMode}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              demoMode === 'tampered'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
                : 'bg-navy-950/60 border-navy-800 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-1">
              <Flame className="w-4 h-4" />
              <span>3. Tampered Response (Will REJECT)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Response <code className="text-amber-300">z</code> modified by attacker in transit (<code className="text-amber-300">z+1</code>).
            </p>
          </button>
        </div>
      </div>

      {/* ================= DUAL SPLIT CONSOLE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ================= PROVER SIDE (ALICE) ================= */}
        <div className="rounded-2xl bg-gradient-to-b from-[#11162b] to-[#0c1224] border border-purple-500/40 p-6 shadow-xl relative overflow-hidden glow-prover">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-purple-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                A
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Prover Vault (Client / Alice)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    Client Browser Memory
                  </span>
                </h3>
                <p className="text-[11px] text-purple-300 font-mono">Secret & Nonce Never Transmitted</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Target Identity:</span>
              <span className="ml-1 text-xs font-mono font-semibold text-purple-400">@{username}</span>
            </div>
          </div>

          {/* Secret Input Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{manualScalarMode ? 'Secret Scalar x (Whiteboard Mode)' : 'Prover Password / Passphrase'}</span>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  NEVER SENT TO SERVER
                </span>
              </label>

              {manualScalarMode ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={manualScalar}
                    onChange={(e) => setManualScalar(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg bg-navy-950 border border-purple-500/40 text-purple-300 font-mono text-sm focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-xs text-slate-400">
                    Alice's registered scalar is <strong className="text-emerald-400">x = 8</strong> (y=3). Try <strong className="text-rose-400">x = 5</strong> to reject!
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-purple-500/30 text-slate-200 font-mono text-sm focus:outline-none focus:border-purple-400 pr-10"
                    placeholder="Enter password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Prover Witness Vault Box */}
            {derivedData && (
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 font-semibold flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Witness Derived Locally (x):</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    x = {derivedData.scalar.toString()}
                  </span>
                </div>
                {!manualScalarMode && (
                  <p className="text-[10px] font-mono text-slate-400 break-all">
                    SHA-256: {derivedData.hashHex.slice(0, 24)}... (mapped to scalar range [1, 10])
                  </p>
                )}
                <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Generated Public Key for this Secret:</span>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    y = {derivedData.publicKey.toString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Protocol Actions */}
          <div className="space-y-4">
            {step === 0 && (
              <button
                onClick={handleCommitAndRequestChallenge}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>1. Generate Nonce & Send Commitment (t)</span>
              </button>
            )}

            {step >= 2 && (
              <div className="p-4 rounded-xl bg-navy-950 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Generated Secret Nonce (r):</span>
                  <span className="text-amber-400 font-bold">r = {nonceR?.toString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Calculated Commitment (t = g^r mod p):</span>
                  <span className="text-purple-300 font-bold">t = {commitmentT?.toString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Received Verifier Challenge (e):</span>
                  <span className="text-blue-400 font-bold">e = {challengeE?.toString()}</span>
                </div>

                {/* Editable / Tamperable Response Field */}
                <div className="pt-2 border-t border-navy-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">Response z = (r + e·x) mod q:</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      isTampered ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30' : 'text-emerald-400 bg-emerald-500/10'
                    }`}>
                      z = {responseZ?.toString()} {isTampered ? '(TAMPERED!)' : '(HONEST)'}
                    </span>
                  </div>

                  {step === 2 && (
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={responseZ !== null ? responseZ.toString() : ''}
                        onChange={(e) => {
                          const val = BigInt(e.target.value || '0');
                          setResponseZ(val);
                          setIsTampered(val !== honestZ);
                        }}
                        className="w-20 px-2 py-1 rounded bg-navy-900 border border-purple-500/40 text-cyan-300 font-mono text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={toggleTamper}
                        className={`text-xs px-2.5 py-1 rounded font-medium border transition cursor-pointer ${
                          isTampered
                            ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                            : 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30'
                        }`}
                      >
                        {isTampered ? '🛡️ Restore Honest z' : '⚠️ Tamper Response (z+1)'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <button
                onClick={handleSubmitProof}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>2. Transmit Response (z) to Verifier API</span>
              </button>
            )}

            {step === 3 && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleCommitAndRequestChallenge}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold border border-navy-600 transition"
                >
                  Run Another Attempt
                </button>
                <button
                  onClick={handleSimulateReplay}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                  title="Test if the server blocks replaying the same consumed session"
                >
                  🔄 Replay Same Proof
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= VERIFIER SIDE (BOB / EXPRESS) ================= */}
        <div className="rounded-2xl bg-gradient-to-b from-[#0b1626] to-[#07101f] border border-cyan-500/40 p-6 shadow-xl relative overflow-hidden glow-verifier">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-cyan-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                V
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Verifier API (Bob / Server)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                    Express.js Backend
                  </span>
                </h3>
                <p className="text-[11px] text-cyan-300 font-mono">Evaluates Proof Modulo p=23</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Public Parameters:</span>
              <span className="ml-1 text-xs font-mono font-semibold text-cyan-400">p=23, q=11, g=2</span>
            </div>
          </div>

          {/* Active Session & Verification Status */}
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Server Registered Key (y) for @{username}:</span>
                <span className="text-cyan-300 font-semibold">
                  {username === 'alice' ? 'y = 3 (Registered Alice)' : derivedData ? `y = ${derivedData.publicKey.toString()}` : 'Awaiting...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Received Commitment (t):</span>
                <span className="text-purple-300 font-semibold">
                  {commitmentT ? `t = ${commitmentT.toString()}` : 'Awaiting commitment...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Issued Random Challenge (e):</span>
                <span className="text-blue-400 font-semibold">
                  {challengeE ? `e = ${challengeE.toString()}` : 'Not issued yet'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Received Response (z):</span>
                <span className="text-emerald-400 font-semibold">
                  {responseZ !== null && step >= 2 ? `z = ${responseZ.toString()}` : 'Awaiting response submission...'}
                </span>
              </div>
              <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Session ID:</span>
                <span className="text-slate-400 truncate max-w-[200px]">
                  {sessionId ? sessionId : 'No active session'}
                </span>
              </div>
            </div>

            {/* Replay Attack Blocked Alert */}
            {replayBlockedMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2.5 animate-pulse">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <strong className="block text-rose-200">Replay Attack Prevented!</strong>
                  <span>{replayBlockedMsg}</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Live Verification Result Card */}
            {verificationResult && (
              <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                verificationResult.isValid
                  ? 'bg-emerald-950/25 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-rose-950/25 border-rose-500/50 shadow-lg shadow-rose-500/10'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  {verificationResult.isValid ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {verificationResult.isValid ? 'PROOF ACCEPTED (Authentication Succeeded)' : 'PROOF REJECTED (Authentication Failed)'}
                    </h4>
                    <p className={`text-xs font-mono mt-0.5 ${verificationResult.isValid ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {verificationResult.audit?.reason || (verificationResult.isValid ? 'LHS equals RHS' : 'LHS != RHS')}
                    </p>
                  </div>
                </div>

                {/* Mathematical Equation Proof Verification Breakdown */}
                {verificationResult.equation && (
                  <div className="space-y-2 pt-3 border-t border-navy-800 text-xs font-mono">
                    <div className="text-slate-300 font-semibold flex items-center justify-between">
                      <span>Verification Equation:</span>
                      <span className="text-cyan-400">g^z mod p ≡ (t · y^e) mod p</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className={`p-3 rounded-lg border ${verificationResult.isValid ? 'bg-navy-950 border-emerald-500/30' : 'bg-navy-950 border-rose-500/30'}`}>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Left-Hand Side (LHS):</span>
                        <span className={`text-base font-bold ${verificationResult.isValid ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {verificationResult.equation.lhs}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">
                          2^{responseZ?.toString()} mod 23 = {verificationResult.equation.lhs}
                        </span>
                      </div>

                      <div className={`p-3 rounded-lg border ${verificationResult.isValid ? 'bg-navy-950 border-emerald-500/30' : 'bg-navy-950 border-rose-500/30'}`}>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Right-Hand Side (RHS):</span>
                        <span className={`text-base font-bold ${verificationResult.isValid ? 'text-emerald-400' : 'text-purple-400'}`}>
                          {verificationResult.equation.rhs}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">
                          ({commitmentT?.toString()} · y^{challengeE?.toString()}) mod 23 = {verificationResult.equation.rhs}
                        </span>
                      </div>
                    </div>

                    <div className="text-center pt-2 font-bold text-sm">
                      {verificationResult.isValid ? (
                        <span className="text-emerald-400">
                          ✓ LHS ({verificationResult.equation.lhs}) === RHS ({verificationResult.equation.rhs}) [VALID PROOF]
                        </span>
                      ) : (
                        <span className="text-rose-400">
                          ✗ LHS ({verificationResult.equation.lhs}) ≠ RHS ({verificationResult.equation.rhs}) [EQUATION MISMATCH]
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!verificationResult && (
              <div className="p-6 rounded-xl border border-dashed border-navy-700 bg-navy-950/40 text-center">
                <Shield className="w-8 h-8 text-cyan-500/40 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Ready to verify incoming cryptographic proofs. Complete Step 1 & 2 on the Prover console.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
