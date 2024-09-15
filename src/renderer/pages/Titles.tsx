import axios from 'axios';
import MapForm from './components/MapForm';
import React, { useState, useEffect } from 'react';
import { FaClipboard } from 'react-icons/fa';

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

interface Alert {
  id: number;
  message: string;
  fadeOut: boolean;
  type: 'success' | 'error' | 'alert';
}

const Titles: React.FC = () => {
  const [mapId, setMapId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [player, setPlayer] = useState<string>('Mr_bjo');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [mapFormModal, setMapFormModal] = useState<boolean>(false);
  const [useSubname, setUseSubname] = useState<boolean>(false);

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

  const removeMapInfo = () => {
    setMapId('');
    setMapInfo(null);
    localStorage.removeItem('mapId');
    localStorage.removeItem('mapInfo');
    createAlerts('Cleared map info!', 'alert');
  };

  const copyToClipboard = (text: string, type: 'title' | 'description') => {
    navigator.clipboard.writeText(text).then(() => {
      createAlerts(`$Copied ${type} to clipboard!`, 'success');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
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
    <div className='max-h-96 h-96 relative grid no-move justify-items-center dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-8 justify-center items-center overflow-hidden'>
      <div className='items-center justify-items-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Titles</h1>
          <p className='text-lg'>Generate your title and description here!</p>
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 rounded'
            onClick={() => setMapFormModal(true)}
          >
            Open Map Form
          </button>
          {mapInfo && (
            <div className='absolute left-0 top-0 mt-4 ml-4 z-10 drop-shadow-lg hover:drop-shadow-lg flex'>
              <div className='bg-neutral-300 dark:bg-neutral-800 mt-2 p-2 rounded-md hover:scale-110 transition duration-200'>
                <a href={mapLink} target="_blank" title="Go to BeatSaver map page">
                  <img className='w-24 h-24 rounded-t-md no-move' src={mapInfo.versions[0].coverURL} alt='Cover' />
                </a>
                <button
                  className='w-24 bg-red-500 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-b-md transition duration-200'
                  onClick={() => removeMapInfo()}
                >
                  Clear Map Info
                </button>
              </div>
            </div>
          )}
        </div>

        {mapInfo && (
          <div className='grid grid-cols-2 gap-4 mt-4'>
            <div className='flex-col w-full text-center'>
              <h1 className='text-xl font-bold'>Title:</h1>
              <div className='flex w-full'>
                <div className='flex flex-grow bg-neutral-300 dark:bg-neutral-800 mt-2 p-4 rounded-l-md'>
                  <div className='justify-items-center'>
                    <h1 className='flex text-md'>{mapInfo.metadata.songName} {mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}{mapInfo.metadata.songAuthorName} | {mapInfo.metadata.levelAuthorName} | {difficulty}</h1>
                  </div>
                </div>
                <button
                  className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-2 rounded-r-xl'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName}${mapInfo.metadata.songSubName ? ` ${mapInfo.metadata.songSubName} | ` : ' | '}${mapInfo.metadata.songAuthorName} | ${mapInfo.metadata.levelAuthorName} | ${difficulty}`, 'title')}
                >
                  Copy
                </button>
              </div>
            </div>
            <div className='flex-col w-full text-center'>
              <h1 className='text-xl font-bold'>Description:</h1>
              <div className='flex w-full'>
                <div className='flex flex-grow bg-neutral-300 dark:bg-neutral-800 mt-2 p-4 rounded-l-md'>
                  <div className='flex-col justify-items-center'>
                    <h1 className='flex text-md'>{mapInfo.metadata.songName} by {mapInfo.metadata.songAuthorName}</h1>
                    <h1 className='flex text-sm'>Mapped by {mapInfo.metadata.levelAuthorName}</h1>
                    <h1 className='flex text-sm'>Map Link: {mapLink}</h1>
                    <h1 className='flex text-sm'>Gameplay by {player}</h1>
                  </div>
                </div>
                <button
                  className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-2 rounded-r-xl'
                  onClick={() => copyToClipboard(`${mapInfo.metadata.songName} by ${mapInfo.metadata.songAuthorName}\nMapped by ${mapInfo.metadata.levelAuthorName}\nMap Link: ${mapLink}\nGameplay by ${player}`, 'description')}
                >
                  Copy
                </button>
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
      {mapFormModal && (
        <MapForm
          mapId={mapId}
          setMapId={setMapId}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          useSubname={useSubname}
          setUseSubname={setUseSubname}
          player={player}
          setPlayer={setPlayer}
          setMapInfo={setMapInfo}
          setMapFormModal={setMapFormModal}
        />
          )}
    </div>
  );
}

export default Titles
