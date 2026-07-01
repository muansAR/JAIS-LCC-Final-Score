import React from 'react';
import { Radio, RotateCcw, Check, X, ShieldAlert, Zap, Keyboard } from 'lucide-react';
import { Team, RoundState3 } from '../types';

interface Round3PanelProps {
  teams: Team[];
  roundState: RoundState3;
  currentQuestionNumber: number;
  onSetQuestionNumber: (num: number) => void;
  onOpenBuzzers: () => void;
  onCloseBuzzers: () => void;
  onTriggerBuzz: (teamId: number) => void;
  onBuzzResult: (result: 'correct' | 'wrong') => void;
  onResetBuzzers: () => void;
}

export default function Round3Panel({
  teams,
  roundState,
  currentQuestionNumber,
  onSetQuestionNumber,
  onOpenBuzzers,
  onCloseBuzzers,
  onTriggerBuzz,
  onBuzzResult,
  onResetBuzzers
}: Round3PanelProps) {
  const { buzzedTeamId, isOpen, isLocked } = roundState;
  const buzzedTeam = teams.find(t => t.id === buzzedTeamId);

  return (
    <div className="space-y-4" id="round3_workspace">
      
      {/* Header and Question Number Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            Round 3: Buzz Round (Soal Rebutan)
          </h3>
          <p className="text-[11px] font-medium text-slate-400">
            Speed round. Lock, answer, and gain or lose 100 points!
          </p>
        </div>
        
        {/* Question Counter */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onSetQuestionNumber(Math.max(1, currentQuestionNumber - 1))}
            className="bg-slate-900 text-slate-300 border border-slate-700/50 rounded-lg px-2 py-1 text-xs font-bold hover:text-white"
          >
            -
          </button>
          <div className="bg-slate-950 border border-slate-750 px-3 py-1 rounded-lg text-xs font-mono font-bold text-gold">
            Question {currentQuestionNumber}
          </div>
          <button 
            onClick={() => onSetQuestionNumber(currentQuestionNumber + 1)}
            className="bg-slate-900 text-slate-300 border border-slate-700/50 rounded-lg px-2 py-1 text-xs font-bold hover:text-white"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Buzzer Status Dashboard */}
      <div className="rounded-xl border border-slate-700/50 bg-[#1E293B] p-4.5 shadow-xl relative" id="r3_buzzer_console">
        
        {/* Status indicator banner */}
        <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Radio size={15} className={isOpen ? "text-success animate-pulse" : "text-slate-400"} />
            <span className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest">
              Buzzer Gateway Status
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLocked ? (
              <span className="rounded-full bg-danger/15 px-3 py-0.5 text-xs font-extrabold text-danger border border-danger/35 tracking-widest animate-pulse">
                LOCKED ON REGU {buzzedTeam?.seat || ''}
              </span>
            ) : isOpen ? (
              <span className="rounded-full bg-success/15 px-3 py-0.5 text-xs font-extrabold text-success border border-success/35 tracking-widest animate-pulse">
                GATEWAY OPEN
              </span>
            ) : (
              <span className="rounded-full bg-slate-850 px-3 py-0.5 text-xs font-bold text-slate-500 border border-slate-750 tracking-widest">
                GATEWAY CLOSED
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Display State */}
        {isLocked && buzzedTeam ? (
          /* LOCKED STATE DISPLAY */
          <div 
            className="rounded-xl border-2 p-5 text-center shadow-lg transition-all duration-300 animate-buzzer-flash"
            style={{ 
              borderColor: buzzedTeam.color,
              backgroundColor: `${buzzedTeam.color}12`,
              boxShadow: `0 0 30px ${buzzedTeam.color}20`
            }}
            id="buzzer_lockout_screen"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
              🎉 FASTEST BUZZ DETECTED 🎉
            </span>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white mb-1.5 uppercase">
              {buzzedTeam.name}
            </h2>
            <div 
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white mb-3"
              style={{ backgroundColor: buzzedTeam.color }}
            >
              {buzzedTeam.logo || buzzedTeam.seat}
            </div>
            
            {/* Action Grading Form */}
            <div className="max-w-md mx-auto grid grid-cols-2 gap-3 mt-1">
              <button
                onClick={() => onBuzzResult('correct')}
                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-success text-slate-950 font-extrabold text-xs hover:bg-success-hover shadow-md hover:scale-[1.02] transition"
                id="r3_btn_correct"
              >
                <Check size={16} className="stroke-[3]" />
                <span>CORRECT (+100)</span>
              </button>
              <button
                onClick={() => onBuzzResult('wrong')}
                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-danger text-white font-extrabold text-xs hover:bg-danger-hover shadow-md hover:scale-[1.02] transition"
                id="r3_btn_wrong"
              >
                <X size={16} className="stroke-[3]" />
                <span>WRONG (-100)</span>
              </button>
            </div>
            
            <div className="mt-3.5 flex justify-center">
              <button
                onClick={onResetBuzzers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white transition"
                id="r3_btn_release_lock"
              >
                <RotateCcw size={11} />
                <span>Release Lock without penalty</span>
              </button>
            </div>
          </div>
        ) : (
          /* CLOSED / OPEN STATE MANUAL BUZZ TRIGGERS */
          <div className="space-y-4" id="buzzer_inactive_panel">
            {/* Buzzer buttons (visual representation / manual override) */}
            <div className="grid grid-cols-3 gap-3">
              {teams.map((t) => {
                const disabled = !isOpen || isLocked;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTriggerBuzz(t.id)}
                    disabled={disabled}
                    className={`flex flex-col items-center justify-center h-24 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                      disabled 
                        ? "bg-slate-900/10 border-slate-800 opacity-40 cursor-not-allowed" 
                        : "bg-slate-900 border-slate-700/50 hover:scale-102 cursor-pointer shadow-md hover:shadow-lg"
                    }`}
                    style={{
                      borderColor: !disabled ? `${t.color}35` : undefined,
                      boxShadow: !disabled ? `0 2px 10px rgba(0,0,0,0.3)` : undefined
                    }}
                    id={`r3_manual_buzz_${t.id}`}
                  >
                    {/* Hover Glow Effect */}
                    {!disabled && (
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ backgroundColor: `${t.color}08` }}
                      ></div>
                    )}

                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Seat {t.seat}
                    </span>
                    <div 
                      className="h-8 w-8 rounded-lg flex items-center justify-center font-display text-xs font-black text-white mb-1 shadow-sm"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.logo || t.seat}
                    </div>
                    <span className="font-display font-bold text-xs text-white">
                      {t.name}
                    </span>

                    {/* Keyboard binding label */}
                    <span className="absolute bottom-1.5 rounded bg-slate-950 px-1.5 py-0.25 text-[8px] font-bold text-slate-500 tracking-wider">
                      KEY: {t.id === 1 ? 'A' : t.id === 2 ? 'L' : ';'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Gateway Master Controls */}
            <div className="flex gap-3 border-t border-slate-700/50 pt-3.5 justify-center">
              {isOpen ? (
                <button
                  onClick={onCloseBuzzers}
                  className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-danger text-white font-extrabold text-xs hover:bg-danger-hover shadow-md transition-all animate-pulse"
                  id="r3_btn_close_buzzers"
                >
                  <Radio size={14} />
                  <span>CLOSE BUZZER GATEWAY</span>
                </button>
              ) : (
                <button
                  onClick={onOpenBuzzers}
                  className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-success text-slate-950 font-extrabold text-xs hover:bg-success-hover shadow-md transition-all hover:scale-[1.02]"
                  id="r3_btn_open_buzzers"
                >
                  <Radio size={14} className="animate-pulse" />
                  <span>OPEN BUZZER GATEWAY</span>
                </button>
              )}

              <button
                onClick={onResetBuzzers}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-300 font-bold text-xs hover:text-white transition-all"
                id="r3_btn_reset_gate"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Bindings Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-t border-slate-700/50 pt-2.5">
          <Keyboard size={11} />
          <span>Active Keyboard Buzz keys • Regu A [A]</span>
          <span>• Regu B [L]</span>
          <span>• Regu C [;]</span>
        </div>

      </div>

    </div>
  );
}
