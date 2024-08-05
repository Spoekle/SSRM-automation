import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

const UpdateAlert = ({ setMapFormModal }) => {
  const [showModal, setShowModal] = useState(false);

  // Replace with actual GitHub repository details
  const repoOwner = 'Spoekle';
  const repoName = 'SSRM-automation';

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`);
        if (response.ok) {
          const data = await response.json();
          const latestVersion = data.tag_name; // Assuming tag_name is used for versioning
          const currentVersion = process.env.REACT_APP_VERSION; // Replace with your current app version

          if (latestVersion && latestVersion !== currentVersion) {
            const skipUpdate = localStorage.getItem('skipUpdate');
            if (!skipUpdate || skipUpdate !== 'true') {
              setShowModal(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    checkForUpdate();
  }, []);

  const handleClickOutside = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
      setShowModal(false);
      setMapFormModal(false);
    }
  };

  const handleUpdate = () => {
    localStorage.setItem('skipUpdate', 'true'); // Remember user choice to skip update
    location.reload(); // Replace with actual update logic
  };

  const handleSkip = () => {
    localStorage.setItem('skipUpdate', 'true'); // Remember user choice to skip update
    setShowModal(false);
  };

  if (!showModal) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-overlay fixed inset-0 bg-white/10 backdrop-blur-lg flex justify-center items-center z-50 rounded-3xl animate-fade animate-duration-200"
      onClick={handleClickOutside}
    >
      <div className="modal-content bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 p-6 rounded-lg animate-jump-in animate-duration-300">
        <h1 className='text-2xl font-bold'>New Version Available!</h1>
        <p className='text-lg'>A new version of the tool is available. Please update to get the latest version.</p>
        <div className="flex justify-between mt-4">
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2'
            onClick={handleUpdate}
          >
            Update
          </button>
          <button
            className='bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded'
            onClick={handleSkip}
          >
            Skip Version
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpdateAlert;
