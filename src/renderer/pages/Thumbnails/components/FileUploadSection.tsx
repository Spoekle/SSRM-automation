import React, { useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

interface FileUploadSectionProps {
  file: File | null;
  setFile: (file: File | null) => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ file, setFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileType = (file: File) => {
    return file.type.startsWith('image/')
      ? 'Image'
      : file.type.startsWith('video/')
        ? 'Video'
        : 'File';
  };

  const getFormattedSize = (size: number) => {
    return size < 1024 * 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(2)} MB`
      : `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="w-full bg-white dark:bg-neutral-800 p-2 rounded-lg shadow relative">
      <label className="block mb-1 text-gray-700 dark:text-gray-200 text-sm">Upload Image or Video:</label>
      <div
        className="relative flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-blue-300 rounded-md cursor-pointer hover:bg-blue-100 hover:dark:bg-neutral-700 transition duration-200 text-sm"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        onClick={(e) => {
          // Prevent click if the clear button was clicked
          if ((e.target as HTMLElement).closest('button')) return;
          fileInputRef.current?.click();
        }}
      >
        {file && (
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-md p-1 text-xs text-white z-10"
            aria-label="Clear file"
          >
            <FaTimes />
          </button>
        )}

        {file ? (
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">{file.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{`${getFileType(file)} - ${getFormattedSize(file.size)}`}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Drag & drop image/video here or click to select
          </span>
        )}
        {!file && (
          <>
            <span className="text-xs text-gray-500 dark:text-gray-400">Supported formats: .png, .jpg, .jpeg, .webp, .mp4, .avi, .mov</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Max size: 20 GB</span>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".png, .jpg, .jpeg, .webp, .mp4, .avi, .mov"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default FileUploadSection;
