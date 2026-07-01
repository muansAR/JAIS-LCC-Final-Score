import React, { useState } from 'react';
import { Check, X, ShieldAlert, ArrowRight, CornerDownRight, Zap, RefreshCw } from 'lucide-react';
import { Team, RoundState2 } from '../types';

interface Round2PanelProps {
  teams: Team[];
  roundState: RoundState2;
  currentQuestionNumber: number;
  onSetQuestionNumber: (num: number) => void;
  onMainTeamResult: (result: 'correct' | 'wrong') => void;
  onPassTeamResult: (recipientTeamId: number, result: 'correct' | 'wrong' | 'no_answer') => void;
  onSelectMainTeam: (teamId: number) => void;
  onResetRoundState: () => void;
}

export default function Round2Panel({
  teams,
  roundState,
  currentQuestionNumber,
  onSetQuestionNumber,
  onMainTeamResult,
  onPassTeamResult,
  onSelectMainTeam,
  onResetRoundState
}: Round2PanelProps) {
  const { activeTeamId, isPassed, passedTeamId, status } = roundState;
  const [selectedPassTeam, setSelectedPassTeam] = useState<number | null>(null);

  const mainTeam = teams.find(t => t.id === activeTeamId) || teams[0];
  const opponentTeams = teams.filter(t => t.id !== activeTeamId);

  const handleMainWrong = () => {
    // Automatically select the first opponent as default pass target to save clicks
    if (opponentTeams.length > 0) {
      setSelectedPassTeam(opponentTeams[0].id);
    }
    onMainTeamResult('wrong');
  };

  const handleNextQuestion = () => {
    // Advance question number
    onSetQuestionNumber(currentQuestionNumber + 1);
    // Auto rotate main team to the next one to keep the rotation fluid: A -> B -> C -> A
    const currentIndex = teams.findIndex(t => t.id === activeTeamId);
    const nextIndex = (currentIndex + 1) % teams.length;
    onSelectMainTeam(teams[nextIndex].id);
    onResetRoundState();
    setSelectedPassTeam(null);
  };

  return (
    <div className="space-y-4" id="round2_workspace">
      
      {/* Configuration Header Row */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        {/* Active Team Owner Selection */}
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
            Main Team Owner of Question
          </label>
          <div className="flex gap-2">
            {teams.map((t) => {
              const isSelected = activeTeamId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectMainTeam(t.id);
                    onResetRoundState();
                    setSelectedPassTeam(null);
                  }}
                  disabled={status !== 'pending'}
                  className={`flex-1 flex items-center gap-1.5 justify-center rounded-xl py-1.5 px-2.5 border text-xs transition-all ${
                    isSelected 
                      ? "bg-slate-900 border-gold text-white font-bold" 
                      : "bg-slate-900/30 border-slate-700/50 text-slate-400 hover:text-white"
                  }`}
                  id={`r2_select_main_${t.id}`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Question Number Counter */}
        <div className="w-full md:w-auto">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
            Question Number
          </label>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => onSetQuestionNumber(Math.max(1, currentQuestionNumber - 1))}
              className="bg-slate-900 text-slate-300 border border-slate-700/50 rounded-lg px-2 py-1 text-xs font-bold hover:text-white"
              title="Previous Question"
            >
              -
            </button>
            <div className="bg-slate-950 border border-slate-750 px-3 py-1 rounded-lg text-xs font-mono font-bold text-gold">
              Question {currentQuestionNumber}
            </div>
            <button 
              onClick={() => onSetQuestionNumber(currentQuestionNumber + 1)}
              className="bg-slate-900 text-slate-300 border border-slate-700/50 rounded-lg px-2 py-1 text-xs font-bold hover:text-white"
              title="Next Question"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Workspace Card */}
      <div className="rounded-xl border border-slate-700/50 bg-[#1E293B] p-4.5 shadow-xl relative" id="r2_interactive_workspace">
        
        {/* Dynamic State Overlay Banner */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-gold" />
            <span className="font-display text-sm font-bold tracking-tight text-white uppercase">
              Lemparan Round Interactive Log
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${
            status === 'pending' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
            status === 'correct' ? 'bg-success/15 text-success border-success/30' :
            status === 'wrong' ? 'bg-danger/15 text-danger border-danger/30 animate-pulse' :
            'bg-warning/15 text-warning border-warning/30'
          }`}>
            {status === 'pending' ? 'First Attempt' : status === 'correct' ? 'Solved by Owner' : status === 'wrong' ? 'Throw Stage Active' : 'Pass Done'}
          </span>
        </div>

        {/* STEP 1: Main Team Action */}
        <div className={`transition-all duration-300 ${status !== 'pending' ? 'opacity-50' : ''}`} id="r2_step1_main_panel">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-400">1</span>
            <span className="font-display text-sm font-bold text-slate-300">
              Answering Attempt for Main Owner:
            </span>
            <span className="font-display text-sm font-black text-white" style={{ color: mainTeam.color }}>
              {mainTeam.name}
            </span>
          </div>

          {status === 'pending' ? (
            <div className="grid grid-cols-2 gap-3 my-3">
              <button
                onClick={() => onMainTeamResult('correct')}
                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-success text-slate-950 font-bold text-xs shadow-md hover:bg-success-hover transition"
                id="r2_main_correct"
              >
                <Check size={16} className="stroke-[3]" />
                <span>CORRECT (+100)</span>
              </button>
              <button
                onClick={handleMainWrong}
                className="flex items-center justify-center gap-2 h-12 rounded-xl bg-danger text-white font-bold text-xs shadow-md hover:bg-danger-hover transition"
                id="r2_main_wrong"
              >
                <X size={16} className="stroke-[3]" />
                <span>WRONG (0 - Trigger Pass)</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-700/50 p-2.5 rounded-xl flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400 font-medium">Main team logged:</span>
              <span className={`text-xs font-bold uppercase ${status === 'correct' ? 'text-success' : 'text-danger'}`}>
                {status === 'correct' ? '✓ Correct Answer (+100)' : '✗ Incorrect / Pass Question'}
              </span>
            </div>
          )}
        </div>

        {/* STEP 2: Passed / Throw Target Selection & Scoring */}
        {isPassed && (
          <div className="border-t border-dashed border-slate-700/50 pt-4 mt-4 animate-fade-in" id="r2_step2_pass_panel">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-950 text-[10px] font-bold text-slate-400">2</span>
              <span className="font-display text-sm font-bold text-slate-300">
                Choose Recipient of Passed Question & Grade:
              </span>
            </div>

            {/* Selector of which opponent gets the pass */}
            <div className="flex gap-2.5 mb-4">
              {opponentTeams.map((opponent) => {
                const isSelected = selectedPassTeam === opponent.id;
                return (
                  <button
                    key={opponent.id}
                    onClick={() => {
                      if (status === 'wrong') {
                        setSelectedPassTeam(opponent.id);
                      }
                    }}
                    disabled={status !== 'wrong'}
                    className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected 
                        ? "bg-slate-900 border-warning text-warning shadow-md shadow-warning/5" 
                        : "bg-slate-900/30 border-slate-700/50 text-slate-400 hover:text-white"
                    }`}
                    id={`r2_pass_target_${opponent.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: opponent.color }}></div>
                      <span>{opponent.name}</span>
                    </div>
                    {isSelected && <span className="text-[9px] bg-warning/15 px-1.5 py-0.5 rounded text-warning uppercase">Pass Target</span>}
                  </button>
                );
              })}
            </div>

            {/* Scoring for the chosen pass target */}
            {selectedPassTeam && (
              <div className="space-y-3">
                <div className="text-xs text-center font-semibold text-slate-400 uppercase tracking-widest">
                  Score Pass for {teams.find(t => t.id === selectedPassTeam)?.name}
                </div>

                {status === 'wrong' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => onPassTeamResult(selectedPassTeam, 'correct')}
                      className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-success/20 border border-success/40 text-success font-bold text-xs shadow-md hover:bg-success hover:text-slate-950 transition"
                      id="r2_pass_correct"
                    >
                      <Check size={14} className="stroke-[3]" />
                      <span>CORRECT (+50)</span>
                    </button>
                    <button
                      onClick={() => onPassTeamResult(selectedPassTeam, 'wrong')}
                      className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-danger/20 border border-danger/40 text-danger font-bold text-xs shadow-md hover:bg-danger hover:text-white transition"
                      id="r2_pass_wrong"
                    >
                      <X size={14} className="stroke-[3]" />
                      <span>WRONG (-50)</span>
                    </button>
                    <button
                      onClick={() => onPassTeamResult(selectedPassTeam, 'no_answer')}
                      className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-slate-800 border border-slate-700/50 text-slate-300 font-bold text-xs hover:text-white transition"
                      id="r2_pass_no_answer"
                    >
                      <RefreshCw size={12} />
                      <span>NO ANSWER (0)</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-slate-700/50 p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Passed Team Result:</span>
                    <span className={`text-xs font-bold uppercase ${
                      status === 'passed_correct' ? 'text-success' : 
                      status === 'passed_wrong' ? 'text-danger' : 'text-slate-400'
                    }`}>
                    {status === 'passed_correct' ? '✓ Passed Correct (+50)' : 
                     status === 'passed_wrong' ? '✗ Passed Wrong (-50)' : 'No Answer / Timeout (0)'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* NEXT QUESTION NAVIGATION BUTTON */}
        {status !== 'pending' && (!isPassed || (isPassed && status !== 'wrong')) && (
          <div className="mt-4 border-t border-slate-700/50 pt-3.5 flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gold text-slate-950 font-extrabold text-xs hover:bg-gold-hover transition shadow-md shadow-gold/10"
              id="r2_next_question_btn"
            >
              <span>NEXT QUESTION</span>
              <ArrowRight size={14} className="stroke-[3.5]" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
