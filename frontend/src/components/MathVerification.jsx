import React, { useState } from 'react';
import { Calculator, Check, AlertCircle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { 
  modPow, 
  mod, 
  computePublicKey, 
  computeCommitment, 
  computeResponse, 
  EDUCATIONAL_PARAMS 
} from '../utils/schnorrClient';

export default function MathVerification() {
  // Interactive test inputs
  const [xVal, setXVal] = useState('3');
  const [rVal, setRVal] = useState('5');
  const [eVal, setEVal] = useState('4');

  const p = EDUCATIONAL_PARAMS.p;
  const q = EDUCATIONAL_PARAMS.q;
  const g = EDUCATIONAL_PARAMS.g;

  // Safe parsing
  const x = BigInt(Math.max(1, Math.min(10, parseInt(xVal) || 1)));
  const r = BigInt(Math.max(1, Math.min(10, parseInt(rVal) || 1)));
  const e = BigInt(Math.max(1, Math.min(10, parseInt(eVal) || 1)));

  // Dynamic calculations
  const y = computePublicKey(x, p, g);
  const t = computeCommitment(r, p, g);
  const z = computeResponse(r, e, x, q);

  // Verification Equation calculations
  const lhs = modPow(g, z, p);
  const ye = modPow(y, e, p);
  const rhs = mod(t * ye, p);
  const isMatch = (lhs === rhs);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <span>Mathematical Proof & Dynamic Verification Engine</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Full dynamic algebraic evaluation of the Schnorr verification equation modulo p=23
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
          Cyclic Subgroup ⟨g⟩ ⊆ ℤ_p*
        </div>
      </div>

      {/* Interactive Playground Inputs */}
      <div className="p-6 rounded-2xl bg-navy-900/90 border border-navy-700 shadow-md">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <span>Interactive Parameter Playground</span>
          <span className="text-xs text-slate-400 font-normal">(Change any scalar to re-calculate instantly)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-3.5 rounded-xl bg-navy-950 border border-purple-500/30">
            <label className="block text-xs font-semibold text-purple-300 mb-1">
              Secret Scalar x ∈ [1, 10]:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={xVal}
              onChange={(e) => setXVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-navy-900 border border-purple-500/40 text-purple-200 font-mono text-sm focus:outline-none focus:border-purple-400"
            />
            <span className="text-[11px] font-mono text-slate-400 mt-1 block">
              y = 2^{x.toString()} mod 23 = <strong className="text-cyan-400">{y.toString()}</strong>
            </span>
          </div>

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
              z = ({r.toString()} + {e.toString()}·{x.toString()}) mod 11 = <strong className="text-emerald-400">{z.toString()}</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Verification Equation Comparison Box */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isMatch ? 'bg-emerald-950/20 border-emerald-500/50' : 'bg-rose-950/20 border-rose-500/50'
        }`}>
          <div className="text-center mb-6">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-1">
              Schnorr Identification Verification Equation
            </span>
            <div className="text-lg sm:text-2xl font-mono font-extrabold text-white">
              g^z mod p <span className="text-indigo-400">≡</span> (t · y^e) mod p
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
                <div>= ({t.toString()} · {y.toString()}^{e.toString()}) mod 23</div>
                <div>= ({t.toString()} · {ye.toString()}) mod 23</div>
                <div className="text-lg font-bold text-purple-400 pt-1">
                  RHS = {rhs.toString()}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-800 text-center">
            {isMatch ? (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-mono font-bold">
                <Check className="w-5 h-5" />
                <span>Verification Holds: LHS ({lhs.toString()}) === RHS ({rhs.toString()}) — Proof Accepted</span>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-mono font-bold">
                <AlertCircle className="w-5 h-5" />
                <span>Verification Failed: LHS ({lhs.toString()}) !== RHS ({rhs.toString()})</span>
              </div>
            )}
          </div>
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

