import React, { useState, useEffect } from 'react';
import { History, Trash2, RefreshCw, CheckCircle2, XCircle, Filter, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function AuditHistory() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACCEPTED' | 'REJECTED'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async (currentFilter = filter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getHistory(currentFilter);
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(filter);
  }, [filter]);

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all verification history records?')) return;
    try {
      setLoading(true);
      await api.clearHistory();
      setLogs([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header and Controls */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Cryptographic Proof Audit Log & History</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Zero-Knowledge Compliance: Witness x and nonce r are strictly omitted from database and logs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-navy-950 border border-navy-700 text-xs">
            {['ALL', 'ACCEPTED', 'REJECTED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchLogs(filter)}
            disabled={loading}
            className="p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleClearHistory}
            disabled={loading || logs.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Security Privacy Assurance */}
      <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/25 flex items-center space-x-3 text-xs text-blue-300">
        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          Audit records store only public metadata: Session ID, timestamp, public key (y), commitment (t), challenge (e), response (z), and LHS/RHS verification.
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-navy-900 border border-navy-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-950/80 text-slate-400">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Public Key (y)</th>
                <th className="py-3 px-4">Commitment (t)</th>
                <th className="py-3 px-4">Challenge (e)</th>
                <th className="py-3 px-4">Response (z)</th>
                <th className="py-3 px-4">LHS vs RHS</th>
                <th className="py-3 px-4">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No verification records found in audit log.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isAccepted = log.status === 'ACCEPTED';
                  return (
                    <tr key={log.id} className="hover:bg-navy-800/40 transition">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isAccepted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isAccepted ? <CheckCircle2 className="w-3 h-3 mr-0.5" /> : <XCircle className="w-3 h-3 mr-0.5" />}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono truncate max-w-[120px]" title={log.sessionId}>
                        {log.sessionId.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-cyan-300 font-bold">{log.publicKey}</td>
                      <td className="py-3 px-4 text-purple-300 font-bold">{log.commitment}</td>
                      <td className="py-3 px-4 text-blue-300 font-bold">{log.challenge}</td>
                      <td className="py-3 px-4 text-emerald-300 font-bold">{log.response}</td>
                      <td className="py-3 px-4">
                        <span className={`font-mono text-[11px] ${isAccepted ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {log.lhs} {isAccepted ? '==' : '!='} {log.rhs}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.durationMs}ms
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

