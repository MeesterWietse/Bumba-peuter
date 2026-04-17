import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Music, Star, ArrowLeft } from 'lucide-react';

const ITEMS = [
  { id: 'bal', name: 'de rode bal' },
  { id: 'ster', name: 'de gele ster' },
  { id: 'hoed', name: 'de groene hoed' },
  { id: 'auto', name: 'de blauwe auto' },
  { id: 'banaan', name: 'de lekkere banaan' },
  { id: 'appel', name: 'de groene appel' },
  { id: 'eend', name: 'het gele eendje' },
  { id: 'bloem', name: 'de roze bloem' },
  { id: 'vis', name: 'het oranje visje' },
  { id: 'blok', name: 'het paarse blokje' },
];

const BUMBA_IMG = 'https://raw.githubusercontent.com/MeesterWietse/afbeeldingen-apps/c372b622213423ecd024f459f7e9176ffda48c11/Bumba-removebg-preview.png';

const NOTES = [
  { id: 'do', freq: 261.63, color: 'bg-red-500' },
  { id: 're', freq: 293.66, color: 'bg-orange-500' },
  { id: 'mi', freq: 329.63, color: 'bg-yellow-400' },
  { id: 'fa', freq: 349.23, color: 'bg-green-500' },
  { id: 'sol', freq: 392.00, color: 'bg-blue-500' },
];

const TENTS = [
  { id: 0, top: '12%', left: '10%', dirs: ['top', 'right', 'bottom'] },
  { id: 1, top: '22%', left: '48%', dirs: ['top', 'left', 'bottom'] },
  { id: 2, top: '42%', left: '28%', dirs: ['top', 'left', 'right', 'bottom'] },
  { id: 3, top: '65%', left: '50%', dirs: ['top', 'left'] },
  { id: 4, top: '72%', left: '10%', dirs: ['top', 'right'] },
];

