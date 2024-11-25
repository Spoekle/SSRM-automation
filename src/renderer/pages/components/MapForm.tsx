import React, { FormEvent } from 'react';
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
  setMapFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
}

const MapForm: React.FC<MapFormProps> = ({
  mapId,
  setMapId,
  difficulty,
  setDifficulty,
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
      localStorage.setItem('mapInfo', JSON.stringify(data)); // Serialize the mapInfo object
      console.log(data);
      setMapFormModal(false);
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 rounded-lg animate-jump-in animate-duration-300">
        <form onSubmit={getMapInfo}>
            <h1 className='text-2xl font-bold'>Get Info</h1>
            <div className='flex mt-2'>
                <div className='flex flex-col mr-2'>
                    <div className='flex flex-col'>
                        <label>Map ID:</label>
                        <input
                          type='text'
                          value={mapId}
                          onChange={(e) => setMapId(e.target.value)}
                          className='w-24 border rounded p-2 text-neutral-950 mt-1'
                        />
                    </div>
                    <div className='flex flex-col my-2'>
                        <label>Use Subname?</label>
                        <input
                          type='checkbox'
                          checked={useSubname}
                          onChange={(e) => setUseSubname(e.target.checked)}
                          className='w-24 border rounded p-2 text-neutral-950 mt-1'
                        />
                    </div>
                </div>
                <div className='flex flex-col ml-2'>
                    <div className='flex flex-col'>
                        <label>Difficulty:</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className='w-24 border rounded p-2 text-neutral-950 mt-1'
                        >
                          <option value="Easy">Easy</option>
                          <option value="Normal">Normal</option>
                          <option value="Hard">Hard</option>
                          <option value="Expert">Expert</option>
                          <option value="Expert+">Expert+</option>
                        </select>
                    </div>
                    <div className='flex flex-col my-2'>
                        <label>Player:</label>
                        <select
                          value={player}
                          onChange={(e) => setPlayer(e.target.value)}
                          className='w-24 border rounded p-2 text-neutral-950 mt-1'
                        >
                          <option value="Mr_bjo">Mr_bjo</option>
                          <option value="yabje">yabje</option>
                          <option value="BigOlDumplin">BigOlDumplin</option>
                          <option value="RaccoonVR">RaccoonVR</option>
                          <option value="voltage">voltage</option>
                          <option value="olliemine">olliemine</option>
                        </select>
                    </div>
                </div>

            </div>
            <div className='flex flex-col'>
                <button type="submit" className='bg-blue-500 text-white p-2 rounded mt-2'>Generate</button>
            </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default MapForm;
