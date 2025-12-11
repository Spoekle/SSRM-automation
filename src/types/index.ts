/**
 * Shared TypeScript types and interfaces
 */

// Star Ratings
export interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

export type Difficulty = keyof StarRatings;
export type DifficultyNumber = 1 | 3 | 5 | 7 | 9;

export const DIFFICULTY_MAP: Record<Difficulty, DifficultyNumber> = {
  ES: 1,
  NOR: 3,
  HARD: 5,
  EX: 7,
  EXP: 9,
};

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  ES: 'Easy',
  NOR: 'Normal',
  HARD: 'Hard',
  EX: 'Expert',
  EXP: 'Expert+',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  ES: 'bg-green-500',
  NOR: 'bg-blue-500',
  HARD: 'bg-orange-500',
  EX: 'bg-red-500',
  EXP: 'bg-purple-500',
};

// Map Info
export interface MapInfo {
  id: string;
  name: string;
  metadata: {
    songAuthorName: string;
    songName: string;
    songSubName: string;
    levelAuthorName: string;
    duration: number;
    bpm: number;
  };
  versions: Array<{
    coverURL: string;
    hash: string;
    previewURL?: string;
  }>;
}

// Qualified JSON structures
export interface QualifiedJson {
  id: number;
  songHash: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  difficulty: number;
  stars: number;
}

export interface ReweightJson {
  id: number;
  songHash: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  difficulty: number;
  old_stars: number;
  new_stars: number;
}

// Alert types
export type AlertType = 'success' | 'error' | 'alert' | 'info';

// Create Alert function type
export type CreateAlertFunction = (message: string, type: AlertType) => void;

// Progress function type
export type ProgressFunction = (process: string, progress: number, visible: boolean) => void;
