import axios from 'axios';
import ThumbnailForm from './components/ThumbnailForm';
import React, { useEffect, useState } from 'react';
import { FaClipboard } from 'react-icons/fa';
import background from '../../../assets/background.png';
import html2canvas from 'html2canvas';

interface MapInfo {
  metadata: {
    songAuthorName: string;
    songName: string;
    songSubName: string;
    levelAuthorName: string;
  };
  versions: {
    coverURL: string;
  }[];
}

interface CopyAlert {
  id: number;
  message: string;
  fadeOut: boolean;
}

const Thumbnails: React.FC = () => {
  const [mapId, setMapId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [player, setPlayer] = useState<string>('Mr_bjo');
  const [copyAlerts, setCopyAlerts] = useState<CopyAlert[]>([]);
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [thumbnailFormModal, setThumbnailFormModal] = useState<boolean>(false);
  const [useSubname, setUseSubname] = useState<boolean>(false);

  const mapLink = `https://beatsaver.com/maps/${mapId}`;

  useEffect(() => {
    const storedMapId = localStorage.getItem('mapId');
    if (storedMapId) {
      setMapId(storedMapId);
    }
    const storedMapInfo = localStorage.getItem('mapInfo');
    if (storedMapInfo) {
      setMapInfo(JSON.parse(storedMapInfo));
    }
  }, []);

  return (
    <div className='max-h-96 h-96 relative grid no-move justify-items-center dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-8 justify-center items-center overflow-hidden'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold'>Thumbnails <span className='text-sm font-semibold'>(beta)</span></h1>
        <p className='text-lg'>Generate your thumbnail here!</p>
        <button
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 rounded cursor-not-allowed'
          onClick={() => setThumbnailFormModal(true)}
          disabled
        >
          Open Thumbnail Form
        </button>
        {mapInfo && (
          <div className='absolute left-0 top-0 mt-4 ml-4 z-10 drop-shadow-lg'>
            <div className='bg-neutral-300 dark:bg-neutral-800 mt-2 p-2 rounded-md hover:scale-110 transition duration 200'>
              <a href={mapLink} target="_blank"><img className='w-24 h-24 rounded-md no-move' src={mapInfo.versions[0].coverURL} alt='Cover' /></a>
            </div>
          </div>
        )}
      </div>

      {mapInfo && (
        <div className='mt-4'>
          <div className='overflow-auto'>
            <div className='flex-col w-full h-full text-center'>
              <h1 className='text-xl font-bold px-4 py-2 bg-red-600 rounded-md drop-shadow-lg'>No thumbnail generation possible yet!</h1>
            </div>
          </div>
        </div>
      )}
      <div className='absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end space-y-2'>
        {copyAlerts.map(alert => (
          <div key={alert.id} className={`flex items-center justify-center px-4 py-2 bg-green-600 rounded-md drop-shadow-lg animate-fade-left ${alert.fadeOut ? 'animate-fade-out' : ''}`}>
            <FaClipboard className='text-white mr-2'/>
            <p className='text-white'>{alert.message}</p>
          </div>
        ))}
      </div>
      {thumbnailFormModal && (
        <ThumbnailForm
          mapId={mapId}
          setMapId={setMapId}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          useSubname={useSubname}
          setUseSubname={setUseSubname}
          player={player}
          setPlayer={setPlayer}
          setMapInfo={setMapInfo}
          setMapFormModal={setThumbnailFormModal}
        />
      )}
    </div>
  );
}

export default Thumbnails;
