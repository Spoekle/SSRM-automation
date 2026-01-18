import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExpand, FaCompress, FaArrowsAlt, FaUndo } from 'react-icons/fa';
import logo from '../../../assets/thumbnails/SSRB_Logo.png';
import { convertFileSrc } from '@tauri-apps/api/core';

type AspectRatioType = '16:9' | '1:1';

interface BackgroundCustomizerProps {
    previewSrc: string;
    month?: string;
    backgroundScale: number;
    setBackgroundScale: (scale: number) => void;
    backgroundX: number;
    setBackgroundX: (x: number) => void;
    backgroundY: number;
    setBackgroundY: (y: number) => void;
    // Customization options
    aspectRatio?: AspectRatioType;
    accentColor?: 'yellow' | 'orange';
    positionRange?: number;
    showLogo?: boolean;
    showMonth?: boolean;
}

const ASPECT_RATIO_CONFIG = {
    '16:9': {
        canvasWidth: 1920,
        canvasHeight: 1080,
        previewClass: 'h-48 aspect-video',
        cropStyle: { left: '12.5%', right: '12.5%', top: '0%', bottom: '0%' },
        cropDescription: 'Dashed area shows final crop region (16:9)',
        logoClass: 'absolute inset-0 -mt-14 flex items-center justify-center pointer-events-none',
        logoSize: 'h-12',
        monthClass: 'absolute inset-0 -mb-14 flex items-center justify-center pointer-events-none',
        monthTextClass: 'text-white text-3xl px-2 py-1 rounded shadow-sm',
        hintDragText: 'Drag to move',
        hintZoomText: 'Ctrl + Scroll to zoom',
        previewSizeText: '',
    },
    '1:1': {
        canvasWidth: 512,
        canvasHeight: 512,
        previewClass: 'w-48 h-48',
        cropStyle: { left: '0%', right: '0%', top: '0%', bottom: '0%' },
        cropDescription: 'Shows full image with square crop area',
        logoClass: 'absolute inset-0 flex items-start justify-center pt-4 pointer-events-none',
        logoSize: 'h-8',
        monthClass: 'absolute inset-0 flex items-end justify-center pb-3 pointer-events-none',
        monthTextClass: 'text-white text-sm px-2 py-1 rounded shadow-sm text-center max-w-[90%] break-words',
        hintDragText: 'Drag',
        hintZoomText: 'Ctrl + Scroll',
        previewSizeText: '512×512 Preview',
    },
};

const COLOR_CONFIG = {
    yellow: {
        slider: '#eab308',
        sliderHover: '#facc15',
        border: 'border-yellow-400',
        dot: 'bg-yellow-400',
        button: 'bg-yellow-500 hover:bg-yellow-600',
    },
    orange: {
        slider: '#ea580c',
        sliderHover: '#fb923c',
        border: 'border-orange-400',
        dot: 'bg-orange-400',
        button: 'bg-orange-500 hover:bg-orange-600',
    },
};

