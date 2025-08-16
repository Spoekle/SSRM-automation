import React, { useRef } from 'react';
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';

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
    <div className="w-full">
      <label className="block mb-1 text-sm text-neutral-700 dark:text-neutral-200">Upload Image:</label>
      <div
        className="relative flex items-center justify-center w-full h-16 px-3 py-2 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50 transition duration-200"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        onClick={(e) => {
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
          <div className="flex">
            <img src={URL.createObjectURL(file)} alt="Preview" className="absolute top-1/2 -translate-y-1/2 left-0.5 max-h-14 object-cover rounded-md" />
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{file.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{`${getFileType(file)} - ${getFormattedSize(file.size)}`}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FaCloudUploadAlt className="mb-1 text-yellow-500" size={18} />
            <span className="text-sm text-neutral-700 dark:text-neutral-200">Select image</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">or drag and drop</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".png, .jpg, .jpeg, .webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {!file && (
        <div className="text-xs mt-1 text-center text-gray-500 dark:text-gray-400">
          Supported: .png, .jpg, .jpeg, .webp
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;
