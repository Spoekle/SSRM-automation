import React from 'react';
import type { ParsedReweightData, ParsedQualifiedData } from '../../../types';
import { CompactReweightMapItem } from './CompactReweightMapItem';
import { CompactQualifiedMapItem } from './CompactQualifiedMapItem';
import type { Top3Maps } from '../hooks/useReweightScript';

interface SelectedMapsBreakdownProps {
  qualifiedMaps?: ParsedQualifiedData[];
  top3Nerfs: Top3Maps;
  top3Buffs: Top3Maps;
  highStarNerfs: ParsedReweightData[];
  highStarBuffs: ParsedReweightData[];
}

export const SelectedMapsBreakdown: React.FC<SelectedMapsBreakdownProps> = ({
  qualifiedMaps = [],
  top3Nerfs,
  top3Buffs,
  highStarNerfs,
  highStarBuffs,
}) => {
  return (
    <div className="w-full space-y-4">
      {qualifiedMaps.length > 0 && (
        <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-3.5 rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50">
          <h3 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Qualified Maps ({qualifiedMaps.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {qualifiedMaps.map((map, idx) => (
              <CompactQualifiedMapItem key={map.id || `${map.songHash}-${map.difficulty}`} map={map} index={idx} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-3.5 rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50">
          <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2.5">
            Top 3 Most Nerfed
          </h3>
          <div className="space-y-1.5">
            {[
              { label: '3rd Nerfed', map: top3Nerfs.first },
              { label: '2nd Nerfed', map: top3Nerfs.second },
              { label: '1st Most Nerfed', map: top3Nerfs.most }
            ].map((item, idx) => (
              <React.Fragment key={idx}>
                <CompactReweightMapItem map={item.map} label={item.label} />
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-3.5 rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50">
          <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2.5">
            Top 3 Most Buffed
          </h3>
          <div className="space-y-1.5">
            {[
              { label: '3rd Buffed', map: top3Buffs.first },
              { label: '2nd Buffed', map: top3Buffs.second },
              { label: '1st Most Buffed', map: top3Buffs.most }
            ].map((item, idx) => (
              <React.Fragment key={idx}>
                <CompactReweightMapItem map={item.map} label={item.label} />
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-3.5 rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50">
          <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2.5">
            Notable Nerfs ({highStarNerfs.length})
          </h3>
          <div className="space-y-1.5">
            {highStarNerfs.length > 0 ? (
              highStarNerfs.map((map, idx) => (
                <React.Fragment key={idx}>
                  <CompactReweightMapItem map={map} label={`Nerf #${idx + 1}`} />
                </React.Fragment>
              ))
            ) : (
              <p className="text-[11px] text-neutral-400 italic">No notable high star nerfs.</p>
            )}
          </div>
        </div>

        <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-3.5 rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50">
          <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2.5">
            Notable Buffs ({highStarBuffs.length})
          </h3>
          <div className="space-y-1.5">
            {highStarBuffs.length > 0 ? (
              highStarBuffs.map((map, idx) => (
                <React.Fragment key={idx}>
                  <CompactReweightMapItem map={map} label={`Buff #${idx + 1}`} />
                </React.Fragment>
              ))
            ) : (
              <p className="text-[11px] text-neutral-400 italic">No notable high star buffs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
