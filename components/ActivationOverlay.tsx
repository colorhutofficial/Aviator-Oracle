import React, { useState } from 'react';
import { Lock, Key, AlertCircle, CheckCircle } from 'lucide-react';

interface ActivationOverlayProps {
  onUnlock: () => void;
}

const VALID_KEYS = [
  'AVIATOR-PRO-2023',
  'ORACLE-PREMIUM',
  'FLYHIGH-2023',
  'PREDICT-WIN',
  'BIGWINS-ONLY',
  'BIGWINS-JIHAD',
  'TEST-KEY', // Added for easy testing
  'MEHAN-LOVE-LIZA'
];

const ActivationOverlay: React.FC<ActivationOverlayProps> = ({ onUnlock }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = () => {
    setIsLoading(true);
    setError('');
    
    // Simulate network delay for effect
    setTimeout(() => {
      if (VALID_KEYS.includes(inputKey.trim())) {
        localStorage.setItem('aviator_activation_key', inputKey.trim());
        onUnlock();
      } else {
        setError('Invalid Activation Key. Please contact support.');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-20"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-slate-800 p-4 rounded-full mb-6 shadow-inner ring-1 ring-white/10">
            <Lock className="w-10 h-10 text-orange-500" />
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Aviator Oracle <span className="text-orange-500">Pro</span>
          </h1>
          <p className="text-slate-400 mb-8 text-sm">
            Enter your premium activation key to access the prediction engine.
          </p>

          <div className="w-full space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={isLoading || !inputKey}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                ${isLoading 
                  ? 'bg-slate-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/25 active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <>Verifying...</>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Activate License
                </>
              )}
            </button>
          </div>
          
          <div className="mt-8 text-xs text-slate-500">
            Protected by Oracle Guard™ v2.4.1
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivationOverlay;