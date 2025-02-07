import React, { FormEvent, ChangeEvent, useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FaTimes } from "react-icons/fa";
import { generateStarChange } from '../../../main/helper';

interface StarRatingFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  oldStarRatings: OldStarRatings;
  setOldStarRatings: (ratings: OldStarRatings) => void;
  newStarRatings: NewStarRatings;
  setNewStarRatings: (ratings: NewStarRatings) => void;
  setStarRatingFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
  createAlerts: (message: string, type: 'success' | 'error' | 'alert') => void;
  progress: (process: string, progress: number, visible: boolean) => void;
}

interface OldStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

interface NewStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

interface UploadedMap {
  id: number;
  songHash: string;
  songName: string;
  songSubName: string;
  levelAuthorName: string;
  difficulty: number;
  old_stars: number;
  new_stars: number;
}

const StarRatingForm: React.FC<StarRatingFormProps> = ({
  mapId,
  setMapId,
  oldStarRatings,
  setOldStarRatings,
  newStarRatings,
  setNewStarRatings,
  setStarRatingFormModal,
  setMapInfo,
  setImageSrc,
  createAlerts,
  progress: setProgress
}) => {
  const [songName, setSongName] = useState('');
  const [chosenDiff, setChosenDiff] = useState('ES');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setStarRatingFormModal(false);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    createAlerts("Fetching map info...", "alert");
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setMapInfo(data);
      localStorage.setItem('mapId', `${mapId}`);
      localStorage.setItem('oldStarRatings', JSON.stringify(oldStarRatings));
      localStorage.setItem('mapInfo', JSON.stringify(data));

      const image = await generateStarChange(data, oldStarRatings, newStarRatings, chosenDiff as keyof OldStarRatings);
      setImageSrc(image);
      createAlerts("Star change image generated successfully.", "success");
      setStarRatingFormModal(false);
    } catch (error) {
      console.error('Error fetching map info:', error);
      createAlerts("Error fetching map info.", "error");
    }
  };

  async function getStarRating(hash: string): Promise<NewStarRatings> {
    let diffs = ['1', '3', '5', '7', '9'];
    let fetchedStarRatings: NewStarRatings = {
      ES: '',
      NOR: '',
      HARD: '',
      EXP: '',
      EXP_PLUS: ''
    };

    for (let i = 0; i < diffs.length; i++) {
      try {
        const response = await axios.get(`http://localhost:3000/api/scoresaber/${hash}/${diffs[i]}`);
        const data = response.data;
        const key = Object.keys(fetchedStarRatings)[i] as keyof NewStarRatings;
        fetchedStarRatings[key] = data.stars === 0 ? 'Unranked' : data.stars.toString();
        localStorage.setItem('starRatings', JSON.stringify(fetchedStarRatings));
        console.log(fetchedStarRatings);
      } catch (error) {
        console.error(error);
      }
    }
    return fetchedStarRatings;
  }

  const fetchName = async (mapId: string) => {
    if (mapId === '') {
      setSongName('');
      return;
    }
    setMapId(mapId);
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);
      getStarRating(data.versions[0].hash).then((fetchedStarRatings) => {
        setNewStarRatings(fetchedStarRatings);
      });
      return data.metadata.songName;
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  };

  const handleJsonUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStarRatingFormModal(false);
    setUploadError(null);
    createAlerts("Reweight JSON Uploaded...", "alert");
    setProgress("Reading JSON file...", 10, true);
    try {
      const text = await file.text();
      setProgress("Parsing JSON...", 20, true);
      const uploadedMaps: UploadedMap[] = JSON.parse(text);
      const mapCount = uploadedMaps.length;
      setProgress("Starting map processing...", 30, true);
      const zip = new JSZip();

      for (let i = 0; i < mapCount; i++) {
        const map = uploadedMaps[i];
        let diffKey = '';
        switch (map.difficulty) {
          case 1:
            diffKey = 'ES';
            break;
          case 3:
            diffKey = 'NOR';
            break;
          case 5:
            diffKey = 'HARD';
            break;
          case 7:
            diffKey = 'EXP';
            break;
          case 9:
            diffKey = 'EXP_PLUS';
            break;
          default:
            diffKey = 'ES';
        }

        const manualOld: OldStarRatings = { ES: '', NOR: '', HARD: '', EXP: '', EXP_PLUS: '' };
        const manualNew: NewStarRatings = { ES: '', NOR: '', HARD: '', EXP: '', EXP_PLUS: '' };
        manualOld[diffKey as keyof OldStarRatings] = map.old_stars.toString();
        manualNew[diffKey as keyof NewStarRatings] = map.new_stars.toString();

        try {
          const percent = Math.floor(((i + 1) / mapCount) * 100);
          setProgress(`Processing maps`, percent, true);

          const response = await axios.get(`https://api.beatsaver.com/maps/hash/${map.songHash}`);
          const mapInfo = response.data;
          const imageDataUrl = await generateStarChange(mapInfo, manualOld, manualNew, diffKey as keyof OldStarRatings);
          const base64Data = imageDataUrl.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const sanitizedSongName = map.songName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const fileName = `${sanitizedSongName}_${map.id}.png`;

          zip.file(fileName, byteArray, { binary: true });
        } catch (err) {
          console.error(`Error processing map with hash ${map.songHash}:`, err);
        }
      }

      setProgress("Generating ZIP file...", 80, true);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      createAlerts("Creating zip!", "success");
      saveAs(zipBlob, 'reweight_cards.zip');
      setProgress("ZIP file created!", 100, true);
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
    } catch (err: any) {
      console.error('Error processing uploaded JSON:', err);
      setUploadError('Failed to process the uploaded JSON file. Please ensure it is correctly formatted.');
      createAlerts("Failed to process the uploaded JSON file. Please ensure it is correctly formatted.", "error");
      setProgress("", 0, false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="relative modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 m-16 rounded-lg animate-jump-in animate-duration-300">
        <div className="absolute z-10 top-8 right-8 text-center items-center text-lg">
          <button
            className="bg-red-500 text-white hover:bg-red-600 rounded-md p-2 transition duration-200"
            onClick={() => setStarRatingFormModal(false)}
          >
            <FaTimes />
          </button>
        </div>
        {songName && (
          <div className="absolute left-0 ml-6 mt-8">
            <h1 className="text-2xl font-bold">Chosen Song:</h1>
            <h1 className="text-lg font-semibold">{songName}</h1>
          </div>
        )}
        <form onSubmit={getMapInfo} className="space-y-6">
          <div className="flex flex-col md:flex-row md:space-x-6">
            {/* Manual Input Section */}
            <div className="relative w-full bg-white dark:bg-neutral-800 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Manual Input</h2>
              <label className="block mb-2 text-gray-700 dark:text-gray-200">Map ID:</label>
              <input
                type="text"
                value={mapId}
                onChange={(e) => fetchName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block mt-4 mb-2 text-gray-700 dark:text-gray-200">Difficulty:</label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => setChosenDiff(e.target.value)}
                value={chosenDiff}
              >
                <option value="ES">Easy</option>
                <option value="NOR">Normal</option>
                <option value="HARD">Hard</option>
                <option value="EXP">Expert</option>
                <option value="EXP_PLUS">Expert+</option>
              </select>
              <div className='absolute w-full bg-white dark:bg-neutral-800 p-6 left-0'/>
            </div>

            {/* Automatic Input Section */}
            <div className="relative w-full bg-white dark:bg-neutral-800 p-4 rounded-lg shadow mt-6 md:mt-0">
              <h2 className="text-xl font-semibold mb-4">Automatic Input</h2>
              <label className="block mb-2 text-gray-700 dark:text-gray-200">Upload JSON File:</label>
              <label className="flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition duration-200">
                <span>Select File</span>
                <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
              </label>
              {uploadError && <p className="mt-2 text-red-500">{uploadError}</p>}
            </div>
          </div>

          {/* Reweight Values Section */}
          <div className="relative bg-white dark:bg-neutral-800 px-4 pb-4 rounded-lg flex flex-row gap-6 items-center">
            <div className="flex flex-col w-1/2">
              <label className="mb-1 text-gray-700 dark:text-gray-200">Old:</label>
              <input
                type="text"
                placeholder="Old"
                value={oldStarRatings[chosenDiff as keyof OldStarRatings]}
                onChange={(e) =>
                  setOldStarRatings({ ...oldStarRatings, [chosenDiff]: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex flex-col w-1/2">
              <label className="mb-1 text-gray-700 dark:text-gray-200">New:</label>
              <input
                type="text"
                placeholder="New"
                value={newStarRatings[chosenDiff as keyof NewStarRatings]}
                onChange={(e) =>
                  setNewStarRatings({ ...newStarRatings, [chosenDiff]: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col md:flex-row justify-end items-center">
            <button
              type="submit"
              className="w-full md:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-200"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default StarRatingForm;
