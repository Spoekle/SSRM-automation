import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExpand, FaCompress, FaArrowsAlt, FaUndo } from 'react-icons/fa';
import logo from '../../../../../../assets/thumbnails/SSRB_Logo.png'

interface PlaylistBackgroundCustomizerProps {
  file: File | null;
  month: string;
  backgroundScale: number;
  setBackgroundScale: (scale: number) => void;
  backgroundX: number;
  setBackgroundX: (x: number) => void;
  backgroundY: number;
  setBackgroundY: (y: number) => void;
}

const PlaylistBackgroundCustomizer: React.FC<PlaylistBackgroundCustomizerProps> = ({
  file,
  month,
  backgroundScale,
  setBackgroundScale,
  backgroundX,
  setBackgroundX,
  backgroundY,
  setBackgroundY,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [previewScale, setPreviewScale] = useState({ x: 1, y: 1 });
  const previewRef = useRef<HTMLDivElement>(null);

  // Reset function
  const resetPosition = () => {
    setBackgroundScale(1);
    setBackgroundX(0);
    setBackgroundY(0);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!file) return;
    e.preventDefault();
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !file) return;
    
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
    if (!file || !e.ctrlKey) return;
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

  // Calculate preview scale factors for 512x512 canvas
  useEffect(() => {
    if (previewRef.current) {
      const updateScale = () => {
        const previewRect = previewRef.current!.getBoundingClientRect();
        setPreviewScale({
          x: previewRect.width / 512,
          y: previewRect.height / 512
        });
      };
      
      updateScale();
      
      // Update scale on window resize
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-600 rounded-lg p-4 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Upload an image to see preview and customization options
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #fb923c;
          transform: scale(1.1);
        }
        
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb:hover {
          background: #fb923c;
          transform: scale(1.1);
        }
      `}</style>
      {/* Preview - Square format for playlist thumbnails */}
      <div className="bg-neutral-100 justify-items-center overflow-hidden dark:bg-neutral-600 rounded-lg p-2">
        <div 
          ref={previewRef}
          className="relative w-48 h-48 bg-neutral-200 dark:bg-neutral-700 rounded cursor-move border-2 border-dashed border-neutral-300 dark:border-neutral-500"
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          {/* Full background image - shows entire image */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-75"
            style={{
              backgroundImage: `url(${URL.createObjectURL(file)})`,
              transform: `translate(${backgroundX * previewScale.x}px, ${backgroundY * previewScale.y}px) scale(${backgroundScale})`,
              transformOrigin: 'center',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          />
          
          {/* Crop area overlay to show what will be used in final thumbnail */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-full h-full">
              {/* Semi-transparent overlay on areas that will be cropped out */}
              <div className="absolute inset-0 bg-black/20"></div>
              {/* Clear area showing the square crop region */}
              <div 
                className="absolute bg-transparent border-2 border-orange-400 border-dashed"
                style={{
                  left: '0%',
                  right: '0%',
                  top: '0%',
                  bottom: '0%'
                }}
              >
                {/* Corner indicators */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
              </div>
            </div>
          </div>
            {/* Logo Overlay - scaled for 512x512 preview */}
            <div className="absolute inset-0 flex items-start justify-center pt-4 pointer-events-none">
                <img src={logo} alt="Logo" className="h-8" />
            </div>

            {/* Month Overlay */}
            {month && (
              <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                <span className="text-white text-sm px-2 py-1 rounded shadow-sm text-center max-w-[90%] break-words">
                  {month}
                </span>
              </div>
            )}

          {/* Overlay hints */}
          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
            <FaArrowsAlt className="inline mr-1" />
            Drag
          </div>
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
            Ctrl + Scroll
          </div>
        </div>
        <div className="text-center mt-1">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            512×512 Preview
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
            Shows full image with square crop area
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {/* Scale Control */}
        <div>
          <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-200">
            Scale: {(backgroundScale * 100).toFixed(0)}%
          </label>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => setBackgroundScale(Math.max(0.1, backgroundScale - 0.1))}
              className="p-1 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaCompress size={10} />
            </motion.button>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={backgroundScale}
              onChange={(e) => setBackgroundScale(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <motion.button
              type="button"
              onClick={() => setBackgroundScale(Math.min(3, backgroundScale + 0.1))}
              className="p-1 bg-neutral-200 dark:bg-neutral-600 rounded hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaExpand size={10} />
            </motion.button>
          </div>
        </div>

        {/* Position Controls */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-200">
              X: {backgroundX.toFixed(0)}px
            </label>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={backgroundX}
              onChange={(e) => setBackgroundX(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-200">
              Y: {backgroundY.toFixed(0)}px
            </label>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={backgroundY}
              onChange={(e) => setBackgroundY(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* Reset Button */}
        <motion.button
          type="button"
          onClick={resetPosition}
          className="w-full p-2 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg font-medium flex items-center justify-center gap-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaUndo size={10} />
          Reset Position & Scale
        </motion.button>
      </div>
    </div>
  );
};

export default PlaylistBackgroundCustomizer;