import React, { FormEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

interface MapFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  difficulty: string;
  setDifficulty: (difficulty: string) => void;
  useSubname: boolean;
  setUseSubname: (use: boolean) => void;
  player: string;
  setPlayer: (player: string) => void;
  setThumbnailFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  thumbnailAssets: string;
  setThumbnailAssets: (thumbnailAssets: string) => void;
}

const ThumbnailForm: React.FC<MapFormProps> = ({
  mapId,
  setMapId,
  difficulty,
  setDifficulty,
  useSubname,
  setUseSubname,
  setThumbnailFormModal,
  setThumbnailAssets,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeLink, setYoutubeLink] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setThumbnailFormModal(false);
    }
  };

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Validate the form inputs
    if (!videoFile && !youtubeLink) {
      setError('Please provide a video file or a YouTube link.');
      return;
    }
    if (videoFile && youtubeLink) {
      setError('Please provide only one of either a video file or a YouTube link.');
      return;
    }

    const formData = new FormData();
    formData.append('mapId', mapId);
    formData.append('difficulty', difficulty);
    formData.append('useSubname', useSubname.toString());

    if (videoFile) {
      formData.append('file', videoFile);
    } else if (youtubeLink) {
      formData.append('youtubeLink', youtubeLink);
    }

    setError(null); // Clear any previous errors
    console.log('Submitting form data:', formData);

    try {
      const response = await axios.post('http://localhost:3001/generate-assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Thumbnail response received:', response.data);

      // Assuming the server returns an object with the paths to the generated assets
      setThumbnailAssets(response.data);
      setThumbnailFormModal(false);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setError('Failed to generate thumbnail. Please try again.');
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 drop-shadow-xl p-6 rounded-lg animate-jump-in animate-duration-300">
        <form onSubmit={handleFormSubmit}>
          <h1 className="text-2xl font-bold">Generate Assets</h1>
          <div className="flex mt-2">
            <div className="flex flex-col mr-2">
              <label>Map ID:</label>
              <input
                type="text"
                value={mapId}
                onChange={(e) => setMapId(e.target.value)}
                className="w-24 border rounded p-2 text-neutral-950 mt-1"
                required
              />
            </div>
            <div className="flex flex-col ml-2">
              <label>Use Subname?</label>
              <input
                type="checkbox"
                checked={useSubname}
                onChange={(e) => setUseSubname(e.target.checked)}
                className="mt-2"
              />
            </div>
            <div className="flex flex-col ml-2">
              <label>Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-24 border rounded p-2 text-neutral-950 mt-1"
              >
                <option value="Easy">Easy</option>
                <option value="Normal">Normal</option>
                <option value="Hard">Hard</option>
                <option value="Expert">Expert</option>
                <option value="Expert+">Expert+</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <h1 className="text-lg font-bold">Upload Video or Enter YouTube Link:</h1>
            <label>Video</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            <label>YouTube Link</label>
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="border rounded p-2 text-neutral-950 mt-1"
            />
          </div>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
          <div className="flex flex-col">
            <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ThumbnailForm;
