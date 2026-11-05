import React, { useState, useEffect } from 'react';
import { 
  Key, Lock, Send, RefreshCw, CheckCircle2, XCircle, ShieldAlert, 
  ArrowRight, ArrowLeft, Terminal, Shield, Eye, EyeOff, Hash, Clock
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
  // Prover States
  const [username, setUsername] = useState('alice');
  const [secretInput, setSecretInput] = useState('student-crypto-2026');
  const [showSecret, setShowSecret] = useState(false);
  const [derivedData, setDerivedData] = useState(null);
  const [manualScalarMode, setManualScalarMode] = useState(false);
  const [manualScalar, setManualScalar] = useState('3');

  // Protocol Execution States
  const [nonceR, setNonceR] = useState(null);
  const [commitmentT, setCommitmentT] = useState(null);
  const [challengeE, setChallengeE] = useState(null);
  const [responseZ, setResponseZ] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Status & Verification Result
  const [step, setStep] = useState(0); // 0: Init, 1: Committed & Challenged, 2: Response Computed, 3: Verified
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

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
            hashHex: 'N/A (Direct scalar selected)',
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

  // Step 1: Prover registers public key and sends commitment to Verifier
  const handleCommitAndRequestChallenge = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);

      // 1. Generate random nonce r on Prover client
      const r = generateRandomNonce(EDUCATIONAL_PARAMS.q);
      const t = computeCommitment(r);
      setNonceR(r);
      setCommitmentT(t);

      // 2. Prover registers public key y with Verifier backend (if not already)
      await api.registerUser(username, derivedData.publicKey.toString());

      // 3. Prover sends commitment t to Verifier to start proof session
      const commitRes = await api.submitCommitment(username, derivedData.publicKey.toString(), t.toString());
      const sId = commitRes.session.id;
      setSessionId(sId);

      // 4. Verifier issues unpredictable challenge e
      const chalRes = await api.requestChallenge(sId);
      const e = BigInt(chalRes.challenge);
      setChallengeE(e);

      // 5. Prover computes response z = (r + e * x) mod q locally
      const z = computeResponse(r, e, derivedData.scalar, EDUCATIONAL_PARAMS.q);
      setResponseZ(z);

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

      // Transmit z to backend
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

  // Quick reset
  const handleReset = () => {
    setNonceR(null);
    setCommitmentT(null);
    setChallengeE(null);
    setResponseZ(null);
    setSessionId(null);
    setVerificationResult(null);
    setErrorMsg(null);
    setStep(0);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/90 border border-navy-700/80 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Live Cryptographic Authentication Console</h2>
            <p className="text-xs text-slate-400 font-mono">
              Prover (Client Browser) ⟷ Verifier (Express Backend API)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setManualScalarMode(!manualScalarMode)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-navy-600 bg-navy-850 hover:bg-navy-800 text-slate-300 transition"
          >
            {manualScalarMode ? 'Switch to Password Hash (SHA-256)' : 'Switch to Direct Scalar x (1-10)'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Split-Screen Console */}
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
                  <span>Prover Vault (Alice / Client)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    Client-Side Only
                  </span>
                </h3>
                <p className="text-[11px] text-purple-300 font-mono">Holds Private Secret & Nonce</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Identity:</span>
              <span className="ml-1 text-xs font-mono font-semibold text-purple-400">@{username}</span>
            </div>
          </div>

          {/* Secret Input Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>{manualScalarMode ? 'Private Scalar x (Whiteboard Mode)' : 'Demo Secret / Password'}</span>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  NEVER LEAVES BROWSER
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
                    Direct integer scalar x ∈ [1, 10] for easy classroom paper checking.
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

            {/* Quick Demo Presets */}
            {!manualScalarMode && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Demo Presets:</span>
                {['student-crypto-2026', 'FacultyDemo$99', 'zkp-secret-key'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSecretInput(preset)}
                    className="px-2 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 text-[11px] font-mono transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            {/* Prover Witness Vault Box */}
            {derivedData && (
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300 font-semibold flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Private Witness (x) & Derivation:</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    x = {derivedData.scalar.toString()}
                  </span>
                </div>
                {!manualScalarMode && (
                  <p className="text-[10px] font-mono text-slate-400 break-all">
                    SHA-256: {derivedData.hashHex.slice(0, 24)}... (mapped mod {EDUCATIONAL_PARAMS.q - 1n} + 1)
                  </p>
                )}
                <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Public Key (y = g^x mod p):</span>
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
                <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Calculated Response z = (r + e·x) mod q:</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    z = {responseZ?.toString()}
                  </span>
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
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCommitAndRequestChallenge}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold border border-navy-600 transition"
                >
                  Run Fresh Authentication
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
                <p className="text-[11px] text-cyan-300 font-mono">Verifies Without Learning Secret</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Parameters:</span>
              <span className="ml-1 text-xs font-mono font-semibold text-cyan-400">p=23, q=11, g=2</span>
            </div>
          </div>

          {/* Active Session & Verification Status */}
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Registered Public Key (y):</span>
                <span className="text-cyan-300 font-semibold">
                  {derivedData ? `y = ${derivedData.publicKey.toString()}` : 'Waiting for Prover...'}
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
                  {responseZ && step >= 3 ? `z = ${responseZ.toString()}` : 'Awaiting response submission...'}
                </span>
              </div>
              <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Session ID:</span>
                <span className="text-slate-400 truncate max-w-[200px]">
                  {sessionId ? sessionId : 'No active session'}
                </span>
              </div>
            </div>

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
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-500/10'
              }`}>
                <div className="flex items-center space-x-3 mb-4">
                  {verificationResult.isValid ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {verificationResult.isValid ? 'PROOF ACCEPTED (Authentication Succeeded)' : 'PROOF REJECTED (Authentication Failed)'}
                    </h4>
                    <p className={`text-xs font-mono ${verificationResult.isValid ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {verificationResult.audit?.reason || (verificationResult.isValid ? 'LHS equals RHS' : 'LHS != RHS')}
                    </p>
                  </div>
                </div>

                {/* Mathematical Equation Proof Verification Breakdown */}
                {verificationResult.equation && (
                  <div className="space-y-2 pt-3 border-t border-navy-800 text-xs font-mono">
                    <div className="text-slate-300 font-semibold">
                      Verification Formula: <span className="text-cyan-400">g^z mod p ≡ t · y^e (mod p)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-700">
                        <span className="text-slate-400 block text-[10px] uppercase">Left-Hand Side (LHS):</span>
                        <span className="text-sm font-bold text-blue-400">
                          {verificationResult.equation.lhs}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-1">
                          2^{responseZ?.toString()} mod 23
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-700">
                        <span className="text-slate-400 block text-[10px] uppercase">Right-Hand Side (RHS):</span>
                        <span className="text-sm font-bold text-purple-400">
                          {verificationResult.equation.rhs}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-1">
                          ({commitmentT?.toString()} · {derivedData?.publicKey.toString()}^{challengeE?.toString()}) mod 23
                        </span>
                      </div>
                    </div>
                    <div className="text-center pt-2 font-bold">
                      {verificationResult.isValid ? (
                        <span className="text-emerald-400">✓ LHS ({verificationResult.equation.lhs}) === RHS ({verificationResult.equation.rhs})</span>
                      ) : (
                        <span className="text-rose-400">✗ LHS ({verificationResult.equation.lhs}) !== RHS ({verificationResult.equation.rhs})</span>
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

