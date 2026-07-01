import React from 'react';
import { Trophy, Radio, ShieldAlert, Check, X, RotateCcw, HelpCircle } from 'lucide-react';
import { Team, TieBreakState } from '../types';

interface SuddenDeathPanelProps {
  teams: Team[];
  scores: Record<number, number>;
  tieBreakState: TieBreakState;
  onOpenSuddenDeathBuzzers: () => void;
  onTriggerSuddenDeathBuzz: (teamId: number) => void;
  onSuddenDeathResult: (result: 'correct' | 'wrong') => void;
  onResetSuddenDeathBuzzers: () => void;
}

export default function SuddenDeathPanel({
  teams,
  scores,
  tieBreakState,
  onOpenSuddenDeathBuzzers,
  onTriggerSuddenDeathBuzz,
  onSuddenDeathResult,
  onResetSuddenDeathBuzzers
}: SuddenDeathPanelProps) {
  const { activeTeams, buzzedTeamId, isOpen, isLocked } = tieBreakState;
  
  const tiedTeamsList = teams.filter(t => activeTeams.includes(t.id));
  const buzzedTeam = teams.find(t => t.id === buzzedTeamId);

  return (
    <div className="space-y-4" id="sudden_death_workspace">
      
      {/* Alert Header Box */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 flex items-start gap-2.5 shadow-md">
        <ShieldAlert className="text-warning h-5 w-5 shrink-0 mt-0.5 animate-bounce" />
        <div>
          <h3 className="font-display font-bold text-xs text-warning uppercase tracking-wider">
            🚨 TIE DETECTED • SUDDEN DEATH ENGAGED 🚨
          </h3>
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
            The regular rounds ended in a draw! The following teams are tied with the same score of{' '}
            <strong className="font-mono text-warning text-xs">{scores[activeTeams[0]] || 0}</strong> points.{' '}
            The tied teams will now compete in a Sudden Death Buzz question. First correct answer breaks the tie and wins!
          </p>
        </div>
      </div>

      {/* Main Panel Frame */}
      <div className="rounded-xl border border-slate-700/50 bg-[#1E293B] p-4.5 shadow-xl relative" id="sudden_death_console">
        
        {/* Dynamic State Overlay Banner */}
        <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-gold" />
            <span className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest">
              Sudden Death Arena
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLocked ? (
              <span className="rounded-full bg-danger/15 px-3 py-0.5 text-xs font-extrabold text-danger border border-danger/35 tracking-widest animate-pulse">
                SUDDEN DEATH LOCKOUT
              </span>
            ) : isOpen ? (
              <span className="rounded-full bg-success/15 px-3 py-0.5 text-xs font-extrabold text-success border border-success/35 tracking-widest animate-pulse">
                BUZZERS ARMED
              </span>
            ) : (
              <span className="rounded-full bg-slate-850 px-3 py-0.5 text-xs font-bold text-slate-500 border border-slate-750 tracking-widest">
                BUZZERS DISARMED
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
            id="sudden_death_lockout_screen"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
              🚨 TIE BREAK BUZZ DETECTED 🚨
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
                onClick={() => onSuddenDeathResult('correct')}
                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-success text-slate-950 font-extrabold text-xs hover:bg-success-hover shadow-md hover:scale-[1.02] transition animate-pulse"
                id="sd_btn_correct"
              >
                <Check size={16} className="stroke-[3]" />
                <span>CORRECT (WIN!)</span>
              </button>
              <button
                onClick={() => onSuddenDeathResult('wrong')}
                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-danger text-white font-extrabold text-xs hover:bg-danger-hover shadow-md hover:scale-[1.02] transition"
                id="sd_btn_wrong"
              >
                <X size={16} className="stroke-[3]" />
                <span>WRONG (-100)</span>
              </button>
            </div>
            
            <div className="mt-3 flex justify-center">
              <button
                onClick={onResetSuddenDeathBuzzers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-semibold text-slate-300 hover:text-white transition"
              >
                <RotateCcw size={11} />
                <span>Cancel lock</span>
              </button>
            </div>
          </div>
        ) : (
          /* CLOSED / OPEN STATE BUZZ TRIGGERS FOR TIED TEAMS */
          <div className="space-y-4" id="sudden_death_buzzers_panel">
            {/* Visual description of tied contestants */}
            <div className="flex gap-3 items-center justify-center mb-1.5">
              {tiedTeamsList.map((t, idx) => (
                <React.Fragment key={t.id}>
                  <div className="flex flex-col items-center">
                    <div 
                      className="h-8 w-8 rounded-lg flex items-center justify-center font-display text-xs font-black text-white shadow"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.logo || t.seat}
                    </div>
                    <span className="font-display font-bold text-xs text-slate-200 mt-1.5">{t.name}</span>
                    <span className="font-mono text-[9px] font-bold text-slate-500 mt-0.5">Score: {scores[t.id]}</span>
                  </div>
                  {idx < tiedTeamsList.length - 1 && (
                    <span className="font-display text-xs font-black text-slate-600">VS</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Buzzer triggers specifically for the tied teams */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {tiedTeamsList.map((t) => {
                const disabled = !isOpen || isLocked;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTriggerSuddenDeathBuzz(t.id)}
                    disabled={disabled}
                    className={`flex flex-col items-center justify-center h-24 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                      disabled 
                        ? "bg-slate-900/10 border-slate-800 opacity-40 cursor-not-allowed" 
                        : "bg-slate-900 border-slate-700/50 hover:scale-102 cursor-pointer shadow-md hover:shadow-lg"
                    }`}
                    style={{
                      borderColor: !disabled ? `${t.color}35` : undefined,
                    }}
                    id={`sd_manual_buzz_${t.id}`}
                  >
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
                    <span className="absolute bottom-1.5 rounded bg-slate-950 px-1 py-0.25 text-[7px] font-bold text-slate-500 tracking-wider">
                      KEY: {t.id === 1 ? 'A' : t.id === 2 ? 'L' : ';'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Arm Button */}
            <div className="flex gap-3 border-t border-slate-700/50 pt-3.5 justify-center">
              {!isOpen ? (
                <button
                  onClick={onOpenSuddenDeathBuzzers}
                  className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-warning text-slate-950 font-extrabold text-xs hover:bg-warning-hover shadow-md transition-all hover:scale-[1.02]"
                  id="sd_btn_arm"
                >
                  <Radio size={14} className="animate-pulse" />
                  <span>ARM SUDDEN DEATH BUZZERS</span>
                </button>
              ) : (
                <button
                  onClick={onResetSuddenDeathBuzzers}
                  className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-danger text-white font-extrabold text-xs hover:bg-danger-hover shadow-md transition-all"
                  id="sd_btn_disarm"
                >
                  <Radio size={14} />
                  <span>DISARM BUZZERS</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
