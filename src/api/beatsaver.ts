/**
 * BeatSaver API client
 * Handles all interactions with the BeatSaver API
 */

import log from '../utils/log';

const BEATSAVER_API = 'https://api.beatsaver.com';

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
  }>;
}

class HttpError extends Error {
  status: number;
  response: { status: number };

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.response = { status };
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new HttpError(response.status, `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Fetch map data by map ID
 */
export async function fetchMapData(mapId: string): Promise<MapInfo> {
  try {
    const response = await fetch(`${BEATSAVER_API}/maps/id/${mapId}`);
    return await handleResponse<MapInfo>(response);
  } catch (error) {
    log.error(`Error fetching map data for ID ${mapId}:`, error);
    throw error;
  }
}

/**
 * Fetch map data by hash
 */
export async function fetchMapDataByHash(hash: string): Promise<MapInfo> {
  try {
    const response = await fetch(`${BEATSAVER_API}/maps/hash/${hash}`);
    return await handleResponse<MapInfo>(response);
  } catch (error) {
    log.error(`Error fetching map data for hash ${hash}:`, error);
    throw error;
  }
}

/**
 * Fetch map data by hash with retry logic for rate limiting
 */
export async function fetchMapDataByHashWithRetry(hash: string, maxRetries = 3): Promise<MapInfo> {
  let retries = 0;

  while (true) {
    try {
      const response = await fetch(`${BEATSAVER_API}/maps/hash/${hash}`);
      return await handleResponse<MapInfo>(response);
    } catch (error: any) {
      if (error.response && error.response.status === 429 && retries < maxRetries) {
        retries++;
        log.warn(`Rate limited, retrying in 2s... (attempt ${retries}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
}