const BackgroundCustomizer: React.FC<BackgroundCustomizerProps> = ({
    previewSrc,
    month,
    backgroundScale,
    setBackgroundScale,
    backgroundX,
    setBackgroundX,
    backgroundY,
    setBackgroundY,
    aspectRatio = '16:9',
    accentColor = 'yellow',
    positionRange = 500,
    showLogo = true,
    showMonth = true,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [previewScale, setPreviewScale] = useState({ x: 1, y: 1 });
    const previewRef = useRef<HTMLDivElement>(null);

    const config = ASPECT_RATIO_CONFIG[aspectRatio];
    const colors = COLOR_CONFIG[accentColor];

    // Reset function
    const resetPosition = () => {
        setBackgroundScale(1);
        setBackgroundX(0);
        setBackgroundY(0);
    };

    // Handle mouse down for dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!previewSrc) return;
        e.preventDefault();
        setIsDragging(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    // Handle mouse move for dragging
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !previewSrc) return;

        const deltaX = e.clientX - lastMousePos.x;
        const deltaY = e.clientY - lastMousePos.y;

        // Scale the mouse movement to match the actual canvas size
        setBackgroundX(backgroundX + (deltaX / previewScale.x));
        setBackgroundY(backgroundY + (deltaY / previewScale.y));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    // Handle mouse up
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle wheel for scaling
    const handleWheel = (e: React.WheelEvent) => {
        if (!previewSrc || !e.ctrlKey) return;
        e.preventDefault();

        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.1, Math.min(3, backgroundScale * scaleFactor));
        setBackgroundScale(newScale);
    };

    // Add global event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, lastMousePos]);

    // Calculate preview scale factors
    useEffect(() => {
        if (previewRef.current) {
            const updateScale = () => {
                const previewRect = previewRef.current!.getBoundingClientRect();
                setPreviewScale({
                    x: previewRect.width / config.canvasWidth,
                    y: previewRect.height / config.canvasHeight
                });
            };

            updateScale();

            // Update scale on window resize
            window.addEventListener('resize', updateScale);
            return () => window.removeEventListener('resize', updateScale);
        }
    }, [previewSrc, config.canvasWidth, config.canvasHeight]);

    if (!previewSrc) {
        return (
            <div className="bg-neutral-100 dark:bg-neutral-600 rounded-lg p-4 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Upload an image to see preview and customization options
                </p>
            </div>
        );
    }

    // Determine if it is a path (needs conversion) or data URL
    const isDataUrl = previewSrc.startsWith('data:');
    const backgroundImage = isDataUrl ? previewSrc : convertFileSrc(previewSrc);

    // Generate slider styles dynamically based on accent color
    const sliderStyles = `
    .slider-${accentColor}::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${colors.slider};
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .slider-${accentColor}::-webkit-slider-thumb:hover {
      background: ${colors.sliderHover};
      transform: scale(1.1);
    }

    .slider-${accentColor}::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${colors.slider};
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .slider-${accentColor}::-moz-range-thumb:hover {
      background: ${colors.sliderHover};
      transform: scale(1.1);
    }
  `;

    return (
        <div className="space-y-4">
            <style>{sliderStyles}</style>
            {/* Preview */}
            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 backdrop-blur-sm">
                <div className="flex justify-center">
                    <div
                        ref={previewRef}
                        className={`relative ${config.previewClass} bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-move shadow-inner overflow-hidden ring-1 ring-neutral-900/5 dark:ring-white/10`}
                        onMouseDown={handleMouseDown}
                        onWheel={handleWheel}
                    >
                        {/* Background image - uses object-fit cover to simulate Rust's crop behavior */}
                        <img
                            src={backgroundImage}
                            alt="Background preview"
                            className="absolute inset-0 w-full h-full transition-transform duration-75"
                            style={{
                                objectFit: 'cover',
                                transform: `scale(${backgroundScale})`,
                                transformOrigin: 'center',
                                objectPosition: `calc(50% + ${backgroundX}px) calc(50% + ${backgroundY}px)`,
                                cursor: isDragging ? 'grabbing' : 'grab'
                            }}
                            draggable={false}
                        />

                        {/* Logo Overlay */}
                        {showLogo && (
                            <div className={config.logoClass}>
                                <img src={logo} alt="Logo" className={`${config.logoSize} drop-shadow-lg`} />
                            </div>
                        )}

                        {/* Month Overlay */}
                        {showMonth && month && (
                            <div className={config.monthClass}>
                                <span className={`${config.monthTextClass} backdrop-blur-md bg-black/30`}>
                                    {month}
                                </span>
                            </div>
                        )}

                        {/* Overlay hints */}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full shadow-lg border border-white/10">
                            <FaArrowsAlt className="inline mr-1" />
                            {config.hintDragText}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full shadow-lg border border-white/10">
                            {config.hintZoomText}
                        </div>
                    </div>
                </div>

                <div className="text-center mt-3 flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 px-1">
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-block w-2 h-2 ${colors.dot} rounded-full ring-1 ring-neutral-200 dark:ring-neutral-700`}></span>
                        Preview shows exactly what will be generated
                    </div>
                    {config.previewSizeText && (
                        <span>{config.previewSizeText}</span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 px-1">
                {/* Scale Control */}
                <div>
                    <label className="flex justify-between text-xs font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
                        <span>Zoom Level</span>
                        <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 rounded">{(backgroundScale * 100).toFixed(0)}%</span>
                    </label>
                    <div className="flex items-center gap-3">
                        <motion.button
                            type="button"
                            onClick={() => setBackgroundScale(Math.max(0.1, backgroundScale - 0.1))}
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaCompress size={12} />
                        </motion.button>
                        <div className="flex-1 relative h-6 flex items-center">
                            <input
                                type="range"
                                min="0.1"
                                max="3"
                                step="0.1"
                                value={backgroundScale}
                                onChange={(e) => setBackgroundScale(parseFloat(e.target.value))}
                                className={`w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider-${accentColor}`}
                            />
                        </div>
                        <motion.button
                            type="button"
                            onClick={() => setBackgroundScale(Math.min(3, backgroundScale + 0.1))}
                            className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaExpand size={12} />
                        </motion.button>
                    </div>
                </div>

                {/* Position Controls */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex justify-between text-xs font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
                            <span>Position X</span>
                            <span className="font-mono text-[10px] text-neutral-500">{backgroundX.toFixed(0)}</span>
                        </label>
                        <input
                            type="range"
                            min={-positionRange}
                            max={positionRange}
                            step="1"
                            value={backgroundX}
                            onChange={(e) => setBackgroundX(parseInt(e.target.value))}
                            className={`w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider-${accentColor}`}
                        />
                    </div>
                    <div>
                        <label className="flex justify-between text-xs font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">
                            <span>Position Y</span>
                            <span className="font-mono text-[10px] text-neutral-500">{backgroundY.toFixed(0)}</span>
                        </label>
                        <input
                            type="range"
                            min={-positionRange}
                            max={positionRange}
                            step="1"
                            value={backgroundY}
                            onChange={(e) => setBackgroundY(parseInt(e.target.value))}
                            className={`w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider-${accentColor}`}
                        />
                    </div>
                </div>

                {/* Reset Button */}
                <motion.button
                    type="button"
                    onClick={resetPosition}
                    className="w-full py-2 px-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all flex items-center justify-center gap-2 group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <FaUndo size={10} className="group-hover:-rotate-45 transition-transform duration-300" />
                    Reset Position & Scale
                </motion.button>
            </div>
        </div>
    );
};

export default BackgroundCustomizer;

