import { useMemo } from 'react';
import type { ParsedQualifiedData, ParsedReweightData } from '../../../types';
import { useQualifiedScript } from './useQualifiedScript';
import { useReweightScript } from './useReweightScript';

export const useCombinedScript = (
  qualifiedMaps: ParsedQualifiedData[],
  reweightMaps: ParsedReweightData[],
  month: string
) => {
  const qualifiedResult = useQualifiedScript(qualifiedMaps, month);
  const reweightResult = useReweightScript(reweightMaps, month);

  const fullScript = useMemo(() => {
    const hasQualified = qualifiedResult.sortedQualifiedMaps.length > 0;
    const hasReweights = reweightMaps.length > 0;

    const parts: string[] = [];

    if (hasQualified) {
      parts.push(qualifiedResult.fullQualifiedScript);
    }

    if (hasReweights) {
      parts.push(reweightResult.paragraphs.paragraph1);
      parts.push(reweightResult.paragraphs.paragraph2);
      parts.push(reweightResult.paragraphs.paragraph3);
      if (reweightResult.paragraphs.paragraph4) {
        parts.push(reweightResult.paragraphs.paragraph4);
      }
      if (reweightResult.paragraphs.paragraph5) {
        parts.push(reweightResult.paragraphs.paragraph5);
      }
    }

    parts.push(reweightResult.paragraphs.paragraph6);

    return parts.filter(p => p.trim().length > 0).join('\n\n');
  }, [qualifiedResult, reweightResult, reweightMaps.length]);

  return {
    qualifiedResult,
    reweightResult,
    fullScript
  };
};
