import React from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Clock } from 'lucide-react';

interface TimerSectionProps {
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onAdjustDuration: (change: number) => void;
  onSetDuration: (secs: number) => void;
}

export default function TimerSection({
  timeLeft,
  duration,
  isRunning,
  onToggleTimer,
  onResetTimer,
  onAdjustDuration,
  onSetDuration
}: TimerSectionProps) {
  // SVG Circular math
  const radius = 64;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / duration;
  const strokeDashoffset = circumference * (1 - progress);

  // Dynamic colors for countdown states
  const getColorClass = () => {
    if (timeLeft <= 3) return { text: 'text-danger', stroke: 'stroke-danger', bg: 'bg-danger/5' };
    if (timeLeft <= duration / 2) return { text: 'text-warning', stroke: 'stroke-warning', bg: 'bg-warning/5' };
    return { text: 'text-success', stroke: 'stroke-success', bg: 'bg-success/5' };
  };

  const currentColors = getColorClass();

  return (
    <div className="glass-card flex flex-col items-center justify-between rounded-xl border border-slate-700/50 p-4.5 shadow-md" id="timer_dashboard">
      <div className="flex w-full items-center justify-between border-b border-slate-700/50 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Clock size={15} className="text-gold" />
          <span className="font-display text-xs font-bold tracking-tight text-white uppercase">
            Game Timer
          </span>
        </div>
        <div className="flex gap-1">
          {[5, 10, 15, 20].map((sec) => (
            <button 
              key={sec}
              onClick={() => onSetDuration(sec)}
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold border transition ${
                duration === sec 
                  ? "bg-gold text-slate-950 border-gold" 
                  : "bg-slate-950 text-slate-400 border-slate-700/50 hover:text-white"
              }`}
              id={`timer_preset_${sec}`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* SVG Ring & Big Number */}
      <div className="relative my-4 flex h-36 w-36 items-center justify-center rounded-full" id="timer_circle_container">
        {/* Ambient Pulsing Background */}
        <div className={`absolute inset-2 rounded-full transition-all duration-500 ${currentColors.bg} ${isRunning && timeLeft <= 3 ? 'animate-ping opacity-25' : ''}`}></div>

        <svg className="h-full w-full rotate-270" viewBox="0 0 160 160">
          {/* Track circle */}
          <circle 
            cx="80" 
            cy="80" 
            r={radius} 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth={strokeWidth} 
            fill="transparent"
          />
          {/* Animated active circle */}
          <circle 
            cx="80" 
            cy="80" 
            r={radius} 
            strokeWidth={strokeWidth} 
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(strokeDashoffset) ? 0 : strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${currentColors.stroke}`}
            style={{
              transitionDuration: isRunning ? '1000ms' : '200ms'
            }}
          />
        </svg>

        {/* Digital Time Center */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`font-mono text-4xl font-black tracking-tighter transition-colors duration-300 ${currentColors.text}`} id="timer_countdown_num">
            {timeLeft}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            seconds
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex w-full flex-col gap-3">
        
        {/* Core Controls */}
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => onAdjustDuration(-5)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-white transition"
            title="Subtract 5 Seconds"
            id="timer_minus_5"
          >
            <Minus size={14} />
          </button>

          <button 
            onClick={onToggleTimer}
            className={`flex h-11 w-24 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold shadow-md transition-all duration-300 ${
              isRunning 
                ? "bg-danger text-white hover:bg-danger-hover shadow-danger/10 border border-danger/20" 
                : "bg-success text-slate-950 hover:bg-success-hover shadow-success/10 border border-success/20"
            }`}
            title="Start/Pause Timer (Shortcut: Space)"
            id="timer_toggle_btn"
          >
            {isRunning ? (
              <>
                <Pause size={14} className="fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-current" />
                <span>START</span>
              </>
            )}
          </button>

          <button 
            onClick={onResetTimer}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-white transition"
            title="Reset Timer (Shortcut: R)"
            id="timer_reset_btn"
          >
            <RotateCcw size={14} />
          </button>

          <button 
            onClick={() => onAdjustDuration(5)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-white transition"
            title="Add 5 Seconds"
            id="timer_plus_5"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Shortcuts Label */}
        <div className="text-center">
          <span className="inline-block rounded-md bg-slate-950 px-2 py-0.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800">
            Space: Start/Pause • R: Reset
          </span>
        </div>

      </div>
    </div>
  );
}
