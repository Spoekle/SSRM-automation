import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import "tailwindcss/tailwind.css";

function PartialLeftBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className='flex bg-gray-200'>
      <div className='flex-none w-64 h-screen m-4'>
        <button onClick={toggleMenu} className="w-full h-10 grid grid-cols-2 hover:scale-[1.025] leading-tight uppercase transition ease-in-out duration-150">
            <p className="w-10 h-10 flex items-center justify-center rounded-l-lg bg-red-800 text-white font-semibold text-lg">X</p>
            <p className='w-full h-10 flex items-center justify-center rounded-r-lg bg-neutral-400 text-white font-semibold text-lg'>Clip Sesh!</p>
        </button>
        <div id='menu' className="grid grid-cols-1 gap-3 mt-4">
          <Link to="/">
            <p className="w-full bg-blue-600 text-center py-5 rounded-lg text-white font-semibold text-lg hover:scale-[1.025] leading-tight uppercase hover:bg-blue-500 transition ease-in-out duration-150">Back</p>
          </Link>
          <Link to="/view">
            <p className="w-full bg-blue-600 text-center py-5 rounded-lg text-white font-semibold text-lg hover:scale-[1.025] leading-tight uppercase hover:bg-blue-500 transition ease-in-out duration-150">Watch some clips!</p>
          </Link>
          <Link to="/upload">
            <p className="w-full bg-blue-600 text-center py-5 rounded-lg text-white font-semibold text-lg hover:scale-[1.025] leading-tight uppercase hover:bg-blue-500 transition ease-in-out duration-150">Upload Clips...</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PartialLeftBar