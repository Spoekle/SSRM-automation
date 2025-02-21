import React, { useState, useEffect, useRef } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { FaDownload } from 'react-icons/fa';
import CardForm from './components/CardForm';
import StarRatingForm from './components/ReweightForm';
import LoadedMap from '../components/LoadedMap';

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

interface Alert {
  id: number;
  message: string;
  fadeOut: boolean;
  type: 'success' | 'error' | 'alert';
}

interface StarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EX: string;
  EXP: string;
}

interface Progress {
  process: string;
  progress: number;
  visible: boolean;
}

const MapCards: React.FC = () => {
  const [mapId, setMapId] = useState<string>('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [progress, setProgress] = useState<Progress>({process: "", progress: 0, visible: false });
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [cardFormModal, setCardFormModal] = useState<boolean>(false);
  const [starRatingFormModal, setStarRatingFormModal] = useState<boolean>(false);
  const [starRatings, setStarRatings] = useState<StarRatings>({ ES: "", NOR: "", HARD: "", EX: "", EXP: "" });
  const [oldStarRatings, setOldStarRatings] = useState<StarRatings>({ ES: "", NOR: "", HARD: "", EX: "", EXP: "" });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [useBackground, setUseBackground] = React.useState(true);
  const cancelGenerationRef = useRef(false);

  useEffect(() => {
    const storedMapId = localStorage.getItem('mapId');
    if (storedMapId) {
      setMapId(storedMapId);
    }
    const storedMapInfo = localStorage.getItem('mapInfo');
    if (storedMapInfo) {
      setMapInfo(JSON.parse(storedMapInfo));
    }
    const storedStarRatings = localStorage.getItem('starRatings');
    if (storedStarRatings) {
      setStarRatings(JSON.parse(storedStarRatings));
    }
    const storedOldStarRatings = localStorage.getItem('oldStarRatings');
    if (storedOldStarRatings) {
      setOldStarRatings(JSON.parse(storedOldStarRatings));
    }
  }, []);

  const removeMapInfo = () => {
    setMapId('');
    setMapInfo(null);
    setImageSrc(null);
    localStorage.removeItem('mapId');
    localStorage.removeItem('mapInfo');
    localStorage.removeItem('starRatings');
    localStorage.removeItem('oldStarRatings');
    createAlerts('Cleared map info!', 'alert');
  };

  const downloadCard = () => {
    const link = document.createElement('a');
    link.href = imageSrc || '';
    link.download = `${mapInfo?.metadata.songName} - ${mapInfo?.metadata.songAuthorName} - ${mapInfo?.metadata.levelAuthorName}.png`;
    document.body.appendChild(link);
    link.click();
    createAlerts('Downloaded card!', 'success');
    document.body.removeChild(link);

  };


  const createAlerts = (text: string, type: 'success' | 'error' | 'alert') => {
    const id = new Date().getTime();
    setAlerts([...alerts, { id, message: `${text}`, type, fadeOut: false }]);
    setTimeout(() => {
      setAlerts(alerts => alerts.map(alert => alert.id === id ? { ...alert, fadeOut: true } : alert));
      setTimeout(() => {
        setAlerts(alerts => alerts.filter(alert => alert.id !== id));
      }, 500);
    }, 2000);
  };

  const mapLink = `https://beatsaver.com/maps/${mapId}`;

  return (
    <div className='max-h-96 h-96 relative grid no-move justify-items-center justify-center items-center dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-8 overflow-hidden'>
      <div className='items-center justify-items-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Mapcard Generator</h1>
          <p className='text-lg'>Generate a mapcard in a single click!</p>
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 mx-2 rounded-lg hover:scale-110 transition duration-200 drop-shadow-lg'
            onClick={() => setCardFormModal(true)}
          >
            Open Map Form
          </button>
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 mx-2 rounded-lg hover:scale-110 transition duration-200 drop-shadow-lg'
            onClick={() => setStarRatingFormModal(true)}
          >
            Open Reweight Form
          </button>
          {imageSrc && (
            <>
              <button
                className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg ml-4 hover:scale-110 transition duration-200 drop-shadow-lg'
                onClick={() => downloadCard()}
              >
                <FaDownload className='inline' /> Download
              </button>
            </>
          )}
          {mapInfo && <LoadedMap mapInfo={mapInfo} />}
        </div>
        {imageSrc && (
          <div className='mt-4 flex justify-center'>
            <div className='flex flex-col items-center text-center'>
              <h1 className='text-xl font-bold'>Preview:</h1>
              <div className='w-3/5 flex justify-center drop-shadow-lg'>
                <img src={imageSrc} alt='Card Preview' className='block mt-2' />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className='absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end space-y-2 overflow-hidden z-60'>
        {alerts.map(alert => (
          <div key={alert.id} className={`flex items-center justify-center px-4 py-2 ${alert.type === 'success' ? 'bg-green-600' : alert.type === 'error' ? 'bg-red-600' : 'bg-blue-600'} rounded-md drop-shadow-lg animate-fade-left ${alert.fadeOut ? 'animate-fade-out' : ''}`}>
            <p className='text-white'>{alert.message}</p>
          </div>
        ))}
      </div>

      <div className='absolute bottom-0 w-[90vw] items-center justify-center mb-4 z-60'>
        {progress.visible && (
          <div className='flex flex-col w-full text-center items-center justify-center bg-neutral-300 dark:bg-neutral-800 p-4 rounded-md drop-shadow-lg animate-fade'>
            <div className="w-full px-4 relative">
        <p className='text-lg font-bold mb-2'>{progress.process}</p>
        <div className='relative'>
          <LinearProgress
            sx={{
              height: 30,
              backgroundColor: "#171717",
              "& .MuiLinearProgress-bar": { backgroundColor: "#2563eb" }
            }}
            variant="determinate"
            value={progress.progress}
            className='w-full rounded-full text-white'
          />
          <span className='absolute inset-0 flex items-center justify-center text-white font-bold'>
            {progress.progress}%
          </span>
        </div>
        <button
          className='mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200'
          onClick={() => {
            cancelGenerationRef.current = true;
            setProgress({ process: "", progress: 0, visible: false });
          }}
        >
          Cancel
        </button>
            </div>
          </div>
        )}
      </div>

      {cardFormModal && (
        <CardForm
          mapId={mapId}
          setMapId={setMapId}
          starRatings={starRatings}
          setStarRatings={setStarRatings}
          setMapInfo={setMapInfo}
          setCardFormModal={setCardFormModal}
          setImageSrc={setImageSrc}
          useBackground={useBackground}
          setUseBackground={setUseBackground}
          createAlerts={createAlerts}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          cancelGenerationRef={cancelGenerationRef}
        />
      )}
      {starRatingFormModal && (
        <StarRatingForm
          mapId={mapId}
          setMapId={setMapId}
          oldStarRatings={oldStarRatings}
          setOldStarRatings={setOldStarRatings}
          newStarRatings={starRatings}
          setNewStarRatings={setStarRatings}
          setMapInfo={setMapInfo}
          setStarRatingFormModal={setStarRatingFormModal}
          setImageSrc={setImageSrc}
          createAlerts={createAlerts}
          progress={(process: string, progress: number, visible: boolean) => setProgress({ process, progress, visible })}
          cancelGenerationRef={cancelGenerationRef}
        />
      )}
    </div>
  );
}

export default MapCards;
