import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plane, Activity, SignalHigh, Zap, Clock, TrendingUp } from 'lucide-react';
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
  
  // Graph state
  const [graphPoints, setGraphPoints] = useState<string>('');
  const [planePosition, setPlanePosition] = useState({ x: 0, y: 100 }); // SVG coordinates (0-100)

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const predictionRef = useRef<Prediction | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(CRASH_SOUND_URL);
    audioRef.current.volume = 0.4;
  }, []);

  const generateRoundId = () => Math.floor(getSecureRandom() * 90000) + 10000;

  const generatePrediction = (): Prediction => {
    // Probability for "PLAY" (CRASH type) outcome set to ~25%
    const isCrash = getSecureRandom() < 0.25;
    
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
  };

  const startGameCycle = useCallback(() => {
    setStatus(GameStatus.IDLE);
    const newRoundId = generateRoundId().toString();
    setRoundId(newRoundId);
    setGraphPoints(''); // Reset graph
    setPlanePosition({ x: 0, y: 100 });
    
    const newPrediction = generatePrediction();
    setPrediction(newPrediction);
    predictionRef.current = newPrediction;

    if (newPrediction.type === 'CRASH') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }

    setMultiplier(1.00);
    setCountdown(5); // Increased countdown slightly for effect

    let count = 5;
    const countInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countInterval);
        startFlyingPhase(newRoundId);
      }
    }, 1000);

  }, []);

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
      // X: time based, max 10 seconds for full width (clamped)
      // Y: multiplier based
      const progressX = Math.min((elapsedSec / 8) * 100, 100); 
      // Logarithmic scale for Y to keep it on screen: log10(mult)
      const rawY = Math.log10(currentMult) * 50; 
      const progressY = Math.min(rawY, 90); // Cap at 90% height

      // SVG coordinate system: y=0 is top, y=100 is bottom
      // We want to start at bottom-left (0, 100) and go to top-right (100, 0)
      const svgX = progressX;
      const svgY = 100 - progressY;

      setPlanePosition({ x: svgX, y: svgY });
      
      // Build path string "M 0 100 L x1 y1 L x2 y2 ..."
      // For performance, we might just use a Quadratic curve logic or simple line to current point
      // But creating a trail is better. 
      // To optimize, we only update state every frame, React handles diffing.
      // We can just draw a curve from 0,100 to svgX, svgY with a control point.
      const controlX = svgX * 0.5;
      const controlY = 100;
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
    setPlanePosition({ x, y }); // Freeze position
    
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

    setTimeout(() => {
      startGameCycle();
    }, 4000);
  };

  useEffect(() => {
    startGameCycle();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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
                {/* Gradient Fill under curve */}
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

            {/* Loading Overlay */}
            {status === GameStatus.IDLE && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-slate-700 rounded-full animate-[spin_3s_linear_infinite]"></div>
                        <div className="w-24 h-24 border-t-4 border-orange-500 rounded-full absolute top-0 left-0 animate-[spin_1s_linear_infinite]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <span className="text-4xl font-bold text-white">{countdown}</span>
                        </div>
                    </div>
                    <p className="mt-4 text-slate-400 font-mono text-sm animate-pulse">PREPARING NEXT ROUND</p>
                    <div className="mt-2 flex gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}

            {/* Top Bar Info */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                <div className="bg-slate-900/60 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-mono text-slate-300">ID: {roundId}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border backdrop-blur flex items-center gap-2 transition-colors
                    ${status === GameStatus.FLYING ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-slate-900/60 border-white/10 text-slate-400'}
                `}>
                    <div className={`w-2 h-2 rounded-full ${status === GameStatus.FLYING ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
                    <span className="text-xs font-bold uppercase">{status}</span>
                </div>
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