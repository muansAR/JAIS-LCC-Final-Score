import React from 'react';
import { BarChart3, TrendingUp, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { Team, HistoryItem } from '../types';

interface StatisticsPanelProps {
  teams: Team[];
  scores: Record<number, number>;
  history: HistoryItem[];
}

export default function StatisticsPanel({
  teams,
  scores,
  history
}: StatisticsPanelProps) {
  
  // Calculate analytics for each team
  const getTeamStats = (teamId: number) => {
    const teamLogs = history.filter(item => item.teamId === teamId);
    
    let correct = 0;
    let wrong = 0;
    let passed = 0;
    
    teamLogs.forEach(log => {
      if (log.scoreChange > 0) {
        correct++;
      } else if (log.scoreChange < 0) {
        wrong++;
      } else {
        // Simple pass if score change was zero and logged as a pass
        if (log.reason.toLowerCase().includes('pass') || log.reason.toLowerCase().includes('skip')) {
          passed++;
        }
      }
    });

    const totalAttempts = correct + wrong + passed;
    const accuracy = totalAttempts > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

    return { correct, wrong, passed, totalAttempts, accuracy };
  };

  // Generate Score Progression Data for the Line Graph
  // We want to map points chronologically: Match Start (0,0,0) -> Log 1 -> Log 2 -> etc.
  const getScoreProgressionData = () => {
    // Start with 0 score for all teams
    const progression: Record<number, number>[] = [];
    const currentRunningScores: Record<number, number> = {};
    teams.forEach(t => { currentRunningScores[t.id] = 0; });
    
    // Add starting point
    progression.push({ ...currentRunningScores });
    
    // Iterate through history to reconstruct step-by-step scores
    history.forEach(log => {
      if (log.teamId > 0) {
        currentRunningScores[log.teamId] = log.newScores[log.teamId] ?? 0;
      }
      progression.push({ ...currentRunningScores });
    });
    
    return progression;
  };

  const progressionData = getScoreProgressionData();
  const totalLogs = progressionData.length;

  // Render SVG Line Graph
  const renderLineChart = () => {
    if (totalLogs < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-950/20 border border-slate-700/50 rounded-xl p-3.5">
          <TrendingUp className="text-slate-600 h-8 w-8 mb-2" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Awaiting score changes...</p>
          <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest">Score progression line graph will render once actions are logged</p>
        </div>
      );
    }

    // Chart dimensions
    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min and max scores across the history for scaling
    let minScore = 0;
    let maxScore = 100; // default ceiling
    
    progressionData.forEach(step => {
      teams.forEach(t => {
        const s = step[t.id] ?? 0;
        if (s < minScore) minScore = s;
        if (s > maxScore) maxScore = s;
      });
    });

    // Add padding to scores range
    minScore = Math.floor(minScore / 50) * 50 - 50;
    maxScore = Math.ceil(maxScore / 100) * 100 + 50;
    const scoreRange = maxScore - minScore;

    // Coordinate mapping helpers
    const getX = (index: number) => paddingLeft + (index / (totalLogs - 1)) * chartWidth;
    const getY = (score: number) => paddingTop + chartHeight - ((score - minScore) / scoreRange) * chartHeight;

    return (
      <div className="w-full h-full relative" id="svg_progression_chart">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
            const sc = minScore + p * scoreRange;
            const y = getY(sc);
            return (
              <g key={idx}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="rgba(255,255,255,0.04)" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fill="#64748B" 
                  fontSize="8" 
                  fontFamily="monospace" 
                  textAnchor="end"
                >
                  {sc}
                </text>
              </g>
            );
          })}

          {/* Time ticks on X axis */}
          {progressionData.map((_, idx) => {
            if (idx === 0 || idx === totalLogs - 1 || (totalLogs > 5 && idx === Math.floor(totalLogs / 2))) {
              const x = getX(idx);
              return (
                <text
                  key={idx}
                  x={x}
                  y={height - 6}
                  fill="#64748B"
                  fontSize="8"
                  textAnchor="center"
                  className="font-display font-semibold"
                >
                  {idx === 0 ? "Start" : idx === totalLogs - 1 ? `Log ${idx}` : `Step ${idx}`}
                </text>
              );
            }
            return null;
          })}

          {/* Plotting team lines */}
          {teams.map(team => {
            const points = progressionData.map((step, idx) => {
              const score = step[team.id] ?? 0;
              return `${getX(idx)},${getY(score)}`;
            }).join(' ');

            return (
              <g key={team.id}>
                {/* Visual shadow glow behind line */}
                <polyline
                  fill="none"
                  stroke={team.color}
                  strokeWidth="4"
                  opacity="0.15"
                  points={points}
                />
                {/* Core line */}
                <polyline
                  fill="none"
                  stroke={team.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
                {/* Circular node for final point */}
                {totalLogs > 0 && (
                  <circle
                    cx={getX(totalLogs - 1)}
                    cy={getY(progressionData[totalLogs - 1][team.id] ?? 0)}
                    r="4"
                    fill={team.color}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="stats_panel_section">
      
      {/* SCORE PROGRESSION CHART (Takes 2 Columns) */}
      <div className="glass-card rounded-xl border border-slate-700/50 p-4 shadow-md lg:col-span-2 flex flex-col justify-between">
        <div className="flex items-center gap-1.5 border-b border-slate-700/50 pb-2.5 mb-3.5">
          <TrendingUp size={15} className="text-gold" />
          <h4 className="font-display text-xs font-bold text-slate-300 uppercase tracking-widest">
            Live Score Progression Graph
          </h4>
        </div>
        
        <div className="flex-1 min-h-[180px] flex items-center justify-center">
          {renderLineChart()}
        </div>

        {/* Legend */}
        {totalLogs >= 2 && (
          <div className="flex justify-center gap-4 mt-2 border-t border-slate-700/50 pt-2">
            {teams.map(t => (
              <div key={t.id} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }}></span>
                <span>{t.name}</span>
                <span className="font-mono text-slate-500">({scores[t.id] || 0})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TEAM EFFICIENCY AND ACCURACY CARDS (1 Column) */}
      <div className="glass-card rounded-xl border border-slate-700/50 p-4 shadow-md flex flex-col justify-between">
        <div className="flex items-center gap-1.5 border-b border-slate-700/50 pb-2.5 mb-3">
          <BarChart3 size={15} className="text-gold" />
          <h4 className="font-display text-xs font-bold text-slate-300 uppercase tracking-widest">
            Team Accuracy Statistics
          </h4>
        </div>

        <div className="space-y-3 flex-1 flex flex-col justify-center">
          {teams.map(team => {
            const stats = getTeamStats(team.id);
            
            return (
              <div key={team.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-950/20 border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-7.5 w-7.5 rounded-md flex items-center justify-center font-display text-xs font-black text-white"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.logo || team.seat}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white truncate max-w-[90px]">{team.name}</h5>
                    <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                      {stats.totalAttempts} total attempts
                    </p>
                  </div>
                </div>

                {/* Mini bar graph values / counters */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 text-[9px]">
                    <span className="text-success font-bold flex items-center" title="Correct">
                      <CheckCircle size={9} className="mr-0.5" /> {stats.correct}
                    </span>
                    <span className="text-danger font-bold flex items-center" title="Wrong">
                      <XCircle size={9} className="mr-0.5" /> {stats.wrong}
                    </span>
                  </div>

                  {/* Accuracy Ring circle */}
                  <div className="relative h-9 w-9 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="3"/>
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="14" 
                        fill="transparent" 
                        stroke={team.color} 
                        strokeWidth="3"
                        strokeDasharray="88"
                        strokeDashoffset={88 - (88 * stats.accuracy) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-[8px] font-mono font-black text-white">
                      {stats.accuracy}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
