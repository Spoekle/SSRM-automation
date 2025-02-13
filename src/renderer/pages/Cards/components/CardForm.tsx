import React, { FormEvent, ChangeEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Switch from '@mui/material/Switch';
import { FaTimes } from 'react-icons/fa';
import { generateCard } from '../../../../main/helper';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface CardFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  starRatings: StarRatings;
  setStarRatings: (ratings: StarRatings) => void;
  setCardFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
  useBackground: boolean;
  setUseBackground: (use: boolean) => void;
  createAlerts: (message: string, type: 'success' | 'error' | 'alert') => void;
  progress: (process: string, progress: number, visible: boolean) => void;
  cancelGenerationRef: React.MutableRefObject<boolean>;
}

interface StarRatings {
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
  stars: number;
}

const CardForm: React.FC<CardFormProps> = ({
  mapId,
  setMapId,
  starRatings,
  setStarRatings,
  setCardFormModal,
  setMapInfo,
  setImageSrc,
  useBackground,
  setUseBackground,
  createAlerts,
  progress: setProgress,
  cancelGenerationRef,
}) => {
  const [songName, setSongName] = React.useState('');

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setCardFormModal(false);
    }
  };

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseBackground(event.target.checked);
    localStorage.setItem('useBackground', `${event.target.checked}`);
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setMapInfo(data);
      localStorage.setItem('mapId', `${mapId}`);
      localStorage.setItem('mapInfo', JSON.stringify(data));

      const image = await generateCard(data, starRatings, useBackground);
      setImageSrc(image);

      console.log(data);
      setCardFormModal(false);
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  };

  async function getStarRating(hash: string): Promise<StarRatings> {
    let diffs = ['1', '3', '5', '7', '9'];
    let starRatings: StarRatings = {
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
        const key = Object.keys(starRatings)[i] as keyof StarRatings;
        if (data.stars === 0) {
          starRatings[key] = 'Unranked';
        } else {
          starRatings[key] = data.stars.toString();
        }
        localStorage.setItem('starRatings', JSON.stringify(starRatings));
        console.log(starRatings);
      } catch (error) {
        console.error(error);
      }
    }
    return starRatings;
  }

  const fetchName = async (mapId: string) => {
    if (mapId === '') (
      setSongName('')
    )
    setMapId(mapId)
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);
      getStarRating(data.versions[0].hash).then((starRatings) => {
        setStarRatings(starRatings);
      });
      return data.metadata.songName;
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  }

  interface MapInfo {
    metadata: {
        songAuthorName: string;
        songName: string;
        songSubName: string;
        levelAuthorName: string;
        duration: number;
        bpm: number;
    };
    id: string;
    versions: {
        coverURL: string;
        hash: string;
    }[];
  }

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    cancelGenerationRef.current = false;
    const file = event.target.files?.[0];
    if (!file) return;

    setCardFormModal(false);
    createAlerts(`JSON processing...`, 'alert');
    setProgress("Reading JSON file...", 10, true);

    try {
      const text = await file.text();
      setProgress("Parsing JSON...", 20, true);

      const uploadedMaps: UploadedMap[] = JSON.parse(text);
      // Group by songHash
      const groupedMaps: { [key: string]: UploadedMap[] } = uploadedMaps.reduce(
        (acc, map) => {
          if (!acc[map.songHash]) {
            acc[map.songHash] = [];
          }
          acc[map.songHash].push(map);
          return acc;
        },
        {} as { [key: string]: UploadedMap[] }
      );

      setProgress("Starting map processing...", 30, true);

      const zip = new JSZip();
      const songHashes = Object.keys(groupedMaps);
      const totalHashes = songHashes.length;
      let processedCount = 0;

      for (const songHash of songHashes) {
        if (cancelGenerationRef.current) {
          createAlerts("Card generation cancelled by user!", "error");
          setProgress("", 0, false);
          return;
        }

        // Combine star ratings for all maps with the same songHash
        const combinedStarRatings: StarRatings = {
          ES: '',
          NOR: '',
          HARD: '',
          EXP: '',
          EXP_PLUS: '',
        };

        groupedMaps[songHash].forEach((map) => {
          switch (map.difficulty) {
            case 1:
              combinedStarRatings.ES = map.stars.toString();
              break;
            case 3:
              combinedStarRatings.NOR = map.stars.toString();
              break;
            case 5:
              combinedStarRatings.HARD = map.stars.toString();
              break;
            case 7:
              combinedStarRatings.EXP = map.stars.toString();
              break;
            case 9:
              combinedStarRatings.EXP_PLUS = map.stars.toString();
              break;
            default:
              break;
          }
        });

        try {
          let response;
          while (true) {
            try {
              response = await axios.get<MapInfo>(
                `https://api.beatsaver.com/maps/hash/${songHash}`
              );
              break;
            } catch (err: any) {
              if (err.response && err.response.status === 429) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
              } else {
                throw err;
              }
            }
          }
          const mapInfo = response.data;
          const imageDataUrl = await generateCard(mapInfo, combinedStarRatings, useBackground);
          const base64Data = imageDataUrl.split(",")[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const sanitizedSongName = mapInfo.metadata.songName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const fileName = `${sanitizedSongName}-${mapInfo.id}.png`;

          zip.file(fileName, byteArray, { binary: true });
        } catch (error: any) {
          console.error(`Error processing map with hash ${songHash}:`, error);
        } finally {
          processedCount++;
          const percent = Math.floor((processedCount / totalHashes) * 100);
          setProgress(`Processing maps (${processedCount} / ${totalHashes})`, percent, true);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "map_cards.zip");
      setProgress("ZIP file created!", 100, true);
      setTimeout(() => {
        setProgress("", 0, false);
      }, 2000);
    } catch (error: any) {
      console.error("Error processing uploaded JSON:", error);
      createAlerts(
        "Failed to process the uploaded JSON file. Please ensure it is correctly formatted.",
        "error"
      );
      setProgress("", 0, false);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="relative modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 m-16 rounded-lg animate-jump-in animate-duration-300">
        <div className='absolute top-8 right-8 text-center items-center text-lg'>
          <button
            className='bg-red-500 text-white hover:bg-red-600 rounded-md p-2 transition duration-200'
            onClick={() => setCardFormModal(false)}
          >
            <FaTimes/>
          </button>
        </div>
        {songName &&
          <div className='absolute left-0 ml-6 mt-8'>
            <h1 className='text-2xl font-bold'>Chosen Song:</h1>
            <h1 className='text-lg font-semibold'>{songName}</h1>
          </div>
        }
        <form onSubmit={getMapInfo} className='space-y-6'>
          <div className='flex flex-col md:flex-row md:space-x-6'>
            {/* Manual Inputs */}
            <div className='relative w-full bg-white dark:bg-neutral-800 p-4 rounded-lg shadow'>
              <h2 className='text-xl font-semibold mb-4'>Manual Input</h2>
              <label className='block mb-2 text-gray-700 dark:text-gray-200'>Map ID:</label>
              <input
              type='text'
              value={mapId}
              onChange={(e) => fetchName(e.target.value)}
              className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
              />
              <div className='absolute w-full bg-white dark:bg-neutral-800 p-6 left-0'/>
            </div>

            {/* Automatic Inputs */}
            <div className='w-full bg-white dark:bg-neutral-800 p-4 rounded-lg shadow'>
              <h2 className='text-xl font-semibold mb-4'>Automatic Input</h2>
              <label className='block mb-2 text-gray-700 dark:text-gray-200'>Upload JSON File:</label>
              <label className='flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition duration-200'>
              <span>Select File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className='hidden'
              />
              </label>
            </div>
          </div>

          {/* Star Ratings */}
          <div className='relative bg-white dark:bg-neutral-800 px-4 pb-4 rounded-lg'>
            <h2 className='text-xl font-semibold mb-4'>Star Ratings</h2>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
              <div className='flex flex-col'>
              <label className='mb-1 text-gray-700 dark:text-gray-200 font-medium'>Easy</label>
              <input
                type='text'
                value={starRatings.ES}
                onChange={(e) => setStarRatings({ ...starRatings, ES: e.target.value })}
                className='px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
              />
              </div>
              <div className='flex flex-col'>
              <label className='mb-1 text-gray-700 dark:text-gray-200 font-medium'>Normal</label>
              <input
                type='text'
                value={starRatings.NOR}
                onChange={(e) => setStarRatings({ ...starRatings, NOR: e.target.value })}
                className='px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
              />
              </div>
              <div className='flex flex-col'>
              <label className='mb-1 text-gray-700 dark:text-gray-200 font-medium'>Hard</label>
              <input
                type='text'
                value={starRatings.HARD}
                onChange={(e) => setStarRatings({ ...starRatings, HARD: e.target.value })}
                className='px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
              />
              </div>
              <div className='flex flex-col'>
              <label className='mb-1 text-gray-700 dark:text-gray-200 font-medium'>Expert</label>
              <input
                type='text'
                value={starRatings.EXP}
                onChange={(e) => setStarRatings({ ...starRatings, EXP: e.target.value })}
                className='px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
              />
              </div>
              <div className='flex flex-col'>
              <label className='mb-1 text-gray-700 dark:text-gray-200 font-medium'>Expert+</label>
              <input
                type='text'
                value={starRatings.EXP_PLUS}
                onChange={(e) => setStarRatings({ ...starRatings, EXP_PLUS: e.target.value })}
                className='px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
              />
              </div>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='flex items-center mb-4 md:mb-0'>
              <label className='mr-2 text-gray-700 dark:text-gray-200'>Background:</label>
              <Switch checked={useBackground} onChange={handleSwitch} />
            </div>
            <button type="submit" className='w-full md:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-200'>
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CardForm;
