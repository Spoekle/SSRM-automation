import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMinus } from 'react-icons/fa';
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

  // Initialize on component mount
  useEffect(() => {
    getOS();
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/titles', label: 'Titles' },
    { path: '/mapcards', label: 'Mapcards' },
    { path: '/thumbnails', label: 'Thumbnails' }
  ];

  return (
    <div className='drag items-center justify-center bg-neutral-300 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-200 p-4 rounded-t-3xl'>
      <div className='flex text-center justify-between'>
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
          <h1 className='text-xl font-bold items-center'>
            SSRM Automation
          </h1>
        </div>
        <div className='no-drag flex text-center items-center text-lg'>
          <div className='no-drag text-center items-center text-lg relative' ref={navRef}>
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    className={`p-2 px-4 hover:text-neutral-950 dark:hover:text-neutral-200 transition-colors relative ${
                      location.pathname === item.path ? 'text-neutral-950 dark:text-neutral-200' : 'text-neutral-400'
                    }`}
                  >
                    {item.label}
                    {location.pathname === item.path && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-full"
                        layoutId="navUnderline"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        {os !== 'darwin' ? (
          <div className='no-drag text-center items-center text-lg'>
            <motion.button
              className='hover:bg-orange-500 hover:text-white rounded-md p-2 mr-2 transition duration-200'
              onClick={minimizeWindow}
              whileHover={{ scale: 1.1, backgroundColor: "#f97316" }}
              whileTap={{ scale: 0.9 }}
            >
              <FaMinus/>
            </motion.button>
            <motion.button
              className='hover:bg-red-500 hover:text-white rounded-md p-2 transition duration-200'
              onClick={clearAndCloseWindow}
              whileHover={{ scale: 1.1, backgroundColor: "#ef4444" }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes/>
            </motion.button>
          </div>
        ) : (
          <div className='no-drag text-center items-center text-lg'>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
