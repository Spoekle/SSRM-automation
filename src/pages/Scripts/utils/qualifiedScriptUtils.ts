import type { ParsedQualifiedData } from '../../../types';
import { fetchScoreSaberMapByHash } from '../../../api/scoresaber';
import { getDifficultyName, getDiffLabel, formatStars } from './reweightScriptUtils';

export { getDifficultyName, getDiffLabel, formatStars };

export const parseQualifiedJson = (json: any[]): ParsedQualifiedData[] => {
  if (!Array.isArray(json)) return [];

  return json
    .filter(map => map && (map.songHash || map.songName))
    .map(map => {
      const difficulty = map.difficulty ?? 0;
      const stars = map.stars ?? 0;
      const qualifiedDate = map.qualifiedDate || map.dateQualified || map.createdDate || undefined;

      return {
        id: map.id,
        songHash: map.songHash || '',
        songName: map.songName || 'Unknown Song',
        songSubName: map.songSubName || '',
        levelAuthorName: map.levelAuthorName || 'Unknown Author',
        difficulty,
        difficultyName: map.difficultyName || getDifficultyName(difficulty),
        stars,
        qualifiedDate,
        selected: false,
      };
    });
};

export const formatDateShort = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${monthName} ${day}`;
  } catch {
    return '';
  }
};

export const sortByQualifiedDate = (
  maps: ParsedQualifiedData[],
  ascending: boolean = true
): ParsedQualifiedData[] => {
  return [...maps].sort((a, b) => {
    const timeA = a.qualifiedDate ? new Date(a.qualifiedDate).getTime() : 0;
    const timeB = b.qualifiedDate ? new Date(b.qualifiedDate).getTime() : 0;

    if (timeA !== timeB) {
      return ascending ? timeA - timeB : timeB - timeA;
    }
    return a.songName.localeCompare(b.songName);
  });
};

const extractQualifiedDateFromMapData = (mapData: any, targetDifficulty?: number): string | undefined => {
  if (!mapData) return undefined;

  const leaderboards = Array.isArray(mapData.leaderboards) ? mapData.leaderboards : [];

  let targetLb = leaderboards.find((lb: any) => lb.difficulty === targetDifficulty);

  if (!targetLb) {
    targetLb = leaderboards[0];
  }

  if (targetLb) {
    const dateStr =
      targetLb.realm?.qualifiedAt ||
      targetLb.qualifiedAt ||
      targetLb.realm?.rankedAt ||
      targetLb.rankedAt ||
      targetLb.createdAt;
    if (dateStr) return dateStr;
  }

  for (const lb of leaderboards) {
    const d = lb.realm?.qualifiedAt || lb.qualifiedAt || lb.realm?.rankedAt || lb.rankedAt;
    if (d) return d;
  }

  return mapData.createdAt || undefined;
};

export const fetchQualifiedDatesFromScoreSaber = async (
  maps: ParsedQualifiedData[],
  onProgress?: (current: number, total: number) => void
): Promise<ParsedQualifiedData[]> => {
  const mapDataCache = new Map<string, any>();
  const updatedMaps: ParsedQualifiedData[] = [];
  const total = maps.length;

  for (let i = 0; i < maps.length; i++) {
    const map = maps[i];
    if (onProgress) {
      onProgress(i + 1, total);
    }

    const hash = map.songHash?.trim().toUpperCase();

    if (hash) {
      try {
        let mapData = mapDataCache.get(hash);
        if (!mapData) {
          mapData = await fetchScoreSaberMapByHash(hash);
          if (mapData) {
            mapDataCache.set(hash, mapData);
          }
        }

        if (mapData) {
          const dateStr = extractQualifiedDateFromMapData(mapData, map.difficulty);
          updatedMaps.push({
            ...map,
            qualifiedDate: dateStr || map.qualifiedDate,
          });
          continue;
        }
      } catch (e) {
        console.error(`Failed to fetch ScoreSaber map data for hash ${hash} (${map.songName}):`, e);
      }
    }

    updatedMaps.push(map);
  }

  return sortByQualifiedDate(updatedMaps, true);
};
