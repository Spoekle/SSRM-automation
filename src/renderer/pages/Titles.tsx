import axios from 'axios';
import MapForm from './components/MapForm';
import React, { useState } from 'react';
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

interface CopyAlert {
  id: number;
  message: string;
  fadeOut: boolean;
}

const Titles: React.FC = () => {
  const [mapId, setMapId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('Easy');
  const [player, setPlayer] = useState<string>('Mr_bjo');
  const [copyAlerts, setCopyAlerts] = useState<CopyAlert[]>([]);
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [mapFormModal, setMapFormModal] = useState<boolean>(false);
  const [useSubname, setUseSubname] = useState<boolean>(false);

  const copyToClipboard = (text: string, type: 'title' | 'description') => {
    navigator.clipboard.writeText(text).then(() => {
      const id = new Date().getTime();
      setCopyAlerts([...copyAlerts, { id, message: `Copied ${type} to clipboard!`, fadeOut: false }]);
      setTimeout(() => {
        setCopyAlerts(copyAlerts => copyAlerts.map(alert => alert.id === id ? { ...alert, fadeOut: true } : alert));
        setTimeout(() => {
          setCopyAlerts(copyAlerts => copyAlerts.filter(alert => alert.id !== id));
        }, 500);  // Duration of fade-out animation
      }, 2000);  // Delay before starting fade-out
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
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
              <div className='absolute left-0 top-0 mt-4 ml-4 z-10 drop-shadow-lg'>
                <div className='bg-neutral-300 dark:bg-neutral-800 mt-2 p-2 rounded-md hover:scale-110 transition duration 200'>
                    <a href={mapLink} target="_blank"><img className='w-24 h-24 rounded-md no-move' src={mapInfo.versions[0].coverURL} alt='Cover' /></a>
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
                    <h1 className='flex text-md'>{mapInfo.metadata.songName} {mapInfo.metadata.songSubName ? `${mapInfo.metadata.songSubName} | ` : ''}{mapInfo.metadata.songAuthorName} | {mapInfo.metadata.levelAuthorName} | {difficulty}</h1>
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
      <div className='absolute top-0 right-0 mt-4 mr-4 flex flex-col items-end space-y-2'>
        {copyAlerts.map(alert => (
          <div key={alert.id} className={`flex items-center justify-center px-4 py-2 bg-green-600 rounded-md drop-shadow-lg animate-fade-left ${alert.fadeOut ? 'animate-fade-out' : ''}`}>
            <FaClipboard className='text-white mr-2'/>
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
