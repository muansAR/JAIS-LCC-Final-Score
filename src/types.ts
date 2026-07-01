/**
 * LCC Pro Scoring System Types
 */

export type RoundType = 'ROUND_1' | 'ROUND_2' | 'ROUND_3' | 'TIE_BREAK';

export interface Team {
  id: number;
  name: string;
  color: string;
  logo: string; // Initials or emoji
  seat: string; // "A", "B", "C"
}

export interface QuestionStatus {
  number: number;
  status: 'pending' | 'correct' | 'wrong' | 'passed';
  scoreAwarded?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: string; // ISO string
  round: RoundType;
  questionNumber: number;
  teamId: number; // 0 for system/general, otherwise teamId
  teamName: string;
  scoreChange: number;
  reason: string;
  prevScores: Record<number, number>;
  newScores: Record<number, number>;
  details?: string;
}

export interface RoundState1 {
  activeTeamId: number;
  questions: Record<number, QuestionStatus[]>; // teamId -> 10 questions
  passBacklog: Record<number, number[]>; // teamId -> list of passed question numbers (1-indexed)
  isBacklogMode: Record<number, boolean>; // teamId -> whether answering passed questions
  currentBacklogIndex: Record<number, number>; // teamId -> index in backlog list
}

export interface RoundState2 {
  activeTeamId: number; // Team whose question is currently active
  isPassed: boolean; // Has it been passed to another team?
  passedTeamId: number | null; // Which team received the pass
  status: 'pending' | 'correct' | 'wrong' | 'passed_correct' | 'passed_wrong' | 'no_answer';
}

export interface RoundState3 {
  buzzedTeamId: number | null;
  buzzedTime: number | null; // DOMHighResTimeStamp
  isOpen: boolean; // Are buzzers open?
  isLocked: boolean; // Is buzzer locked on a team?
}

export interface TieBreakState {
  activeTeams: number[]; // Team IDs participating in tie break
  buzzedTeamId: number | null;
  buzzedTime: number | null;
  isOpen: boolean;
  isLocked: boolean;
}

export interface SoundSettings {
  isMuted: boolean;
  volume: number; // 0 to 1
}

export interface AppSettings {
  competitionName: string;
  eventName: string;
  operatorName: string;
  judgeNames: string[];
  timerDuration: number; // default 10s
  pointsCorrectR1: number; // default 100
  pointsWrongR1: number; // default -50
  pointsPassR1: number; // default 0
  pointsCorrectR2: number; // default 100
  pointsWrongR2: number; // default 0 (or custom)
  pointsPassedCorrectR2: number; // default 50
  pointsPassedWrongR2: number; // default -50
  pointsCorrectR3: number; // default 100
  pointsWrongR3: number; // default -100
  shortcuts: {
    timerStartPause: string;
    timerReset: string;
    correct: string;
    wrong: string;
    pass: string;
    undo: string;
    redo: string;
  };
}

export interface GameState {
  currentRound: RoundType;
  currentQuestionNumber: Record<RoundType, number>; // question number for each round
  scores: Record<number, number>; // teamId -> score
  teams: Team[];
  round1: RoundState1;
  round2: RoundState2;
  round3: RoundState3;
  tieBreak: TieBreakState;
  timerDuration: number;
  timeLeft: number;
  timerRunning: boolean;
  settings: AppSettings;
  history: HistoryItem[];
  historyIndex: number;
}

// Synced broadcast payload for Projector Display Screen
export interface DisplaySyncPayload {
  competitionName: string;
  eventName: string;
  currentRound: RoundType;
  currentQuestionNumber: number;
  teams: Team[];
  scores: Record<number, number>;
  timerDuration: number;
  timeLeft: number;
  timerRunning: boolean;
  buzzedTeamId: number | null;
  buzzerLocked: boolean;
  buzzerOpen: boolean;
  activeTeamId: number | null;
  roundStatusText: string;
  tieBreakTeams: number[];
  winnerTeamId: number | null; // For celebration confetti
  latestLog?: string;
  flashColor?: string; // and timing trigger
}
