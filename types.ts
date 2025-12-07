export interface HistoryItem {
  id: string;
  roundId: string;
  prediction: string;
  actual: string;
  isCrash: boolean; // Did we predict crash correctly or was the result a crash?
  timestamp: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  FLYING = 'FLYING',
  CRASHED = 'CRASHED',
}

export interface Prediction {
  type: 'MULTIPLIER' | 'CRASH';
  value: number; // Multiplier value or 0 for instant crash
  confidence: number;
}