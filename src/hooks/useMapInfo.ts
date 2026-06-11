/**
 * Custom hook for managing map info state with localStorage persistence
 * Consolidates the repeated pattern across Titles, Thumbnails, and MapCards pages
 */

import { useState, useEffect, useCallback } from 'react';
import type { MapInfo } from '../types';

const STORAGE_KEY = 'mapInfo';

export interface UseMapInfoReturn {
    mapInfo: MapInfo | null;
    setMapInfo: (info: MapInfo | null) => void;
    clearMapInfo: () => void;
    isLoading: boolean;
}

export function useMapInfo(): UseMapInfoReturn {
    const [mapInfo, setMapInfoState] = useState<MapInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadFromStorage = useCallback(() => {
        try {
            const storedMapInfo = localStorage.getItem(STORAGE_KEY);
            if (storedMapInfo) {
                setMapInfoState(JSON.parse(storedMapInfo));
            } else {
                setMapInfoState(null);
            }
        } catch (error) {
            console.error('Error loading mapInfo from localStorage:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load from localStorage on mount and listen for updates
    useEffect(() => {
        loadFromStorage();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                loadFromStorage();
            }
        };

        const handleCustomEvent = () => {
            loadFromStorage();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('mapinfo-updated', handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('mapinfo-updated', handleCustomEvent);
        };
    }, [loadFromStorage]);

    // Persist to localStorage and dispatch event when mapInfo changes
    const setMapInfo = useCallback((info: MapInfo | null) => {
        setMapInfoState(info);
        if (info) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
        // Dispatch event to notify other components (like GlobalLoadedMap)
        window.dispatchEvent(new Event('mapinfo-updated'));
    }, []);

    const clearMapInfo = useCallback(() => {
        setMapInfoState(null);
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('mapinfo-updated'));
    }, []);

    return {
        mapInfo,
        setMapInfo,
        clearMapInfo,
        isLoading,
    };
}
