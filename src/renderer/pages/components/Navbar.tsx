import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMinus, FaHome, FaFileAlt, FaLayerGroup, FaImage } from 'react-icons/fa';
import { motion } from 'framer-motion';
import logo from '../../../../assets/icons/logo.svg';
import background from '../../../../assets/images/easter.png';

const { ipcRenderer } = window.require('electron');

const Navbar: React.FC = () => {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [easterEggCounter, setEasterEggCounter] = useState(0);
  const [os, setOS] = useState('');
  const isDarkMode = localStorage.getItem('theme') === 'dark';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const minimizeWindow = () => {
    ipcRenderer.send('minimize-window');
  };

  const clearAndCloseWindow = () => {
    localStorage.removeItem('mapId');
    localStorage.removeItem('mapInfo');
    ipcRenderer.send('close-window');
  };

  const getOS = () => {
    const os = window.require('os');
    setOS(os.platform());
  };

  const addToCounter = () => {
    if (easterEggCounter === 5) {
      setEasterEggCounter(0);
      return;
    }
    setEasterEggCounter(prevCounter => prevCounter + 1);
  };

  useEffect(() => {
    getOS();
  }, []);

  const navItems = [
    { path: '/', label: 'Home', icon: <FaHome className="mr-1" /> },
    { path: '/titles', label: 'Titles', icon: <FaFileAlt className="mr-1" /> },
    { path: '/mapcards', label: 'Mapcards', icon: <FaLayerGroup className="mr-1" /> },
    { path: '/thumbnails', label: 'Thumbnails', icon: <FaImage className="mr-1" /> }
  ];

  return (
    <div className='drag items-center justify-center bg-neutral-300 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-200 rounded-t-3xl shadow-md border-b border-neutral-200/30 dark:border-neutral-800/30'>
      <div className='mx-4 flex text-center justify-between'>
        <div className='flex text-center items-center text-lg'>
          <motion.img
            src={logo}
            className='no-drag h-8 mr-2'
            onClick={addToCounter}
            whileHover={{ rotate: 10, scale: 1.1 }}
            whileTap={{ rotate: -10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          {easterEggCounter === 5 &&
            <motion.img
              src={background}
              className='absolute z-50 w-80 h-auto left-56 top-20 rounded-lg drop-shadow-lg hover:invert'
              onClick={addToCounter}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            />
          }
          <h1 className='ml-1 text-xl text-left font-bold items-center'>
            SSRM Automation
          </h1>
        </div>
        <div className='mx-2 my-2 no-drag flex text-center items-center'>
          <div className='no-drag text-center items-center text-md relative' ref={navRef}>
            <div className="flex space-x-1 bg-neutral-200 dark:bg-neutral-800 rounded-full px-2 py-1 shadow-inner">
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    className={`p-2 px-4 rounded-full flex items-center hover:text-blue-500 dark:hover:text-blue-400 transition-colors ${
                      location.pathname === item.path
                        ? 'bg-white dark:bg-neutral-700 shadow-md text-blue-600 dark:text-blue-400'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {os !== 'darwin' ? (
          <div className='no-drag text-center items-center text-lg flex space-x-2'>
            <motion.button
              className='hover:bg-orange-500 hover:text-white rounded-full p-2 transition duration-200 bg-neutral-200 dark:bg-neutral-800 shadow-md'
              onClick={minimizeWindow}
              whileHover={{ scale: 1.1, backgroundColor: "#f97316" }}
              whileTap={{ scale: 0.9 }}
            >
              <FaMinus/>
            </motion.button>
            <motion.button
              className='hover:bg-red-500 hover:text-white rounded-full p-2 transition duration-200 bg-neutral-200 dark:bg-neutral-800 shadow-md'
              onClick={clearAndCloseWindow}
              whileHover={{ scale: 1.1}}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes/>
            </motion.button>
          </div>
        ) : (
          <div className='no-drag mx-10 text-center items-center text-lg'>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
