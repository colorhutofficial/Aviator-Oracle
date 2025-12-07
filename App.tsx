import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Menu, Bell, User } from 'lucide-react';
import ActivationOverlay from './components/ActivationOverlay';
import Dashboard from './components/Dashboard';
import BetCalculator from './components/BetCalculator';
import RulesPanel from './components/RulesPanel';
import PredictionHistory from './components/PredictionHistory';
import { HistoryItem } from './types';

// Add type definition for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
      };
    };
  }
}

const App: React.FC = () => {
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tgUser, setTgUser] = useState<{username?: string; photo_url?: string; first_name?: string; id?: number} | null>(null);

  // Function to check license via API using Telegram ID
  const checkRemoteLicense = useCallback(async (userId: number) => {
    try {
        // API call to check license record by tgID
        const response = await fetch(`https://oracle.colorhutbd.xyz/api.php?tgID=${userId}`);
        
        if (response.ok) {
            const data = await response.json();
            // Expected format: { status: "success", tgID: "...", key: "...", expire: "YYYY-MM-DD", is_expired: boolean }
            
            if (data.status === 'success' && !data.is_expired && data.expire) {
                const expiry = new Date(data.expire);
                const now = new Date();
                
                // Check if date is valid and in the future
                if (!isNaN(expiry.getTime()) && expiry > now) {
                    setIsActivated(true);
                    // Optionally update stored key
                    if (data.key) {
                        localStorage.setItem('aviator_activation_key', data.key);
                    }
                }
            }
        }
    } catch (error) {
        console.debug("Remote license check failed", error);
        // Fail silently and rely on manual key entry if API fails
    }
  }, []);

  // Check initial activation status and Telegram user
  useEffect(() => {
    // Check for Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        // Attempt to expand to full height for better experience
        try { tg.expand(); } catch (e) {}

        const user = tg.initDataUnsafe?.user;
        if (user) {
            setTgUser(user);
            // If user has an ID, check for remote license
            if (user.id) {
                checkRemoteLicense(user.id);
            }
        }
    }

    // Check Activation Key
    const key = localStorage.getItem('aviator_activation_key');
    const validKeys = [
        'AVIATOR-PRO-2023', 'ORACLE-PREMIUM', 'FLYHIGH-2023', 
        'PREDICT-WIN', 'BIGWINS-ONLY', 'BIGWINS-JIHAD', 'TEST-KEY',
        'MEHAN-LOVE-LIZA'
    ];
    if (key && validKeys.includes(key)) {
      setIsActivated(true);
    }
  }, [checkRemoteLicense]);

  const handleUnlock = () => {
    setIsActivated(true);
  };

  const handleAddHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev].slice(0, 50)); // Keep last 50
  };

  if (!isActivated) {
    return <ActivationOverlay onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg shadow-lg shadow-orange-500/20">
                <Activity className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-none">Aviator Oracle</h1>
                <span className="text-xs text-orange-500 font-semibold tracking-wider uppercase">
                    {tgUser?.username ? `@${tgUser.username}` : 'PRO EDITION'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/20 flex items-center justify-center overflow-hidden">
                 {tgUser?.photo_url ? (
                     <img src={tgUser.photo_url} alt={tgUser.first_name || "User"} className="w-full h-full object-cover" />
                 ) : (
                     <User className="w-4 h-4 text-white" />
                 )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Grid: Dashboard + Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Dashboard onAddHistory={handleAddHistory} />
          </div>
          <div className="lg:col-span-1 space-y-6">
             <BetCalculator />
             <div className="hidden lg:block">
                <RulesPanel />
             </div>
          </div>
        </div>

        {/* Bottom Grid: History + Rules (Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-3">
              <PredictionHistory history={history} />
           </div>
           <div className="lg:hidden">
              <RulesPanel />
           </div>
        </div>

      </main>
      
      <footer className="text-center text-slate-600 text-xs py-6">
        &copy; 2024 Aviator Oracle Pro. All rights reserved. <br/>
        Results are simulated for entertainment purposes only.
      </footer>
    </div>
  );
};

export default App;