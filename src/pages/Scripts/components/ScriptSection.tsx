import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUpload,
  FaCopy,
  FaTrash,
  FaRedo,
  FaList,
  FaFileAlt,
  FaSyncAlt,
  FaScroll
} from 'react-icons/fa';
import { storage, STORAGE_KEYS } from '../../../utils/storage';
import { useNotifications } from '../../../contexts/NotificationContext';
import log from '../../../utils/log';
import type { ParsedReweightData, ParsedQualifiedData } from '../../../types';
import { parseReweightJson } from '../utils/reweightScriptUtils';
import {
  parseQualifiedJson,
  fetchAllScoreSaberQualifiedMaps,
  mergeStarsFromJson,
  deduplicateMaps
} from '../utils/qualifiedScriptUtils';
import { useCombinedScript } from '../hooks/useCombinedScript';
import { SelectedMapsBreakdown } from './SelectedMapsBreakdown';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ScriptSectionProps {
  fadeIn: any;
}

export const ScriptSection: React.FC<ScriptSectionProps> = ({ fadeIn }) => {
  const { createAlert } = useNotifications();

  const [qualifiedMaps, setQualifiedMaps] = useState<ParsedQualifiedData[]>([]);
  const [rawApiQualifiedMaps, setRawApiQualifiedMaps] = useState<ParsedQualifiedData[]>([]);
  const [jsonStarData, setJsonStarData] = useState<ParsedQualifiedData[]>([]);
  const [reweightMaps, setReweightMaps] = useState<ParsedReweightData[]>([]);
  const [month, setMonth] = useState<string>(() =>
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [activeTab, setActiveTab] = useState<'full' | 'qualified' | 'reweight' | 'maps'>('full');
  const [isFetchingMaps, setIsFetchingMaps] = useState<boolean>(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    const savedQualified = storage.get<ParsedQualifiedData[]>(STORAGE_KEYS.QUALIFIED_MAPS_JSON);
    if (savedQualified && Array.isArray(savedQualified) && savedQualified.length > 0) {
      setQualifiedMaps(savedQualified);
      setJsonStarData(savedQualified);
    }

    const savedReweights = storage.get<ParsedReweightData[]>(STORAGE_KEYS.REWEIGHT_MAPS_JSON);
    if (savedReweights && Array.isArray(savedReweights) && savedReweights.length > 0) {
      setReweightMaps(savedReweights);
    }
  };

  const fetchScoreSaberMaps = async () => {
    setIsFetchingMaps(true);

    try {
      const apiMaps = await fetchAllScoreSaberQualifiedMaps();

      setRawApiQualifiedMaps(apiMaps);
      const merged = mergeStarsFromJson(apiMaps, jsonStarData);
      setQualifiedMaps(merged);
      storage.set(STORAGE_KEYS.QUALIFIED_MAPS_JSON, merged);
      createAlert(`Fetched ${merged.length} qualified maps from ScoreSaber API!`, 'success');
    } catch (e) {
      log.error('Error fetching qualified maps from ScoreSaber', e);
      createAlert('Failed to fetch qualified maps from ScoreSaber API', 'error');
    } finally {
      setIsFetchingMaps(false);
    }
  };

  const handleQualifiedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = parseQualifiedJson(json);

      if (parsed.length === 0) {
        createAlert('No valid map entries found in uploaded JSON', 'error');
        return;
      }

      setJsonStarData(parsed);

      let updated: ParsedQualifiedData[];
      if (rawApiQualifiedMaps.length > 0) {
        updated = mergeStarsFromJson(rawApiQualifiedMaps, parsed);
      } else {
        updated = deduplicateMaps(parsed);
      }

      setQualifiedMaps(updated);
      storage.set(STORAGE_KEYS.QUALIFIED_MAPS_JSON, updated);
      createAlert(`Loaded ${parsed.length} qualified map entries from JSON!`, 'success');
    } catch (err) {
      log.error('Failed to parse qualified JSON file', err);
      createAlert('Error parsing JSON file. Please verify format.', 'error');
    }
    e.target.value = '';
  };

  const handleReweightUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = parseReweightJson(json);

      if (parsed.length === 0) {
        createAlert('No valid reweight changes found in the uploaded JSON', 'error');
        return;
      }

      setReweightMaps(parsed);
      storage.set(STORAGE_KEYS.REWEIGHT_MAPS_JSON, parsed);
      const buffs = parsed.filter(m => m.changeType === 'buff').length;
      const nerfs = parsed.filter(m => m.changeType === 'nerf').length;
      createAlert(`Loaded ${parsed.length} reweight changes (${buffs} buffs, ${nerfs} nerfs)!`, 'success');
    } catch (err) {
      log.error('Failed to parse reweight JSON file', err);
      createAlert('Error parsing JSON file. Please verify format.', 'error');
    }
    e.target.value = '';
  };

  const clearQualifiedData = () => {
    setQualifiedMaps([]);
    setRawApiQualifiedMaps([]);
    setJsonStarData([]);
    storage.remove(STORAGE_KEYS.QUALIFIED_MAPS_JSON);
    createAlert('Cleared qualified map data', 'info');
  };

  const clearReweightData = () => {
    setReweightMaps([]);
    storage.remove(STORAGE_KEYS.REWEIGHT_MAPS_JSON);
    createAlert('Cleared reweight map data', 'info');
  };

  const { qualifiedResult, reweightResult, fullScript } = useCombinedScript(
    qualifiedMaps,
    reweightMaps,
    month
  );

  const copyToClipboard = (text: string, label: string = 'script') => {
    navigator.clipboard.writeText(text).then(() => {
      createAlert(`Copied ${label} to clipboard!`, 'success');
    }).catch(err => {
      log.error('Failed to copy text', err);
      createAlert('Failed to copy to clipboard', 'error');
    });
  };

  const currentDisplayScript = (() => {
    if (activeTab === 'qualified') return qualifiedResult.fullQualifiedScript;
    if (activeTab === 'reweight') return reweightResult.fullScript;
    return fullScript;
  })();

  return (
    <>
      <motion.div
        className="w-full bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm p-4 rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50 mb-5 space-y-3"
        variants={fadeIn}
        custom={1}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {qualifiedMaps.length > 0 ? (
              <div className="flex items-center gap-2 bg-white/60 dark:bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-teal-500/30 text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  <strong className="text-teal-600 dark:text-teal-400">{qualifiedMaps.length}</strong> qualified maps
                </span>
                <label className="cursor-pointer text-teal-600 dark:text-teal-400 hover:text-teal-500 ml-1 p-0.5" title="Upload Qualified JSON">
                  <FaUpload size={11} />
                  <input type="file" accept=".json" onChange={handleQualifiedUpload} className="hidden" />
                </label>
                <button
                  onClick={() => fetchScoreSaberMaps()}
                  disabled={isFetchingMaps}
                  title="Refetch qualified maps from ScoreSaber API"
                  className="text-teal-500 hover:text-teal-600 ml-1 disabled:opacity-50"
                >
                  <FaSyncAlt size={11} className={isFetchingMaps ? 'animate-spin' : ''} />
                </button>
                <button onClick={clearQualifiedData} title="Clear data" className="text-neutral-400 hover:text-red-500 ml-1">
                  <FaTrash size={11} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchScoreSaberMaps()}
                  disabled={isFetchingMaps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <FaSyncAlt size={12} className={isFetchingMaps ? 'animate-spin' : ''} />
                  <span>Fetch Qualified Maps</span>
                </button>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm transition-all" title="Upload Qualified JSON">
                  <FaUpload size={12} />
                  <span>Upload Qualified JSON</span>
                  <input type="file" accept=".json" onChange={handleQualifiedUpload} className="hidden" />
                </label>
              </div>
            )}

            {reweightMaps.length > 0 ? (
              <div className="flex items-center gap-2 bg-white/60 dark:bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-teal-500/30 text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  <strong className="text-teal-600 dark:text-teal-400">{reweightMaps.length}</strong> reweights
                </span>
                <label className="cursor-pointer text-teal-600 dark:text-teal-400 hover:text-teal-500 ml-1 p-0.5" title="Replace JSON">
                  <FaUpload size={11} />
                  <input type="file" accept=".json" onChange={handleReweightUpload} className="hidden" />
                </label>
                <button onClick={clearReweightData} title="Clear data" className="text-neutral-400 hover:text-red-500 ml-1">
                  <FaTrash size={11} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white font-medium text-xs rounded-lg shadow-sm transition-all">
                <FaUpload size={12} />
                <span>Upload Reweight JSON</span>
                <input type="file" accept=".json" onChange={handleReweightUpload} className="hidden" />
              </label>
            )}

            <button onClick={loadSavedData} title="Reload storage" className="p-1.5 bg-white/50 dark:bg-neutral-700 hover:bg-white dark:hover:bg-neutral-600 rounded-lg text-xs transition-all">
              <FaRedo size={12} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-neutral-600 dark:text-neutral-400">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-1.5 bg-white/70 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div className="flex justify-between items-center w-full mb-3" variants={fadeIn} custom={2}>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'full'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white/40 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-800'
            }`}
          >
            <FaScroll size={12} />
            Full Script
          </button>
          <button
            onClick={() => setActiveTab('qualified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'qualified'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white/40 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-800'
            }`}
          >
            <FaFileAlt size={12} />
            Qualified Script
          </button>
          <button
            onClick={() => setActiveTab('reweight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'reweight'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white/40 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-800'
            }`}
          >
            <FaFileAlt size={12} />
            Reweight Script
          </button>
          <button
            onClick={() => setActiveTab('maps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'maps'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-white/40 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-800'
            }`}
          >
            <FaList size={12} />
            Selected Maps
          </button>
        </div>

        {activeTab !== 'maps' && (
          <motion.button
            className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-1.5 px-3 text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
            onClick={() => copyToClipboard(currentDisplayScript, `${activeTab} script`)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <FaCopy size={12} />
            Copy Script
          </motion.button>
        )}
      </motion.div>

      {activeTab !== 'maps' ? (
        <motion.div
          className="w-full relative flex flex-col bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm rounded-xl p-4 shadow-md overflow-hidden group"
          variants={fadeIn}
          custom={3}
        >
          <div className="bg-white dark:bg-neutral-700 p-4 rounded-lg shadow-inner overflow-auto text-left relative z-10 font-mono text-xs leading-relaxed whitespace-pre-line text-neutral-800 dark:text-neutral-100 max-h-[45vh]">
            {currentDisplayScript ? (
              currentDisplayScript
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 dark:text-neutral-400 font-sans">
                <p className="text-xs italic">
                  {activeTab === 'reweight'
                    ? 'No reweighted maps loaded.'
                    : activeTab === 'qualified'
                    ? 'No qualified maps loaded.'
                    : 'No script generated yet.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeIn} custom={3} className="w-full">
          <SelectedMapsBreakdown
            qualifiedMaps={qualifiedResult.sortedQualifiedMaps}
            top3Nerfs={reweightResult.top3Nerfs}
            top3Buffs={reweightResult.top3Buffs}
            highStarNerfs={reweightResult.highStarNerfs}
            highStarBuffs={reweightResult.highStarBuffs}
          />
        </motion.div>
      )}
    </>
  );
};
