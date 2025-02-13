import React from 'react';

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

const LoadedMap: React.FC<{ mapInfo: MapInfo }> = ({ mapInfo }) => {
  const mapLink = mapInfo ? `https://beatsaver.com/maps/${mapInfo.id}` : '';

  return (
    <div className='absolute left-0 top-0 mt-4 ml-4 z-10 drop-shadow-lg hover:drop-shadow-lg flex'>
      <div className='bg-neutral-300 dark:bg-neutral-800 mt-2 p-2 rounded-md hover:scale-110 transition duration-200'>
        <a href={mapLink} target="_blank" rel="noopener noreferrer" title="Go to BeatSaver map page">
          <img className='w-24 h-24 rounded-md no-move' src={mapInfo.versions[0].coverURL} alt='Cover' />
        </a>
      </div>
    </div>
  );
};

export default LoadedMap;
