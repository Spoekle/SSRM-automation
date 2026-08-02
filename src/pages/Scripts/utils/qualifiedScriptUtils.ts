import type { ParsedQualifiedData } from '../../../types';
import { fetchQualifiedLeaderboards } from '../../../api/scoresaber';
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

export const deduplicateMaps = (maps: ParsedQualifiedData[]): ParsedQualifiedData[] => {
  const mapDict = new Map<string, ParsedQualifiedData>();

  for (const m of sortByQualifiedDate(maps, true)) {
    const key = (m.songHash || m.songName).toUpperCase();
    const existing = mapDict.get(key);

    if (!existing) {
      mapDict.set(key, { ...m });
    } else {
      if (m.stars > existing.stars) {
        existing.stars = m.stars;
        existing.difficulty = m.difficulty;
        existing.difficultyName = m.difficultyName;
      }
      if (!existing.qualifiedDate && m.qualifiedDate) {
        existing.qualifiedDate = m.qualifiedDate;
      }
    }
  }

  return sortByQualifiedDate(Array.from(mapDict.values()), true);
};

export const parseScoreSaberQualifiedLeaderboards = (leaderboards: any[]): ParsedQualifiedData[] => {
  if (!Array.isArray(leaderboards)) return [];

  return leaderboards.map(item => {
    const diffNum = typeof item.difficulty === 'object' ? item.difficulty.difficulty : (item.difficulty ?? 0);
    const dateStr = item.qualifiedDate || item.createdDate || item.rankedDate;

    return {
      id: item.id,
      songHash: item.songHash || '',
      songName: item.songName || 'Unknown Song',
      songSubName: item.songSubName || '',
      levelAuthorName: item.levelAuthorName || 'Unknown Author',
      difficulty: diffNum,
      difficultyName: getDifficultyName(diffNum),
      stars: item.stars || 0,
      qualifiedDate: dateStr,
      selected: false,
    };
  });
};

export const fetchAllScoreSaberQualifiedMaps = async (
  onProgress?: (page: number, totalPages: number) => void
): Promise<ParsedQualifiedData[]> => {
  const allLeaderboards: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    if (onProgress) onProgress(page, totalPages);
    const data = await fetchQualifiedLeaderboards(page);

    if (!data || !Array.isArray(data.leaderboards) || data.leaderboards.length === 0) {
      break;
    }

    allLeaderboards.push(...data.leaderboards);

    if (data.metadata && data.metadata.total && data.metadata.itemsPerPage) {
      totalPages = Math.ceil(data.metadata.total / data.metadata.itemsPerPage);
    } else {
      break;
    }

    page++;
  }

  const parsed = parseScoreSaberQualifiedLeaderboards(allLeaderboards);
  return deduplicateMaps(parsed);
};

export const mergeStarsFromJson = (
  apiMaps: ParsedQualifiedData[],
  jsonMaps: ParsedQualifiedData[]
): ParsedQualifiedData[] => {
  if (!jsonMaps || jsonMaps.length === 0) return deduplicateMaps(apiMaps);

  const idStarsMap = new Map<number, number>();
  const hashDiffStarsMap = new Map<string, number>();

  for (const jm of jsonMaps) {
    if (jm.id) {
      idStarsMap.set(jm.id, jm.stars);
    }
    if (jm.songHash) {
      hashDiffStarsMap.set(`${jm.songHash.toUpperCase()}_${jm.difficulty}`, jm.stars);
    }
  }

  const merged = apiMaps.map(map => {
    let stars = map.stars;

    if (map.id && idStarsMap.has(map.id)) {
      stars = idStarsMap.get(map.id)!;
    } else if (map.songHash && hashDiffStarsMap.has(`${map.songHash.toUpperCase()}_${map.difficulty}`)) {
      stars = hashDiffStarsMap.get(`${map.songHash.toUpperCase()}_${map.difficulty}`)!;
    }

    return {
      ...map,
      stars,
    };
  });

  return deduplicateMaps(merged);
};
