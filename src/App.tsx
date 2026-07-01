import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Settings, RotateCcw, Clock, ShieldCheck, 
  HelpCircle, ChevronRight, Play, AlertTriangle, ArrowRight, Printer, RefreshCcw
} from 'lucide-react';
import { 
  Team, HistoryItem, GameState, AppSettings, SoundSettings, RoundType, 
  QuestionStatus, DisplaySyncPayload 
} from './types';
import Navbar from './components/Navbar';
import Scoreboard from './components/Scoreboard';
import TimerSection from './components/TimerSection';
import Round1Panel from './components/Round1Panel';
import Round2Panel from './components/Round2Panel';
import Round3Panel from './components/Round3Panel';
import SuddenDeathPanel from './components/SuddenDeathPanel';
import HistoryPanel from './components/HistoryPanel';
import StatisticsPanel from './components/StatisticsPanel';
import SettingsModal from './components/SettingsModal';
import ProjectorDisplay from './components/ProjectorDisplay';
import soundEngine from './utils/soundEngine';
import { exportToExcelXML, exportScoreboardPNG } from './utils/exportHelper';

// Default initial settings
const DEFAULT_SETTINGS: AppSettings = {
  competitionName: "LCC PRO SCORING SYSTEM",
  eventName: "Islamic Quiz Competition Final",
  operatorName: "Operator Panel",
  judgeNames: ["Judge 1", "Judge 2", "Judge 3"],
  timerDuration: 10,
  pointsCorrectR1: 100,
  pointsWrongR1: -50,
  pointsPassR1: 0,
  pointsCorrectR2: 100,
  pointsWrongR2: 0,
  pointsPassedCorrectR2: 50,
  pointsPassedWrongR2: -50,
  pointsCorrectR3: 100,
  pointsWrongR3: -100,
  shortcuts: {
    timerStartPause: "Space",
    timerReset: "r",
    correct: "1",
    wrong: "2",
    pass: "3",
    undo: "z",
    redo: "y"
  }
};

// Initial teams
const DEFAULT_TEAMS: Team[] = [
  { id: 1, name: "Regu A", color: "#D4AF37", logo: "A", seat: "A" },
  { id: 2, name: "Regu B", color: "#3B82F6", logo: "B", seat: "B" },
  { id: 3, name: "Regu C", color: "#22C55E", logo: "C", seat: "C" }
];

// Initial default state
const INITIAL_STATE: GameState = {
  currentRound: 'ROUND_1',
  currentQuestionNumber: {
    ROUND_1: 1,
    ROUND_2: 1,
    ROUND_3: 1,
    TIE_BREAK: 1
  },
  scores: { 1: 0, 2: 0, 3: 0 },
  teams: DEFAULT_TEAMS,
  round1: {
    activeTeamId: 1,
    questions: {
      1: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, status: 'pending' })),
      2: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, status: 'pending' })),
      3: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, status: 'pending' }))
    },
    passBacklog: { 1: [], 2: [], 3: [] },
    isBacklogMode: { 1: false, 2: false, 3: false },
    currentBacklogIndex: { 1: 0, 2: 0, 3: 0 }
  },
  round2: {
    activeTeamId: 1,
    isPassed: false,
    passedTeamId: null,
    status: 'pending'
  },
  round3: {
    buzzedTeamId: null,
    buzzedTime: null,
    isOpen: false,
    isLocked: false
  },
  tieBreak: {
    activeTeams: [],
    buzzedTeamId: null,
    buzzedTime: null,
    isOpen: false,
    isLocked: false
  },
  timerDuration: 10,
  timeLeft: 10,
  timerRunning: false,
  settings: DEFAULT_SETTINGS,
  history: [],
  historyIndex: -1
};

