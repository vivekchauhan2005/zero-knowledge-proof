import React from 'react';
import { Shield, Lock, Terminal, Cpu, Bug, History, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus }) {
  const navItems = [
    { id: 'dashboard', label: 'Authentication Console', icon: Cpu },
    { id: 'walkthrough', label: 'How It Works (Step-by-Step)', icon: Terminal },
    { id: 'math', label: 'Math Verification', icon: Lock },
    { id: 'attacks', label: 'Attack Simulation Lab', icon: Bug },
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-md border-b border-navy-700/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition">
              <div className="w-full h-full bg-[#0c1322] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400 group-hover:scale-110 transition duration-200" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                  Zero Knowledge Proof
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-semibold">
                  Schnorr
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Academic Authentication System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Backend Status Badge */}
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-mono border ${
              backendStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : backendStatus === 'checking'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              {backendStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Verifier API Live</span>
                </>
              ) : backendStatus === 'checking' ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>API Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-navy-800 bg-[#0c1322] space-x-2 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 bg-navy-850 hover:bg-navy-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

