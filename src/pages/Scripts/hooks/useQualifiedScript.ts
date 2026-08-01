import { useMemo } from 'react';
import type { ParsedQualifiedData } from '../../../types';
import {
  sortByQualifiedDate,
  formatStars
} from '../utils/qualifiedScriptUtils';

export const QUALIFIED_TRANSITION_PHRASES = [
  "The first map of this batch will be",
  "Up next is",
  "Next up is",
  "The next map will be",
  "Up next is",
  "The next map is",
  "After that we have",
  "Following that is",
  "Following that we have",
  "And after that we have",
  "Next up is",
  "Up next is",
  "The next map is",
  "Next up is",
  "We also have",
  "Up next is",
  "Following that we have"
];

export const useQualifiedScript = (
  qualifiedMaps: ParsedQualifiedData[],
  _month?: string
) => {
  const uniqueMapsWithHighestStars = useMemo(() => {
    const sorted = sortByQualifiedDate(qualifiedMaps, true);
    const mapDict = new Map<string, ParsedQualifiedData>();

    for (const m of sorted) {
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
  }, [qualifiedMaps]);

  const mapsListParagraph = useMemo(() => {
    if (uniqueMapsWithHighestStars.length === 0) {
      return '';
    }

    const lines: string[] = [];
    let lastPhrase = '';
    const total = uniqueMapsWithHighestStars.length;

    for (let i = 0; i < total; i++) {
      const m = uniqueMapsWithHighestStars[i];
      let phrase: string;

      if (i === 0) {
        phrase = QUALIFIED_TRANSITION_PHRASES[0];
      } else if (i === total - 1 && total > 1) {
        phrase = "The last map of this batch will be";
      } else {
        const candidates = QUALIFIED_TRANSITION_PHRASES.filter(p => p !== lastPhrase);
        const randomIndex = Math.floor(Math.random() * candidates.length);
        phrase = candidates[randomIndex] || QUALIFIED_TRANSITION_PHRASES[1];
      }
      lastPhrase = phrase;

      const sentence = `${phrase} “${m.songName}” mapped by ${m.levelAuthorName} (${formatStars(m.stars)} stars).`;
      lines.push(sentence);
    }

    return lines.join('\n');
  }, [uniqueMapsWithHighestStars]);

  return {
    sortedQualifiedMaps: uniqueMapsWithHighestStars,
    mapsListParagraph,
    fullQualifiedScript: mapsListParagraph
  };
};
