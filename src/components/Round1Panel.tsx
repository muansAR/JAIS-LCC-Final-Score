import React from 'react';
import { Check, X, CornerDownRight, ArrowRight, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import { Team, QuestionStatus, RoundState1 } from '../types';

interface Round1PanelProps {
  teams: Team[];
  roundState: RoundState1;
  currentQuestionNumber: number;
  onScoreAction: (actionType: 'correct' | 'wrong' | 'pass') => void;
  onSelectTeam: (teamId: number) => void;
}

export default function Round1Panel({
  teams,
  roundState,
  currentQuestionNumber,
  onScoreAction,
  onSelectTeam
}: Round1PanelProps) {
  const { activeTeamId, questions, passBacklog, isBacklogMode, currentBacklogIndex } = roundState;
  
  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];
  const activeTeamQuestions = questions[activeTeam.id] || [];
  const activeTeamBacklog = passBacklog[activeTeam.id] || [];
  const activeTeamBacklogMode = isBacklogMode[activeTeam.id] || false;
  const activeBacklogIdx = currentBacklogIndex[activeTeam.id] || 0;

  // Calculate stats for current active team
  const correctCount = activeTeamQuestions.filter(q => q.status === 'correct').length;
  const wrongCount = activeTeamQuestions.filter(q => q.status === 'wrong').length;
  const passedCount = activeTeamQuestions.filter(q => q.status === 'passed').length;
  
  // Find current question context
  let currentQuestionDisplay = currentQuestionNumber;
  let statusText = "";

  if (activeTeamBacklogMode) {
    const backlogQuestionNumber = activeTeamBacklog[activeBacklogIdx];
    currentQuestionDisplay = backlogQuestionNumber || 0;
    statusText = `RE-ATTEMPT (Pass Queue #${activeBacklogIdx + 1} of ${activeTeamBacklog.length})`;
  } else {
    statusText = `Question ${currentQuestionNumber} of 10`;
  }

  return (
    <div className="space-y-4" id="round1_workspace">
      
      {/* Team Turn Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Select Active Team for Round 1
        </label>
        <div className="flex gap-2.5">
          {teams.map((team) => {
            const isSelected = activeTeamId === team.id;
            const completed = (questions[team.id] || []).filter(q => q.status !== 'pending').length === 10 && !(passBacklog[team.id]?.length > 0 && !isBacklogMode[team.id]);
            
            return (
              <button
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className={`flex-1 flex items-center justify-between rounded-xl px-3.5 py-2.5 border transition-all duration-200 ${
                  isSelected 
                    ? "bg-slate-900 border-gold shadow-md shadow-gold/5" 
                    : "bg-slate-900/40 border-slate-700/50 hover:border-slate-600/60 hover:bg-slate-900/70"
                }`}
                id={`r1_team_select_${team.id}`}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="h-6.5 w-6.5 rounded-md flex items-center justify-center font-display text-xs font-black text-white"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.logo || team.name.charAt(0)}
                  </div>
                  <span className={`font-display text-xs font-bold ${isSelected ? 'text-gold' : 'text-slate-300'}`}>
                    {team.name}
                  </span>
                </div>
                {completed ? (
                  <span className="rounded bg-success/15 px-1.5 py-0.5 text-[8px] font-bold text-success border border-success/20 uppercase tracking-widest">
                    Done
                  </span>
                ) : (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest border border-slate-750">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace for active team questions */}
      <div className="rounded-xl border border-slate-700/50 bg-[#1E293B] p-4.5 shadow-xl relative overflow-hidden" id="r1_active_board">
        {/* Background Accent Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full filter blur-2xl"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-700/50 pb-3 mb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeTeam.color }}></span>
              <h2 className="font-display text-lg font-bold text-white tracking-tight">
                Mandatory Questions: {activeTeam.name}
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">
              {statusText}
            </p>
          </div>

          {/* Micro Stats */}
          <div className="flex gap-3 text-xs">
            <span className="rounded-lg bg-success/10 border border-success/20 px-2.5 py-1 text-success font-semibold flex items-center gap-1.5">
              <Check size={12} className="stroke-[2.5]" />
              {correctCount} Correct
            </span>
            <span className="rounded-lg bg-danger/10 border border-danger/20 px-2.5 py-1 text-danger font-semibold flex items-center gap-1.5">
              <X size={12} className="stroke-[2.5]" />
              {wrongCount} Wrong
            </span>
            <span className="rounded-lg bg-warning/10 border border-warning/20 px-2.5 py-1 text-warning font-semibold flex items-center gap-1.5">
              <RefreshCw size={11} className="animate-spin-slow" />
              {passedCount} Passed
            </span>
          </div>
        </div>

        {/* Question Nodes Grid (1 - 10) */}
        <div className="grid grid-cols-5 gap-2.5 mb-5 sm:grid-cols-10" id="question_nodes_grid">
          {activeTeamQuestions.map((q) => {
            const isCurrent = q.number === currentQuestionNumber && !activeTeamBacklogMode;
            
            let statusColor = "bg-slate-950/60 border-slate-700/50 text-slate-500 hover:border-slate-600/50";
            let activeGlow = "";

            if (q.status === 'correct') {
              statusColor = "bg-success/20 border-success/60 text-success font-bold shadow-lg shadow-success/15";
            } else if (q.status === 'wrong') {
              statusColor = "bg-danger/20 border-danger/60 text-danger font-bold shadow-lg shadow-danger/15";
            } else if (q.status === 'passed') {
              statusColor = "bg-warning/20 border-warning/60 text-warning font-bold shadow-lg shadow-warning/15";
            } else if (isCurrent) {
              statusColor = "bg-slate-950 border-gold text-gold font-extrabold shadow-lg shadow-gold/20 scale-105";
              activeGlow = "ring-2 ring-gold/40 animate-pulse";
            }

            return (
              <div 
                key={q.number}
                className={`flex flex-col items-center justify-center h-11 rounded-xl border text-xs transition-all duration-200 select-none ${statusColor} ${activeGlow}`}
                title={`Question ${q.number} Status`}
              >
                <span className="font-mono">{q.number}</span>
                {q.status === 'correct' && <span className="text-[8px] font-extrabold mt-0.5">OK</span>}
                {q.status === 'wrong' && <span className="text-[8px] font-extrabold mt-0.5">X</span>}
                {q.status === 'passed' && <span className="text-[8px] font-extrabold mt-0.5">PASS</span>}
                {isCurrent && <span className="text-[8px] font-black tracking-widest mt-0.5 animate-pulse text-gold uppercase">Now</span>}
              </div>
            );
          })}
        </div>

        {/* Backlog Display (If backlog mode or has backlog) */}
        {activeTeamBacklog.length > 0 && (
          <div className="rounded-xl bg-slate-950/40 p-3.5 border border-slate-700/50 mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-warning">
                <RefreshCw size={13} className="animate-spin-slow" />
                <h4 className="font-display text-xs font-bold uppercase tracking-wider">
                  Pass Backlog Queue
                </h4>
              </div>
              <span className="rounded bg-warning/10 px-2 py-0.5 text-[9px] font-bold text-warning border border-warning/20">
                {activeTeamBacklog.length} questions passed
              </span>
            </div>
            
            <div className="flex gap-1.5 flex-wrap">
              {activeTeamBacklog.map((num, idx) => {
                const isActiveBacklog = activeTeamBacklogMode && idx === activeBacklogIdx;
                const isPassedResolved = activeTeamQuestions[num - 1]?.status !== 'passed' && activeTeamQuestions[num - 1]?.status !== 'pending';
                
                return (
                  <div 
                    key={num}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isActiveBacklog 
                        ? "bg-warning/20 border-warning text-warning scale-105" 
                        : isPassedResolved
                        ? "bg-success/10 border-success/30 text-success opacity-70"
                        : "bg-slate-900 border-slate-700/50 text-slate-400"
                    }`}
                  >
                    <HelpCircle size={11} />
                    <span>Q{num}</span>
                    {isActiveBacklog && <span className="ml-1 text-[8px] font-bold animate-pulse">ACTIVE</span>}
                    {isPassedResolved && <span className="ml-1 text-[8px] font-bold">SOLVED</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scoring Actions Panel */}
        <div className="flex flex-col gap-3">
          <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {activeTeamBacklogMode ? "Score Returned Question" : "Log scoring action"}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Correct Button */}
            <button
              onClick={() => onScoreAction('correct')}
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-success text-slate-950 text-xs font-extrabold shadow-md hover:bg-success-hover transition-all duration-200"
              title="Award 100 Points (Shortcut: 1)"
              id="r1_btn_correct"
            >
              <Check size={16} className="stroke-[3]" />
              <span>CORRECT (+100)</span>
            </button>

            {/* Wrong Button */}
            <button
              onClick={() => onScoreAction('wrong')}
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-danger text-white text-xs font-extrabold shadow-md hover:bg-danger-hover transition-all duration-200"
              title="Deduct 50 Points (Shortcut: 2)"
              id="r1_btn_wrong"
            >
              <X size={16} className="stroke-[3]" />
              <span>WRONG (-50)</span>
            </button>

            {/* Pass / Skip Button */}
            <button
              onClick={() => onScoreAction('pass')}
              className={`flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-extrabold shadow-md border transition-all duration-200 ${
                activeTeamBacklogMode 
                  ? "bg-slate-800 text-slate-400 border-slate-700/50 hover:bg-slate-750 hover:text-white" 
                  : "bg-warning text-slate-950 border-warning/20 hover:bg-warning-hover shadow-warning/15"
              }`}
              title={activeTeamBacklogMode ? "Skip backlog item (0 pts)" : "Pass Question (0 pts) to queue (Shortcut: 3)"}
              id="r1_btn_pass"
            >
              <RefreshCw size={16} className={activeTeamBacklogMode ? "" : "animate-spin-slow"} />
              <span>{activeTeamBacklogMode ? "SKIP (0)" : "PASS (0)"}</span>
            </button>
          </div>
        </div>

        {/* Shortcut Quick Hints */}
        <div className="flex justify-center gap-6 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-4 border-t border-slate-700/50 pt-2.5">
          <span>Shortcuts • [1]: Correct</span>
          <span>[2]: Wrong</span>
          <span>[3]: Pass</span>
        </div>

      </div>

    </div>
  );
}
