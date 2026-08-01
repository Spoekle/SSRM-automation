/**
 * ScoreSaber API client
 * Handles star rating fetching from ScoreSaber via Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';
import log from '../utils/log';

export interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

interface ScoreSaberResponse {
  stars?: number;
  qualified?: boolean;
}

const DIFFICULTY_MAP = ['1', '3', '5', '7', '9'];
const RATING_KEYS: (keyof StarRatings)[] = ['ES', 'NOR', 'HARD', 'EX', 'EXP'];

/**
 * Fetch ScoreSaber data via Tauri command
 */
async function fetchScoreSaberData(hash: string, difficulty: string): Promise<ScoreSaberResponse | null> {
  try {
    const data = await invoke<ScoreSaberResponse>('fetch_scoresaber', { hash, difficulty });
    return data;
  } catch (error) {
    log.error(`Error fetching ScoreSaber data for ${hash}/${difficulty}:`, error);
    return null;
  }
}

/**
 * Get star ratings for all difficulties of a map by hash
 * Uses parallel requests for faster fetching
 */
export async function getStarRating(hash: string): Promise<StarRatings> {
  const ratings: StarRatings = {
    ES: '',
    NOR: '',
    HARD: '',
    EX: '',
    EXP: '',
  };

  // Fetch all difficulties in parallel for better performance
  await Promise.all(
    DIFFICULTY_MAP.map(async (diff, index) => {
      const data = await fetchScoreSaberData(hash, diff);
      const key = RATING_KEYS[index];

      if (data) {
        if (data.stars === 0) {
          ratings[key] = data.qualified ? 'Qualified' : 'Unranked';
        } else if (data.stars) {
          ratings[key] = data.stars.toString();
        }
      }
    })
  );

  return ratings;
}

/**
 * Get star rating for a specific difficulty
 */
export async function getStarRatingForDifficulty(
  hash: string,
  difficulty: keyof StarRatings
): Promise<string> {
  const diffIndex = RATING_KEYS.indexOf(difficulty);
  if (diffIndex === -1) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  const diff = DIFFICULTY_MAP[diffIndex];
  const data = await fetchScoreSaberData(hash, diff);

  if (data) {
    if (data.stars === 0) {
      return data.qualified ? 'Qualified' : 'Unranked';
    }
    return data.stars?.toString() || '';
  }
  return '';
}

/**
 * Fetch full ScoreSaber leaderboard info object for a hash and difficulty
 */
export async function fetchScoreSaberLeaderboardInfo(
  hash: string,
  difficulty: string | number
): Promise<any | null> {
  const diffStr = difficulty.toString();
  try {
    const data = await invoke<any>('fetch_scoresaber', { hash, difficulty: diffStr });
    if (data) return data;
  } catch {
    try {
      const response = await fetch(
        `https://scoresaber.com/api/leaderboard/by-hash/${hash}/info?difficulty=${diffStr}`
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      log.error(`Error fetching ScoreSaber leaderboard info for ${hash}/${diffStr}:`, e);
    }
  }
  return null;
}

/**
 * Fetch full ScoreSaber map object by hash (/api/v2/maps/hash/{hash})
 */
export async function fetchScoreSaberMapByHash(hash: string): Promise<any | null> {
  try {
    const data = await invoke<any>('fetch_scoresaber_map_by_hash', { hash });
    if (data) return data;
  } catch {
    try {
      const response = await fetch(`https://scoresaber.com/api/v2/maps/hash/${hash}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      log.error(`Error fetching ScoreSaber map for hash ${hash}:`, e);
    }
  }
  return null;
}

