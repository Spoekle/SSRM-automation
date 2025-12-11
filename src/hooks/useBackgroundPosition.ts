/**
 * Custom hook for managing background customization state
 * Used by BackgroundCustomizer and thumbnail forms
 */

import { useState, useCallback } from 'react';

export interface BackgroundPosition {
    scale: number;
    x: number;
    y: number;
}

export interface UseBackgroundPositionReturn {
    backgroundScale: number;
    setBackgroundScale: (scale: number) => void;
    backgroundX: number;
    setBackgroundX: (x: number) => void;
    backgroundY: number;
    setBackgroundY: (y: number) => void;
    resetPosition: () => void;
    position: BackgroundPosition;
}

const DEFAULT_POSITION: BackgroundPosition = {
    scale: 1,
    x: 0,
    y: 0,
};

export function useBackgroundPosition(initialPosition?: Partial<BackgroundPosition>): UseBackgroundPositionReturn {
    const [backgroundScale, setBackgroundScale] = useState(initialPosition?.scale ?? DEFAULT_POSITION.scale);
    const [backgroundX, setBackgroundX] = useState(initialPosition?.x ?? DEFAULT_POSITION.x);
    const [backgroundY, setBackgroundY] = useState(initialPosition?.y ?? DEFAULT_POSITION.y);

    const resetPosition = useCallback(() => {
        setBackgroundScale(DEFAULT_POSITION.scale);
        setBackgroundX(DEFAULT_POSITION.x);
        setBackgroundY(DEFAULT_POSITION.y);
    }, []);

    const position: BackgroundPosition = {
        scale: backgroundScale,
        x: backgroundX,
        y: backgroundY,
    };

    return {
        backgroundScale,
        setBackgroundScale,
        backgroundX,
        setBackgroundX,
        backgroundY,
        setBackgroundY,
        resetPosition,
        position,
    };
}
