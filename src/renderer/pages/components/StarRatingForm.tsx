import React, { FormEvent } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { GoTriangleRight } from "react-icons/go";
import { generateStarChange } from '../../../main/helper';

interface StarRatingFormProps {
  mapId: string;
  setMapId: (id: string) => void;
  oldStarRatings: OldStarRatings;
  setOldStarRatings: (ratings: OldStarRatings) => void;
  newStarRatings: NewStarRatings;
  setNewStarRatings: (ratings: NewStarRatings) => void;
  setStarRatingFormModal: (show: boolean) => void;
  setMapInfo: (info: any) => void;
  setImageSrc: (src: string) => void;
}

interface OldStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

interface NewStarRatings {
  ES: string;
  NOR: string;
  HARD: string;
  EXP: string;
  EXP_PLUS: string;
}

const StarRatingForm: React.FC<StarRatingFormProps> = ({
  mapId,
  setMapId,
  oldStarRatings,
  setOldStarRatings,
  newStarRatings,
  setNewStarRatings,
  setStarRatingFormModal,
  setMapInfo,
  setImageSrc
}) => {
  const [songName, setSongName] = React.useState('');
  const [chosenDiff, setChosenDiff] = React.useState('ES');

  const handleClickOutside = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if ((event.target as HTMLDivElement).classList.contains('modal-overlay')) {
      setStarRatingFormModal(false);
    }
  };

  const getMapInfo = async (event: FormEvent) => {
    event.preventDefault();
    try {
        const response = await axios.get(`https://api.beatsaver.com/maps/id/${mapId}`);
        const data = response.data;
        setMapInfo(data);
        localStorage.setItem('mapId', `${mapId}`);
        localStorage.setItem('oldStarRatings', JSON.stringify(oldStarRatings));
        localStorage.setItem('mapInfo', JSON.stringify(data));

        // Generate the image and set it to state
        const image = await generateStarChange(data, oldStarRatings, newStarRatings, chosenDiff as keyof OldStarRatings);
        setImageSrc(image);

        console.log(data);
        setStarRatingFormModal(false);
    } catch (error) {
        console.error('Error fetching map info:', error);
    }
  };

  // Get star ratings from ScoreSaber API for difficulty
  async function getStarRating(hash: string): Promise<NewStarRatings> {
    let diffs = ['1', '3', '5', '7', '9'];
    let newStarRatings: NewStarRatings = {
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
        const key = Object.keys(newStarRatings)[i] as keyof NewStarRatings;
        if (data.stars === 0) {
          newStarRatings[key] = 'Unranked';
        } else {
          newStarRatings[key] = data.stars;
        }
        localStorage.setItem('starRatings', JSON.stringify(newStarRatings));
        console.log(newStarRatings);
      } catch (error) {
        console.error(error);
      }
    }
    return newStarRatings;
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
      getStarRating(data.versions[0].hash).then((newStarRatings) => {
        setNewStarRatings(newStarRatings);
      });
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
            <div className='flex flex-col text-center'>
              <h1 className='text-2xl font-bold'>Star Rating Change:</h1>
              <p className='text-lg'>Enter the OLD star ratings for each difficulty</p>
              <div className='flex flex-col justify-center items-center my-4'>
              {chosenDiff === 'ES' && (
                <div className='flex flex-col bg-green-600 rounded px-2 py-1'>
                  <label className='font-bold'>Easy</label>
                  <div className='flex justify-center items-center'>
                    <input
                      type='text'
                      placeholder='Old'
                      value={oldStarRatings.ES}
                      onChange={(e) => setOldStarRatings({ ...oldStarRatings, ES: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1 mr-2'
                    />
                    <div className='flex justify-center'>
                      <GoTriangleRight size={28} />
                    </div>
                    <input
                      type='text'
                      placeholder='New'
                      value={newStarRatings.ES}
                      onChange={(e) => setNewStarRatings({ ...newStarRatings, ES: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1 ml-2'
                    />
                  </div>
                </div>
              )}

              {chosenDiff === 'NOR' && (
                <div className='flex flex-col bg-blue-500 rounded px-2 py-1'>
                  <label className='font-bold'>Normal</label>
                  <div className='flex justify-center items-center'>
                    <input
                      type='text'
                      value={oldStarRatings.NOR}
                      onChange={(e) => setOldStarRatings({ ...oldStarRatings, NOR: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1'
                    />
                    <div className='flex justify-center'>
                      <GoTriangleRight size={28} />
                    </div>
                    <input
                      type='text'
                      placeholder='New'
                      value={newStarRatings.NOR}
                      onChange={(e) => setNewStarRatings({ ...newStarRatings, NOR: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1 ml-2'
                    />
                  </div>
                </div>
              )}

              {chosenDiff === 'HARD' && (
                <div className='flex flex-col bg-orange-500 rounded px-2 py-1'>
                  <label className='font-bold'>Hard</label>
                  <div className='flex justify-center items-center'>
                    <input
                      type='text'
                      value={oldStarRatings.HARD}
                      onChange={(e) => setOldStarRatings({ ...oldStarRatings, HARD: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1'
                    />
                    <div className='flex justify-center'>
                      <GoTriangleRight size={28} />
                    </div>
                    <input
                      type='text'
                      placeholder='New'
                      value={newStarRatings.HARD}
                      onChange={(e) => setNewStarRatings({ ...newStarRatings, HARD: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1 ml-2'
                    />
                  </div>
                </div>
              )}

              {chosenDiff === 'EXP' && (
                <div className='flex flex-col bg-red-600 rounded px-2 py-1'>
                  <label className='font-bold'>Expert</label>
                  <div className='flex justify-center items-center'>
                    <input
                      type='text'
                      value={oldStarRatings.EXP}
                      onChange={(e) => setOldStarRatings({ ...oldStarRatings, EXP: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1'
                    />
                    <div className='flex justify-center'>
                      <GoTriangleRight size={28} />
                    </div>
                    <input
                      type='text'
                      placeholder='New'
                      value={newStarRatings.EXP}
                      onChange={(e) => setNewStarRatings({ ...newStarRatings, EXP: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1 ml-2'
                    />
                  </div>
                </div>
              )}

              {chosenDiff === 'EXP_PLUS' && (
                <div className='flex flex-col bg-purple-700 rounded px-2 py-1'>
                  <label className='font-bold'>Expert+</label>
                  <div className='flex justify-center items-center'>
                    <input
                      type='text'
                      value={oldStarRatings.EXP_PLUS}
                      onChange={(e) => setOldStarRatings({ ...oldStarRatings, EXP_PLUS: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1'
                    />
                    <div className='flex justify-center'>
                      <GoTriangleRight size={28} />
                    </div>
                    <input
                      type='text'
                      placeholder='New'
                      value={newStarRatings.EXP_PLUS}
                      onChange={(e) => setNewStarRatings({ ...newStarRatings, EXP_PLUS: e.target.value })}
                      className='w-24 border rounded p-1 text-neutral-950 mt-1 ml-2'
                    />
                  </div>
                </div>
              )}
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

export default StarRatingForm;
