import type { ParsedReweightData } from '../../../types';

export const MIN_STARS = 11.5;
export const MIN_CHANGE = 0.05;

export const getDifficultyName = (diff: number): string => {
  switch (diff) {
    case 1: return 'Easy';
    case 3: return 'Normal';
    case 5: return 'Hard';
    case 7: return 'Expert';
    case 9: return 'Expert+';
    default: return 'Unknown';
  }
};

export const getDiffLabel = (diff?: number): string => {
  if (diff === undefined || diff === null) return 'diff';
  switch (diff) {
    case 1: return 'easy diff';
    case 3: return 'normal diff';
    case 5: return 'hard diff';
    case 7: return 'expert diff';
    case 9: return 'expert+ diff';
    default: return 'diff';
  }
};

export const formatStars = (stars?: number, precision: number = 2): string => {
  if (stars === undefined || stars === null) return '…';
  return Number(stars.toFixed(precision)).toString();
};

export const isHighStar = (m: ParsedReweightData): boolean =>
  m.oldStars >= MIN_STARS || m.newStars >= MIN_STARS;

export const isNotableChange = (m: ParsedReweightData): boolean =>
  Math.abs(m.change) >= MIN_CHANGE;

export const parseReweightJson = (json: any[]): ParsedReweightData[] => {
  return json
    .filter(map => {
      const oldStars = map.old_stars ?? map.oldStars;
      const newStars = map.new_stars ?? map.newStars;
      return oldStars !== undefined && newStars !== undefined && oldStars !== newStars;
    })
    .map(map => {
      const oldStars = map.old_stars ?? map.oldStars;
      const newStars = map.new_stars ?? map.newStars;
      const change = newStars - oldStars;
      const changeType: 'buff' | 'nerf' | 'same' = change > 0 ? 'buff' : change < 0 ? 'nerf' : 'same';
      const difficulty = map.difficulty ?? 0;

      return {
        songHash: map.songHash || '',
        songName: map.songName || 'Unknown Song',
        songSubName: map.songSubName || '',
        levelAuthorName: map.levelAuthorName || 'Unknown Author',
        difficulty,
        difficultyName: map.difficultyName || getDifficultyName(difficulty),
        oldStars,
        newStars,
        change,
        changeType,
        id: map.id,
        selected: false,
      };
    });
};
