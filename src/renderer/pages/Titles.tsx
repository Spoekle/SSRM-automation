import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';


function Titles() {
  const [mapId, setMapId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [useSubname, setUseSubname] = useState(true);
  const [mapInfo, setMapInfo] = useState<any>(null);

  const getMapInfo = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      setMapInfo(response.data);
      if (useSubname === false) {
        response.data.metadata.songSubName = '';
      }
      setDifficulty(difficulty);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  };

  return (
    <div className='grid justify-items-center dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-900 p-4 pt-8 justify-center items-center'>
      <div className='items-center justify-items-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold'>Titles</h1>
          <p className='text-lg'>Generate your title and description here!</p>
        </div>
        <div className='items-center justify-center'>
          <form onSubmit={getMapInfo}>
            <div>
              <label className='text-lg'>Map ID:</label>
              <input
                type='text'
                id='mapId'
                name='mapId'
                className='border border-gray-600 dark:bg-neutral-200 bg-neutral-800 text-neutral-200  dark:text-neutral-950 rounded px-2 py-1 ml-2'
                value={mapId}
                onChange={(e) => setMapId(e.target.value)}
              />
              <label className='text-lg ml-4'>Use Subname?</label>
              <input
                type='checkbox'
                id='useSubname'
                name='useSubname'
                className='ml-2'
                value={useSubname.toString()}
                onChange={(e) => setUseSubname(e.target.checked)} // Use checked property instead of value
              />
            </div>
            <div>
              <label>Difficulty:</label>
              <select
                id="difficulty"
                name="difficulty"
                className="border border-gray-600 dark:bg-neutral-200 bg-neutral-800 text-neutral-200  dark:text-neutral-950 rounded px-2 py-1 ml-2"
                onChange={(e) => setDifficulty(e.target.value)}
                >
                <option value="Easy">Easy</option>
                <option value="Normal">Normal</option>
                <option value="Hard">Hard</option>
                <option value="Ex">Expert</option>
                <option value="Ex+">Expert+</option>
              </select>
            </div>
            <div>
              <label>Played by:</label>
              <select id="difficulty" name="difficulty" className="border border-gray-600 dark:bg-neutral-200 bg-neutral-800 text-neutral-200  dark:text-neutral-950 rounded px-2 py-1 ml-2">
                <option value="EASY">Mr_bjo</option>
                <option value="NORMAL">yabje</option>
              </select>
            </div>
            <button type='submit' className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 ml-4'>Generate</button>
          </form>
        </div>

        {mapInfo && (
          <div className='grid justify-items-start mt-4 p-4 rounded-md'>
            <div className='grid justify-items-start bg-neutral-300 dark:bg-neutral-800 mt-4 p-4 rounded-md'>
              <h1 className='text-xl font-bold'>Chosen Map:</h1>
              <div className='flex mt-4'>
                <img className='w-24 h-24 rounded-md' src={mapInfo.versions[0].coverURL} alt='Cover' />
                <div className='flex-col ml-4'>
                  <h1 className='flex text-md font-semibold'>{mapInfo.metadata.songAuthorName}</h1>
                  <h1 className='flex text-lg font-bold'>{mapInfo.metadata.songName}</h1>
                  <h1 className='flex text-md'>{mapInfo.metadata.songSubName}</h1>
                  <h1 className='flex text-md'>{mapInfo.metadata.levelAuthorName}</h1>
                </div>
              </div>
            </div>
            <div className='grid justify-items-start bg-neutral-300 dark:bg-neutral-800 mt-4 p-4 rounded-md'>
              <h1 className='text-xl font-bold'>Title:</h1>
              <div className='flex mt-4'>
                <div className='flex-col justify-items-center'>
                  <h1 className='flex text-md'>{mapInfo.metadata.songName} {mapInfo.metadata.songSubName} | {mapInfo.metadata.songAuthorName} | {mapInfo.metadata.levelAuthorName} | {difficulty}</h1>
                  <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2'>Copy</button>
                </div>
              </div>
            </div>
          </div>
        )
        }


      </div>
    </div>
  );
}

export default Titles