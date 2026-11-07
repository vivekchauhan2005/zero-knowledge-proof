import React, { useState } from 'react';
import { 
  Key, Lock, Send, RefreshCw, CheckCircle2, XCircle, ShieldAlert, 
  ArrowRight, Terminal, Shield, Eye, EyeOff, Sparkles, UserCheck, UserX, Flame
} from 'lucide-react';
import { 
  computePublicKey, 
  computeCommitment, 
  computeResponse, 
  EDUCATIONAL_PARAMS 
} from '../utils/schnorrClient';
import { api } from '../services/api';

export default function DualConsoleDashboard({ onProofComplete }) {
  // Current active scenario: 'honest' | 'impostor' | 'tampered'
  const [activeScenario, setActiveScenario] = useState('honest');

  // Alice's registered account parameters (dynamically randomized)
  const [username, setUsername] = useState('alice');
  const [aliceRealSecret, setAliceRealSecret] = useState(3);
  const [serverRegisteredPubKey, setServerRegisteredPubKey] = useState('8');

  // Currently evaluated secret in Prover console (can be Alice's secret or Impostor's guess)
  const [secretX, setSecretX] = useState(3);
  const [showSecret, setShowSecret] = useState(false);

  // Protocol state
  const [nonceR, setNonceR] = useState(5);
  const [commitmentT, setCommitmentT] = useState(null);
  const [challengeE, setChallengeE] = useState(null);
  const [responseZ, setResponseZ] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  // Execution step: 0 = Ready, 1 = Challenged (Ready to submit z), 2 = Verified
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Generate a brand new random secret key for Alice
  const generateNewRandomSecret = async () => {
    try {
      setLoading(true);
      const randX = Math.floor(Math.random() * 9) + 1;
      setSecretX(randX);
      setAliceRealSecret(randX);
      const pubY = computePublicKey(BigInt(randX)).toString();
      await api.registerUser(username, pubY);
      setServerRegisteredPubKey(pubY);
      handleReset();
    } catch (err) {
      console.error('Failed to register new secret:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual typing of Secret Key x
  const handleSecretChange = async (val) => {
    const parsed = parseInt(val);
    const num = isNaN(parsed) ? 1 : Math.max(1, Math.min(10, parsed));
    setSecretX(num);
    setAliceRealSecret(num);
    const pubY = computePublicKey(BigInt(num)).toString();
    setServerRegisteredPubKey(pubY);
    handleReset();
    try {
      await api.registerUser(username, pubY);
    } catch (err) {
      console.error('Failed to register typed key:', err);
    }
  };

  // Handle manual typing of Nonce r
  const handleNonceChange = (val) => {
    const parsed = parseInt(val);
    const num = isNaN(parsed) ? 1 : Math.max(1, Math.min(10, parsed));
    setNonceR(num);
    handleReset();
  };

  // 1. SCENARIO A: HONEST PROVER (WILL ACCEPT)
  const setupHonestScenario = () => {
    setActiveScenario('honest');
    setUsername('alice');
    setSecretX(aliceRealSecret);
    handleReset();
  };

  // 2. SCENARIO B: IMPOSTOR WITH RANDOM WRONG SECRET (WILL REJECT)
  const setupImpostorScenario = () => {
    setActiveScenario('impostor');
    setUsername('alice');
    const wrongKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => n !== aliceRealSecret);
    const randWrong = wrongKeys[Math.floor(Math.random() * wrongKeys.length)];
    setSecretX(randWrong);
    handleReset();
  };

  // 3. SCENARIO C: TAMPERED RESPONSE IN TRANSIT (WILL REJECT)
  const setupTamperedScenario = () => {
    setActiveScenario('tampered');
    setUsername('alice');
    setSecretX(aliceRealSecret);
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

  // STEP 1: Generate Commitment & Get Challenge
  const handleStep1 = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);

      const r = BigInt(nonceR || 5);
      const t = computeCommitment(r);
      setCommitmentT(t);

      // Register Alice's current secret key public key
      const pubY = computePublicKey(BigInt(secretX)).toString();
      await api.registerUser(username, pubY);
      setServerRegisteredPubKey(pubY);

      // Prover sends commitment t to server for user 'alice'
      const commitRes = await api.submitCommitment(username, pubY, t.toString());
      const sId = commitRes.session.id;
      setSessionId(sId);

      // Server generates challenge e
      const chalRes = await api.requestChallenge(sId);
      const e = BigInt(chalRes.challenge);
      setChallengeE(e);

      // Prover calculates response z = (r + e * x) mod q
      const xBig = BigInt(secretX);
      let calculatedZ = computeResponse(r, e, xBig, EDUCATIONAL_PARAMS.q);

      // If Tampered Scenario was selected, alter z by +1
      if (activeScenario === 'tampered') {
        calculatedZ = (calculatedZ + 1n) % EDUCATIONAL_PARAMS.q;
      }

      setResponseZ(calculatedZ);
      setStep(1); // Ready for Step 2
    } catch (err) {
      setErrorMsg(err.message || 'Step 1 failed');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Submit Response & Verify
  const handleStep2 = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      if (responseZ === null) {
        throw new Error('Please enter or calculate response z first');
      }

      const result = await api.submitProof(sessionId, responseZ.toString());
      setVerificationResult(result);
      setStep(2);

      if (onProofComplete) onProofComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ONE-CLICK QUICK RUN: Runs Step 1 and Step 2 automatically
  const handleOneClickTest = async (scenarioType) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setVerificationResult(null);

      const r = BigInt(nonceR || 5);
      let targetX = secretX;
      let shouldTamper = false;

      // Always register Alice's chosen secret key
      const pubY = computePublicKey(BigInt(secretX)).toString();
      await api.registerUser(username, pubY);
      setServerRegisteredPubKey(pubY);

      if (scenarioType === 'honest') {
        setActiveScenario('honest');
        targetX = secretX;
      } else if (scenarioType === 'impostor') {
        setActiveScenario('impostor');
        // Pick a wrong secret different from secretX
        const wrongKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => n !== secretX);
        targetX = wrongKeys[Math.floor(Math.random() * wrongKeys.length)];
      } else if (scenarioType === 'tampered') {
        setActiveScenario('tampered');
        targetX = secretX;
        shouldTamper = true;
      }

      // Step 1: Commit
      const t = computeCommitment(r);
      setCommitmentT(t);

      const commitRes = await api.submitCommitment('alice', pubY, t.toString());
      const sId = commitRes.session.id;
      setSessionId(sId);

      const chalRes = await api.requestChallenge(sId);
      const e = BigInt(chalRes.challenge);
      setChallengeE(e);

      let calcZ = computeResponse(r, e, BigInt(targetX), EDUCATIONAL_PARAMS.q);
      if (shouldTamper) {
        calcZ = (calcZ + 1n) % EDUCATIONAL_PARAMS.q;
      }
      setResponseZ(calcZ);

      // Step 2: Verify
      const result = await api.submitProof(sId, calcZ.toString());
      setVerificationResult(result);
      setStep(2);

      if (onProofComplete) onProofComplete();
    } catch (err) {
      setErrorMsg(err.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ================= SIMPLE 3-STEP EXPLAINER BANNER ================= */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              🔐
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">How Zero-Knowledge Authentication Works</h2>
              <p className="text-xs text-slate-300">
                Alice proves she knows her secret without sending her secret. Server verifies using pure mathematics.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
            <span className="px-2 py-1 rounded bg-navy-900 border border-navy-700">p = 23 (Prime)</span>
            <span className="px-2 py-1 rounded bg-navy-900 border border-navy-700">g = 2 (Generator)</span>
            <span className="px-2 py-1 rounded bg-navy-900 border border-navy-700">Alice Public Key y = {serverRegisteredPubKey}</span>
          </div>
        </div>
      </div>

      {/* ================= ONE-CLICK DEMO BUTTONS ================= */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-700 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Click Any Button Below To Run The Live Test:</span>
          </span>
          <button
            onClick={handleReset}
            className="text-xs font-mono px-3 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 transition flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 🟢 BUTTON 1: DEMONSTRATE ACCEPT */}
          <button
            onClick={() => handleOneClickTest('honest')}
            disabled={loading}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              activeScenario === 'honest' && verificationResult?.isValid
                ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-navy-950/80 border-navy-700 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                <UserCheck className="w-4 h-4" />
                <span>1. Test ACCEPT (Uses Entered Secret x = {secretX})</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                WILL PASS
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Tests proof with your entered secret <strong className="text-emerald-300">x = {secretX}</strong>. Equation will match!
            </p>
          </button>

          {/* 🔴 BUTTON 2: DEMONSTRATE REJECT (WRONG SECRET) */}
          <button
            onClick={() => handleOneClickTest('impostor')}
            disabled={loading}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              activeScenario === 'impostor' && verificationResult && !verificationResult.isValid
                ? 'bg-rose-950/60 border-rose-500 shadow-lg shadow-rose-500/20'
                : 'bg-navy-950/80 border-navy-700 hover:border-rose-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 text-rose-400 font-bold text-xs">
                <UserX className="w-4 h-4" />
                <span>2. Test REJECT (Wrong Secret)</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold">
                WILL FAIL
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Impostor enters a wrong secret <strong className="text-rose-300">≠ {secretX}</strong>. Equation will mismatch!
            </p>
          </button>

          {/* ⚠️ BUTTON 3: DEMONSTRATE REJECT (TAMPERED) */}
          <button
            onClick={() => handleOneClickTest('tampered')}
            disabled={loading}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              activeScenario === 'tampered' && verificationResult && !verificationResult.isValid
                ? 'bg-amber-950/60 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-navy-950/80 border-navy-700 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                <Flame className="w-4 h-4" />
                <span>3. Test REJECT (Tampered z)</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                WILL FAIL
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Hacker alters response <strong className="text-amber-300">z by +1</strong> in transit. Rejected!
            </p>
          </button>
        </div>
      </div>

      {/* ================= VERIFICATION RESULT BANNER (BIG & CLEAR) ================= */}
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
                    ? 'Both sides of the equation match exactly! Alice proved she knows the secret without revealing it.'
                    : 'Equation mismatch! The user entered an invalid secret or the response was tampered with.'}
                </p>
              </div>
            </div>

            {/* Live Math Box */}
            <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-700 text-center font-mono text-xs space-y-1 min-w-[240px]">
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Mathematical Verification:</span>
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
                Formula: g^z mod p ≡ (t · y^e) mod p
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= DUAL SPLIT CONSOLE (PROVER VS VERIFIER) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================= LEFT CONSOLE: ALICE (PROVER) ================= */}
        <div className="rounded-2xl bg-[#0c1224] border border-purple-500/30 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Prover Vault (Alice / Client Browser)</h4>
                <p className="text-[10px] text-purple-400 font-mono">Secret Never Leaves This Computer</p>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-300">Identity: @{username}</span>
          </div>

          {/* Secret Display - Fully editable manual input! */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Alice's Secret Key (x ∈ [1, 10]):</span>
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={secretX}
                  onChange={(e) => handleSecretChange(e.target.value)}
                  className="w-14 px-2 py-1 rounded bg-navy-900 border border-purple-500/50 text-amber-300 font-mono font-bold text-center text-xs focus:outline-none focus:border-purple-400"
                  title="Type any secret number from 1 to 10"
                />
                <button
                  type="button"
                  onClick={generateNewRandomSecret}
                  className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-mono cursor-pointer transition flex items-center space-x-1"
                  title="Pick a random secret"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Random</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-navy-800">
              <span>Public Key (y = 2^{secretX} mod 23):</span>
              <span className="text-cyan-400 font-bold">y = {computePublicKey(BigInt(secretX)).toString()}</span>
            </div>
          </div>

          {/* Protocol Values - Step-by-step interactive inputs */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-2.5 font-mono text-xs">
            {/* Nonce r Input */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Random Nonce (r ∈ [1, 10]):</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={nonceR}
                  onChange={(e) => handleNonceChange(e.target.value)}
                  className="w-14 px-2 py-0.5 rounded bg-navy-900 border border-indigo-500/50 text-amber-400 font-bold text-center text-xs focus:outline-none focus:border-indigo-400"
                  title="Type any nonce number from 1 to 10"
                />
                <button
                  type="button"
                  onClick={() => setNonceR(Math.floor(Math.random() * 9) + 1)}
                  className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] hover:bg-indigo-500/30 cursor-pointer"
                  title="Randomize nonce"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Commitment t */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Commitment (t = 2^{nonceR} mod 23):</span>
              <span className="text-purple-300 font-bold">
                t = {computeCommitment(BigInt(nonceR || 5)).toString()}
              </span>
            </div>

            {/* Server Challenge e */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Received Challenge (e):</span>
              <span className="text-blue-400 font-bold">
                {challengeE ? `e = ${challengeE.toString()}` : 'Click Step 1 to request...'}
              </span>
            </div>

            {/* Response z Input */}
            <div className="flex items-center justify-between pt-1 border-t border-navy-800">
              <div>
                <span className="text-slate-300 font-semibold block">Response z = (r + e·x) mod 11:</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {challengeE ? `(${nonceR} + ${challengeE}×${secretX}) mod 11` : 'Computed on Step 1'}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={responseZ !== null ? responseZ.toString() : ''}
                  onChange={(e) => setResponseZ(e.target.value === '' ? null : BigInt(e.target.value))}
                  placeholder="z"
                  className="w-14 px-2 py-0.5 rounded bg-navy-900 border border-emerald-500/50 text-emerald-400 font-bold text-center text-xs focus:outline-none focus:border-emerald-400"
                  title="Computed response or type to tamper"
                />
              </div>
            </div>
          </div>

          {/* Step-by-Step Buttons */}
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <button
                onClick={handleStep1}
                disabled={loading}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition disabled:opacity-40 cursor-pointer"
              >
                1. Send Commitment (t)
              </button>
              <button
                onClick={handleStep2}
                disabled={loading || step === 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-40 cursor-pointer"
              >
                2. Submit Response (z)
              </button>
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
                <p className="text-[10px] text-cyan-400 font-mono">Verifies Without Seeing Secret</p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">p=23, q=11, g=2</span>
          </div>

          {/* Registered Identity & Received Wire Data */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-cyan-500/20 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Server Registered Key for Alice:</span>
              <span className="text-cyan-300 font-bold">y = {serverRegisteredPubKey} (Registered on Server)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Received Commitment (t):</span>
              <span className="text-purple-300 font-semibold">{commitmentT ? commitmentT.toString() : 'Awaiting...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Server Challenge Issued (e):</span>
              <span className="text-blue-400 font-semibold">{challengeE ? challengeE.toString() : 'Awaiting...'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Received Response (z):</span>
              <span className="text-emerald-400 font-semibold">{responseZ !== null ? responseZ.toString() : 'Awaiting...'}</span>
            </div>
          </div>

          {/* What the server evaluates */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-800 space-y-2 text-xs font-mono">
            <span className="text-slate-400 block font-bold text-[10px] uppercase">Verifier Equation:</span>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded bg-navy-900 border border-navy-700">
                <span className="text-[10px] text-slate-400 block">LHS: g^z mod p</span>
                <span className="font-bold text-blue-400 text-sm">
                  {verificationResult?.equation?.lhs || '2^z mod 23'}
                </span>
              </div>
              <div className="p-2 rounded bg-navy-900 border border-navy-700">
                <span className="text-[10px] text-slate-400 block">RHS: (t · y^e) mod p</span>
                <span className="font-bold text-purple-400 text-sm">
                  {verificationResult?.equation?.rhs || `(t · ${serverRegisteredPubKey}^e) mod 23`}
                </span>
              </div>
            </div>
          </div>

          {/* Status Note */}
          <div className="text-center text-xs text-slate-400">
            {verificationResult ? (
              <span className={verificationResult.isValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {verificationResult.isValid ? '✓ Access Granted: Math check passed' : '✗ Access Denied: Math check failed'}
              </span>
            ) : (
              <span>Click any test button above to run verification</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
