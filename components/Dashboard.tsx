import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plane, Activity, SignalHigh, Zap, PlayCircle, FastForward, ToggleLeft, ToggleRight } from 'lucide-react';
import { HistoryItem, GameStatus, Prediction } from '../types';

interface DashboardProps {
  onAddHistory: (item: HistoryItem) => void;
}

// Sound URL
const CRASH_SOUND_URL = "https://colorhutbd.xyz/audio/crash-sound.mp3";

// Cryptographically secure random number generator
const getSecureRandom = (): number => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
};

const Dashboard: React.FC<DashboardProps> = ({ onAddHistory }) => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [roundId, setRoundId] = useState<string>('0000');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  
  // Graph state
  const [graphPoints, setGraphPoints] = useState<string>('');
  const [planePosition, setPlanePosition] = useState({ x: 0, y: 100 }); // SVG coordinates (0-100)

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const predictionRef = useRef<Prediction | null>(null);
  const lastPredictionTypeRef = useRef<'MULTIPLIER' | 'CRASH' | null>(null); // Track strictly for algo
  const isAutoModeRef = useRef<boolean>(true); 
  const countdownIntervalRef = useRef<number | null>(null);
  const autoRestartTimeoutRef = useRef<number | null>(null);
  const isCycleActiveRef = useRef<boolean>(false); // Strict lock for cycle start

  useEffect(() => {
    isAutoModeRef.current = isAutoMode;
    
    // If we switch to AUTO and we are IDLE or CRASHED, we need to ensure the loop continues
    if (isAutoMode) {
        if (!isCycleActiveRef.current && status !== GameStatus.FLYING) {
             // Clear any existing restart timers to prevent doubles
             if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
             
             // Short delay to start
             autoRestartTimeoutRef.current = window.setTimeout(() => {
                 startGameCycle();
             }, 500);
        }
    } else {
        // If switching to MANUAL, clear any pending auto-starts
        if (autoRestartTimeoutRef.current) {
            clearTimeout(autoRestartTimeoutRef.current);
            autoRestartTimeoutRef.current = null;
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoMode]); 

  useEffect(() => {
    audioRef.current = new Audio(CRASH_SOUND_URL);
    audioRef.current.volume = 0.4;
    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);
    };
  }, []);

  const generateRoundId = () => Math.floor(getSecureRandom() * 90000) + 10000;

  const generatePrediction = useCallback((): Prediction => {
    // Check strict history ref
    const previousWasCrash = lastPredictionTypeRef.current === 'CRASH';

    // Probability for "PLAY" (CRASH type) outcome set to ~25%
    // FORCE FALSE if previous was crash to avoid consecutive PLAYs
    const isCrash = previousWasCrash ? false : (getSecureRandom() < 0.25);
    
    // Update strict history ref immediately for next call safety
    lastPredictionTypeRef.current = isCrash ? 'CRASH' : 'MULTIPLIER';
    
    if (isCrash) {
      return { type: 'CRASH', value: 0, confidence: Math.floor(getSecureRandom() * 20) + 75 };
    } else {
      // More random distribution for multipliers
      const r = getSecureRandom();
      let safeMulti;
      
      if (r < 0.5) {
        // 50% chance of lower safer multipliers (1.10 - 1.90)
        safeMulti = (getSecureRandom() * 0.8 + 1.1).toFixed(2);
      } else if (r < 0.8) {
        // 30% chance of medium multipliers (1.90 - 3.50)
        safeMulti = (getSecureRandom() * 1.6 + 1.9).toFixed(2);
      } else {
        // 20% chance of higher multipliers (3.50 - 15.00)
        safeMulti = (getSecureRandom() * 11.5 + 3.5).toFixed(2);
      }
      
      return { type: 'MULTIPLIER', value: parseFloat(safeMulti), confidence: Math.floor(getSecureRandom() * 15) + 80 };
    }
  }, []);

  const startGameCycle = useCallback(() => {
    // Strict Locking: Prevent starting if already flying or cycle active
    if (isCycleActiveRef.current) return;
    
    isCycleActiveRef.current = true;
    
    // Cleanup previous timers
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (autoRestartTimeoutRef.current) clearTimeout(autoRestartTimeoutRef.current);

    setStatus(GameStatus.IDLE);
    const newRoundId = generateRoundId().toString();
    setRoundId(newRoundId);
    setGraphPoints(''); 
    setPlanePosition({ x: 0, y: 100 });
    
    const newPrediction = generatePrediction();
    setPrediction(newPrediction);
    predictionRef.current = newPrediction;

    // Play sound if prediction is CRASH (PLAY)
    if (newPrediction.type === 'CRASH') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }

    setMultiplier(1.00);
    setCountdown(5); 

    let count = 5;
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        startFlyingPhase(newRoundId);
      }
    }, 1000);

  }, [generatePrediction]);

  const startFlyingPhase = (currentRoundId: string) => {
    setStatus(GameStatus.FLYING);
    startTimeRef.current = Date.now();
    
    const r = getSecureRandom();
    let targetCrash = 1.00;
    
    // Purely random simulation logic
    if (r < 0.45) targetCrash = 1.0 + getSecureRandom() * 0.9; // 1.0 - 1.9
    else if (r < 0.75) targetCrash = 2.0 + getSecureRandom() * 2; // 2.0 - 4.0
    else if (r < 0.90) targetCrash = 4.0 + getSecureRandom() * 6; // 4.0 - 10.0
    else targetCrash = 10.0 + getSecureRandom() * 20; // 10.0 - 30.0 (Rare high fly)
    
    crashPointRef.current = targetCrash;

    const animate = () => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      const elapsedSec = elapsedMs / 1000;
      
      // Multiplier formula
      const currentMult = 1 + (elapsedSec * 0.1) + Math.pow(elapsedSec, 2) * 0.05;
      
      // Calculate visual position
      const progressX = Math.min((elapsedSec / 8) * 100, 100); 
      const rawY = Math.log10(currentMult) * 50; 
      const progressY = Math.min(rawY, 90);

      const svgX = progressX;
      const svgY = 100 - progressY;

      setPlanePosition({ x: svgX, y: svgY });
      
      const controlX = svgX * 0.5;
      setGraphPoints(`M 0 100 Q ${controlX} ${100} ${svgX} ${svgY}`);
      
      if (currentMult >= crashPointRef.current) {
        handleCrash(currentRoundId, crashPointRef.current, svgX, svgY);
      } else {
        setMultiplier(currentMult);
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  const handleCrash = (currentRoundId: string, finalValue: number, x: number, y: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStatus(GameStatus.CRASHED);
    setMultiplier(finalValue);
    setPlanePosition({ x, y }); 
    
    // Release lock so new game can start
    isCycleActiveRef.current = false;
    
    const currentPrediction = predictionRef.current;
    const predStr = currentPrediction?.type === 'CRASH' ? 'PLAY' : `${currentPrediction?.value}x`;
    const actualStr = `${finalValue.toFixed(2)}x`;
    
    onAddHistory({
      id: Date.now().toString(),
      roundId: currentRoundId,
      prediction: predStr,
      actual: actualStr,
      isCrash: true, 
      timestamp: Date.now()
    });

    // Only restart automatically if in Auto Mode
    if (isAutoModeRef.current) {
      autoRestartTimeoutRef.current = window.setTimeout(() => {
        if (isAutoModeRef.current) startGameCycle();
      }, 4000);
    }
  };

  useEffect(() => {
    // Initial start
    if (isAutoMode) {
        startGameCycle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="glass-panel p-1 rounded-3xl relative overflow-hidden flex flex-col gap-1">
        
        {/* Main Display Area */}
        <div className="relative h-80 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
            
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20" 
                 style={{
                     backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                     backgroundSize: '40px 40px',
                     transform: status === GameStatus.FLYING ? 'translateY(10px)' : 'none',
                     transition: 'transform 0.1s linear'
                 }}>
            </div>

            {/* SVG Graph Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                
                {status !== GameStatus.IDLE && (
                    <>
                        <path d={`${graphPoints} L ${planePosition.x} 100 Z`} fill="url(#graphGradient)" />
                        <path d={graphPoints} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    </>
                )}
            </svg>

            {/* Plane Element */}
            {status !== GameStatus.IDLE && (
                <div 
                    className={`absolute w-12 h-12 flex items-center justify-center transition-transform duration-75 will-change-transform z-20
                        ${status === GameStatus.CRASHED ? 'crash-active' : ''}
                    `}
                    style={{
                        left: `${planePosition.x}%`,
                        top: `${planePosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <Plane 
                        className={`w-full h-full ${status === GameStatus.CRASHED ? 'text-red-500' : 'text-red-500'} drop-shadow-lg`} 
                        fill={status === GameStatus.CRASHED ? '#ef4444' : '#f97316'}
                        strokeWidth={0}
                        style={{
                            transform: status === GameStatus.FLYING ? 'rotate(-15deg)' : 'rotate(0deg)'
                        }}
                    />
                    {status === GameStatus.FLYING && (
                        <div className="absolute top-1/2 right-full mr-1 w-16 h-1 bg-gradient-to-r from-transparent to-orange-500/50 blur-sm"></div>
                    )}
                </div>
            )}

             {/* Explosion Effect */}
             {status === GameStatus.CRASHED && (
                <div 
                    className="absolute w-24 h-24 pointer-events-none z-30"
                    style={{
                        left: `${planePosition.x}%`,
                        top: `${planePosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="w-full h-full bg-red-500 rounded-full bomb-effect mix-blend-screen blur-md"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white font-black text-sm tracking-widest uppercase drop-shadow-md">Flew Away</div>
                    </div>
                </div>
            )}

            {/* Central Big Multiplier */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className={`text-6xl md:text-8xl font-black font-display tracking-tighter transition-all duration-100
                    ${status === GameStatus.CRASHED ? 'text-red-500 scale-110' : 'text-white'}
                `}>
                    {multiplier.toFixed(2)}x
                </div>
            </div>

            {/* AUTO MODE: Loading Overlay */}
            {isAutoMode && status === GameStatus.IDLE && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-slate-700 rounded-full animate-[spin_3s_linear_infinite]"></div>
                        <div className="w-24 h-24 border-t-4 border-orange-500 rounded-full absolute top-0 left-0 animate-[spin_1s_linear_infinite]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-4xl font-bold text-white">{countdown}</span>
                        </div>
                    </div>
                    <p className="mt-4 text-slate-400 font-mono text-sm animate-pulse">PREPARING NEXT ROUND</p>
                </div>
            )}
            
            {/* MANUAL MODE: Controls Overlay */}
            {!isAutoMode && (
                <>
                     {/* Start Button (When Idle/Init) */}
                     {status === GameStatus.IDLE && countdown === 0 && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
                            <button 
                                onClick={() => startGameCycle()}
                                className="group relative flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <PlayCircle className="w-6 h-6 fill-white/20" />
                                START PREDICTION
                                <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
                            </button>
                        </div>
                     )}

                     {/* Next Button (After Crash) */}
                     {status === GameStatus.CRASHED && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
                             <button 
                                onClick={() => startGameCycle()}
                                className="group flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <FastForward className="w-6 h-6 fill-white/20" />
                                NEXT ROUND
                            </button>
                        </div>
                     )}
                     
                     {/* Countdown in Manual Mode */}
                     {status === GameStatus.IDLE && countdown > 0 && (
                         <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
                             <div className="text-6xl font-black text-white mb-2 animate-bounce">{countdown}</div>
                             <div className="text-slate-400 font-mono tracking-widest">LAUNCHING</div>
                         </div>
                     )}
                </>
            )}

            {/* Top Bar Info & Mode Switch */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-auto">
                <div className="bg-slate-900/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-mono text-slate-300">ID: {roundId}</span>
                </div>
                
                {/* Mode Toggle */}
                <button 
                    onClick={() => {
                        const newMode = !isAutoMode;
                        setIsAutoMode(newMode);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur transition-all ${
                        isAutoMode 
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                        : 'bg-slate-700/50 border-slate-600 text-slate-300'
                    }`}
                >
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                        {isAutoMode ? 'AUTO MODE' : 'MANUAL'}
                    </span>
                    {isAutoMode ? <ToggleRight className="w-4 h-4 text-indigo-400" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
            </div>
        </div>

        {/* HUD / Prediction Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1">
            {/* Prediction Card */}
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 transition-colors"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                        <Zap className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">AI Forecast</h3>
                    </div>
                    
                    <div className="flex items-baseline gap-1">
                        {prediction ? (
                            <>
                                <span className={`text-3xl font-black font-display tracking-tight ${
                                    prediction.type === 'CRASH' ? 'text-yellow-400' : 'text-indigo-300'
                                }`}>
                                    {prediction.type === 'CRASH' ? 'PLAY' : prediction.value.toFixed(2)}
                                </span>
                                {prediction.type !== 'CRASH' && <span className="text-sm font-bold text-slate-500">x</span>}
                            </>
                        ) : (
                            <span className="text-3xl font-black text-slate-700">---</span>
                        )}
                    </div>
                    
                    <div className="mt-2 text-xs text-slate-500 font-mono">
                        Algorithm v4.2 Active
                    </div>
                </div>
            </div>

            {/* Confidence Card */}
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <SignalHigh className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Confidence</h3>
                    </div>
                    
                    <div className="flex items-end justify-between">
                         <span className="text-3xl font-black font-display text-white">
                             {prediction ? prediction.confidence : '--'}%
                         </span>
                         <div className="flex gap-0.5 mb-1.5">
                             {[1,2,3,4,5].map(i => (
                                 <div key={i} className={`w-1.5 h-4 rounded-sm ${
                                     prediction && (prediction.confidence / 20) >= i ? 'bg-emerald-500' : 'bg-slate-700'
                                 }`}></div>
                             ))}
                         </div>
                    </div>
                    
                    <div className="mt-2 w-full bg-slate-700/50 h-1 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: prediction ? `${prediction.confidence}%` : '0%' }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;