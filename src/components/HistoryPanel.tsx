import React from 'react';
import { Undo2, Redo2, Clock, Trash2, ArrowRight } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  historyIndex: number;
  onUndo: () => void;
  onRedo: () => void;
  onResetAllHistory: () => void;
}

export default function HistoryPanel({
  history,
  historyIndex,
  onUndo,
  onRedo,
  onResetAllHistory
}: HistoryPanelProps) {
  // Extract visible history (items that exist in the stack up to current index)
  const activeHistory = history.slice(0, historyIndex + 1).reverse();
  const forwardHistoryCount = history.length - 1 - historyIndex;

  const handleClear = () => {
    if (window.confirm("CRITICAL WARNING: This will permanently delete the entire match history and reset all team scores back to 0. This cannot be undone! Are you absolutely sure you want to proceed?")) {
      onResetAllHistory();
    }
  };

  return (
    <div className="glass-card flex flex-col h-[380px] rounded-xl border border-slate-700/50 p-4 shadow-md" id="history_dashboard">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5 mb-3.5">
        <div className="flex items-center gap-1.5">
          <Clock size={15} className="text-gold" />
          <h3 className="font-display text-xs font-bold tracking-tight text-white uppercase">
            Match History Log
          </h3>
        </div>

        {/* Undo / Redo triggers */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={historyIndex < 0}
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/50 text-slate-300 disabled:opacity-30 hover:text-gold hover:border-gold/30 transition-all cursor-pointer"
            title="Undo Last Action (Shortcut: Ctrl+Z)"
            id="history_undo_btn"
          >
            <Undo2 size={13} />
          </button>
          
          <button
            onClick={onRedo}
            disabled={forwardHistoryCount <= 0}
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/50 text-slate-300 disabled:opacity-30 hover:text-gold hover:border-gold/30 transition-all cursor-pointer"
            title="Redo Next Action (Shortcut: Ctrl+Y)"
            id="history_redo_btn"
          >
            <Redo2 size={13} />
          </button>

          <span className="h-3.5 w-px bg-slate-700 mx-1"></span>

          <button
            onClick={handleClear}
            className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-900/40 border border-slate-700/50 text-slate-500 hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all"
            title="Wipe and reset entire match"
            id="history_clear_btn"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="history_logs_container">
        {activeHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-3">
            <span className="text-xl mb-1 opacity-40">📝</span>
            <p className="text-xs text-slate-500 font-medium">No actions logged yet.</p>
            <p className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-widest">Awaiting competition start...</p>
          </div>
        ) : (
          activeHistory.map((item, idx) => {
            const isLatest = idx === 0;
            const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // Format round name nicely
            const formatRound = (rName: string) => {
              if (rName === 'ROUND_1') return 'Wajib';
              if (rName === 'ROUND_2') return 'Lemparan';
              if (rName === 'ROUND_3') return 'Rebutan';
              return 'Sudden Death';
            };

            return (
              <div 
                key={item.id}
                className={`flex flex-col p-2.5 rounded-lg border transition-all ${
                  isLatest 
                    ? "bg-slate-950/60 border-gold/40 shadow-inner glow-gold/5" 
                    : "bg-slate-950/20 border-slate-800 opacity-80"
                }`}
                id={`history_item_${item.id}`}
              >
                {/* Log Meta Row */}
                <div className="flex items-center justify-between mb-0.5 text-[9px] font-semibold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">{timeStr}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-750"></span>
                    <span className="rounded bg-slate-900 border border-slate-800 px-1 py-0.25 font-bold uppercase text-[8px] text-slate-400">
                      R{item.round.charAt(6) || '4'} ({formatRound(item.round)})
                    </span>
                    <span className="text-slate-500">Q{item.questionNumber}</span>
                  </div>
                  {isLatest && (
                    <span className="rounded bg-gold/15 px-1.5 py-0.25 text-[8px] font-black text-gold border border-gold/35 uppercase tracking-widest">
                      LATEST
                    </span>
                  )}
                </div>

                {/* Score adjustment reason row */}
                <div className="flex items-center justify-between my-0.5">
                  <span className="text-xs font-bold text-slate-200">
                    {item.reason}
                  </span>
                  
                  {/* Badge representing score increment/decrement */}
                  <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                    item.scoreChange > 0 
                      ? "bg-success/15 text-success border border-success/30" 
                      : item.scoreChange < 0 
                      ? "bg-danger/15 text-danger border border-danger/30" 
                      : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}>
                    {item.scoreChange > 0 ? '+' : ''}{item.scoreChange}
                  </span>
                </div>

                {/* Small print auditing scores */}
                {item.teamId > 0 && (
                  <div className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                    <span>Score Progression:</span>
                    <span className="font-mono">{item.prevScores[item.teamId] || 0}</span>
                    <ArrowRight size={7} />
                    <span className="font-mono font-bold text-slate-300">{item.newScores[item.teamId]}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Undo/Redo quick status line */}
      {history.length > 0 && (
        <div className="text-[9px] text-center font-bold text-slate-500 uppercase tracking-widest mt-2 pt-2 border-t border-slate-700/50">
          Stack Index: {historyIndex + 1} of {history.length} active logs
        </div>
      )}

    </div>
  );
}
