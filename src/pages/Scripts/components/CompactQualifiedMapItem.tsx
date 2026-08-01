import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import type { ParsedQualifiedData } from '../../../types';
import { formatDateShort } from '../utils/qualifiedScriptUtils';

interface CompactQualifiedMapItemProps {
  map?: ParsedQualifiedData;
  index?: number;
}

export const CompactQualifiedMapItem: React.FC<CompactQualifiedMapItemProps> = ({ map, index }) => {
  if (!map) return null;
  const dateFormatted = formatDateShort(map.qualifiedDate);

  return (
    <div className="p-2 rounded-lg border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 shadow-sm">
      <div className="min-w-0 flex-1">
        {index !== undefined && (
          <span className="text-[9px] font-bold uppercase tracking-wider block text-teal-600 dark:text-teal-400">
            #{index + 1} Qualified
          </span>
        )}
        <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
          {map.songName}
        </p>
        <div className="flex items-center text-[10px] text-neutral-500 dark:text-neutral-400 gap-1.5">
          <span className="truncate">{map.levelAuthorName}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1 text-[10px] text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200/60 dark:border-neutral-700/60">
          <FaCalendarAlt size={9} className="text-teal-500" />
          <span>{dateFormatted || 'No Date'}</span>
        </div>
      </div>
    </div>
  );
};
