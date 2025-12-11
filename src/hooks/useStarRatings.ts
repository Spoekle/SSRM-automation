/**
 * Custom hook for managing star ratings state with localStorage persistence
 * Used by MapCards, Thumbnails, and related forms
 */

import { useState, useEffect, useCallback } from 'react';
import type { StarRatings } from '../types';

const STORAGE_KEY = 'starRatings';

const DEFAULT_RATINGS: StarRatings = {
    ES: '',
    NOR: '',
    HARD: '',
    EX: '',
    EXP: '',
};

export interface UseStarRatingsReturn {
    starRatings: StarRatings;
    setStarRatings: (ratings: StarRatings) => void;
    updateRating: (difficulty: keyof StarRatings, value: string) => void;
    resetRatings: () => void;
    hasAnyRating: boolean;
    isLoading: boolean;
}

export function useStarRatings(
    initialRatings?: StarRatings,
    storageKey: string = STORAGE_KEY
): UseStarRatingsReturn {
    const [starRatings, setStarRatingsState] = useState<StarRatings>(initialRatings ?? DEFAULT_RATINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const storedRatings = localStorage.getItem(storageKey);
            if (storedRatings) {
                setStarRatingsState(JSON.parse(storedRatings));
            }
        } catch (error) {
            console.error(`Error loading starRatings from localStorage (${storageKey}):`, error);
        } finally {
            setIsLoading(false);
        }
    }, [storageKey]);

    // Persist to localStorage when ratings change
    const setStarRatings = useCallback((ratings: StarRatings) => {
        setStarRatingsState(ratings);
        localStorage.setItem(storageKey, JSON.stringify(ratings));
    }, [storageKey]);

    const updateRating = useCallback((difficulty: keyof StarRatings, value: string) => {
        setStarRatingsState(prev => {
            const newRatings = {
                ...prev,
                [difficulty]: value,
            };
            localStorage.setItem(storageKey, JSON.stringify(newRatings));
            return newRatings;
        });
    }, [storageKey]);

    const resetRatings = useCallback(() => {
        setStarRatingsState(DEFAULT_RATINGS);
        localStorage.removeItem(storageKey);
    }, [storageKey]);

    const hasAnyRating = Object.values(starRatings).some(value => value !== '');

    return {
        starRatings,
        setStarRatings,
        updateRating,
        resetRatings,
        hasAnyRating,
        isLoading,
    };
}