export default function App() {
  const [isDisplayRoute, setIsDisplayRoute] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [sound, setSound] = useState<SoundSettings>({ isMuted: false, volume: 0.5 });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [celebrationWinner, setCelebrationWinner] = useState<number | null>(null);

  // References for timing loops
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  // 1. ROUTING DETECTION & RECOVERY
  useEffect(() => {
    const isDisplay = window.location.search.includes('display=true') || window.location.hash.includes('display');
    setIsDisplayRoute(isDisplay);

    if (!isDisplay) {
      // Check for saved localStorage session
      const saved = localStorage.getItem('lcc_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as GameState;
          setState(parsed);
          setShowSplash(false);
        } catch (e) {
          console.error("Error reading saved lcc state", e);
        }
      }
    }
  }, []);

  // 2. STATE AUTO-SAVE & LIVE SYNCHRONIZATION
  useEffect(() => {
    if (isDisplayRoute) return;

    // Auto-save to localStorage
    localStorage.setItem('lcc_state', JSON.stringify(state));

    // Send payload to projector display
    const syncChannel = new BroadcastChannel('lcc_sync');
    const payload: DisplaySyncPayload = {
      competitionName: state.settings.competitionName,
      eventName: state.settings.eventName,
      currentRound: state.currentRound,
      currentQuestionNumber: state.currentQuestionNumber[state.currentRound],
      teams: state.teams,
      scores: state.scores,
      timerDuration: state.timerDuration,
      timeLeft: state.timeLeft,
      timerRunning: state.timerRunning,
      buzzedTeamId: state.currentRound === 'TIE_BREAK' ? state.tieBreak.buzzedTeamId : state.round3.buzzedTeamId,
      buzzerLocked: state.currentRound === 'TIE_BREAK' ? state.tieBreak.isLocked : state.round3.isLocked,
      buzzerOpen: state.currentRound === 'TIE_BREAK' ? state.tieBreak.isOpen : state.round3.isOpen,
      activeTeamId: state.currentRound === 'ROUND_1' ? state.round1.activeTeamId : state.currentRound === 'ROUND_2' ? state.round2.activeTeamId : null,
      roundStatusText: getRoundStatusLabel(),
      tieBreakTeams: state.tieBreak.activeTeams,
      winnerTeamId: celebrationWinner,
      latestLog: state.history[state.historyIndex]?.reason || ""
    };
    syncChannel.postMessage(payload);

    // Setup initial sync handshake listener (if projector opens after operater)
    syncChannel.onmessage = (e) => {
      if (e.data && e.data.type === 'REQUEST_SYNC') {
        syncChannel.postMessage(payload);
      }
    };

    return () => {
      syncChannel.close();
    };
  }, [state, isDisplayRoute, celebrationWinner]);

  // 3. GAME TIMER LOGIC
  useEffect(() => {
    if (state.timerRunning) {
      timerRef.current = setInterval(() => {
        const currentSeconds = stateRef.current.timeLeft;
        if (currentSeconds > 1) {
          const nextSeconds = currentSeconds - 1;
          setState(prev => ({ ...prev, timeLeft: nextSeconds }));
          // Play tick or alert tick sounds
          soundEngine.playTick(nextSeconds <= 3);
        } else {
          // Timer reached 0!
          clearInterval(timerRef.current!);
          soundEngine.playWrong(); // Out of time alarm buzzer
          
          setState(prev => {
            const next = { ...prev, timeLeft: 0, timerRunning: false };
            
            // Log timeout to history
            const activeRound = prev.currentRound;
            const qNum = prev.currentQuestionNumber[activeRound];
            let details = "Time limit expired.";
            let teamId = 0;
            let teamName = "General";

            if (activeRound === 'ROUND_1') {
              teamId = prev.round1.activeTeamId;
              teamName = prev.teams.find(t => t.id === teamId)?.name || "";
              details = `${teamName} timed out on Mandatory Question ${qNum}.`;
              
              // Automatically record as "pass" to trigger the backlog
              const r1 = { ...next.round1 };
              const tQuestions = [...(r1.questions[teamId] || [])];
              
              if (r1.isBacklogMode[teamId]) {
                const bIdx = r1.currentBacklogIndex[teamId];
                const bQNum = r1.passBacklog[teamId][bIdx];
                tQuestions[bQNum - 1] = { number: bQNum, status: 'passed' };
                r1.currentBacklogIndex[teamId] = bIdx + 1;
                // If backlog completed, check for end of backlog
                if (r1.currentBacklogIndex[teamId] >= r1.passBacklog[teamId].length) {
                  r1.isBacklogMode[teamId] = false;
                }
              } else {
                tQuestions[qNum - 1] = { number: qNum, status: 'passed' };
                const backlog = [...(r1.passBacklog[teamId] || [])];
                backlog.push(qNum);
                r1.passBacklog[teamId] = backlog;
                
                if (qNum < 10) {
                  next.currentQuestionNumber.ROUND_1 = qNum + 1;
                } else if (backlog.length > 0) {
                  r1.isBacklogMode[teamId] = true;
                  r1.currentBacklogIndex[teamId] = 0;
                }
              }
              r1.questions[teamId] = tQuestions;
              next.round1 = r1;
            } else if (activeRound === 'ROUND_2') {
              teamId = prev.round2.activeTeamId;
              teamName = prev.teams.find(t => t.id === teamId)?.name || "";
              
              if (!prev.round2.isPassed) {
                // If the main owner team times out, automatically pass it
                const r2 = { ...next.round2, isPassed: true, status: 'wrong' as const };
                next.round2 = r2;
                details = `${teamName} timed out. Question is now passed to opponent teams.`;
              } else {
                // Opponent team timed out
                const recipientId = prev.round2.passedTeamId || 0;
                const r2Name = prev.teams.find(t => t.id === recipientId)?.name || "";
                const r2 = { ...next.round2, status: 'no_answer' as const };
                next.round2 = r2;
                details = `Passed team ${r2Name} timed out. 0 points awarded.`;
              }
            } else if (activeRound === 'ROUND_3') {
              const r3 = { ...next.round3, isOpen: false, isLocked: false, buzzedTeamId: null };
              next.round3 = r3;
              details = `No teams answered in time. Buzzers closed.`;
            } else if (activeRound === 'TIE_BREAK') {
              const tb = { ...next.tieBreak, isOpen: false, isLocked: false, buzzedTeamId: null };
              next.tieBreak = tb;
              details = `Sudden death timed out. Buzzers closed.`;
            }

            // Create log
            const logItem: HistoryItem = {
              id: `log_${Date.now()}`,
              timestamp: new Date().toISOString(),
              round: activeRound,
              questionNumber: qNum,
              teamId,
              teamName,
              scoreChange: 0,
              reason: `⏳ TIME OUT on Q${qNum}`,
              prevScores: prev.scores,
              newScores: prev.scores,
              details
            };

            const hist = prev.history.slice(0, prev.historyIndex + 1);
            hist.push(logItem);
            next.history = hist;
            next.historyIndex = hist.length - 1;

            return next;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.timerRunning, state.timeLeft]);

  // 4. KEYBOARD SHORTCUTS HOOK
  useEffect(() => {
    if (isDisplayRoute) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut triggers when operator is actively typing in inputs
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }

      const key = e.key.toLowerCase();
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl + Z (Undo)
      if (isCtrl && key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl + Y (Redo)
      if (isCtrl && key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Space (Start/Pause Timer)
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer();
        return;
      }

      // R (Reset Timer)
      if (key === 'r') {
        e.preventDefault();
        handleResetTimer();
        return;
      }

      // Numeric shortcuts: 1, 2, 3 (Scoring shortcuts for Round 1 & Round 2)
      if (stateRef.current.currentRound === 'ROUND_1') {
        if (key === '1') {
          e.preventDefault();
          handleRound1Score('correct');
        } else if (key === '2') {
          e.preventDefault();
          handleRound1Score('wrong');
        } else if (key === '3') {
          e.preventDefault();
          handleRound1Score('pass');
        }
      }

      // Buzzer keyboard triggers in Round 3 (Buzz / Rebutan) and Tie Break
      if (stateRef.current.currentRound === 'ROUND_3') {
        if (key === 'a') {
          e.preventDefault();
          handleBuzzerTrigger(1);
        } else if (key === 'l') {
          e.preventDefault();
          handleBuzzerTrigger(2);
        } else if (key === ';') {
          e.preventDefault();
          handleBuzzerTrigger(3);
        }
      }

      if (stateRef.current.currentRound === 'TIE_BREAK') {
        if (key === 'a' && stateRef.current.tieBreak.activeTeams.includes(1)) {
          e.preventDefault();
          handleSuddenDeathBuzzTrigger(1);
        } else if (key === 'l' && stateRef.current.tieBreak.activeTeams.includes(2)) {
          e.preventDefault();
          handleSuddenDeathBuzzTrigger(2);
        } else if (key === ';' && stateRef.current.tieBreak.activeTeams.includes(3)) {
          e.preventDefault();
          handleSuddenDeathBuzzTrigger(3);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDisplayRoute]);

  // If we are on the projector display page, bypass operator panel layout entirely
  if (isDisplayRoute) {
    return <ProjectorDisplay />;
  }

  // 5. CORE SCORE & UTILITY ACTIONS

  const getRoundStatusLabel = (): string => {
    const round = state.currentRound;
    const qNum = state.currentQuestionNumber[round];
    if (round === 'ROUND_1') {
      const activeTeam = state.teams.find(t => t.id === state.round1.activeTeamId);
      if (state.round1.isBacklogMode[state.round1.activeTeamId]) {
        return `Pass Backlog Queue for ${activeTeam?.name || ''}`;
      }
      return `Mandatory question for ${activeTeam?.name || ''} (${qNum} of 10)`;
    }
    if (round === 'ROUND_2') {
      const activeTeam = state.teams.find(t => t.id === state.round2.activeTeamId);
      if (state.round2.isPassed) {
        const passedTeam = state.teams.find(t => t.id === state.round2.passedTeamId);
        return `Pass to ${passedTeam?.name || 'opponent'} (Q${qNum})`;
      }
      return `Lemparan question for ${activeTeam?.name || ''} (Q${qNum})`;
    }
    if (round === 'ROUND_3') {
      return `Rebutan Buzz Question (Q${qNum})`;
    }
    return "Sudden Death Match Point";
  };

  const handleToggleTimer = () => {
    setState(prev => ({ ...prev, timerRunning: !prev.timerRunning }));
    soundEngine.playTick();
  };

  const handleResetTimer = () => {
    setState(prev => ({ 
      ...prev, 
      timeLeft: prev.timerDuration, 
      timerRunning: false 
    }));
    soundEngine.playTick(false);
  };

  const handleAdjustDuration = (change: number) => {
    setState(prev => {
      const nextDuration = Math.max(3, Math.min(60, prev.timerDuration + change));
      return { 
        ...prev, 
        timerDuration: nextDuration,
        timeLeft: nextDuration,
        timerRunning: false
      };
    });
  };

  const handleSetDuration = (secs: number) => {
    setState(prev => ({
      ...prev,
      timerDuration: secs,
      timeLeft: secs,
      timerRunning: false
    }));
    soundEngine.playTick(false);
  };

  // ROUND 1 CORE SCORING (Mandatory)
  const handleRound1Score = (actionType: 'correct' | 'wrong' | 'pass') => {
    const prev = stateRef.current;
    const teamId = prev.round1.activeTeamId;
    const qNum = prev.currentQuestionNumber.ROUND_1;
    const teamName = prev.teams.find(t => t.id === teamId)?.name || "";

    let pointsAwarded = 0;
    let statusLogged: 'correct' | 'wrong' | 'passed' = 'passed';
    let logReason = "";
    let logDetails = "";

    const r1 = { ...prev.round1 };
    const tQuestions = [...(r1.questions[teamId] || [])];
    const passList = [...(r1.passBacklog[teamId] || [])];

    if (r1.isBacklogMode[teamId]) {
      // BACKLOG ANSWERING MODE
      const bIdx = r1.currentBacklogIndex[teamId];
      const backlogQuestionNumber = r1.passBacklog[teamId][bIdx];

      if (actionType === 'correct') {
        pointsAwarded = prev.settings.pointsCorrectR1; // default 100
        statusLogged = 'correct';
        logReason = `✓ ${teamName} Correct on Return Q${backlogQuestionNumber}`;
        logDetails = `Awarded ${pointsAwarded} points during pass return queue.`;
        soundEngine.playCorrect();
      } else if (actionType === 'wrong') {
        pointsAwarded = prev.settings.pointsWrongR1; // default -50
        statusLogged = 'wrong';
        logReason = `✗ ${teamName} Wrong on Return Q${backlogQuestionNumber}`;
        logDetails = `Deducted ${Math.abs(pointsAwarded)} points during pass return queue.`;
        soundEngine.playWrong();
      } else {
        // Skip
        pointsAwarded = 0;
        statusLogged = 'passed'; // remain passed
        logReason = `⏭ ${teamName} Skipped Return Q${backlogQuestionNumber}`;
        logDetails = `Skipped return. 0 points awarded.`;
        soundEngine.playTick();
      }

      tQuestions[backlogQuestionNumber - 1] = { 
        number: backlogQuestionNumber, 
        status: statusLogged,
        scoreAwarded: pointsAwarded
      };

      r1.currentBacklogIndex[teamId] = bIdx + 1;
      
      // If index exceeds backlog list, we completed backlog!
      if (r1.currentBacklogIndex[teamId] >= passList.length) {
        r1.isBacklogMode[teamId] = false;
      }
    } else {
      // REGULAR WAJIB SEQUENCE 1-10
      if (actionType === 'correct') {
        pointsAwarded = prev.settings.pointsCorrectR1;
        statusLogged = 'correct';
        logReason = `✓ ${teamName} Correct on Mandatory Q${qNum}`;
        logDetails = `Awarded ${pointsAwarded} points.`;
        soundEngine.playCorrect();
      } else if (actionType === 'wrong') {
        pointsAwarded = prev.settings.pointsWrongR1;
        statusLogged = 'wrong';
        logReason = `✗ ${teamName} Wrong on Mandatory Q${qNum}`;
        logDetails = `Deducted ${Math.abs(pointsAwarded)} points.`;
        soundEngine.playWrong();
      } else {
        // Passed to backlog
        pointsAwarded = prev.settings.pointsPassR1;
        statusLogged = 'passed';
        logReason = `⏭ ${teamName} Passed Mandatory Q${qNum}`;
        logDetails = `Saved question to return backlog.`;
        passList.push(qNum);
        r1.passBacklog[teamId] = passList;
        soundEngine.playTick();
      }

      tQuestions[qNum - 1] = { 
        number: qNum, 
        status: statusLogged,
        scoreAwarded: pointsAwarded
      };

      // Progress regular question index
      if (qNum < 10) {
        prev.currentQuestionNumber.ROUND_1 = qNum + 1;
      } else {
        // We reached question 10. If we have any backlog questions, launch backlog mode!
        if (passList.length > 0) {
          r1.isBacklogMode[teamId] = true;
          r1.currentBacklogIndex[teamId] = 0;
          soundEngine.playBell();
        } else {
          // No backlog. Round is completed for this team.
          soundEngine.playBell();
        }
      }
    }

    r1.questions[teamId] = tQuestions;

    // Apply score change
    const newScores = { ...prev.scores };
    newScores[teamId] = (newScores[teamId] || 0) + pointsAwarded;

    const logItem: HistoryItem = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      round: 'ROUND_1',
      questionNumber: r1.isBacklogMode[teamId] ? r1.passBacklog[teamId][r1.currentBacklogIndex[teamId] - 1] : qNum,
      teamId,
      teamName,
      scoreChange: pointsAwarded,
      reason: logReason,
      prevScores: prev.scores,
      newScores,
      details: logDetails
    };

    const hist = prev.history.slice(0, prev.historyIndex + 1);
    hist.push(logItem);

    setState({
      ...prev,
      scores: newScores,
      round1: r1,
      history: hist,
      historyIndex: hist.length - 1,
      timeLeft: prev.timerDuration,
      timerRunning: false
    });
  };

  const handleSelectTeamR1 = (teamId: number) => {
    setState(prev => ({
      ...prev,
      round1: {
        ...prev.round1,
        activeTeamId: teamId
      },
      timeLeft: prev.timerDuration,
      timerRunning: false
    }));
    soundEngine.playTick();
  };

  // ROUND 2 CORE SCORING (Lemparan)
  const handleRound2MainResult = (result: 'correct' | 'wrong') => {
    const prev = stateRef.current;
    const teamId = prev.round2.activeTeamId;
    const qNum = prev.currentQuestionNumber.ROUND_2;
    const teamName = prev.teams.find(t => t.id === teamId)?.name || "";

    const r2 = { ...prev.round2 };

    if (result === 'correct') {
      const points = prev.settings.pointsCorrectR2; // 100
      const newScores = { ...prev.scores };
      newScores[teamId] = (newScores[teamId] || 0) + points;

      r2.status = 'correct';

      const logItem: HistoryItem = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        round: 'ROUND_2',
        questionNumber: qNum,
        teamId,
        teamName,
        scoreChange: points,
        reason: `✓ ${teamName} Correct on Lemparan Q${qNum}`,
        prevScores: prev.scores,
        newScores,
        details: `${teamName} answered their Lemparan question correctly. +100 awarded.`
      };

      const hist = prev.history.slice(0, prev.historyIndex + 1);
      hist.push(logItem);

      setState({
        ...prev,
        scores: newScores,
        round2: r2,
        history: hist,
        historyIndex: hist.length - 1,
        timerRunning: false
      });
      soundEngine.playCorrect();
    } else {
      // Main team got it wrong. Points are deducted or remain same.
      // Juklak standard says main team gets 0 penalty for being wrong, and it is passed!
      const points = prev.settings.pointsWrongR2; // 0
      const newScores = { ...prev.scores };
      newScores[teamId] = (newScores[teamId] || 0) + points;

      r2.isPassed = true;
      r2.status = 'wrong';

      const logItem: HistoryItem = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        round: 'ROUND_2',
        questionNumber: qNum,
        teamId,
        teamName,
        scoreChange: points,
        reason: `✗ ${teamName} Wrong on Lemparan Q${qNum}`,
        prevScores: prev.scores,
        newScores,
        details: `${teamName} got it wrong. Question is now open for pass to opponent teams.`
      };

      const hist = prev.history.slice(0, prev.historyIndex + 1);
      hist.push(logItem);

      setState({
        ...prev,
        scores: newScores,
        round2: r2,
        history: hist,
        historyIndex: hist.length - 1,
        timeLeft: prev.timerDuration, // Reload timer for the throw!
        timerRunning: false
      });
      soundEngine.playWrong();
    }
  };

  const handleRound2PassResult = (recipientTeamId: number, result: 'correct' | 'wrong' | 'no_answer') => {
    const prev = stateRef.current;
    const qNum = prev.currentQuestionNumber.ROUND_2;
    const recipientName = prev.teams.find(t => t.id === recipientTeamId)?.name || "";

    let points = 0;
    let logStatus: 'passed_correct' | 'passed_wrong' | 'no_answer' = 'no_answer';
    let reasonText = "";

    if (result === 'correct') {
      points = prev.settings.pointsPassedCorrectR2; // +50
      logStatus = 'passed_correct';
      reasonText = `↪ ${recipientName} Correct on Throw Q${qNum}`;
      soundEngine.playCorrect();
    } else if (result === 'wrong') {
      points = prev.settings.pointsPassedWrongR2; // -50
      logStatus = 'passed_wrong';
      reasonText = `↪ ${recipientName} Wrong on Throw Q${qNum}`;
      soundEngine.playWrong();
    } else {
      points = 0;
      logStatus = 'no_answer';
      reasonText = `↪ Passed Throw Q${qNum} Unanswered`;
      soundEngine.playTick();
    }

    const r2 = { 
      ...prev.round2, 
      passedTeamId: recipientTeamId,
      status: logStatus
    };

    const newScores = { ...prev.scores };
    newScores[recipientTeamId] = (newScores[recipientTeamId] || 0) + points;

    const logItem: HistoryItem = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      round: 'ROUND_2',
      questionNumber: qNum,
      teamId: recipientTeamId,
      teamName: recipientName,
      scoreChange: points,
      reason: reasonText,
      prevScores: prev.scores,
      newScores,
      details: `${recipientName} processed throw attempt with result: ${result}. Score adjusted by ${points} points.`
    };

    const hist = prev.history.slice(0, prev.historyIndex + 1);
    hist.push(logItem);

    setState({
      ...prev,
      scores: newScores,
      round2: r2,
      history: hist,
      historyIndex: hist.length - 1,
      timerRunning: false
    });
  };

  const handleSelectMainTeamR2 = (teamId: number) => {
    setState(prev => ({
      ...prev,
      round2: {
        ...prev.round2,
        activeTeamId: teamId
      }
    }));
    soundEngine.playTick();
  };

  const handleResetRound2State = () => {
    setState(prev => ({
      ...prev,
      round2: {
        ...prev.round2,
        isPassed: false,
        passedTeamId: null,
        status: 'pending'
      }
    }));
  };

  // ROUND 3 CORE SCORING (Buzz / Rebutan)
  const handleOpenBuzzers = () => {
    setState(prev => ({
      ...prev,
      round3: {
        ...prev.round3,
        isOpen: true,
        isLocked: false,
        buzzedTeamId: null
      }
    }));
    soundEngine.playBell();
  };

  const handleCloseBuzzers = () => {
    setState(prev => ({
      ...prev,
      round3: {
        ...prev.round3,
        isOpen: false
      }
    }));
    soundEngine.playTick();
  };

  const handleBuzzerTrigger = (teamId: number) => {
    const prev = stateRef.current;
    if (!prev.round3.isOpen || prev.round3.isLocked) return;

    // Lock on the first team!
    setState(p => ({
      ...p,
      round3: {
        ...p.round3,
        isLocked: true,
        buzzedTeamId: teamId,
        buzzedTime: performance.now()
      },
      timerRunning: false,
      timeLeft: p.timerDuration // Reload timer for answer countdown!
    }));
    soundEngine.playBuzz();
  };

  const handleBuzzResult = (result: 'correct' | 'wrong') => {
    const prev = stateRef.current;
    const teamId = prev.round3.buzzedTeamId;
    if (!teamId) return;

    const teamName = prev.teams.find(t => t.id === teamId)?.name || "";
    const qNum = prev.currentQuestionNumber.ROUND_3;

    let points = 0;
    let reasonText = "";
    
    if (result === 'correct') {
      points = prev.settings.pointsCorrectR3; // +100
      reasonText = `⚡ ${teamName} Correct on Buzz Q${qNum}`;
      soundEngine.playCorrect();
    } else {
      points = prev.settings.pointsWrongR3; // -100
      reasonText = `⚡ ${teamName} Wrong on Buzz Q${qNum}`;
      soundEngine.playWrong();
    }

    const newScores = { ...prev.scores };
    newScores[teamId] = (newScores[teamId] || 0) + points;

    const logItem: HistoryItem = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      round: 'ROUND_3',
      questionNumber: qNum,
      teamId,
      teamName,
      scoreChange: points,
      reason: reasonText,
      prevScores: prev.scores,
      newScores,
      details: `${teamName} locked the buzzer and was graded: ${result}.`
    };

    const hist = prev.history.slice(0, prev.historyIndex + 1);
    hist.push(logItem);

    // After a response, clear buzzer locks
    const r3 = {
      ...prev.round3,
      isLocked: false,
      buzzedTeamId: null,
      isOpen: false // Close gate after response
    };

    setState({
      ...prev,
      scores: newScores,
      round3: r3,
      history: hist,
      historyIndex: hist.length - 1,
      timeLeft: prev.timerDuration,
      timerRunning: false
    });
  };

  const handleResetBuzzers = () => {
    setState(prev => ({
      ...prev,
      round3: {
        ...prev.round3,
        isLocked: false,
        buzzedTeamId: null,
        isOpen: false
      }
    }));
    soundEngine.playTick();
  };

  // SUDDEN DEATH SUDDEN DEATH SCORING (Tie Breaker)
  const handleOpenSuddenDeathBuzzers = () => {
    setState(prev => ({
      ...prev,
      tieBreak: {
        ...prev.tieBreak,
        isOpen: true,
        isLocked: false,
        buzzedTeamId: null
      }
    }));
    soundEngine.playBell();
  };

  const handleSuddenDeathBuzzTrigger = (teamId: number) => {
    const prev = stateRef.current;
    if (!prev.tieBreak.isOpen || prev.tieBreak.isLocked) return;
    if (!prev.tieBreak.activeTeams.includes(teamId)) return; // disabled team

    setState(p => ({
      ...p,
      tieBreak: {
        ...p.tieBreak,
        isLocked: true,
        buzzedTeamId: teamId,
        buzzedTime: performance.now()
      },
      timerRunning: false,
      timeLeft: p.timerDuration
    }));
    soundEngine.playBuzz();
  };

  const handleSuddenDeathResult = (result: 'correct' | 'wrong') => {
    const prev = stateRef.current;
    const teamId = prev.tieBreak.buzzedTeamId;
    if (!teamId) return;

    const teamName = prev.teams.find(t => t.id === teamId)?.name || "";
    const qNum = prev.currentQuestionNumber.TIE_BREAK;

    let points = 0;
    let reasonText = "";
    
    if (result === 'correct') {
      points = 100; // instant win points
      reasonText = `🏆 ${teamName} Correct in Sudden Death!`;
      soundEngine.playWinner();
    } else {
      points = -100;
      reasonText = `✗ ${teamName} Wrong in Sudden Death`;
      soundEngine.playWrong();
    }

    const newScores = { ...prev.scores };
    newScores[teamId] = (newScores[teamId] || 0) + points;

    const logItem: HistoryItem = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      round: 'TIE_BREAK',
      questionNumber: qNum,
      teamId,
      teamName,
      scoreChange: points,
      reason: reasonText,
      prevScores: prev.scores,
      newScores,
      details: `Sudden Death tie breaker action graded: ${result}.`
    };

    const hist = prev.history.slice(0, prev.historyIndex + 1);
    hist.push(logItem);

    const tb = {
      ...prev.tieBreak,
      isLocked: false,
      buzzedTeamId: null,
      isOpen: false
    };

    // Evaluate if the tie is broken!
    let tieBroken = false;
    let winnerId = null;

    if (result === 'correct') {
      tieBroken = true;
      winnerId = teamId;
    }

    setState({
      ...prev,
      scores: newScores,
      tieBreak: tb,
      history: hist,
      historyIndex: hist.length - 1,
      timeLeft: prev.timerDuration,
      timerRunning: false
    });

    if (tieBroken && winnerId) {
      setCelebrationWinner(winnerId);
      soundEngine.playWinner();
    }
  };

  const handleResetSuddenDeathBuzzers = () => {
    setState(prev => ({
      ...prev,
      tieBreak: {
        ...prev.tieBreak,
        isLocked: false,
        buzzedTeamId: null,
        isOpen: false
      }
    }));
    soundEngine.playTick();
  };

  // GENERAL MANUAL UTILITIES
  const handleUpdateTeam = (updatedTeam: Team) => {
    setState(prev => {
      const ts = prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
      return { ...prev, teams: ts };
    });
    soundEngine.playTick();
  };

  const handleAdjustScoreManual = (teamId: number, adjustment: number) => {
    setState(prev => {
      const newScores = { ...prev.scores };
      newScores[teamId] = (newScores[teamId] || 0) + adjustment;

      const teamName = prev.teams.find(t => t.id === teamId)?.name || "";
      const qNum = prev.currentQuestionNumber[prev.currentRound];

      const logItem: HistoryItem = {
        id: `manual_${Date.now()}`,
        timestamp: new Date().toISOString(),
        round: prev.currentRound,
        questionNumber: qNum,
        teamId,
        teamName,
        scoreChange: adjustment,
        reason: `🔧 Manual Score Adjustment for ${teamName}`,
        prevScores: prev.scores,
        newScores,
        details: `Operator manually adjusted ${teamName}'s score by ${adjustment > 0 ? '+' : ''}${adjustment} points.`
      };

      const hist = prev.history.slice(0, prev.historyIndex + 1);
      hist.push(logItem);

      return {
        ...prev,
        scores: newScores,
        history: hist,
        historyIndex: hist.length - 1
      };
    });
    soundEngine.playBell();
  };

  // UNDO & REDO ENGINES
  const handleUndo = () => {
    const prev = stateRef.current;
    if (prev.historyIndex < 0) return;

    const targetIdx = prev.historyIndex - 1;
    const targetLog = targetIdx >= 0 ? prev.history[targetIdx] : null;

    // Restore scores and state to before this logged action
    const currentLog = prev.history[prev.historyIndex];
    const prevScores = currentLog.prevScores;

    setState(p => ({
      ...p,
      scores: prevScores,
      historyIndex: targetIdx,
      timeLeft: p.timerDuration,
      timerRunning: false
    }));
    soundEngine.playBell();
  };

  const handleRedo = () => {
    const prev = stateRef.current;
    if (prev.historyIndex >= prev.history.length - 1) return;

    const targetIdx = prev.historyIndex + 1;
    const targetLog = prev.history[targetIdx];
    const newScores = targetLog.newScores;

    setState(p => ({
      ...p,
      scores: newScores,
      historyIndex: targetIdx,
      timeLeft: p.timerDuration,
      timerRunning: false
    }));
    soundEngine.playBell();
  };

  const handleResetAllHistory = () => {
    setState({
      ...INITIAL_STATE,
      settings: state.settings,
      teams: state.teams
    });
    setCelebrationWinner(null);
    soundEngine.playWrong();
  };

  // CHECK AND TRIGGER SUDDEN DEATH
  const handleTriggerSuddenDeathCheck = () => {
    // Find tied scores
    const maxScore = Math.max(state.scores[1] || 0, state.scores[2] || 0, state.scores[3] || 0);
    const tiedTeamIds: number[] = [];
    
    [1, 2, 3].forEach(id => {
      if (state.scores[id] === maxScore) {
        tiedTeamIds.push(id);
      }
    });

    if (tiedTeamIds.length >= 2) {
      setState(prev => ({
        ...prev,
        currentRound: 'TIE_BREAK',
        tieBreak: {
          activeTeams: tiedTeamIds,
          buzzedTeamId: null,
          buzzedTime: null,
          isOpen: false,
          isLocked: false
        }
      }));
      soundEngine.playBell();
    } else {
      // Find winner
      const winId = [1, 2, 3].reduce((a, b) => (state.scores[a] || 0) > (state.scores[b] || 0) ? a : b);
      setCelebrationWinner(winId);
      soundEngine.playWinner();
    }
  };

  // 6. EXPORTING AND BACKUP HANDLERS
  const handleOpenProjectorWindow = () => {
    const url = window.location.origin + window.location.pathname + '?display=true';
    window.open(url, 'LCCProjector', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleExportExcel = () => {
    exportToExcelXML(state);
  };

  const handleExportPNG = () => {
    exportScoreboardPNG(state.teams, state.scores, state.settings.competitionName);
  };

  const handleBackupJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", `lcc_scoring_backup_${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const handleRestoreJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string) as GameState;
          if (parsed.teams && parsed.scores && parsed.currentRound) {
            setState(parsed);
            setShowSplash(false);
            soundEngine.playBell();
          } else {
            alert("Invalid backup file layout.");
          }
        } catch (err) {
          alert("Error parsing JSON file.");
        }
      };
    }
  };

  // PRINT NATIVE PDF EXPORT REPORT
  const handlePrintReport = () => {
    window.print();
  };

  // SPLASH SCREEN LAUNCHERS
  const startFreshMatch = () => {
    localStorage.removeItem('lcc_state');
    setState(INITIAL_STATE);
    setShowSplash(false);
    soundEngine.playBell();
  };

  const startDemoMatch = () => {
    const demoState = {
      ...INITIAL_STATE,
      scores: { 1: 300, 2: 250, 3: 300 }, // Pre-trigger a tie check at the end!
      history: [
        {
          id: "init_demo",
          timestamp: new Date().toISOString(),
          round: 'ROUND_1' as const,
          questionNumber: 1,
          teamId: 1,
          teamName: "Regu A",
          scoreChange: 300,
          reason: "⭐ Demo initialized with sample scores",
          prevScores: { 1: 0, 2: 0, 3: 0 },
          newScores: { 1: 300, 2: 250, 3: 300 }
        }
      ],
      historyIndex: 0
    };
    setState(demoState);
    setShowSplash(false);
    soundEngine.playBell();
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans relative antialiased select-none" id="lcc_operator_root">
      
      {/* Background visual texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,41,59,0.35)_0%,transparent_75%)] pointer-events-none"></div>

      {/* 1. INITIAL SPLASH / SETUP SCREEN OVERLAY */}
      {showSplash ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950" id="splash_screen">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04)_0%,transparent_75%)]"></div>
          
          <div className="relative max-w-xl w-full text-center space-y-8 animate-scale-up">
            
            {/* Visual Header Brand */}
            <div className="flex flex-col items-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gold to-yellow-600 shadow-2xl shadow-gold/20">
                <span className="text-4xl">🕌</span>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success border-4 border-slate-950">
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-success opacity-75"></span>
                </span>
              </div>
              <h1 className="font-display text-3xl font-black text-white uppercase tracking-tight mt-5">
                LCC Pro Scoring System
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest leading-none">
                Official Islamic Quiz Competition Scoring Suite
              </p>
            </div>

            {/* Selection Panels Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <button 
                onClick={startFreshMatch}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-900 border border-white/5 hover:border-gold/30 hover:scale-103 cursor-pointer transition-all duration-200 shadow-xl group"
                id="splash_new_match_btn"
              >
                <div className="h-10 w-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Play size={18} className="fill-current" />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-100">New Competition</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Wipes state and starts a fresh live match.</p>
              </button>

              <button 
                onClick={startDemoMatch}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-900 border border-white/5 hover:border-gold/30 hover:scale-103 cursor-pointer transition-all duration-200 shadow-xl group"
                id="splash_demo_match_btn"
              >
                <div className="h-10 w-10 rounded-xl bg-info/10 text-info flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Trophy size={18} />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-100">Load Demo Sandbox</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Loads sample scores to preview layout & ties.</p>
              </button>

              <label 
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-900 border border-white/5 hover:border-gold/30 hover:scale-103 cursor-pointer transition-all duration-200 shadow-xl group"
                id="splash_import_btn"
              >
                <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <RefreshCcw size={18} />
                </div>
                <h3 className="font-display text-sm font-bold text-slate-100">Import Saved File</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Upload a previous backup .json scorecard.</p>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleRestoreJson}
                  className="hidden" 
                />
              </label>

            </div>

            {/* General offline disclaimer */}
            <div className="text-center">
              <span className="inline-block rounded-full bg-slate-900 px-3.5 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">
                🔒 100% Client-Side Encryption • Works Completely Offline
              </span>
            </div>

          </div>
        </div>
      ) : (
        /* 2. OPERATOR BOARD INTERFACE ACTIVE */
        <>
          <Navbar 
            settings={state.settings}
            sound={sound}
            setSound={setSound}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProjector={handleOpenProjectorWindow}
            onExportExcel={handleExportExcel}
            onExportPNG={handleExportPNG}
            onBackupJson={handleBackupJson}
            onRestoreJson={handleRestoreJson}
            onPrintReport={handlePrintReport}
          />

          {/* MAIN COLUMN BODY WORKSPACE */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4.5 py-4 space-y-4 relative z-10 no-print" id="operator_workspace">
            
            {/* STAGE A: ACTIVE LIVE ROUND CONTROL TABS */}
            <div className="flex gap-2" id="round_navigation_tabs">
              {[
                { type: 'ROUND_1', label: 'Babak 1: Wajib' },
                { type: 'ROUND_2', label: 'Babak 2: Lemparan' },
                { type: 'ROUND_3', label: 'Babak 3: Rebutan' },
                { type: 'TIE_BREAK', label: 'Sudden Death' }
              ].map((tab) => {
                const isActive = state.currentRound === tab.type;
                return (
                  <button
                    key={tab.type}
                    onClick={() => {
                      setState(prev => ({ 
                        ...prev, 
                        currentRound: tab.type as RoundType,
                        timeLeft: prev.timerDuration,
                        timerRunning: false
                      }));
                      soundEngine.playTick();
                    }}
                    className={`flex-1 flex items-center justify-center h-9.5 rounded-lg text-[11px] font-bold tracking-wider border transition-all cursor-pointer ${
                      isActive 
                        ? "bg-slate-900 border-gold text-gold shadow-md shadow-gold/5" 
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                    id={`nav_tab_${tab.type}`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* STAGE B: TEAM SCOREBOARD */}
            <Scoreboard 
              teams={state.teams}
              scores={state.scores}
              activeTeamId={state.currentRound === 'ROUND_1' ? state.round1.activeTeamId : state.currentRound === 'ROUND_2' ? state.round2.activeTeamId : null}
              buzzedTeamId={state.currentRound === 'TIE_BREAK' ? state.tieBreak.buzzedTeamId : state.round3.buzzedTeamId}
              onUpdateTeam={handleUpdateTeam}
              onAdjustScoreManual={handleAdjustScoreManual}
            />

            {/* STAGE C: TWO COLUMN WORKSPACE (TIMER & PANEL vs UTILITIES) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="dashboard_split_rows">
              
              {/* LEFT & CENTER WORKSPACE (Takes 2 Columns) */}
              <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
                
                {/* Dynamically Swap Round Control Panels */}
                <div className="flex-1">
                  {state.currentRound === 'ROUND_1' && (
                    <Round1Panel 
                      teams={state.teams}
                      roundState={state.round1}
                      currentQuestionNumber={state.currentQuestionNumber.ROUND_1}
                      onScoreAction={handleRound1Score}
                      onSelectTeam={handleSelectTeamR1}
                    />
                  )}

                  {state.currentRound === 'ROUND_2' && (
                    <Round2Panel 
                      teams={state.teams}
                      roundState={state.round2}
                      currentQuestionNumber={state.currentQuestionNumber.ROUND_2}
                      onSetQuestionNumber={(num) => setState(prev => {
                        const next = { ...prev };
                        next.currentQuestionNumber.ROUND_2 = num;
                        return next;
                      })}
                      onMainTeamResult={handleRound2MainResult}
                      onPassTeamResult={handleRound2PassResult}
                      onSelectMainTeam={handleSelectMainTeamR2}
                      onResetRoundState={handleResetRound2State}
                    />
                  )}

                  {state.currentRound === 'ROUND_3' && (
                    <Round3Panel 
                      teams={state.teams}
                      roundState={state.round3}
                      currentQuestionNumber={state.currentQuestionNumber.ROUND_3}
                      onSetQuestionNumber={(num) => setState(prev => {
                        const next = { ...prev };
                        next.currentQuestionNumber.ROUND_3 = num;
                        return next;
                      })}
                      onOpenBuzzers={handleOpenBuzzers}
                      onCloseBuzzers={handleCloseBuzzers}
                      onTriggerBuzz={handleBuzzerTrigger}
                      onBuzzResult={handleBuzzResult}
                      onResetBuzzers={handleResetBuzzers}
                    />
                  )}

                  {state.currentRound === 'TIE_BREAK' && (
                    <SuddenDeathPanel 
                      teams={state.teams}
                      scores={state.scores}
                      tieBreakState={state.tieBreak}
                      onOpenSuddenDeathBuzzers={handleOpenSuddenDeathBuzzers}
                      onTriggerSuddenDeathBuzz={handleSuddenDeathBuzzTrigger}
                      onSuddenDeathResult={handleSuddenDeathResult}
                      onResetSuddenDeathBuzzers={handleResetSuddenDeathBuzzers}
                    />
                  )}
                </div>

                {/* Draw check trigger at end of Match */}
                {state.currentRound !== 'TIE_BREAK' && (
                  <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-xs font-bold text-slate-300 uppercase tracking-wide">Evaluate Winner standings</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Scrutinizes draw states and locks champion stand.</p>
                    </div>
                    <button 
                      onClick={handleTriggerSuddenDeathCheck}
                      className="rounded bg-slate-950 px-3.5 py-1.5 border border-slate-700/50 hover:border-gold/30 hover:text-gold text-slate-200 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                      id="nav_check_winner"
                    >
                      <span>Check Standing & Ties</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}

              </div>

              {/* RIGHT WORKSPACE COLUMN (Takes 1 Column) */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* 1. Count Down clock */}
                <TimerSection 
                  timeLeft={state.timeLeft}
                  duration={state.timerDuration}
                  isRunning={state.timerRunning}
                  onToggleTimer={handleToggleTimer}
                  onResetTimer={handleResetTimer}
                  onAdjustDuration={handleAdjustDuration}
                  onSetDuration={handleSetDuration}
                />

                {/* 2. Undo Redo History logger */}
                <HistoryPanel 
                  history={state.history}
                  historyIndex={state.historyIndex}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onResetAllHistory={handleResetAllHistory}
                />

              </div>

            </div>

            {/* STAGE D: INTERACTIVE SCORE STATISTICS */}
            <StatisticsPanel 
              teams={state.teams}
              scores={state.scores}
              history={state.history.slice(0, state.historyIndex + 1)}
            />

          </main>

          {/* OVERLAY: COMPETITION SYSTEM CONFIGURATION SETTINGS */}
          <SettingsModal 
            isOpen={showSettings}
            settings={state.settings}
            onClose={() => setShowSettings(false)}
            onSaveSettings={(sett) => setState(prev => ({ ...prev, settings: sett }))}
          />

          {/* MAIN FOOTER LOGO */}
          <footer className="w-full border-t border-slate-700/50 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest no-print">
            <span>🕌 LCC PRO Quiz scoring system • Built completely offline</span>
          </footer>
        </>
      )}

      {/* 3. HIDDEN NATIVE PRINT EVALUATION REPORT SHEET */}
      <div className="print-only print-container flex flex-col justify-between min-h-screen p-12 bg-white text-slate-900 font-sans" id="printable_official_certificate">
        
        {/* Certificate Header branding */}
        <div className="text-center border-b-4 border-double border-slate-900 pb-5">
          <span className="text-4xl">🕌</span>
          <h1 className="font-display text-2xl font-black text-slate-950 uppercase mt-2">
            LAPORAN RESMI HASIL LOMBA CERDAS CERMAT (LCC)
          </h1>
          <h2 className="font-display text-lg font-bold text-slate-800 uppercase mt-1">
            {state.settings.competitionName}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Event: {state.settings.eventName} | Operator: {state.settings.operatorName}
          </p>
        </div>

        {/* STANDINGS TABLE */}
        <div className="my-8">
          <h3 className="font-display text-sm font-bold text-slate-950 uppercase tracking-wide border-b-2 border-slate-900 pb-1 mb-4">
            Hasil Akhir Standings Evaluasi
          </h3>
          
          <table className="w-full text-left border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2.5 font-bold uppercase text-xs">Peringkat</th>
                <th className="border border-slate-300 p-2.5 font-bold uppercase text-xs">Nama Regu</th>
                <th className="border border-slate-300 p-2.5 font-bold uppercase text-xs">Posisi Kursi</th>
                <th className="border border-slate-300 p-2.5 font-bold uppercase text-xs text-right">Skor Akhir</th>
              </tr>
            </thead>
            <tbody>
              {[...state.teams].sort((a,b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0)).map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50 font-medium">
                  <td className="border border-slate-300 p-2.5">{idx + 1} {idx === 0 ? "🏆" : ""}</td>
                  <td className="border border-slate-300 p-2.5 font-bold">{t.name}</td>
                  <td className="border border-slate-300 p-2.5">Seat {t.seat}</td>
                  <td className="border border-slate-300 p-2.5 text-right font-mono font-bold text-lg text-slate-950">{state.scores[t.id] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DETAILED HISTORY TRANSCRIPT LOGS */}
        <div className="my-6 break-inside-avoid">
          <h3 className="font-display text-sm font-bold text-slate-950 uppercase tracking-wide border-b-2 border-slate-900 pb-1 mb-3">
            Histori Penilaian & Scoring Audit Trail
          </h3>
          <div className="space-y-1.5 text-xs font-medium">
            {state.history.slice(0, state.historyIndex + 1).map((item, idx) => (
              <div key={item.id} className="flex justify-between p-1.5 border-b border-slate-200">
                <span>
                  [{new Date(item.timestamp).toLocaleTimeString()}] Round {item.round.charAt(6) || 'SD'} Q{item.questionNumber}: {item.reason}
                </span>
                <span className="font-mono font-bold">{item.scoreChange > 0 ? '+' : ''}{item.scoreChange}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AUTHORIZATION SIGNATURE BLOCK */}
        <div className="grid grid-cols-3 gap-12 mt-16 text-center text-sm font-bold border-t border-slate-300 pt-12 break-inside-avoid">
          <div>
            <p className="text-slate-500 uppercase text-[10px] tracking-wider block mb-14">Dewan Hakim 1</p>
            <div className="border-b border-slate-900 mx-auto w-36"></div>
            <p className="text-slate-800 text-xs mt-1.5">({state.settings.judgeNames[0] || 'Judge 1'})</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase text-[10px] tracking-wider block mb-14">Dewan Hakim 2</p>
            <div className="border-b border-slate-900 mx-auto w-36"></div>
            <p className="text-slate-800 text-xs mt-1.5">({state.settings.judgeNames[1] || 'Judge 2'})</p>
          </div>
          <div>
            <p className="text-slate-500 uppercase text-[10px] tracking-wider block mb-14">Dewan Hakim 3</p>
            <div className="border-b border-slate-900 mx-auto w-36"></div>
            <p className="text-slate-800 text-xs mt-1.5">({state.settings.judgeNames[2] || 'Judge 3'})</p>
          </div>
        </div>

        {/* Certificate Footer Disclaimer */}
        <div className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-12">
          Laporan ini diterbitkan secara otomatis dan diotorisasi sepenuhnya oleh LCC Pro Scoring Gateway pada {new Date().toLocaleString()}.
        </div>

      </div>

    </div>
  );
}
