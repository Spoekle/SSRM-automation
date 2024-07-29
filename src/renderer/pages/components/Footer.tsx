import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function Footer() {

  const [isDarkMode, setIsDarkMode] = useState(() => {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' ? true : false;
  })

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
      setIsDarkMode(!isDarkMode);
  };

  return (
    <div className='bg-neutral-800 text-gray-200'>
      <div className='items-center justify-center'>
        <div className='flex justify-between text-center p-4'>
          <div className='flex text-center justify-center text-xl'>
            <h1 className='text-md py-2 px-3 mt-4 mx-3 lg:mt-0'>ScoreSaber Ranked Maps - Automation</h1>
            <p className='text-sm py-2 px-3 mt-4 mx-3 lg:mt-0'>Created by Spoekle</p>
          </div>
          <button onClick={toggleDarkMode} className="py-2 px-3 mt-4 mx-3 lg:mt-0 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200">
            {isDarkMode ? <FaSun className="transition duration-200" /> : <FaMoon className="transition duration-200" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Footer
