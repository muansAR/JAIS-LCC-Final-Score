import React, { useState } from 'react';
import { Crown, Trophy, Edit3, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { Team } from '../types';

interface ScoreboardProps {
  teams: Team[];
  scores: Record<number, number>;
  activeTeamId: number | null;
  buzzedTeamId: number | null;
  onUpdateTeam: (updatedTeam: Team) => void;
  onAdjustScoreManual: (teamId: number, adjustment: number) => void;
}

export default function Scoreboard({
  teams,
  scores,
  activeTeamId,
  buzzedTeamId,
  onUpdateTeam,
  onAdjustScoreManual
}: ScoreboardProps) {
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editSeat, setEditSeat] = useState('');
  
  const [manualAdjustmentId, setManualAdjustmentId] = useState<number | null>(null);
  const [manualValue, setManualValue] = useState<number>(50);

  // Determine ranks
  const sortedByScore = [...teams]
    .map(t => ({ id: t.id, score: scores[t.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const getRank = (teamId: number): number => {
    return sortedByScore.findIndex(item => item.id === teamId) + 1;
  };

  const isLeader = (teamId: number): boolean => {
    const leaderScore = sortedByScore[0].score;
    const teamScore = scores[teamId] || 0;
    // Check if team has the highest score and highest score isn't tied with 0 for all
    if (teamScore === leaderScore) {
      // Check if all scores are equal to 0
      const allZero = sortedByScore.every(item => item.score === 0);
      return !allZero;
    }
    return false;
  };

  const startEditing = (team: Team) => {
    setEditingTeamId(team.id);
    setEditName(team.name);
    setEditLogo(team.logo);
    setEditColor(team.color);
    setEditSeat(team.seat);
  };

  const saveTeamEdit = () => {
    if (editingTeamId) {
      onUpdateTeam({
        id: editingTeamId,
        name: editName.trim() || `Regu ${String.fromCharCode(64 + editingTeamId)}`,
        logo: editLogo.trim() || String.fromCharCode(64 + editingTeamId),
        color: editColor,
        seat: editSeat.trim() || String.fromCharCode(64 + editingTeamId)
      });
      setEditingTeamId(null);
    }
  };

  const applyManualScore = (teamId: number) => {
    if (manualValue) {
      onAdjustScoreManual(teamId, manualValue);
      setManualAdjustmentId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" id="scoreboard_grid">
      {teams.map((team) => {
        const score = scores[team.id] || 0;
        const rank = getRank(team.id);
        const leader = isLeader(team.id);
        const isActive = activeTeamId === team.id;
        const isBuzzed = buzzedTeamId === team.id;
        const isEditing = editingTeamId === team.id;

        // Custom borders and shadows for active/buzzed states
        let cardStyle = "border-slate-700/50";
        let shadowStyle = "shadow-md shadow-slate-950/40";
        let ringStyle = "";

        if (isBuzzed) {
          cardStyle = "border-danger ring-4 ring-danger/30 animate-pulse";
          shadowStyle = "glow-danger shadow-2xl";
          ringStyle = "border-danger";
        } else if (isActive) {
          cardStyle = "border-gold ring-2 ring-gold/20";
          shadowStyle = "glow-gold shadow-2xl";
          ringStyle = "border-gold";
        }

        return (
          <div 
            key={team.id}
            className={`glass-card relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 transition-all duration-300 ${cardStyle} ${shadowStyle}`}
            id={`team_card_${team.id}`}
            style={{
              borderLeftWidth: '6px',
              borderLeftColor: team.color
            }}
          >
            {/* Crown / Rank Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              {leader && (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-gold border border-gold/30 shadow-lg shadow-gold/10" title="Current Leader">
                  <Crown size={15} className="fill-gold" />
                </span>
              )}
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold border ${
                rank === 1 && score > 0 ? "bg-success/15 text-success border-success/30" : 
                rank === 2 && score > 0 ? "bg-info/15 text-info border-info/30" : 
                "bg-slate-800 text-slate-400 border-white/5"
              }`}>
                {rank}
              </span>
            </div>

            {/* Editing / Card Content */}
            {isEditing ? (
              <div className="space-y-4 mb-4" id={`edit_panel_${team.id}`}>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Team Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded-lg border border-white/10 px-2 py-1 text-sm focus:border-gold outline-none"
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Initials</label>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={editLogo}
                      onChange={(e) => setEditLogo(e.target.value)}
                      className="w-full bg-slate-950 text-white text-center rounded-lg border border-white/10 px-2 py-1 text-sm focus:border-gold outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color Theme</label>
                    <div className="flex gap-1.5 items-center mt-1">
                      {['#D4AF37', '#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#A855F7'].map((c) => (
                        <button 
                          key={c}
                          type="button"
                          className="h-5 w-5 rounded-full border border-white/15"
                          style={{ backgroundColor: c, ring: editColor === c ? '2px #ffffff' : 'none' }}
                          onClick={() => setEditColor(c)}
                        />
                      ))}
                      <input 
                        type="color" 
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-6 w-6 rounded cursor-pointer bg-transparent border-none"
                      />
                    </div>
                  </div>
                  <div className="w-16">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Seat</label>
                    <input 
                      type="text" 
                      maxLength={1}
                      value={editSeat}
                      onChange={(e) => setEditSeat(e.target.value)}
                      className="w-full bg-slate-950 text-white text-center rounded-lg border border-white/10 px-2 py-1 text-sm focus:border-gold outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    onClick={() => setEditingTeamId(null)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveTeamEdit}
                    className="px-3 py-1 rounded-lg text-xs bg-gold text-slate-950 font-bold flex items-center gap-1 hover:bg-gold-hover transition"
                  >
                    <Check size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 mb-3" id={`display_team_info_${team.id}`}>
                {/* Team Icon Accent Circle */}
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-inner font-display text-lg font-black text-white relative transition-transform duration-300"
                  style={{ 
                    backgroundColor: team.color,
                    boxShadow: `0 0 15px ${team.color}40`
                  }}
                >
                  {team.logo || team.name.charAt(0)}
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-extrabold bg-slate-950 px-1.5 py-0.5 rounded-md border border-white/10 text-slate-300 uppercase">
                    SEAT {team.seat}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-bold text-white text-base max-w-[140px] truncate leading-tight">
                      {team.name}
                    </h3>
                    <button 
                      onClick={() => startEditing(team)}
                      className="text-slate-500 hover:text-gold hover:scale-105 transition duration-150"
                      title="Edit Team"
                      id={`edit_team_icon_${team.id}`}
                    >
                      <Edit3 size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    {isBuzzed ? "⚠️ LOCK BUZZER" : isActive ? "⚡ ACTIVE TURN" : "READY"}
                  </p>
                </div>
              </div>
            )}

            {/* Score Display (Large & Highly Legible) */}
            <div className="my-2 flex items-baseline justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Score
              </span>
              <div className="flex items-center gap-2">
                {/* Score change quick trigger adjustment */}
                <div className="flex flex-col gap-1 pr-1.5 border-r border-white/5 opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={() => onAdjustScoreManual(team.id, 10)}
                    className="text-[9px] font-bold bg-success/10 border border-success/30 px-1 py-0.25 rounded text-success hover:bg-success hover:text-white"
                  >
                    +10
                  </button>
                  <button 
                    onClick={() => onAdjustScoreManual(team.id, -10)}
                    className="text-[9px] font-bold bg-danger/10 border border-danger/30 px-1 py-0.25 rounded text-danger hover:bg-danger hover:text-white"
                  >
                    -10
                  </button>
                </div>

                <div 
                  className={`font-mono text-5xl font-extrabold transition-all duration-300 tracking-tight select-none ${
                    isBuzzed ? "text-danger animate-bounce" : 
                    isActive ? "text-gold glow-gold font-black" : 
                    score > 0 ? "text-info" : 
                    score < 0 ? "text-danger" : "text-white"
                  }`}
                  id={`team_score_num_${team.id}`}
                >
                  {score}
                </div>
              </div>
            </div>

            {/* Quick Manual Score Button */}
            <div className="flex items-center justify-between border-t border-slate-700/50 pt-2.5 mt-1.5">
              <span className="text-[10px] font-semibold text-slate-400">
                Quick Adjust
              </span>
              <div className="flex items-center gap-1.5">
                {manualAdjustmentId === team.id ? (
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700/50" id={`score_adjust_input_${team.id}`}>
                    <input 
                      type="number" 
                      step="10"
                      value={manualValue}
                      onChange={(e) => setManualValue(parseInt(e.target.value) || 0)}
                      className="w-14 bg-transparent text-center font-mono text-xs font-bold text-white focus:outline-none"
                    />
                    <button 
                      onClick={() => applyManualScore(team.id)}
                      className="h-5 w-5 bg-success text-slate-950 rounded flex items-center justify-center hover:bg-success/80 transition"
                      title="Apply adjustment"
                    >
                      <Check size={10} className="stroke-[3]" />
                    </button>
                    <button 
                      onClick={() => setManualAdjustmentId(null)}
                      className="h-5 w-5 bg-slate-800 text-slate-400 rounded flex items-center justify-center hover:text-white transition"
                      title="Cancel"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { setManualAdjustmentId(team.id); setManualValue(100); }}
                      className="rounded bg-slate-800 border border-slate-700/50 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:border-success/30 hover:text-success transition"
                      title="Add 100"
                    >
                      +100
                    </button>
                    <button 
                      onClick={() => { setManualAdjustmentId(team.id); setManualValue(-50); }}
                      className="rounded bg-slate-800 border border-slate-700/50 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:border-danger/30 hover:text-danger transition"
                      title="Subtract 50"
                    >
                      -50
                    </button>
                    <button 
                      onClick={() => { setManualAdjustmentId(team.id); setManualValue(50); }}
                      className="rounded bg-slate-800 border border-slate-700/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white transition"
                      title="Custom Manual Adjustment"
                    >
                      Adj
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Glowing Active Underline Accent */}
            {isActive && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
                style={{ filter: 'blur(1px)' }}
              ></div>
            )}
            {isBuzzed && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-danger to-transparent"
                style={{ filter: 'blur(1px)' }}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
