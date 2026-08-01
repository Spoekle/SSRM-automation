import { useMemo } from 'react';
import type { ParsedReweightData } from '../../../types';
import {
  getDiffLabel,
  formatStars,
  isHighStar,
  isNotableChange
} from '../utils/reweightScriptUtils';

export interface Top3Maps {
  first?: ParsedReweightData;
  second?: ParsedReweightData;
  most?: ParsedReweightData;
}

export const useReweightScript = (
  reweightMaps: ParsedReweightData[],
  month: string
) => {
  const nerfedMaps = useMemo(() => {
    return [...reweightMaps]
      .filter(m => m.change < 0)
      .sort((a, b) => a.change - b.change);
  }, [reweightMaps]);

  const buffedMaps = useMemo(() => {
    return [...reweightMaps]
      .filter(m => m.change > 0)
      .sort((a, b) => b.change - a.change);
  }, [reweightMaps]);

  const top3Nerfs = useMemo<Top3Maps>(() => {
    return {
      first: nerfedMaps[2],
      second: nerfedMaps[1],
      most: nerfedMaps[0],
    };
  }, [nerfedMaps]);

  const top3Buffs = useMemo<Top3Maps>(() => {
    return {
      first: buffedMaps[2],
      second: buffedMaps[1],
      most: buffedMaps[0],
    };
  }, [buffedMaps]);

  const mentionedTop3DiffKeys = useMemo(() => {
    const keys = new Set<string>();
    [top3Nerfs.first, top3Nerfs.second, top3Nerfs.most, top3Buffs.first, top3Buffs.second, top3Buffs.most]
      .filter((m): m is ParsedReweightData => Boolean(m))
      .forEach(m => keys.add(`${m.songHash || m.songName}-${m.difficulty}`));
    return keys;
  }, [top3Nerfs, top3Buffs]);

  const highStarNerfs = useMemo(() => {
    return nerfedMaps
      .filter(m =>
        isHighStar(m) &&
        isNotableChange(m) &&
        !mentionedTop3DiffKeys.has(`${m.songHash || m.songName}-${m.difficulty}`)
      )
      .sort((a, b) => Math.abs(a.change) - Math.abs(b.change));
  }, [nerfedMaps, mentionedTop3DiffKeys]);

  const highStarBuffs = useMemo(() => {
    return buffedMaps
      .filter(m =>
        isHighStar(m) &&
        isNotableChange(m) &&
        !mentionedTop3DiffKeys.has(`${m.songHash || m.songName}-${m.difficulty}`)
      )
      .sort((a, b) => Math.abs(a.change) - Math.abs(b.change));
  }, [buffedMaps, mentionedTop3DiffKeys]);

  const paragraph1 = `There were also a good number of reweighted maps from the previous batch. We will not be going over each one, but instead only look at the most buffed and nerfed maps as well as some high star maps. All the exact reweight data can be found on the ScoreSaber wiki.`;

  const n1 = top3Nerfs.first;
  const n2 = top3Nerfs.second;
  const n3 = top3Nerfs.most;
  const paragraph2 = `The first of the three most nerfed maps is “${n1?.songName || '…'}” ${getDiffLabel(n1?.difficulty)} which got nerfed from ${formatStars(n1?.oldStars)} to ${formatStars(n1?.newStars)} stars.\n“${n2?.songName || '…'}” ${getDiffLabel(n2?.difficulty)} got nerfed from ${formatStars(n2?.oldStars)} to ${formatStars(n2?.newStars)} stars.\nLastly the most nerfed map is “${n3?.songName || '…'}” ${getDiffLabel(n3?.difficulty)} which got nerfed from ${formatStars(n3?.oldStars)} to ${formatStars(n3?.newStars)} stars.`;

  const b1 = top3Buffs.first;
  const b2 = top3Buffs.second;
  const b3 = top3Buffs.most;
  const isB3SameSong = Boolean(b3 && (b3.songName === b1?.songName || b3.songName === b2?.songName));
  const b3Text = isB3SameSong
    ? `again “${b3?.songName}” but this time it’s the ${getDiffLabel(b3?.difficulty)}`
    : `“${b3?.songName || '…'}” ${getDiffLabel(b3?.difficulty)}`;

  const isWholeBuff = b3 && b3.change >= 2.5 && Math.abs(b3.change - Math.round(b3.change)) < 0.1;
  const b3BuffDescription = isWholeBuff
    ? `which got buffed a whole ${Math.round(b3.change)} stars, going from ${formatStars(b3.oldStars)} to ${formatStars(b3.newStars)} stars.`
    : `which got buffed from ${formatStars(b3?.oldStars)} to ${formatStars(b3?.newStars)} stars.`;

  const paragraph3 = `The three maps with the biggest buffs are “${b1?.songName || '…'}” ${getDiffLabel(b1?.difficulty)} that got buffed from ${formatStars(b1?.oldStars)} to ${formatStars(b1?.newStars)} stars.\n“${b2?.songName || '…'}” ${getDiffLabel(b2?.difficulty)} got buffed from ${formatStars(b2?.oldStars)} to ${formatStars(b2?.newStars)} stars.\nLastly the most buffed map is ${b3Text} ${b3BuffDescription}`;

  const hn = highStarNerfs;
  const buildParagraph4 = () => {
    if (hn.length === 0) {
      return `Lastly we have some notable nerfs and buffs to high star maps.`;
    }
    if (hn.length === 1) {
      return `Lastly we have some notable nerfs and buffs to high star maps.\n\nThe first notable nerf is “${hn[0].songName}” ${getDiffLabel(hn[0].difficulty)} which got nerfed to ${formatStars(hn[0].newStars)} stars.`;
    }
    const firstMap = `The first notable nerf is “${hn[0].songName}” ${getDiffLabel(hn[0].difficulty)} which got nerfed to ${formatStars(hn[0].newStars)} stars.`;
    const middleMaps = hn.slice(1, hn.length - 1).map(m => `“${m.songName}” ${getDiffLabel(m.difficulty)} got nerfed to ${formatStars(m.newStars)} stars.`).join('\n');
    const lastMap = `And lastly, “${hn[hn.length - 1].songName}” ${getDiffLabel(hn[hn.length - 1].difficulty)} got nerfed to ${formatStars(hn[hn.length - 1].newStars)} stars.`;

    return `Lastly we have some notable nerfs and buffs to high star maps.\n\n${firstMap}${middleMaps ? `\n${middleMaps}` : ''}\n${lastMap}`;
  };
  const paragraph4 = buildParagraph4();

  const hb = highStarBuffs;
  const buildParagraph5 = () => {
    if (hb.length === 0) {
      return ``;
    }
    if (hb.length === 1) {
      return `The first notable buff for high stars is “${hb[0].songName}” ${getDiffLabel(hb[0].difficulty)} which got buffed to ${formatStars(hb[0].newStars)} stars.`;
    }

    const lines = [];
    lines.push(`The first notable buff for high stars is “${hb[0].songName}” ${getDiffLabel(hb[0].difficulty)} which got buffed to ${formatStars(hb[0].newStars)} stars.`);
    for (let i = 1; i < hb.length - 1; i++) {
      lines.push(`“${hb[i].songName}” ${getDiffLabel(hb[i].difficulty)} got buffed to ${formatStars(hb[i].newStars)} stars.`);
    }
    lines.push(`and lastly, “${hb[hb.length - 1].songName}” ${getDiffLabel(hb[hb.length - 1].difficulty)} got buffed to ${formatStars(hb[hb.length - 1].newStars)} stars.`);

    return lines.join('\n');
  };
  const paragraph5 = buildParagraph5();

  const paragraph6 = `This was it for the ScoreSaber ranked batch overview video for the ${month || 'May'} batch. We hope you enjoyed and any feedback for this video can be directly messaged to mr_bjo or yabje on discord! Thank you all for watching, good luck with playing all the new ranked maps and we’ll hope to see you all next month!`;

  const fullScript = [
    paragraph1,
    paragraph2,
    paragraph3,
    paragraph4,
    paragraph5,
    paragraph6
  ].filter(p => p.trim().length > 0).join('\n\n');

  return {
    nerfedMaps,
    buffedMaps,
    top3Nerfs,
    top3Buffs,
    highStarNerfs,
    highStarBuffs,
    fullScript,
    paragraphs: {
      paragraph1,
      paragraph2,
      paragraph3,
      paragraph4,
      paragraph5,
      paragraph6
    }
  };
};
