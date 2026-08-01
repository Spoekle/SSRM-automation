import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import type { ParsedReweightData } from '../../../types';
import { formatStars } from '../utils/reweightScriptUtils';

interface CompactReweightMapItemProps {
  map?: ParsedReweightData;
  label?: string;
}

export const CompactReweightMapItem: React.FC<CompactReweightMapItemProps> = ({ map, label }) => {
  if (!map) return null;
  const change = map.newStars - map.oldStars;

  return (
    <div className="p-2 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 shadow-sm">
      <div className="min-w-0 flex-1">
        {label && (
          <span className={`text-[9px] font-bold uppercase tracking-wider block ${change < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {label}
          </span>
        )}
        <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {map.songName}
        </p>
        <div className="flex items-center text-[10px] text-neutral-500 dark:text-neutral-400 gap-1.5">
          <span className="truncate">{map.levelAuthorName}</span>
          <span>•</span>
          <span className="font-medium text-neutral-600 dark:text-neutral-300">{map.difficultyName}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="px-1.5 py-0.5 text-[10px] font-mono text-white rounded bg-neutral-700 shadow-sm whitespace-nowrap">
          {formatStars(map.oldStars)} → {formatStars(map.newStars)}
        </div>
        <div className={`text-[11px] font-bold flex items-center gap-0.5 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
          {change > 0 ? '+' : ''}{change.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
