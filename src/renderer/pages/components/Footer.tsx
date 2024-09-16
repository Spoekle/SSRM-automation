import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { FaSun, FaMoon, FaGithub } from 'react-icons/fa';

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
    <div className='no-move items-center justify-items-center bg-neutral-200 dark:bg-neutral-900 text-neutral-950 dark:text-neutral-200 rounded-b-3xl drop-shadow-xl'>
      <div className='flex justify-between items-center p-4'>
        <div className='flex text-center justify-between'>
          <p className='text-sm py-2 px-3 mx-3'>Created by Spoekle</p>
        </div>
        <div className='flex text-center justify-between' >
          <a href='https://github.com/Spoekle/SSRM-automation' className='py-2 px-3 mx-3 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200'><FaGithub/></a>
          <button onClick={toggleDarkMode} className="py-2 px-3 mx-3 bg-transparent hover:bg-black/20 hover:scale-110 rounded-md transition duration-200">
            {isDarkMode ? <FaSun className="transition duration-200" /> : <FaMoon className="transition duration-200" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Footer
