import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Volume2, ShieldCheck, Timer } from 'lucide-react';
import { DisplaySyncPayload } from '../types';
import soundEngine from '../utils/soundEngine';

export default function ProjectorDisplay() {
  const [syncState, setSyncState] = useState<DisplaySyncPayload | null>(null);
  const [visualFlash, setVisualFlash] = useState<boolean>(false);

  useEffect(() => {
    // Create synchronization BroadcastChannel
    const channel = new BroadcastChannel('lcc_sync');

    // Listener for real-time messages from operator panel
    channel.onmessage = (event) => {
      const data = event.data as DisplaySyncPayload;
      if (data) {
        setSyncState(prev => {
          // Trigger visual flash if buzzer gets locked or state triggers it
          if (data.buzzedTeamId && prev?.buzzedTeamId !== data.buzzedTeamId) {
            setVisualFlash(true);
            soundEngine.playBuzz();
            setTimeout(() => setVisualFlash(false), 800);
          }
          // If timer changed to running, and seconds are in alarm range, handle tics
          if (data.timerRunning && data.timeLeft !== prev?.timeLeft && data.timeLeft > 0) {
            soundEngine.playTick(data.timeLeft <= 3);
          }
          // Sound alarm at 0
          if (data.timeLeft === 0 && prev?.timeLeft === 1) {
            soundEngine.playWrong();
          }
          return data;
        });
      }
    };

    // Request initial state handshake on load
    channel.postMessage({ type: 'REQUEST_SYNC' });

    return () => {
      channel.close();
    };
  }, []);

  if (!syncState) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col items-center justify-center p-8 select-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,0.3)_0%,transparent_80%)]"></div>
        <div className="relative flex flex-col items-center max-w-lg text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-3xl">🕌</span>
          </div>
          <h1 className="font-display text-2xl font-black text-gold tracking-tight uppercase">
            LCC Pro Projector Mode
          </h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            Awaiting active connection to the Operator Scoring Dashboard...
          </p>
          <div className="flex items-center gap-1.5 mt-3 rounded-full bg-slate-900 px-3.5 py-1.5 border border-white/5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning animate-ping"></span>
            <span className="text-[10px] font-bold text-warning tracking-widest uppercase">
              Offline Standby Active
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Destructure state
  const { 
    competitionName, eventName, currentRound, currentQuestionNumber, 
    teams, scores, timerDuration, timeLeft, timerRunning, 
    buzzedTeamId, buzzerLocked, activeTeamId, roundStatusText,
    tieBreakTeams, winnerTeamId, latestLog
  } = syncState;

  // Determine sorted standings for leaderboard medals
  const sortedStandings = [...teams]
    .map(t => ({ id: t.id, score: scores[t.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const getRankPosition = (teamId: number): number => {
    return sortedStandings.findIndex(item => item.id === teamId) + 1;
  };

  const isCurrentLeader = (teamId: number): boolean => {
    const leaderScore = sortedStandings[0].score;
    const teamScore = scores[teamId] || 0;
    if (teamScore === leaderScore) {
      return !sortedStandings.every(item => item.score === 0);
    }
    return false;
  };

  // Timer SVG math
  const radius = 90;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const timerProgress = timeLeft / timerDuration;
  const strokeDashoffset = circumference * (1 - timerProgress);

  const getTimerColors = () => {
    if (timeLeft <= 3) return { text: 'text-danger', stroke: 'stroke-danger', bg: 'bg-danger/5' };
    if (timeLeft <= timerDuration / 2) return { text: 'text-warning', stroke: 'stroke-warning', bg: 'bg-warning/5' };
    return { text: 'text-success', stroke: 'stroke-success', bg: 'bg-success/5' };
  };

  const timerColors = getTimerColors();

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-8 select-none flex flex-col justify-between overflow-hidden relative font-sans">
      
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.1)_0%,transparent_100%)] pointer-events-none"></div>

      {/* Visual flash effect for buzzer lock */}
      {visualFlash && buzzedTeamId && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none opacity-25 animate-buzzer-flash"
          style={{ backgroundColor: teams.find(t => t.id === buzzedTeamId)?.color || '#FFFFFF' }}
        ></div>
      )}

      {/* HEADER ROW */}
      <header className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-black tracking-tight text-gold uppercase neon-text-gold">
              {competitionName}
            </h1>
            <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/35 uppercase tracking-widest leading-none">
              Live Projection
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">
            {eventName}
          </p>
        </div>

        {/* Current Round Banner */}
        <div className="text-right">
          <div className="bg-slate-900 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse"></span>
            <span className="font-display text-sm font-bold tracking-wider text-slate-200 uppercase">
              {currentRound === 'ROUND_1' ? "Babak 1: Soal Wajib" :
               currentRound === 'ROUND_2' ? "Babak 2: Soal Lemparan" :
               currentRound === 'ROUND_3' ? "Babak 3: Soal Rebutan" : "Sudden Death Arena"}
            </span>
          </div>
        </div>
      </header>

      {/* BODY WORKSPACE GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8 my-auto relative z-10">
        
        {/* LEFT & CENTER: THREE TEAMS DISPLAYS (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col gap-6 justify-center">
          {teams.map((team) => {
            const score = scores[team.id] || 0;
            const rank = getRankPosition(team.id);
            const leader = isCurrentLeader(team.id);
            const isBuzzed = buzzedTeamId === team.id;
            const isAnswering = activeTeamId === team.id;

            // Conditional layout styles
            let cardStyle = "border-white/5 bg-slate-900/60";
            if (isBuzzed) {
              cardStyle = "border-danger ring-4 ring-danger/30 scale-102 bg-danger/10";
            } else if (isAnswering) {
              cardStyle = "border-gold ring-2 ring-gold/20 scale-101 bg-gold/5";
            }

            return (
              <div 
                key={team.id}
                className={`glass-card rounded-2xl border p-6 flex items-center justify-between transition-all duration-300 shadow-2xl relative overflow-hidden ${cardStyle}`}
                style={{
                  borderLeftWidth: '8px',
                  borderLeftColor: team.color
                }}
              >
                {/* Visual highlights for active statuses */}
                {isBuzzed && (
                  <div className="absolute inset-0 bg-danger/5 animate-pulse pointer-events-none"></div>
                )}
                
                <div className="flex items-center gap-6">
                  {/* Huge Circular Logo Badge */}
                  <div 
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white relative shadow-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.logo || team.seat}
                    <span className="absolute -bottom-1.5 -right-1.5 text-[9px] font-extrabold bg-slate-950 px-2 py-0.5 rounded border border-white/10 uppercase">
                      Seat {team.seat}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-2xl font-black text-white uppercase tracking-wide">
                      {team.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {leader && (
                        <span className="flex items-center gap-1 text-[10px] font-black bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded-md uppercase">
                          <Crown size={10} className="fill-gold" /> Leaders
                        </span>
                      )}
                      {isBuzzed && (
                        <span className="text-[10px] font-black bg-danger text-white px-2 py-0.5 rounded-md uppercase animate-bounce">
                          ⚡ BUZZ LOCK ⚡
                        </span>
                      )}
                      {isAnswering && !isBuzzed && (
                        <span className="text-[10px] font-black bg-gold text-slate-950 px-2 py-0.5 rounded-md uppercase animate-pulse">
                          ⚡ ACTIVE TURN ⚡
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Standing Rank #{rank}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Number Display (Huge) */}
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Score
                  </span>
                  <span 
                    className={`font-mono text-6xl font-black tracking-tighter transition-all duration-300 ${
                      isBuzzed ? 'text-danger scale-105' :
                      isAnswering ? 'text-gold' :
                      score > 0 ? 'text-info' : 'text-white'
                    }`}
                  >
                    {score}
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: BIG COUNTDOWN TIMER & STATUS (1 Column) */}
        <div className="lg:col-span-1 flex flex-col justify-between items-center bg-slate-900/40 rounded-2xl border border-white/10 p-6 shadow-2xl relative">
          
          <div className="text-center w-full">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 border border-white/5 mb-3">
              <Timer size={12} className="text-gold" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Question Dial
              </span>
            </div>
            
            <h4 className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest">
              {roundStatusText || `Question ${currentQuestionNumber}`}
            </h4>
          </div>

          {/* Huge SVG Ring Countdown */}
          <div className="relative my-8 flex h-52 w-52 items-center justify-center rounded-full">
            <div className={`absolute inset-4 rounded-full transition-all duration-500 ${timerColors.bg} ${timerRunning && timeLeft <= 3 ? 'animate-ping opacity-25' : ''}`}></div>

            <svg className="h-full w-full rotate-270" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} stroke="rgba(255, 255, 255, 0.03)" strokeWidth={strokeWidth} fill="transparent" />
              <circle 
                cx="100" 
                cy="100" 
                r={radius} 
                strokeWidth={strokeWidth} 
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-linear ${timerColors.stroke}`}
                style={{
                  transitionDuration: timerRunning ? '1000ms' : '200ms'
                }}
              />
            </svg>

            {/* Large Clock Center */}
            <div className="absolute flex flex-col items-center">
              <span className={`font-mono text-6xl font-black tracking-tighter transition-colors duration-300 ${timerColors.text}`}>
                {timeLeft}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                seconds remaining
              </span>
            </div>
          </div>

          {/* Live Action Banner */}
          <div className="w-full text-center">
            {latestLog ? (
              <div className="rounded-xl bg-slate-950/60 p-3 border border-white/5 animate-fade-in">
                <span className="text-[9px] font-bold text-gold uppercase tracking-widest block mb-0.5">LATEST LOG</span>
                <p className="text-xs font-semibold text-slate-200 truncate leading-snug">
                  {latestLog}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-950/20 p-3 border border-dashed border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  No actions logged
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* FOOTER TICKER */}
      <footer className="flex justify-between items-center border-t border-white/10 pt-4 relative z-10 mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <span>🕌 LCC PRO Quiz Scoreboard Gateway</span>
        <span>Muted & Program-Ready • Powered by HTML5 Offline Audio Engine</span>
        <span>© 2026 Competition Panel</span>
      </footer>

    </div>
  );
}
