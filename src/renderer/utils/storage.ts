/**
 * Centralized localStorage utility
 * Provides type-safe access to localStorage with consistent error handling
 */

export const STORAGE_KEYS = {
  MAP_ID: 'mapId',
  MAP_INFO: 'mapInfo',
  STAR_RATINGS: 'starRatings',
  OLD_STAR_RATINGS: 'oldStarRatings',
  CHOSEN_DIFF: 'chosenDiff',
  USE_SUBNAME: 'useSubname',
  USE_BACKGROUND: 'useBackground',
  THEME: 'theme',
  USE_DEV_BRANCH: 'useDevelopmentBranch',
  CARD_CONFIG: 'cardConfig',
  SKIP_UPDATE_CHECK: 'skipUpdateCheck',
  LATEST_STABLE_VERSION: 'latestStableVersion',
  LAST_USED_BRANCH: 'lastUsedBranch',
  FORCE_VERSION_CHECK: 'forceVersionCheck',
  QUALIFIED_MAPS_JSON: 'qualifiedMapsJson',
  REWEIGHT_MAPS_JSON: 'reweightMapsJson',
} as const;

export const storage = {
  /**
   * Get a value from localStorage and parse it as JSON
   */
  get: <T>(key: string, fallback?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback ?? null;
    } catch {
      return fallback ?? null;
    }
  },

  /**
   * Set a value in localStorage as JSON
   */
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
    }
  },

  /**
   * Get a string value from localStorage without JSON parsing
   */
  getString: (key: string, fallback?: string): string | null => {
    return localStorage.getItem(key) ?? fallback ?? null;
  },

  /**
   * Set a string value in localStorage without JSON stringifying
   */
  setString: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to save string to localStorage: ${key}`, error);
    }
  },

  /**
   * Remove a value from localStorage
   */
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  /**
   * Clear all localStorage
   */
  clear: (): void => {
    localStorage.clear();
  },

  /**
   * Check if a key exists in localStorage
   */
  has: (key: string): boolean => {
    return localStorage.getItem(key) !== null;
  },
};
