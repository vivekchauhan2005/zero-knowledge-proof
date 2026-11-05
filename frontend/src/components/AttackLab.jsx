import React, { useState } from 'react';
import { Bug, ShieldAlert, CheckCircle2, XCircle, RefreshCw, Zap, PlayCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { 
  computePublicKey, 
  computeCommitment, 
  computeResponse, 
  EDUCATIONAL_PARAMS 
} from '../utils/schnorrClient';

export default function AttackLab({ onSimulationComplete }) {
  const [selectedScenario, setSelectedScenario] = useState('modified-response');
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [activePayload, setActivePayload] = useState(null);

  const scenarios = [
    {
      id: 'valid-baseline',
      title: '1. Honest Baseline Proof',
      type: 'PASS',
      description: 'Honest Prover possessing secret x=3, r=5, e=4, z=6. Expected: Verification ACCEPTED.',
      payload: { y: '8', t: '9', e: '4', z: '6', scenario: 'Honest Baseline Proof' },
      academicReason: 'Completeness property: When prover knows x and honestly computes z = (r + e*x) mod q, g^z mod p mathematically equals t * y^e mod p.'
    },
    {
      id: 'modified-response',
      title: '2. Tampered / Modified Response (z + 1)',
      type: 'REJECT',
      description: 'Attacker tampers with the response z in transit from 6 to 7. Expected: REJECTED.',
      payload: { y: '8', t: '9', e: '4', z: '7', scenario: 'Modified Response (z + 1)' },
      academicReason: 'Soundness property: g^7 mod 23 = 13, but t * y^e mod 23 = 18. The verification equation mismatch detects any modification in transit.'
    },
    {
      id: 'impostor-public-key',
      title: '3. Impostor Public Key Substitution',
      type: 'REJECT',
      description: 'Attacker presents a forged public key y=4 while claiming knowledge of the private key for y=8.',
      payload: { y: '4', t: '9', e: '4', z: '6', scenario: 'Impostor Public Key (y=4)' },
      academicReason: 'Public Key Binding: The verification equation checks (t * (y_impostor)^e) mod p, which does not match the prover\'s actual response.'
    },
    {
      id: 'invalid-commitment',
      title: '4. Corrupted Commitment (t)',
      type: 'REJECT',
      description: 'Commitment t was modified to t=12. Expected: REJECTED.',
      payload: { y: '8', t: '12', e: '4', z: '6', scenario: 'Corrupted Commitment (t=12)' },
      academicReason: 'Commitment Binding: Since t is part of the RHS multiplier, altering t alters the RHS result from 18 to 1, causing equality failure.'
    },
    {
      id: 'expired-challenge',
      title: '5. Expired Challenge Session (Timeout)',
      type: 'REJECT',
      isSessionBased: true,
      description: 'Prover delays and submits response after challenge TTL has lapsed (>60 seconds).',
      academicReason: 'Challenge Freshness: Prevents attackers from using offline computational time to solve discrete logarithm.'
    },
    {
      id: 'replayed-challenge',
      title: '6. Replay Attack (Token Reuse)',
      type: 'REJECT',
      isSessionBased: true,
      description: 'Attacker eavesdrops an authentic (t, e, z) tuple and tries to resubmit it to authenticate again.',
      academicReason: 'One-Time Challenge Consumption: Each session marked isConsumed=true immediately upon first verification. Resubmission is blocked.'
    },
    {
      id: 'invalid-session-id',
      title: '7. Nonexistent Session Token',
      type: 'REJECT',
      isSessionBased: true,
      description: 'Attacker submits response with a forged/random session UUID.',
      academicReason: 'Session State Integrity: Verifier rejects uninitialized or fabricated session identifiers.'
    },
    {
      id: 'blind-guesser',
      title: '8. Blind Guesser (No Secret Known)',
      type: 'REJECT',
      description: 'Eve does not know secret x. She picks a random guess z_guess=2. Expected: REJECTED.',
      payload: { y: '8', t: '9', e: '4', z: '2', scenario: 'Blind Guesser (Eve guesses z=2)' },
      academicReason: 'Hardness of Discrete Logarithm: Probability of blind guessing a valid z modulo q is 1/q = 1/11 ≈ 9.09% (and 2^-256 in production).'
    }
  ];

  const currentScenario = scenarios.find((s) => s.id === selectedScenario);

  const runSimulation = async (scenarioObj = currentScenario) => {
    try {
      setLoading(true);
      setSimulationResult(null);

      let result;
      if (scenarioObj.isSessionBased) {
        if (scenarioObj.id === 'invalid-session-id') {
          result = await api.submitProof('forged-uuid-' + Date.now(), '6');
        } else if (scenarioObj.id === 'replayed-challenge') {
          // Create session, challenge, verify once (PASS), then verify again (FAIL)
          const commitRes = await api.submitCommitment('eve-replay', '8', '9');
          const sId = commitRes.session.id;
          const chalRes = await api.requestChallenge(sId);
          // First submission consumes it
          await api.submitProof(sId, '6');
          // Second submission triggers replay prevention!
          result = await api.submitProof(sId, '6');
        } else if (scenarioObj.id === 'expired-challenge') {
          // Create session with 1ms TTL
          const commitRes = await api.submitCommitment('eve-slow', '8', '9', 1);
          const sId = commitRes.session.id;
          await new Promise((r) => setTimeout(r, 10)); // wait for expiry
          result = await api.submitProof(sId, '6');
        }
      } else {
        result = await api.simulateDirect(scenarioObj.payload);
      }

      setSimulationResult(result);
      setActivePayload(scenarioObj.payload || { scenario: scenarioObj.title });
      if (onSimulationComplete) onSimulationComplete();
    } catch (err) {
      setSimulationResult({
        isValid: false,
        status: 'REJECTED',
        error: err.message,
        equation: { lhs: '0', rhs: '0', match: false }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Bug className="w-5 h-5 text-rose-400" />
            <span>Negative Testing & Attack Simulation Lab</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Execute real adversarial attacks against the backend cryptographic verifier
          </p>
        </div>

        {/* Global Trigger Button */}
        <button
          onClick={() => runSimulation(scenarios[1])}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
          <span>SIMULATE INVALID PROOF</span>
        </button>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => setSelectedScenario(sc.id)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'bg-navy-850 border-rose-500/60 shadow-lg shadow-rose-500/10'
                  : 'bg-navy-900/60 border-navy-800 hover:border-navy-700 hover:bg-navy-850/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  sc.type === 'PASS' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {sc.type === 'PASS' ? 'ACCEPTED BASELINE' : 'ATTACK VECTOR'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{sc.title}</h4>
              <p className="text-[11px] text-slate-400 leading-tight">{sc.description}</p>
            </div>
          );
        })}
      </div>

      {/* Selected Attack Inspector & Execution Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-navy-900 to-navy-950 border border-navy-700 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-700 pb-4">
          <div>
            <span className="text-xs font-mono text-rose-400 font-bold uppercase">Active Attack Scenario</span>
            <h3 className="text-base font-bold text-white">{currentScenario.title}</h3>
            <p className="text-xs text-slate-300 mt-1">{currentScenario.description}</p>
          </div>

          <button
            onClick={() => runSimulation(currentScenario)}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
            <span>Execute Scenario Against Backend</span>
          </button>
        </div>

        {/* Academic Defense Rationale */}
        <div className="p-4 rounded-xl bg-navy-850 border border-blue-500/30">
          <span className="text-xs font-semibold text-blue-400 block mb-1">
            Academic Cryptographic Defense Rationale:
          </span>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {currentScenario.academicReason}
          </p>
        </div>

        {/* Live Backend Result */}
        {simulationResult && (
          <div className={`p-5 rounded-2xl border transition-all ${
            simulationResult.isValid
              ? 'bg-emerald-950/20 border-emerald-500/50'
              : 'bg-rose-950/20 border-rose-500/50'
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              {simulationResult.isValid ? (
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
                  Backend Verification Outcome: {simulationResult.status}
                </h4>
                <p className={`text-xs font-mono ${simulationResult.isValid ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {simulationResult.audit?.reason || simulationResult.error || 'Verification equation failed'}
                </p>
              </div>
            </div>

            {simulationResult.equation && (
              <div className="grid grid-cols-2 gap-3 mt-3 p-3 rounded-xl bg-navy-950 border border-navy-800 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Calculated LHS:</span>
                  <span className="text-sm font-bold text-blue-400">{simulationResult.equation.lhs}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Calculated RHS:</span>
                  <span className="text-sm font-bold text-purple-400">{simulationResult.equation.rhs}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

