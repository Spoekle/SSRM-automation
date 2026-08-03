import { useMemo } from 'react';
import type { ParsedQualifiedData } from '../../../types';
import {
  deduplicateMaps,
  formatStars
} from '../utils/qualifiedScriptUtils';

export const FIRST_MAP_PHRASE = "The first map of this batch will be";
export const LAST_MAP_PHRASE = "The last map of this batch will be";

export const INTERMEDIATE_TRANSITION_PHRASES = [
  "Up next is",
  "Next up is",
  "The next map will be",
  "The next map is",
  "After that we have",
  "Following that is",
  "Following that we have",
  "And after that we have",
  "We also have"
];

export const QUALIFIED_TRANSITION_PHRASES = [
  FIRST_MAP_PHRASE,
  ...INTERMEDIATE_TRANSITION_PHRASES
];

export const useQualifiedScript = (
  qualifiedMaps: ParsedQualifiedData[],
  _month?: string
) => {
  const uniqueMapsWithHighestStars = useMemo(() => {
    return deduplicateMaps(qualifiedMaps);
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
        phrase = FIRST_MAP_PHRASE;
      } else if (i === total - 1 && total > 1) {
        phrase = LAST_MAP_PHRASE;
      } else {
        const candidates = INTERMEDIATE_TRANSITION_PHRASES.filter(p => p !== lastPhrase);
        const randomIndex = Math.floor(Math.random() * candidates.length);
        phrase = candidates[randomIndex] || INTERMEDIATE_TRANSITION_PHRASES[0];
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
