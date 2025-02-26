import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import Switch from '@mui/material/Switch';
import axios from 'axios';

// Utility functions for difficulty conversion
const difficultyToAbbreviated = (difficulty: string): string => {
  switch (difficulty) {
    case 'Easy':
      return 'ES';
    case 'Normal':
      return 'NOR';
    case 'Hard':
      return 'HARD';
    case 'Expert':
      return 'EX';
    case 'Expert+':
      return 'EXP';
    default:
      return difficulty;
  }
};

interface MapFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  chosenDiff: string;
  setChosenDiff: (diff: string) => void;
  useSubname: boolean;
  setUseSubname: (use: boolean) => void;
  player: string;
  setPlayer: (player: string) => void;
  setMapFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
}

const MapForm: React.FC<MapFormProps> = ({
  mapId,
  setMapId,
  chosenDiff,
  setChosenDiff,
  useSubname,
  setUseSubname,
  player,
  setPlayer,
  setMapFormModal,
  setMapInfo
}) => {

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setMapFormModal(false);
    }
  };

  const handleSwitch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUseSubname(event.target.checked);
    localStorage.setItem('useSubname', `${event.target.checked}`);
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      if (!useSubname) {
        data.metadata.songSubName = '';
      }
      setMapInfo(data);
      localStorage.setItem('mapId', `${mapId}`);
      localStorage.setItem('mapInfo', JSON.stringify(data));
      console.log(data);
      setMapFormModal(false);
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onMouseDown={handleClickOutside}
    >
      <div className="modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 rounded-lg animate-jump-in animate-duration-300">
      <form onSubmit={getMapInfo} className='space-y-6'>
        <div className='flex flex-col md:flex-row md:space-x-6'>
                <div className='flex flex-col mr-2'>
                  <div className='flex flex-col'>
                    <label>Map ID:</label>
                    <input
                      type='text'
                      value={mapId}
                      onChange={(e) => setMapId(e.target.value)}
                      className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
                    />
                  </div>
                  <div className='flex items-center mt-4 md:mb-0'>
                    <label className='mr-2 text-gray-700 dark:text-gray-200'>Use Subname:</label>
                    <Switch checked={useSubname} onChange={handleSwitch} />
                  </div>
                </div>
                <div className='flex flex-col ml-2'>
                    <div className='flex flex-col'>
                    <label className='block mb-2 text-gray-700 dark:text-gray-200'>Difficulty:</label>
                    <select
                          className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
                          value={chosenDiff}
                          onChange={(e) => {
                            const selectedDifficulty = e.target.value;
                            setChosenDiff(selectedDifficulty);
                            localStorage.setItem('chosenDiff', difficultyToAbbreviated(selectedDifficulty));
                          }}
                        >
                          <option value="Easy">Easy (ES)</option>
                          <option value="Normal">Normal (NOR)</option>
                          <option value="Hard">Hard (HARD)</option>
                          <option value="Expert">Expert (EX)</option>
                          <option value="Expert+">Expert+ (EXP)</option>
                        </select>
                    </div>
                    <div className='flex flex-col my-2'>
                      <label>Player:</label>
                      <select
                        className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-neutral-700 dark:border-gray-600 dark:text-white'
                        onChange={(e) => setPlayer(e.target.value)}
                        value={player}
                      >
                        <option value="praunt">praunt</option>
                        <option value="olliemine">olliemine</option>
                        <option value="voltage">voltage</option>
                        <option value="RaccoonVR">RaccoonVR</option>
                        <option value="BigOlDumplin">BigOlDumplin</option>
                        <option value="yabje">yabje</option>
                        <option value="Mr_bjo">Mr_bjo</option>
                      </select>
                    </div>
                </div>
            </div>
            <div className='flex justify-end'>
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

export default MapForm;
