import React, { useState, useEffect, useRef } from 'react';
import { FaCloudUploadAlt, FaTimes, FaFileVideo, FaFileImage } from 'react-icons/fa';
import { nativeDialog } from '../../../../utils/tauri-api';
import { listen } from '@tauri-apps/api/event';

interface NativeFileUploadProps {
  accepts: 'image' | 'video' | 'any';
  onFileSelect: (path: string | null) => void;
  currentPath?: string | null;
  label?: string;
  helperText?: string;
}

const NativeFileUpload: React.FC<NativeFileUploadProps> = ({
  accepts,
  onFileSelect,
  currentPath,
  label,
  helperText = "Click to browse or drag & drop"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for drag/drop events
    const unlistenEnter = listen('tauri://drag-enter', () => setIsDragging(true));
    const unlistenLeave = listen('tauri://drag-leave', () => setIsDragging(false));

    const unlistenDrop = listen<{ paths: string[], position: { x: number, y: number } }>('tauri://drag-drop', (event) => {
        setIsDragging(false);
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const { x, y } = event.payload.position;

            // Check if drop is within this component
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                const paths = event.payload.paths;
                if (paths && paths.length > 0) {
                    // Check extension based on accepts
                    const path = paths[0];
                    const ext = path.split('.').pop()?.toLowerCase();
                    const videoExts = ['mp4', 'mkv', 'avi', 'mov'];
                    const imageExts = ['png', 'jpg', 'jpeg', 'webp'];

                    let isValid = false;
                    if (accepts === 'video' && videoExts.includes(ext || '')) isValid = true;
                    if (accepts === 'image' && imageExts.includes(ext || '')) isValid = true;
                    if (accepts === 'any' && (videoExts.includes(ext || '') || imageExts.includes(ext || ''))) isValid = true;

                    if (isValid) {
                        onFileSelect(path);
                    } else {
                        console.warn('Dropped file type not accepted');
                    }
                }
            }
        }
    });

    return () => {
        unlistenEnter.then(unlisten => unlisten());
        unlistenLeave.then(unlisten => unlisten());
        unlistenDrop.then(unlisten => unlisten());
    };
  }, [accepts, onFileSelect]);

  const handleClick = async () => {
      const path = await nativeDialog.selectFile(accepts);
      if (path) onFileSelect(path);
  };

  const clearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      onFileSelect(null);
  };

  return (
    <div className="w-full">
      {label && <label className="block mb-1 text-sm text-neutral-400">{label}</label>}
      <div
        ref={containerRef}
        onClick={handleClick}
        className={`relative flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
            isDragging ? 'border-orange-500 bg-orange-500/10 scale-[1.02]' :
            currentPath ? 'border-green-500 bg-green-500/5' : 'border-neutral-600 hover:border-orange-500 hover:bg-neutral-700/50'
        }`}
      >
         {currentPath ? (
             <div className="flex flex-col items-center p-2 text-center w-full relative group">
                 {accepts === 'video' ? <FaFileVideo className="text-3xl text-green-500 mb-1"/> : <FaFileImage className="text-3xl text-green-500 mb-1"/>}
                 <span className="text-sm font-medium text-green-500 truncate w-full px-8">{currentPath.split(/[/\\]/).pop()}</span>
                 <span className="text-xs text-neutral-500 truncate w-full px-8 opacity-70">{currentPath}</span>
                 <button
                    onClick={clearFile}
                    className="absolute top-0 right-0 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-bl-lg transition-opacity opacity-0 group-hover:opacity-100"
                    title="Remove file"
                 >
                     <FaTimes size={12} />
                 </button>
             </div>
         ) : (
             <div className="flex flex-col items-center p-2 text-center text-neutral-400">
                 <FaCloudUploadAlt className={`text-3xl mb-1 transition-colors ${isDragging ? 'text-orange-500' : ''}`} />
                 <span className="text-sm font-medium">{isDragging ? "Drop here!" : helperText}</span>
             </div>
         )}
      </div>
    </div>
  );
};

export default NativeFileUpload;
