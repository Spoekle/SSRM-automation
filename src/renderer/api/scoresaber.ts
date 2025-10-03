/**
 * ScoreSaber API client
 * Handles star rating fetching from ScoreSaber
 */

import axios from 'axios';
import log from 'electron-log';

const SCORESABER_PROXY = 'http://localhost:3000/api/scoresaber';

export interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

const DIFFICULTY_MAP = ['1', '3', '5', '7', '9'];
const RATING_KEYS: (keyof StarRatings)[] = ['ES', 'NOR', 'HARD', 'EX', 'EXP'];

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
      try {
        const { data } = await axios.get(`${SCORESABER_PROXY}/${hash}/${diff}`);
        const key = RATING_KEYS[index];
        
        if (data.stars === 0) {
          ratings[key] = data.qualified ? 'Qualified' : 'Unranked';
        } else {
          ratings[key] = data.stars.toString();
        }
      } catch (error) {
        log.error(`Error fetching star rating for difficulty ${diff}:`, error);
        // Continue with other difficulties even if one fails
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

  try {
    const diff = DIFFICULTY_MAP[diffIndex];
    const { data } = await axios.get(`${SCORESABER_PROXY}/${hash}/${diff}`);
    
    if (data.stars === 0) {
      return data.qualified ? 'Qualified' : 'Unranked';
    }
    return data.stars.toString();
  } catch (error) {
    log.error(`Error fetching star rating for difficulty ${difficulty}:`, error);
    return '';
  }
}
