import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingHero from './components/LandingHero';
import DualConsoleDashboard from './components/DualConsoleDashboard';
import StepWalkthrough from './components/StepWalkthrough';
import MathVerification from './components/MathVerification';
import AttackLab from './components/AttackLab';
import AuditHistory from './components/AuditHistory';
import VivaAndArchitecture from './components/VivaAndArchitecture';
import { api } from './services/api';
import { Shield, ExternalLink, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'checking' | 'disconnected'

  // Poll backend health periodically
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        await api.getHealth();
        if (isMounted) setBackendStatus('connected');
      } catch (err) {
        if (isMounted) setBackendStatus('disconnected');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        backendStatus={backendStatus} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            <LandingHero 
              onStartDemo={() => {
                const element = document.getElementById('console-section');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              onLearnMore={() => setActiveTab('walkthrough')}
            />
            <div id="console-section" className="pt-2">
              <DualConsoleDashboard 
                onProofComplete={() => {}}
              />
            </div>
          </div>
        )}

        {activeTab === 'walkthrough' && <StepWalkthrough />}

        {activeTab === 'math' && <MathVerification />}

        {activeTab === 'attacks' && <AttackLab onSimulationComplete={() => {}} />}

        {activeTab === 'audit' && <AuditHistory />}

        {activeTab === 'viva' && <VivaAndArchitecture />}
      </main>

      {/* Academic Footer */}
      <footer className="border-t border-navy-800 bg-[#090e1c] py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-300">
              Zero-Knowledge Proof Authentication System
            </span>
            <span className="text-slate-500">|</span>
            <span>Cryptography & Network Security</span>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Schnorr Protocol (p=23, q=11, g=2) · Express & React
          </div>
        </div>
      </footer>
    </div>
  );
}

