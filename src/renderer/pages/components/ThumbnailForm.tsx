import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { generateThumbnail } from '../../../main/helper';

interface ThumbnailFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  setThumbnailFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
}

const ThumbnailForm: React.FC<ThumbnailFormProps> = ({
  mapId,
  setMapId,
  setThumbnailFormModal,
  setMapInfo,
  setImageSrc
}) => {
  const [songName, setSongName] = React.useState('');
  const [chosenDiff, setChosenDiff] = React.useState('ES');

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setThumbnailFormModal(false);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
        const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
        const data = response.data;
        setMapInfo(data);
        localStorage.setItem('mapId', `${mapId}`);
        localStorage.setItem('mapInfo', JSON.stringify(data));

        // Generate the image and set it to state
        const image = await generateThumbnail(data, chosenDiff);
        setImageSrc(image);

        console.log(data);
        setThumbnailFormModal(false);
    } catch (error) {
        console.error('Error fetching map info:', error);
    }
  };


  const fetchName = async (mapId: string) => {
    if (mapId === '') (
      setSongName('')
    )
    setMapId(mapId)
    try {
      const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
      const data = response.data;
      setSongName(data.metadata.songName);
      return data.metadata.songName;
    } catch (error) {
      console.error('Error fetching map info:', error);
    }
  }

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="relative modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 rounded-lg animate-jump-in animate-duration-300">
        {songName &&
          <div className='absolute right-0 mr-8 text-right'>
            <h1 className='text-2xl font-bold'>Chosen Song:</h1>
            <h1 className='text-lg font-semibold'>{songName}</h1>
          </div>
        }
        <form onSubmit={getMapInfo}>
          <h1 className='text-2xl font-bold'>Reweight Form</h1>
          <div className='flex flex-col justify-center items-center mt-2'>
            <div className='flex gap-8 text-center'>
            <div className='flex flex-col text-center'>
              <label>Map ID:</label>
              <input
                type='text'
                value={mapId}
                onChange={(e) => fetchName(e.target.value)}
                className='w-24 border rounded p-2 text-neutral-950 mt-1'
              />
            </div>
            <div className='flex flex-col text-center'>
              <label>Difficulty:</label>
              <select
                className='w-24 border rounded p-2 text-neutral-950 mt-1'
                onChange={(e) => setChosenDiff(e.target.value)}
              >
                <option value='ES'>Easy</option>
                <option value='NOR'>Normal</option>
                <option value='HARD'>Hard</option>
                <option value='EXP'>Expert</option>
                <option value='EXP_PLUS'>Expert+</option>
              </select>
            </div>
            </div>
          </div>
          <div className='flex flex-col'>
            <button type="submit" className='bg-blue-500 text-white p-2 rounded'>Generate</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ThumbnailForm;
