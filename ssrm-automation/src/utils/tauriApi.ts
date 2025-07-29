import { invoke } from '@tauri-apps/api/core';

export interface GitHubRelease {
  tag_name: string;
  prerelease: boolean;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
}

export interface StarRating {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

export interface MapMetadata {
  songAuthorName: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  duration: number;
  bpm: number;
}

export interface MapVersion {
  coverURL: string;
  hash: string;
}

export interface MapInfo {
  metadata: MapMetadata;
  id: string;
  versions: MapVersion[];
}

// API status checks
export const checkScoreSaber = async (): Promise<boolean> => {
  try {
    return await invoke<boolean>('check_scoresaber');
  } catch (error) {
    console.error('Failed to check ScoreSaber:', error);
    return false;
  }
};

export const checkBeatSaver = async (): Promise<boolean> => {
  try {
    return await invoke<boolean>('check_beatsaver');
  } catch (error) {
    console.error('Failed to check BeatSaver:', error);
    return false;
  }
};

export const checkFfmpeg = async (): Promise<boolean> => {
  try {
    return await invoke<boolean>('check_ffmpeg');
  } catch (error) {
    console.error('Failed to check FFmpeg:', error);
    return false;
  }
};

// Data fetching
export const getScoreSaberData = async (hash: string, difficulty: string): Promise<any> => {
  try {
    return await invoke('get_scoresaber_data', { hash, difficulty });
  } catch (error) {
    console.error('Failed to get ScoreSaber data:', error);
    throw error;
  }
};

export const getBeatSaverData = async (hash: string): Promise<any> => {
  try {
    return await invoke('get_beatsaver_data', { hash });
  } catch (error) {
    console.error('Failed to get BeatSaver data:', error);
    throw error;
  }
};

// Thumbnail generation
export const generateThumbnailFromVideo = async (filePath: string): Promise<string> => {
  try {
    return await invoke<string>('generate_thumbnail_from_video', { filePath });
  } catch (error) {
    console.error('Failed to generate thumbnail from video:', error);
    throw error;
  }
};

export const generateThumbnailFromImage = async (filePath: string): Promise<string> => {
  try {
    return await invoke<string>('generate_thumbnail_from_image', { filePath });
  } catch (error) {
    console.error('Failed to generate thumbnail from image:', error);
    throw error;
  }
};

// GitHub releases
export const getGitHubReleases = async (): Promise<GitHubRelease[]> => {
  try {
    return await invoke<GitHubRelease[]>('get_github_releases');
  } catch (error) {
    console.error('Failed to get GitHub releases:', error);
    throw error;
  }
};

// Card generation functions
export const generateCard = async (
  data: MapInfo,
  starRatings: StarRating,
  useBackground: boolean
): Promise<string> => {
  try {
    return await invoke<string>('generate_map_card', { 
      data, 
      starRatings, 
      useBackground 
    });
  } catch (error) {
    console.error('Failed to generate card:', error);
    throw error;
  }
};

export const generateReweightCard = async (
  data: MapInfo,
  oldStarRatings: StarRating,
  newStarRatings: StarRating,
  chosenDiff: string
): Promise<string> => {
  try {
    return await invoke<string>('generate_reweight_card', { 
      data, 
      oldStarRatings, 
      newStarRatings, 
      chosenDiff 
    });
  } catch (error) {
    console.error('Failed to generate reweight card:', error);
    throw error;
  }
};

export const generateThumbnail = async (
  data: MapInfo,
  chosenDiff: string,
  starRatings: StarRating,
  backgroundUrl: string
): Promise<string> => {
  try {
    return await invoke<string>('generate_map_thumbnail', { 
      data, 
      chosenDiff, 
      starRatings, 
      backgroundUrl 
    });
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw error;
  }
};

export const generateBatchThumbnail = async (
  data: MapInfo,
  chosenDiff: string,
  starRatings: StarRating,
  backgroundUrl: string
): Promise<string> => {
  try {
    return await invoke<string>('generate_batch_thumbnail', { 
      data, 
      chosenDiff, 
      starRatings, 
      backgroundUrl 
    });
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw error;
  }
};

export const generateCardFromConfig = async (
  config: any,
  data?: any,
  starRatings?: StarRating,
  useBackground?: boolean
): Promise<string> => {
  try {
    return await invoke<string>('generate_card_from_config', { 
      config, 
      data, 
      starRatings, 
      useBackground 
    });
  } catch (error) {
    console.error('Failed to generate card from config:', error);
    throw error;
  }
};

// Legacy proxy API functions (for backward compatibility)
export const proxyScoreSaber = async (hash: string, difficulty: string): Promise<any> => {
  return getScoreSaberData(hash, difficulty);
};

export const proxyBeatSaver = async (hash: string): Promise<any> => {
  return getBeatSaverData(hash);
};

// Helper function to fetch star ratings for all difficulties
export const getStarRatings = async (hash: string): Promise<StarRating> => {
  const difficulties = ['1', '3', '5', '7', '9']; // ES, NOR, HARD, EX, EXP
  const difficultyKeys: (keyof StarRating)[] = ['ES', 'NOR', 'HARD', 'EX', 'EXP'];
  const ratings: StarRating = { ES: '', NOR: '', HARD: '', EX: '', EXP: '' };

  for (let i = 0; i < difficulties.length; i++) {
    try {
      const data = await getScoreSaberData(hash, difficulties[i]);
      const key = difficultyKeys[i];
      
      if (data && typeof data === 'object') {
        // Check if stars property exists and is valid
        if ('stars' in data) {
          const stars = data.stars;
          if (stars === 0) {
            // Check if it's qualified
            ratings[key] = ('qualified' in data && data.qualified) ? 'Qualified' : 'Unranked';
          } else {
            ratings[key] = `${stars}`;
          }
        } else {
          ratings[key] = 'Unranked';
        }
      } else {
        ratings[key] = 'Unranked';
      }
    } catch (error) {
      console.error(`Error fetching star rating for difficulty ${difficulties[i]}:`, error);
      ratings[difficultyKeys[i]] = 'Unranked';
    }
  }

  return ratings;
};
