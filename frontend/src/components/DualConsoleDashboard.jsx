import React, { useState, useEffect } from 'react';
import { 
  Key, Lock, Send, RefreshCw, CheckCircle2, XCircle, ShieldAlert, 
  ArrowRight, Terminal, Shield, Eye, EyeOff, Sparkles, UserCheck, UserX, Flame, Dices
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
  // Registered User Account
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('aliceSecretPass2026');
  const [showPassword, setShowPassword] = useState(false);
  
  // Alice's registered public key and private scalar (derived automatically from password)
  const [registeredData, setRegisteredData] = useState({
    scalar: 3n,
    publicKey: 8n
  });

  // Protocol state (Generated dynamically & randomly)
  const [nonceR, setNonceR] = useState(null);
  const [commitmentT, setCommitmentT] = useState(null);
  const [challengeE, setChallengeE] = useState(null);
  const [responseZ, setResponseZ] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [attemptType, setAttemptType] = useState('honest'); // 'honest' | 'impostor' | 'tampered'
  
  // Execution step: 0 = Ready, 1 = Challenged (Ready to submit), 2 = Verified
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Derive Alice's secret key and register her public key automatically on startup/password change
  useEffect(() => {
    async function initUser() {
      try {
        const derived = await deriveScalarFromSecret(password, EDUCATIONAL_PARAMS.q);
        const pubKey = computePublicKey(derived.scalar);
        setRegisteredData({
          scalar: derived.scalar,
          publicKey: pubKey
        });

        // Register user's public key with server backend
        await api.registerUser(username, pubKey.toString());
      } catch (err) {
        console.error('Failed to register user:', err);
      }
    }
    initUser();
  }, [password, username]);

  // Generate a random password for Alice
  const randomizePassword = () => {
    const randomWords = ['CryptoMaster', 'ZeroTrust', 'QuantumKey', 'CyberShield', 'DeepProof', 'AlphaSecret'];
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newPass = `${randomWords[Math.floor(Math.random() * randomWords.length)]}${randomSuffix}`;
    setPassword(newPass);
    handleReset();
  };

  // Quick Reset
  const handleReset = () => {
    setCommitmentT(null);
    setChallengeE(null);
    setResponseZ(null);
    setSessionId(null);
    setVerificationResult(null);
    setErrorMsg(null);
    setStep(0);
  };

  // ========================================================
  // 🟢 1. RUN RANDOM VALID LOGIN (HONEST ALICE)
  // Completely automatic with fresh random numbers every click!
  // ========================================================
  const runRandomValidLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);
      setAttemptType('honest');

      // 1. Generate fresh random nonce r in [1, q-1]
      const r = generateRandomNonce(EDUCATIONAL_PARAMS.q);
      const t = computeCommitment(r);
      setNonceR(r);
      setCommitmentT(t);

      // 2. Submit commitment t to backend to start session
      const commitRes = await api.submitCommitment(username, registeredData.publicKey.toString(), t.toString());
      const sId = commitRes.session.id;
      setSessionId(sId);

      // 3. Backend issues a fresh random challenge e
      const chalRes = await api.requestChallenge(sId);
      const e = BigInt(chalRes.challenge);
      setChallengeE(e);

      // 4. Prover calculates honest response: z = (r + e * x) mod q
      const z = computeResponse(r, e, registeredData.scalar, EDUCATIONAL_PARAMS.q);
      setResponseZ(z);

      // 5. Submit response z to backend for mathematical verification
      const verifyRes = await api.submitProof(sId, z.toString());
      setVerificationResult(verifyRes);
      setStep(2);

      if (onProofComplete) onProofComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // 🔴 2. RUN RANDOM INVALID LOGIN (WRONG PASSWORD / IMPOSTOR)
  // Generates a random wrong secret, attempts login -> REJECTED!
  // ========================================================
  const runRandomInvalidLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);
      setAttemptType('impostor');

      // Impostor picks a random nonce
      const r = generateRandomNonce(EDUCATIONAL_PARAMS.q);
      const t = computeCommitment(r);
      setNonceR(r);
      setCommitmentT(t);

      // Impostor requests session for 'alice'
      const commitRes = await api.submitCommitment(username, registeredData.publicKey.toString(), t.toString());
      const sId = commitRes.session.id;
      setSessionId(sId);

      // Backend issues challenge e
      const chalRes = await api.requestChallenge(sId);
      const e = BigInt(chalRes.challenge);
      setChallengeE(e);

      // Impostor DOES NOT know Alice's secret.
      // Impostor uses a random wrong scalar x_fake != x
      let fakeScalar = generateRandomNonce(EDUCATIONAL_PARAMS.q);
      if (fakeScalar === registeredData.scalar) {
        fakeScalar = (fakeScalar % (EDUCATIONAL_PARAMS.q - 2n)) + 1n;
      }

      // Impostor computes response using fake secret
      const fakeZ = computeResponse(r, e, fakeScalar, EDUCATIONAL_PARAMS.q);
      setResponseZ(fakeZ);

      // Submit fake response to backend -> Server will reject because LHS != RHS!
      const verifyRes = await api.submitProof(sId, fakeZ.toString());
      setVerificationResult(verifyRes);
      setStep(2);

      if (onProofComplete) onProofComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // ⚠️ 3. RUN RANDOM TAMPERED ATTACK (MAN-IN-THE-MIDDLE)
  // Honest proof is altered by random offset in transit -> REJECTED!
  // ========================================================
  const runRandomTamperedAttack = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);
      setAttemptType('tampered');

      const r = generateRandomNonce(EDUCATIONAL_PARAMS.q);
      const t = computeCommitment(r);
      setNonceR(r);
      setCommitmentT(t);

      const commitRes = await api.submitCommitment(username, registeredData.publicKey.toString(), t.toString());
      const sId = commitRes.session.id;
      setSessionId(sId);

      const chalRes = await api.requestChallenge(sId);
      const e = BigInt(chalRes.challenge);
      setChallengeE(e);

      // Honest z
      const honestZ = computeResponse(r, e, registeredData.scalar, EDUCATIONAL_PARAMS.q);
      
      // Hacker tampers with z by adding a random offset (1 to 5)
      const randomOffset = BigInt(Math.floor(1 + Math.random() * 4));
      const tamperedZ = (honestZ + randomOffset) % EDUCATIONAL_PARAMS.q;
      setResponseZ(tamperedZ);

      // Submit tampered z -> Server detects altered math and REJECTS!
      const verifyRes = await api.submitProof(sId, tamperedZ.toString());
      setVerificationResult(verifyRes);
      setStep(2);

      if (onProofComplete) onProofComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ================= USER ACCOUNT SETTINGS (AUTOMATIC) ================= */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-indigo-950/20 to-purple-950/30 border border-blue-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            👤
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">Registered Account:</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                @{username}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span>Password:</span>
              <span className="font-mono text-slate-200">
                {showPassword ? password : '••••••••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={randomizePassword}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 text-xs font-medium transition cursor-pointer"
            title="Generate a completely new random password"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Random Password</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 text-xs font-medium transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* ================= ONE-CLICK AUTOMATIC TESTING BUTTONS ================= */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-700 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Click Any Button Below To Test Live (No Manual Entry Needed):</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Numbers are generated randomly on each click
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 🟢 BUTTON 1: RUN VALID LOGIN */}
          <button
            onClick={runRandomValidLogin}
            disabled={loading}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              attemptType === 'honest' && verificationResult?.isValid
                ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-navy-950/80 border-navy-700 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                <UserCheck className="w-4 h-4" />
                <span>1. Test VALID Login</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                WILL ACCEPT
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Alice uses her real password. Generates fresh random nonce & challenge $\rightarrow$ <strong>ACCEPTED!</strong>
            </p>
          </button>

          {/* 🔴 BUTTON 2: RUN INVALID LOGIN */}
          <button
            onClick={runRandomInvalidLogin}
            disabled={loading}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              attemptType === 'impostor' && verificationResult && !verificationResult.isValid
                ? 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20'
                : 'bg-navy-950/80 border-navy-700 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 text-rose-400 font-bold text-xs">
                <UserX className="w-4 h-4" />
                <span>2. Test WRONG Password</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                WILL REJECT
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Impostor attempts login with a random wrong password $\rightarrow$ <strong>REJECTED!</strong>
            </p>
          </button>

          {/* ⚠️ BUTTON 3: RUN TAMPERED ATTACK */}
          <button
            onClick={runRandomTamperedAttack}
            disabled={loading}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              attemptType === 'tampered' && verificationResult && !verificationResult.isValid
                ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-navy-950/80 border-navy-700 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                <Flame className="w-4 h-4" />
                <span>3. Test TAMPERED Data</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                WILL REJECT
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              A hacker in transit modifies the answer packet $\rightarrow$ <strong>REJECTED!</strong>
            </p>
          </button>
        </div>
      </div>

      {/* ================= BIG VERIFICATION RESULT BANNER ================= */}
      {verificationResult && (
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          verificationResult.isValid
            ? 'bg-gradient-to-r from-emerald-950/50 to-[#071a14] border-emerald-500 shadow-xl shadow-emerald-500/10'
            : 'bg-gradient-to-r from-rose-950/50 to-[#1a070e] border-rose-500 shadow-xl shadow-rose-500/10'
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                verificationResult.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {verificationResult.isValid ? <CheckCircle2 className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  {verificationResult.isValid ? '✅ PROOF ACCEPTED — ACCESS GRANTED!' : '❌ PROOF REJECTED — ACCESS DENIED!'}
                </h3>
                <p className={`text-sm mt-1 font-medium ${verificationResult.isValid ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {verificationResult.isValid
                    ? 'The mathematical equation balanced perfectly! Alice proved she holds the password without revealing it.'
                    : 'Equation mismatch! The entered secret is wrong or the response packet was altered in transit.'}
                </p>
              </div>
            </div>

            {/* Live Verification Math Box */}
            <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-700 text-center font-mono text-xs space-y-1 min-w-[250px]">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Server Equation Check:</span>
              <div className="text-base font-extrabold text-white">
                <span className={verificationResult.isValid ? 'text-emerald-400' : 'text-rose-400'}>
                  LHS = {verificationResult.equation?.lhs}
                </span>
                <span className="text-slate-400 mx-2">{verificationResult.isValid ? '===' : '≠'}</span>
                <span className={verificationResult.isValid ? 'text-emerald-400' : 'text-rose-400'}>
                  RHS = {verificationResult.equation?.rhs}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block pt-1">
                g^z mod p ≡ (t · y^e) mod p
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= DUAL CONSOLE DISPLAY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================= LEFT CONSOLE: ALICE (PROVER) ================= */}
        <div className="rounded-2xl bg-[#0c1224] border border-purple-500/30 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Prover Vault (Client Laptop / Phone)</h4>
                <p className="text-[10px] text-purple-400 font-mono">Password & Nonce Never Sent Over Network</p>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-300">Identity: @{username}</span>
          </div>

          {/* Random Numbers Generated for this Round */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-purple-500/20 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Private Witness (x):</span>
              <span className="text-amber-300 font-bold">x = {registeredData.scalar.toString()} (Sealed in memory)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Random Nonce Generated (r):</span>
              <span className="text-amber-400 font-bold">{nonceR ? `r = ${nonceR.toString()}` : 'Click any button above'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Commitment Sent (t = 2^r mod 23):</span>
              <span className="text-purple-300 font-bold">{commitmentT ? `t = ${commitmentT.toString()}` : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Server Random Challenge Received (e):</span>
              <span className="text-blue-400 font-bold">{challengeE ? `e = ${challengeE.toString()}` : '—'}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-navy-800">
              <span className="text-slate-300 font-semibold">Calculated Response (z):</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                {responseZ !== null ? `z = ${responseZ.toString()}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT CONSOLE: SERVER (VERIFIER) ================= */}
        <div className="rounded-2xl bg-[#091122] border border-cyan-500/30 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                V
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Verifier Server (Node.js API)</h4>
                <p className="text-[10px] text-cyan-400 font-mono">Zero Knowledge of Password</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">p=23, q=11, g=2</span>
          </div>

          {/* What Server Sees Over Wire */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-cyan-500/20 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Alice Registered Public Key:</span>
              <span className="text-cyan-300 font-bold">y = {registeredData.publicKey.toString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Received Commitment (t):</span>
              <span className="text-purple-300 font-semibold">{commitmentT ? commitmentT.toString() : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Random Challenge Issued (e):</span>
              <span className="text-blue-400 font-semibold">{challengeE ? challengeE.toString() : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Received Answer (z):</span>
              <span className="text-emerald-400 font-semibold">{responseZ !== null ? responseZ.toString() : '—'}</span>
            </div>
          </div>

          {/* Mathematical Check */}
          <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-xs font-mono text-center">
            {verificationResult ? (
              <div className="space-y-1">
                <span className={verificationResult.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {verificationResult.isValid ? '✓ Mathematics Verified (Accepted)' : '✗ Mathematics Mismatch (Rejected)'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {verificationResult.isValid 
                    ? `LHS (${verificationResult.equation?.lhs}) matches RHS (${verificationResult.equation?.rhs})`
                    : `LHS (${verificationResult.equation?.lhs}) does not match RHS (${verificationResult.equation?.rhs})`}
                </p>
              </div>
            ) : (
              <span className="text-slate-500">Click any test button above to run</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
