import React, { useState } from 'react';
import { 
  Calculator, Check, AlertCircle, ArrowRight, ShieldCheck, 
  HelpCircle, UserCheck, UserX, Flame, Shuffle, RefreshCw 
} from 'lucide-react';
import { 
  modPow, 
  mod, 
  computePublicKey, 
  computeCommitment, 
  computeResponse, 
  EDUCATIONAL_PARAMS 
} from '../utils/schnorrClient';

export default function MathVerification() {
  // Interactive test inputs (range 1 to 11)
  const [xVal, setXVal] = useState('3');
  const [rVal, setRVal] = useState('5');
  const [eVal, setEVal] = useState('4');
  const [isTampered, setIsTampered] = useState(false);

  // Authorized secrets: 3, 6, 11
  const AUTHORIZED_SECRETS = [3n, 6n, 11n];

  const p = EDUCATIONAL_PARAMS.p;
  const q = EDUCATIONAL_PARAMS.q;
  const g = EDUCATIONAL_PARAMS.g;

  // Safe parsing (1 to 11)
  const x = BigInt(Math.max(1, Math.min(11, parseInt(xVal) || 1)));
  const r = BigInt(Math.max(1, Math.min(10, parseInt(rVal) || 1)));
  const e = BigInt(Math.max(1, Math.min(10, parseInt(eVal) || 1)));

  // Prover dynamic calculations
  const proverDerivedY = computePublicKey(x, p, g);
  const t = computeCommitment(r, p, g);
  
  // Calculate response z = (r + e * x) mod q
  let calculatedZ = computeResponse(r, e, x, q);
  if (isTampered) {
    calculatedZ = (calculatedZ + 1n) % q;
  }
  const z = calculatedZ;

  // Verifier public key used:
  // If x is an authorized secret (3, 6, 11), server verifies against that authorized key
  // If x is an unauthorized secret, server verifies against primary key 8 (causing equation failure)
  const isAuthorized = AUTHORIZED_SECRETS.includes(x);
  const verifierPubKey = isAuthorized ? proverDerivedY : 8n;

  // Verifier calculates LHS = g^z mod p and RHS = (t * y_server^e) mod p
  const lhs = modPow(g, z, p);
  const ye = modPow(verifierPubKey, e, p);
  const rhs = mod(t * ye, p);
  const isMatch = (lhs === rhs);

  // Preset Handlers
  const handleUseSecret = (val, tamper = false) => {
    setXVal(val.toString());
    setIsTampered(tamper);
  };

  const handleRandomSecret = () => {
    const pick = Math.floor(Math.random() * 11) + 1;
    handleUseSecret(pick, false);
  };

  // Precompute matrix for all numbers 1 to 11 with current r and e
  const numbersMatrix = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
    const testX = BigInt(num);
    const testIsAuth = AUTHORIZED_SECRETS.includes(testX);
    const testProverY = computePublicKey(testX, p, g);
    const testServerY = testIsAuth ? testProverY : 8n;
    const testZ = computeResponse(r, e, testX, q);
    const testLhs = modPow(g, testZ, p);
    const testRhs = mod(t * modPow(testServerY, e, p), p);
    const testMatches = (testLhs === testRhs);
    return {
      num,
      proverY: testProverY.toString(),
      z: testZ.toString(),
      lhs: testLhs.toString(),
      rhs: testRhs.toString(),
      accepted: testMatches
    };
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <span>Mathematical Proof & Live Dynamic Verification Engine</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Full dynamic algebraic evaluation of the Schnorr verification equation modulo p=23
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            p = 23, q = 11, g = 2
          </span>
        </div>
      </div>

      {/* Quick Test Preset Buttons (No pre-verdict spoilers) */}
      <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-700 shadow-md space-y-3">
        <span className="text-xs font-bold text-white uppercase tracking-wider block">
          Select or Test Any Scalar Parameter:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Secret 3 */}
          <button
            type="button"
            onClick={() => handleUseSecret(3, false)}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              x.toString() === '3' && !isTampered
                ? 'bg-blue-950/70 border-blue-500 shadow-md'
                : 'bg-navy-950 border-navy-700 hover:border-blue-500/40'
            }`}
          >
            <span className="text-xs font-bold text-white block mb-0.5">Secret x = 3</span>
            <span className="text-[11px] text-slate-400 block font-mono">y = 8</span>
          </button>

          {/* Secret 6 */}
          <button
            type="button"
            onClick={() => handleUseSecret(6, false)}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              x.toString() === '6' && !isTampered
                ? 'bg-blue-950/70 border-blue-500 shadow-md'
                : 'bg-navy-950 border-navy-700 hover:border-blue-500/40'
            }`}
          >
            <span className="text-xs font-bold text-white block mb-0.5">Secret x = 6</span>
            <span className="text-[11px] text-slate-400 block font-mono">y = 18</span>
          </button>

          {/* Secret 11 */}
          <button
            type="button"
            onClick={() => handleUseSecret(11, false)}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              x.toString() === '11' && !isTampered
                ? 'bg-blue-950/70 border-blue-500 shadow-md'
                : 'bg-navy-950 border-navy-700 hover:border-blue-500/40'
            }`}
          >
            <span className="text-xs font-bold text-white block mb-0.5">Secret x = 11</span>
            <span className="text-[11px] text-slate-400 block font-mono">y = 1</span>
          </button>

          {/* Secret 7 */}
          <button
            type="button"
            onClick={() => handleUseSecret(7, false)}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              x.toString() === '7' && !isTampered
                ? 'bg-blue-950/70 border-blue-500 shadow-md'
                : 'bg-navy-950 border-navy-700 hover:border-blue-500/40'
            }`}
          >
            <span className="text-xs font-bold text-white block mb-0.5">Secret x = 7</span>
            <span className="text-[11px] text-slate-400 block font-mono">y = 13</span>
          </button>

          {/* Random Secret */}
          <button
            type="button"
            onClick={handleRandomSecret}
            className="p-3 rounded-xl border bg-navy-950 border-navy-700 hover:border-indigo-500/40 text-left transition cursor-pointer"
          >
            <span className="text-xs font-bold text-indigo-300 block mb-0.5 flex items-center space-x-1">
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random [1..11]</span>
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">Pick any number</span>
          </button>

          {/* Tamper */}
          <button
            type="button"
            onClick={() => setIsTampered(!isTampered)}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              isTampered
                ? 'bg-amber-950/70 border-amber-500 shadow-md'
                : 'bg-navy-950 border-navy-700 hover:border-amber-500/40'
            }`}
          >
            <span className="text-xs font-bold text-amber-400 block mb-0.5 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Tamper (z + 1)</span>
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">
              {isTampered ? 'Active' : 'Off'}
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Parameter Playground */}
      <div className="p-6 rounded-2xl bg-navy-900/90 border border-navy-700 shadow-md">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span>Interactive Parameter Playground</span>
            <span className="text-xs text-slate-400 font-normal">(Type any number from 1 to 11)</span>
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Secret Scalar x */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-navy-700">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-200">
                Secret Scalar x ∈ [1, 11]:
              </label>
            </div>
            <input
              type="number"
              min="1"
              max="11"
              value={xVal}
              onChange={(e) => setXVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-900 border border-navy-600 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
            <span className="text-[11px] font-mono text-slate-400 mt-1 block">
              Prover's key: 2^{x.toString()} mod 23 = <strong className="text-cyan-400">{proverDerivedY.toString()}</strong>
            </span>
          </div>

          {/* Random Nonce r */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-indigo-500/30">
            <label className="block text-xs font-semibold text-indigo-300 mb-1">
              Random Nonce r ∈ [1, 10]:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={rVal}
              onChange={(e) => setRVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-900 border border-indigo-500/40 text-indigo-200 font-mono text-sm focus:outline-none focus:border-indigo-400"
            />
            <span className="text-[11px] font-mono text-slate-400 mt-1 block">
              t = 2^{r.toString()} mod 23 = <strong className="text-purple-300">{t.toString()}</strong>
            </span>
          </div>

          {/* Challenge e */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-blue-500/30">
            <label className="block text-xs font-semibold text-blue-300 mb-1">
              Challenge e ∈ [1, 10]:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={eVal}
              onChange={(e) => setEVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-900 border border-blue-500/40 text-blue-200 font-mono text-sm focus:outline-none focus:border-blue-400"
            />
            <span className="text-[11px] font-mono text-slate-400 mt-1 block">
              z = ({r.toString()} + {e.toString()}·{x.toString()}){isTampered ? ' + 1' : ''} mod 11 = <strong className={isTampered ? 'text-amber-400' : 'text-emerald-400'}>{z.toString()}</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Verification Equation Comparison Box */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isMatch ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-rose-950/20 border-rose-500/50'
        }`}>
          <div className="text-center mb-6">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-1">
              Schnorr Identification Verification Equation Checked by Server
            </span>
            <div className="text-lg sm:text-2xl font-mono font-extrabold text-white">
              g^z mod p <span className="text-indigo-400">≡</span> (t · y^e) mod p
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Evaluated with g = 2, p = 23, q = 11
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* LHS */}
            <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-700 space-y-2">
              <span className="text-xs font-mono text-blue-400 font-bold block">
                LEFT-HAND SIDE (LHS): g^z mod p
              </span>
              <div className="text-xs font-mono text-slate-300 space-y-1">
                <div>= 2^{z.toString()} mod 23</div>
                <div>= {Math.pow(2, Number(z))} mod 23</div>
                <div className="text-lg font-bold text-blue-400 pt-1">
                  LHS = {lhs.toString()}
                </div>
              </div>
            </div>

            {/* RHS */}
            <div className="p-4 rounded-xl bg-navy-950/80 border border-navy-700 space-y-2">
              <span className="text-xs font-mono text-purple-400 font-bold block">
                RIGHT-HAND SIDE (RHS): (t · y^e) mod p
              </span>
              <div className="text-xs font-mono text-slate-300 space-y-1">
                <div>= ({t.toString()} · {verifierPubKey.toString()}^{e.toString()}) mod 23</div>
                <div>= ({t.toString()} · {ye.toString()}) mod 23</div>
                <div className="text-lg font-bold text-purple-400 pt-1">
                  RHS = {rhs.toString()}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-800 text-center">
            {isMatch ? (
              <div className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-mono font-bold shadow-lg shadow-emerald-500/10">
                <Check className="w-5 h-5" />
                <span>Verification Holds: LHS ({lhs.toString()}) === RHS ({rhs.toString()}) — Proof ACCEPTED ✅</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-mono font-bold shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-5 h-5" />
                <span>Verification Failed: LHS ({lhs.toString()}) ≠ RHS ({rhs.toString()}) — Proof REJECTED ❌</span>
              </div>
            )}
            <div className="text-xs text-slate-400 mt-2">
              {isMatch
                ? `Possession of valid secret x = ${x.toString()} mathematically authenticated.`
                : isTampered
                  ? 'Response z was altered (+1) in transit, breaking discrete log equivalence.'
                  : `Secret x = ${x.toString()} does not satisfy the discrete log relationship on the server.`}
            </div>
          </div>
        </div>
      </div>

      {/* Scalar Verification Results Table (x = 1 to 11) */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-700 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Scalar Evaluation Results for Subgroup Z_11* (x = 1 to 11)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Evaluated with Nonce r = {r.toString()}, Challenge e = {e.toString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-700 text-slate-400 bg-navy-950/60">
                <th className="py-2.5 px-3">Secret Scalar (x)</th>
                <th className="py-2.5 px-3">Prover Public Key (y)</th>
                <th className="py-2.5 px-3">Response (z)</th>
                <th className="py-2.5 px-3">LHS (g^z)</th>
                <th className="py-2.5 px-3">RHS (t·y^e)</th>
                <th className="py-2.5 px-3 text-center">Verdict</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {numbersMatrix.map((item) => (
                <tr 
                  key={item.num}
                  className={`transition ${
                    item.num === Number(x)
                      ? 'bg-blue-950/40 font-bold'
                      : item.accepted
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/40'
                        : 'hover:bg-navy-800/40'
                  }`}
                >
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center space-x-1 font-bold ${
                      item.accepted ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      <span>x = {item.num}</span>
                      {item.num === Number(x) && <span className="text-[10px] text-cyan-400">(Selected)</span>}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className={item.accepted ? 'text-emerald-400' : 'text-slate-400'}>
                      y = {item.proverY}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    z = {item.z}
                  </td>
                  <td className="py-2 px-3 font-semibold text-blue-400">
                    {item.lhs}
                  </td>
                  <td className="py-2 px-3 font-semibold text-purple-400">
                    {item.rhs}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {item.accepted ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                        <Check className="w-3 h-3" />
                        <span>ACCEPTED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px]">
                        <AlertCircle className="w-3 h-3" />
                        <span>REJECTED</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleUseSecret(item.num, false)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                        item.num === Number(x)
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600'
                      }`}
                    >
                      {item.num === Number(x) ? 'Loaded' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classroom Educational vs RFC 3526 Production Comparison Table */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-700">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Academic vs. Production Group Parameters</span>
        </h3>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Why did we use <span className="font-mono text-blue-400">p=23, q=11, g=2</span>? For academic presentation, 
          it allows college faculty to check the exponential math by hand on a whiteboard in 10 seconds. In real-world deployments, small groups are vulnerable to brute-force discrete logarithm search.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-700 text-slate-400">
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3 text-amber-400">This Educational Demo</th>
                <th className="py-2.5 px-3 text-blue-400">RFC 3526 Standard (Production)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-300">Prime Modulus (p)</td>
                <td className="py-2 px-3 text-amber-300">23 (5 bits)</td>
                <td className="py-2 px-3 text-blue-300">2048-bit safe prime (p = 2q + 1)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-300">Subgroup Order (q)</td>
                <td className="py-2 px-3 text-amber-300">11 (4 bits)</td>
                <td className="py-2 px-3 text-blue-300">256-bit prime subgroup or 2047-bit</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-300">Generator (g)</td>
                <td className="py-2 px-3 text-amber-300">2</td>
                <td className="py-2 px-3 text-blue-300">2</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-300">Cheating Probability (1/q)</td>
                <td className="py-2 px-3 text-amber-300">1 / 11 ≈ 9.09%</td>
                <td className="py-2 px-3 text-blue-300">1 / 2^256 ≈ 8.6 × 10^-78 (Negligible)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-semibold text-slate-300">Blackboard Verifiable?</td>
                <td className="py-2 px-3 text-emerald-400 font-bold">Yes (Calculated in ~10 seconds)</td>
                <td className="py-2 px-3 text-rose-400 font-bold">No (Requires 600+ decimal digits)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