export default function App() {
  const [gameState, setGameState] = useState('start');
  
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState('none');
  const [score, setScore] = useState(0);
  
  const [activeDance, setActiveDance] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [floatingNotes, setFloatingNotes] = useState<any[]>([]);
  const [balloons, setBalloons] = useState<any[]>([]);
  
  const [bumbaSpot, setBumbaSpot] = useState(0);
  const [bumbaDirection, setBumbaDirection] = useState('top');
  const [isCaught, setIsCaught] = useState(false);
  const [confettiBursts, setConfettiBursts] = useState<any[]>([]);
  
  const catchTimerRef = useRef<any>(null);
  const musicIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<any>(null);
  const isCaughtRef = useRef(false);

  useEffect(() => {
    isCaughtRef.current = isCaught;
  }, [isCaught]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }, []);

  const speak = useCallback((text: string, pitch = 1.1, rate = 0.85) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const flemishVoice = voices.find(v => v.lang === 'nl-BE' || v.lang === 'nl_BE');
      utterance.lang = 'nl-BE';
      if (flemishVoice) utterance.voice = flemishVoice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Shared global context om mobile limitations en audio clippings te vermijden
  const getAudioContext = useCallback(() => {
    if (!(window as any).sharedAudioCtx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        (window as any).sharedAudioCtx = new AudioContext();
      }
    }
    const ctx = (window as any).sharedAudioCtx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }, []);

  const startSorterGame = (easy = false) => {
    getAudioContext();
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    setScore(0);
    setIsEasyMode(easy);
    setGameState('sorter');
    nextQuestion();
  };

  const nextQuestion = useCallback(() => {
    const target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    let otherOptions = ITEMS.filter(item => item.id !== target.id);
    otherOptions = otherOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
    const finalOptions = [target, ...otherOptions].sort(() => 0.5 - Math.random());
    setCurrentTarget(target);
    setOptions(finalOptions);
    setFeedback('none');
    setTimeout(() => speak(`Mag ik ${target.name}?`), 500);
  }, [speak]);

  const handleItemClick = (item: any) => {
    if (feedback === 'success') return;
    if (item.id === currentTarget.id) {
      setFeedback('success');
      const newScore = score + 1;
      setScore(newScore);
      if (newScore >= 5) {
        speak('Wauw! Super goed geholpen!', 1.2);
        setTimeout(() => setGameState('celebration'), 2000);
      } else {
        const complimenten = ['Dankjewel!', 'Super!', 'Heel goed!', 'Mooi zo!'];
        speak(complimenten[Math.floor(Math.random() * complimenten.length)], 1.2);
        setTimeout(() => nextQuestion(), 2500);
      }
    } else {
      setFeedback('error');
      speak(`Oeps, dat is ${item.name}. Mag ik ${currentTarget.name}?`);
      setTimeout(() => setFeedback('none'), 1500);
    }
  };

  const startMusicGame = () => {
    getAudioContext();
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    setGameState('music');
    speak('Tijd voor muziek! Speel maar mee!');
  };

  const addFloatingNote = (symbol: string) => {
    const newNote = { id: Date.now(), symbol, left: 10 + Math.random() * 80 };
    setFloatingNotes(prev => [...prev, newNote]);
    setTimeout(() => setFloatingNotes(prev => prev.filter(n => n.id !== newNote.id)), 1000);
  };

  const playNote = (freq: number) => {
    setActiveDance('wiggle');
    addFloatingNote('🎵');
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
    setTimeout(() => setActiveDance(null), 300);
  };

  const playDrum = () => {
    setActiveDance('bounce');
    addFloatingNote('💥');
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(1.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => setActiveDance(null), 300);
  };

  const playHorn = () => {
    setActiveDance('wiggle');
    addFloatingNote('🎺');
    const ctx = getAudioContext();
    if (!ctx) return;
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
    setTimeout(() => setActiveDance(null), 1200);
  };

  const playBell = () => {
    setActiveDance('shake');
    addFloatingNote('🔔');
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
    setTimeout(() => setActiveDance(null), 300);
  };

  const playWhistle = () => {
    setActiveDance('jump');
    addFloatingNote('🐦');
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => setActiveDance(null), 400);
  };

  const playAccordion = () => {
    setActiveDance('wiggle');
    addFloatingNote('🪗');
    const ctx = getAudioContext();
    if (!ctx) return;
    const playReeds = (freq: number, startTime: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, startTime);
      osc2.frequency.setValueAtTime(freq * 1.015, startTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.1);
      gain.gain.setValueAtTime(0.1, startTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + 0.8);
      osc2.stop(startTime + 0.8);
    };
    const nu = ctx.currentTime;
    playReeds(261.63 * 2, nu); 
    playReeds(329.63 * 2, nu); 
    playReeds(392.00 * 2, nu); 
    setTimeout(() => setActiveDance(null), 800);
  };
  
  const playMagic = () => {
    setActiveDance('spin');
    addFloatingNote('✨');
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.5); 
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => setActiveDance(null), 500);
  };

  const startBalloonGame = () => {
    getAudioContext();
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    setBalloons([]);
    setGameState('balloons');
    speak('Prik de ballonnen kapot!');
  };

  useEffect(() => {
    if (gameState !== 'balloons') return;
    const colors = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-400', 'text-purple-500', 'text-orange-500'];
    const interval = setInterval(() => {
      const newBalloon = {
        id: Date.now(),
        left: Math.random() * 70 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 5 + 7, 
        driftSpeed: Math.random() * 3 + 3, 
        driftDir: Math.random() > 0.5 ? 'normal' : 'reverse',
        popped: false
      };
      setBalloons(prev => [...prev, newBalloon]);
      setTimeout(() => setBalloons(prev => prev.filter(b => b.id !== newBalloon.id)), newBalloon.speed * 1000);
    }, 2500); 
    return () => clearInterval(interval);
  }, [gameState]);

  const playPop = () => {
    setActiveDance('jump');
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1); 
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    setTimeout(() => setActiveDance(null), 200);
  };

  const handlePopBalloon = (id: number, e: any) => {
    playPop();
    if (e) {
      const burstId = Date.now() + Math.random();
      setConfettiBursts(prev => [...prev, { id: burstId, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setConfettiBursts(prev => prev.filter(c => c.id !== burstId)), 1000);
    }
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    setTimeout(() => setBalloons(prev => prev.filter(b => b.id !== id)), 50); 
  };
  
  useEffect(() => {
    if (gameState === 'catch') {
      const ctx = getAudioContext();
      audioCtxRef.current = ctx;
      if (!ctx) return;

      const melody = [392, 329, 261, 329, 392, 392, 392, 0, 349, 293, 246, 293, 349, 349, 349, 0];
      let idx = 0;

      musicIntervalRef.current = setInterval(() => {
        if (ctx.state === 'suspended') ctx.resume();
        
        if (melody[idx] > 0 && !isCaughtRef.current) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square'; 
          osc.frequency.value = melody[idx] * 1.5; 
          
          gain.gain.setValueAtTime(0.04, ctx.currentTime); 
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
        idx = (idx + 1) % melody.length;
      }, 250);
    } else {
      if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
    }

    return () => {
      if (musicIntervalRef.current) clearInterval(musicIntervalRef.current);
    };
  }, [gameState]);

  const moveBumba = useCallback(() => {
    setBumbaSpot(prev => {
      let next = Math.floor(Math.random() * TENTS.length);
      if (next === prev) next = (next + 1) % TENTS.length;
      
      const allowedDirs = TENTS[next].dirs;
      const randomDir = allowedDirs[Math.floor(Math.random() * allowedDirs.length)];
      setBumbaDirection(randomDir);
      
      return next;
    });
    
    if (catchTimerRef.current) clearInterval(catchTimerRef.current);
    catchTimerRef.current = setInterval(moveBumba, 2800); 
  }, []);

  const startCatchGame = () => {
    getAudioContext();
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    setScore(0);
    setIsCaught(false);
    setGameState('catch');
    speak('Vang Bumba!');
    moveBumba();
  };

  useEffect(() => {
    if (gameState === 'catch' && !isCaught) {
      catchTimerRef.current = setInterval(moveBumba, 2800);
    } else {
      if (catchTimerRef.current) clearInterval(catchTimerRef.current);
    }
    return () => clearInterval(catchTimerRef.current);
  }, [gameState, isCaught, moveBumba]);

  const playCatchSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  const handleCatchBumba = (e: any) => {
    e.stopPropagation();
    if (isCaught) return; 
    
    setIsCaught(true);
    playCatchSound();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const burstId = Date.now();
    setConfettiBursts(prev => [...prev, { id: burstId, x: centerX, y: centerY }]);
    setTimeout(() => setConfettiBursts(prev => prev.filter(c => c.id !== burstId)), 1500);

    const words = ['Hebbes!', 'Gevangen!', 'Joepie!', 'Knap hoor!'];
    speak(words[Math.floor(Math.random() * words.length)], 1.3, 1.0);

    const newScore = score + 1;
    setScore(newScore);

    if (catchTimerRef.current) clearInterval(catchTimerRef.current);

    setTimeout(() => {
      if (newScore >= 8) {
        setGameState('celebration');
        setIsCaught(false);
      } else {
        setIsCaught(false);
        moveBumba();
      }
    }, 2500); 
  };

  const getClownDanceClass = () => {
    if (activeDance === 'bounce') return 'animate-bounce-fast';
    if (activeDance === 'wiggle') return 'animate-wiggle-fast';
    if (activeDance === 'shake') return 'animate-shake-fast';
    if (activeDance === 'jump') return 'animate-jump';
    if (activeDance === 'spin') return 'animate-spin-slow';
    return 'animate-bounce-slow'; 
  };

  return (
    <div className="flex justify-center bg-gray-900 min-h-[100dvh] font-sans touch-none select-none overscroll-none">
      <div className="w-full max-w-md bg-yellow-50 h-[100dvh] relative overflow-hidden flex flex-col shadow-2xl">
        
        <style dangerouslySetInnerHTML={{__html: `
          html, body { touch-action: none !important; overscroll-behavior: none !important; -webkit-user-select: none; user-select: none; }
          
          @keyframes wiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
          .animate-wiggle { animation: wiggle 0.4s ease-in-out; }
          .animate-wiggle-fast { animation: wiggle 0.2s ease-in-out infinite; }
          
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px) rotate(-5deg); } 75% { transform: translateX(5px) rotate(5deg); } }
          .animate-shake-fast { animation: shake 0.1s ease-in-out infinite; }

          @keyframes jump { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-40px) scale(1.05) rotate(5deg); } }
          .animate-jump { animation: jump 0.4s ease-in-out; }

          @keyframes spin-slow { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(0.8); } 100% { transform: rotate(360deg) scale(1); } }
          .animate-spin-slow { animation: spin-slow 0.6s ease-in-out; }

          @keyframes flyToCenter { 0% { transform: scale(1) translateY(0); opacity: 1; } 50% { transform: scale(1.5) translateY(-150px); opacity: 1; } 100% { transform: scale(0) translateY(-200px); opacity: 0; } }
          .animate-fly { animation: flyToCenter 1.5s ease-in-out forwards; z-index: 50; }
          
          @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .animate-bounce-slow { animation: bounce 2s infinite ease-in-out; }
          
          @keyframes bounceFast { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
          .animate-bounce-fast { animation: bounceFast 0.3s ease-in-out infinite; }

          @keyframes floatUp { 0% { top: 110%; } 100% { top: -20%; } }
          @keyframes drift { 0%, 100% { transform: translateX(-15px) rotate(-5deg); } 50% { transform: translateX(15px) rotate(5deg); } }

          @keyframes peek-top {
            0%, 100% { transform: translate(0, 20%) scale(0.3); opacity: 0; }
            15%, 85% { transform: translate(0, -45%) scale(1.4); opacity: 1; }
          }
          .animate-peek-top { animation: peek-top 2.5s ease-in-out forwards; }

          @keyframes peek-bottom {
            0%, 100% { transform: translate(0, -20%) scale(0.3); opacity: 0; }
            15%, 85% { transform: translate(0, 45%) scale(1.4); opacity: 1; }
          }
          .animate-peek-bottom { animation: peek-bottom 2.5s ease-in-out forwards; }

          @keyframes peek-left {
            0%, 100% { transform: translate(20%, 0) scale(0.3); opacity: 0; }
            15%, 85% { transform: translate(-45%, 0) scale(1.4); opacity: 1; }
          }
          .animate-peek-left { animation: peek-left 2.5s ease-in-out forwards; }

          @keyframes peek-right {
            0%, 100% { transform: translate(-20%, 0) scale(0.3); opacity: 0; }
            15%, 85% { transform: translate(45%, 0) scale(1.4); opacity: 1; }
          }
          .animate-peek-right { animation: peek-right 2.5s ease-in-out forwards; }

          @keyframes zoomCenter {
            0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
            40% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
          .animate-zoom-center { animation: zoomCenter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

          @keyframes confetti-burst {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0.5) rotate(var(--rot)); opacity: 0; }
          }
          .confetti-piece {
            position: absolute;
            width: 14px;
            height: 14px;
            animation: confetti-burst 1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          }
        `}} />

        {gameState === 'start' && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gradient-to-b from-yellow-100 to-amber-300">
            <h1 className="text-4xl font-extrabold text-amber-700 tracking-tight drop-shadow-sm mb-4">
              Circus Speeldoos
            </h1>
            
            <div className="w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center animate-bounce-slow border-8 border-amber-400 mb-6">
               <img src={BUMBA_IMG} alt="Bumba" className="w-24 h-24 object-contain drop-shadow-md" />
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <button onClick={() => startSorterGame(true)} className="bg-green-500 text-white p-3 min-h-[60px] rounded-2xl shadow-md active:scale-95 transition flex items-center gap-4">
                <div className="bg-green-400 p-2 rounded-xl"><Star size={24} fill="currentColor" /></div>
                <div className="text-left"><div className="text-xl font-extrabold">Zoeken Makkelijk</div></div>
              </button>

              <button onClick={() => startSorterGame(false)} className="bg-red-500 text-white p-3 min-h-[60px] rounded-2xl shadow-md active:scale-95 transition flex items-center gap-4">
                <div className="bg-red-400 p-2 rounded-xl"><Star size={24} fill="currentColor" /></div>
                <div className="text-left"><div className="text-xl font-extrabold">Zoeken Moeilijk</div></div>
              </button>

              <button onClick={startMusicGame} className="bg-blue-500 text-white p-3 min-h-[60px] rounded-2xl shadow-md active:scale-95 transition flex items-center gap-4">
                <div className="bg-blue-400 p-2 rounded-xl"><Music size={24} fill="currentColor" /></div>
                <div className="text-left"><div className="text-xl font-extrabold">Muziek</div></div>
              </button>

              <button onClick={startBalloonGame} className="bg-cyan-500 text-white p-3 min-h-[60px] rounded-2xl shadow-md active:scale-95 transition flex items-center gap-4">
                <div className="bg-cyan-400 p-2 rounded-xl text-2xl leading-none">🎈</div>
                <div className="text-left"><div className="text-xl font-extrabold">Ballonnen</div></div>
              </button>

              <button onClick={startCatchGame} className="bg-orange-500 text-white p-3 min-h-[60px] rounded-2xl shadow-md active:scale-95 transition flex items-center gap-4">
                <div className="bg-orange-400 p-2 rounded-xl text-2xl leading-none">🎪</div>
                <div className="text-left"><div className="text-xl font-extrabold">Vangen!</div></div>
              </button>
            </div>
          </div>
        )}

        {gameState === 'sorter' && (
          <div className="flex-1 flex flex-col h-full relative">
            <div className="bg-white/90 backdrop-blur-sm shadow-md p-4 rounded-b-3xl z-20 mx-2 mt-2 flex justify-between items-center">
              <button onClick={() => setGameState('start')} className="p-2 text-amber-500 active:scale-90 bg-amber-50 rounded-full">
                <ArrowLeft size={24} />
              </button>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={22} className={`transition-all duration-500 ${i < score ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-gray-200 fill-gray-200'}`} />
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative pt-4">
              <h2 className="text-3xl font-extrabold text-amber-600 text-center mb-4 px-4 leading-tight">
                Mag ik <span className="text-red-500">{currentTarget?.name}</span>?
              </h2>
              <div className={`w-56 h-56 transition-transform duration-300 ${feedback === 'success' ? 'animate-bounce-slow' : ''} relative`}>
                <img src={BUMBA_IMG} alt="Bumba" className="w-full h-full object-contain drop-shadow-xl relative z-10" />
                
                {isEasyMode && currentTarget && feedback !== 'success' && (
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-[2rem] rounded-bl-sm shadow-xl border-4 border-amber-300 flex items-center justify-center z-20 animate-bounce-slow">
                    <div className="w-16 h-16 pointer-events-none">
                      <ItemSVG type={currentTarget.id} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-48 bg-white/80 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex justify-around items-center px-2 pb-4 pt-6 z-30">
              {options.map((item, index) => {
                const isCorrect = item.id === currentTarget?.id;
                const isClickedWrong = feedback === 'error' && !isCorrect;
                const isFlying = feedback === 'success' && isCorrect;

                return (
                  <div 
                    key={`${item.id}-${index}`}
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-28 h-28 bg-white rounded-2xl shadow-md border-4 border-gray-100 flex items-center justify-center
                      active:scale-95 transition-transform cursor-pointer
                      ${isClickedWrong ? 'animate-wiggle border-red-300 bg-red-50' : ''}
                      ${isFlying ? 'animate-fly border-green-300 bg-green-50 pointer-events-none' : ''}
                    `}
                  >
                    <div className="w-20 h-20 pointer-events-none">
                      <ItemSVG type={item.id} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-50 to-amber-100 -z-10" />
          </div>
        )}

        {gameState === 'music' && (
          <div className="flex-1 flex flex-col h-full relative">
            <div className="absolute top-4 left-4 z-20">
              <button onClick={() => setGameState('start')} className="p-3 text-white bg-blue-500 shadow-md rounded-full active:scale-90">
                <ArrowLeft size={24} />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center pt-8">
              <div className={`w-52 h-52 transition-transform duration-200 ${getClownDanceClass()}`}>
                 <img src={BUMBA_IMG} alt="Bumba" className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
            </div>

            <div className="min-h-[22rem] bg-white/90 rounded-t-[3rem] shadow-[0_-15px_30px_rgba(0,0,0,0.1)] flex flex-col justify-end px-4 pb-6 pt-6 z-30">
              <div className="grid grid-cols-3 gap-3 mb-6">
                 <button onClick={playDrum} className="w-full bg-rose-500 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg active:translate-y-2 active:shadow-none border-b-4 border-rose-700 transition-all flex flex-col items-center"><span className="text-3xl mb-1 drop-shadow-sm">💥</span></button>
                 <button onClick={playHorn} className="w-full bg-amber-500 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg active:translate-y-2 active:shadow-none border-b-4 border-amber-700 transition-all flex flex-col items-center"><span className="text-3xl mb-1 drop-shadow-sm">🎺</span></button>
                 <button onClick={playBell} className="w-full bg-cyan-500 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg active:translate-y-2 active:shadow-none border-b-4 border-cyan-700 transition-all flex flex-col items-center"><span className="text-3xl mb-1 drop-shadow-sm">🔔</span></button>
                 <button onClick={playWhistle} className="w-full bg-green-500 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg active:translate-y-2 active:shadow-none border-b-4 border-green-700 transition-all flex flex-col items-center"><span className="text-3xl mb-1 drop-shadow-sm">🐦</span></button>
                 <button onClick={playAccordion} className="w-full bg-orange-500 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg active:translate-y-2 active:shadow-none border-b-4 border-orange-700 transition-all flex flex-col items-center"><span className="text-3xl mb-1 drop-shadow-sm">🪗</span></button>
                 <button onClick={playMagic} className="w-full bg-purple-500 text-white font-extrabold text-xl py-4 rounded-2xl shadow-lg active:translate-y-2 active:shadow-none border-b-4 border-purple-700 transition-all flex flex-col items-center"><span className="text-3xl mb-1 drop-shadow-sm">✨</span></button>
              </div>
              <div className="flex justify-center gap-2 h-24 items-end">
                {NOTES.map((note, index) => (
                  <button 
                    key={note.id}
                    onClick={() => playNote(note.freq)}
                    className={`flex-1 rounded-t-xl rounded-b-md shadow-md active:translate-y-2 active:shadow-none transition-all border-b-8 border-black/20 ${note.color}`}
                    style={{ height: `${100 - (index * 10)}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-indigo-200 -z-10" />
            {floatingNotes.map(note => (
              <div key={note.id} className="absolute top-1/3 animate-fly pointer-events-none text-5xl z-40 drop-shadow-md" style={{ left: `${note.left}%` }}>{note.symbol}</div>
            ))}
          </div>
        )}

        {gameState === 'balloons' && (
          <div className="flex-1 flex flex-col h-full relative bg-gradient-to-b from-sky-300 to-sky-100 overflow-hidden">
            <div className="absolute top-4 left-4 z-20">
              <button onClick={() => setGameState('start')} className="p-3 text-sky-700 bg-white/80 backdrop-blur shadow-md rounded-full active:scale-90">
                <ArrowLeft size={24} />
              </button>
            </div>
            
            <div className="absolute inset-0 z-10">
              {balloons.map(b => (
                <div 
                  key={b.id}
                  onClick={(e) => !b.popped && handlePopBalloon(b.id, e)}
                  className={`absolute flex flex-col items-center justify-center cursor-pointer touch-manipulation`}
                  style={{
                    left: `${b.left}%`,
                    animation: b.popped ? 'none' : `floatUp ${b.speed}s linear forwards, drift ${b.driftSpeed}s ease-in-out infinite ${b.driftDir}`
                  }}
                >
                  {b.popped ? (
                     <div className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)] animate-ping">
                       <Sparkles size={100} fill="currentColor" />
                     </div>
                  ) : (
                     <BalloonSVG color={b.color} image={BUMBA_IMG} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'catch' && (
          <div className="flex-1 flex flex-col h-full relative bg-gradient-to-b from-green-200 to-emerald-400 overflow-hidden">
            
            <div className="absolute top-4 left-4 z-40">
              <button onClick={() => setGameState('start')} className="p-3 text-emerald-800 bg-white/80 backdrop-blur shadow-md rounded-full active:scale-90">
                <ArrowLeft size={24} />
              </button>
            </div>
            
            <div className="absolute top-6 right-4 z-40 flex gap-1 bg-white/60 px-3 py-2 rounded-full shadow-sm">
               {[...Array(8)].map((_, i) => (
                  <Star key={i} size={18} className={`transition-all duration-500 ${i < score ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-emerald-200/50 fill-emerald-200/50'}`} />
               ))}
            </div>

            <div className="absolute inset-0">
              {TENTS.map((tent) => {
                const isActive = bumbaSpot === tent.id && !isCaught;
                return (
                  <div key={tent.id} className="absolute" style={{ top: tent.top, left: tent.left, width: '9.5rem', height: '9.5rem' }}>
                    
                    {isActive && (
                      <div 
                        className={`absolute inset-0 z-10 animate-peek-${bumbaDirection} flex items-center justify-center`}
                      >
                        <img 
                          src={BUMBA_IMG} 
                          alt="Bumba" 
                          onClick={handleCatchBumba}
                          className="w-full h-full object-contain drop-shadow-xl cursor-pointer touch-manipulation" 
                        />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 z-20 pointer-events-none drop-shadow-2xl">
                      <TentSVG />
                    </div>
                  </div>
                );
              })}
            </div>

            {isCaught && (
              <div className="fixed top-1/2 left-1/2 z-50 animate-zoom-center pointer-events-none">
                <img src={BUMBA_IMG} alt="Bumba Gevangen" className="w-64 h-64 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
              </div>
            )}
          </div>
        )}

        {gameState === 'celebration' && (
          <div className="absolute inset-0 bg-red-400 z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="animate-bounce-slow mb-8 relative">
              <Sparkles size={80} className="absolute -top-10 -left-10 text-yellow-300 animate-pulse" />
              <Sparkles size={80} className="absolute -bottom-10 -right-10 text-yellow-300 animate-pulse" />
              <div className="w-56 h-56 bg-white rounded-full shadow-2xl flex items-center justify-center border-8 border-yellow-300">
                 <img src={BUMBA_IMG} alt="Bumba" className="w-44 h-44 object-contain pointer-events-none drop-shadow-lg" />
              </div>
            </div>
            <h2 className="text-6xl font-extrabold text-white drop-shadow-lg mb-4 tracking-wide">KLAAR!</h2>
            <p className="text-3xl text-red-100 font-bold mb-10">Heel goed gedaan!</p>
            <button onClick={() => setGameState('start')} className="bg-white text-red-600 text-2xl font-bold py-4 px-10 rounded-full shadow-xl active:scale-95 transition">
              Nog een keer
            </button>
          </div>
        )}

        {confettiBursts.map(burst => (
          <div key={burst.id} className="fixed pointer-events-none" style={{ left: burst.x, top: burst.y, zIndex: 100 }}>
            {[...Array(25)].map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const dist = 60 + Math.random() * 100;
              const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];
              return (
                <div 
                  key={i} 
                  className="confetti-piece" 
                  style={{
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    '--tx': `${Math.cos(angle) * dist}px`,
                    '--ty': `${Math.sin(angle) * dist}px`,
                    '--rot': `${Math.random() * 720}deg`,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                  }} 
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const TentSVG = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <path d="M 10 95 L 90 95 L 80 40 L 20 40 Z" fill="#fca5a5" />
    <path d="M 20 40 L 50 10 L 80 40 Z" fill="#ef4444" />
    <path d="M 35 40 L 50 10 L 65 40 Z" fill="#fca5a5" />
    <path d="M 40 95 L 50 55 L 60 95 Z" fill="#1f2937" />
    <path d="M 50 10 L 50 -5 L 65 2.5 Z" fill="#3b82f6" />
    <circle cx="50" cy="10" r="4" fill="#fcd34d" />
  </svg>
);

const BalloonSVG = ({ color, image }: any) => (
  <svg viewBox="0 0 100 160" className={`w-36 h-60 drop-shadow-xl active:scale-90 transition-transform ${color}`}>
    <path d="M 50 160 Q 40 135 50 115" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" />
    <ellipse cx="50" cy="55" rx="40" ry="50" style={{fill: 'currentColor'}} />
    {image && <image href={image} x="15" y="15" width="70" height="70" preserveAspectRatio="xMidYMid meet" />}
    <path d="M 40 105 L 60 105 L 50 115 Z" style={{fill: 'currentColor'}} />
    <ellipse cx="30" cy="35" rx="8" ry="18" fill="#fff" opacity="0.3" transform="rotate(-30 30 35)" />
  </svg>
);

const ItemSVG = ({ type }: any) => {
  if (type === 'bal') return (
    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ef4444" /><circle cx="30" cy="30" r="10" fill="#fff" opacity="0.6" /></svg>
  );
  if (type === 'ster') return (
    <svg viewBox="0 0 100 100"><path d="M 50 5 L 60 40 L 95 40 L 65 60 L 75 95 L 50 75 L 25 95 L 35 60 L 5 40 L 40 40 Z" fill="#eab308" /></svg>
  );
  if (type === 'hoed') return (
    <svg viewBox="0 0 100 100"><ellipse cx="50" cy="85" rx="45" ry="10" fill="#22c55e" /><path d="M 25 80 L 30 20 Q 50 10 70 20 L 75 80 Z" fill="#16a34a" /><rect x="26" y="65" width="48" height="10" fill="#fde047" /></svg>
  );
  if (type === 'auto') return (
    <svg viewBox="0 0 100 100"><path d="M 10 50 L 30 30 L 70 30 L 90 50 L 90 75 L 10 75 Z" fill="#3b82f6" /><rect x="35" y="35" width="15" height="15" fill="#fff" /><rect x="55" y="35" width="15" height="15" fill="#fff" /><circle cx="30" cy="75" r="15" fill="#1f2937" /><circle cx="70" cy="75" r="15" fill="#1f2937" /></svg>
  );
  if (type === 'banaan') return (
    <svg viewBox="0 0 100 100"><path d="M 20 20 Q 50 80 90 20 Q 70 90 10 30 Z" fill="#fde047" /><path d="M 15 25 L 25 15" stroke="#a16207" strokeWidth="4" /></svg>
  );
  if (type === 'appel') return (
    <svg viewBox="0 0 100 100"><path d="M 50 20 Q 65 5 80 25 A 35 35 0 0 1 50 95 A 35 35 0 0 1 20 25 Q 35 5 50 20 Z" fill="#22c55e" /><path d="M 50 20 Q 45 5 55 5" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" /><path d="M 55 5 Q 75 0 65 15 Q 50 15 55 5 Z" fill="#15803d" /><ellipse cx="35" cy="40" rx="6" ry="12" fill="#fff" opacity="0.4" transform="rotate(-20 35 40)" /></svg>
  );
  if (type === 'eend') return (
    <svg viewBox="0 0 100 100"><ellipse cx="45" cy="65" rx="35" ry="25" fill="#facc15" /><circle cx="70" cy="35" r="20" fill="#facc15" /><path d="M 70 35 L 45 65 L 70 65 Z" fill="#facc15" /><path d="M 45 65 Q 20 70 10 50 Q 30 50 45 65 Z" fill="#eab308" /><path d="M 85 30 Q 100 35 85 45 Q 80 40 85 30 Z" fill="#f97316" /><circle cx="75" cy="30" r="3" fill="#000" /></svg>
  );
  if (type === 'bloem') return (
    <svg viewBox="0 0 100 100"><circle cx="50" cy="25" r="18" fill="#f472b6" /><circle cx="75" cy="50" r="18" fill="#f472b6" /><circle cx="50" cy="75" r="18" fill="#f472b6" /><circle cx="25" cy="50" r="18" fill="#f472b6" /><circle cx="50" cy="50" r="16" fill="#fde047" /></svg>
  );
  if (type === 'vis') return (
    <svg viewBox="0 0 100 100"><ellipse cx="60" cy="50" rx="30" ry="20" fill="#f97316" /><path d="M 35 50 L 5 30 L 10 70 Z" fill="#ea580c" /><path d="M 50 32 L 65 15 L 75 35 Z" fill="#ea580c" /><circle cx="80" cy="45" r="4" fill="#fff" /><circle cx="82" cy="45" r="2" fill="#000" /></svg>
  );
  if (type === 'blok') return (
    <svg viewBox="0 0 100 100"><polygon points="50,20 85,35 50,50 15,35" fill="#d8b4fe" /><polygon points="15,35 50,50 50,85 15,70" fill="#9333ea" /><polygon points="50,50 85,35 85,70 50,85" fill="#a855f7" /></svg>
  );
  return null;
};
