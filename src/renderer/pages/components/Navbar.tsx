import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMinus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import logo from '../../../../assets/icons/logo.svg';
import background from '../../../../assets/images/easter.png';

const { ipcRenderer } = window.require('electron');

const Navbar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [underlineStyle, setUnderlineStyle] = useState({});
  const navRef = useRef<HTMLDivElement>(null);
  const [easterEggCounter, setEasterEggCounter] = useState(0);
  const [os, setOS] = useState('');
  const isDarkMode = localStorage.getItem('theme') === 'dark';
  const [activeTab, setActiveTab] = useState(currentPath);
  const [isHovering, setIsHovering] = useState(false);

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

  // Update the active tab when the route changes
  useEffect(() => {
    setActiveTab(currentPath);
    updateUnderlinePosition(currentPath);
  }, [currentPath]);

  // Initialize on component mount
  useEffect(() => {
    getOS();
    updateUnderlinePosition(currentPath);
  }, []);

  // Function to update underline position based on path
  const updateUnderlinePosition = (path: string) => {
    if (!navRef.current) return;

    const navItem = navRef.current.querySelector(`a[href="${path}"]`);
    if (navItem) {
      const { offsetLeft, offsetWidth } = navItem as HTMLElement;
      setUnderlineStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        backgroundColor: '#3b82f6',
        height: '4px',
        bottom: '-4px',
        position: 'absolute',
        borderRadius: '9999px'
      });
    }
  };

  const handleMouseOver = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHovering) return;
    setIsHovering(true);
    const { offsetLeft, offsetWidth } = event.currentTarget;
    setUnderlineStyle({
      left: `${offsetLeft}px`,
      width: `${offsetWidth}px`,
      backgroundColor: '#3b82f6',
      height: '4px',
      bottom: '-4px',
      position: 'absolute',
      borderRadius: '9999px'
    });
  };

  const handleMouseOut = () => {
    setIsHovering(false);
    updateUnderlinePosition(activeTab);
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/titles', label: 'Titles' },
    { path: '/mapcards', label: 'Mapcards' },
    { path: '/thumbnails', label: 'Thumbnails' }
  ];

  return (
    <motion.div
      className='drag items-center justify-center bg-neutral-300 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-200 p-4 rounded-t-3xl'
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
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
          <motion.h1
            className='text-xl font-bold items-center'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            SSRM Automation
          </motion.h1>
        </div>
        <div className='no-drag flex text-center items-center text-lg'>
          <div className='no-drag text-center items-center text-lg relative' ref={navRef}>
            <motion.div
              className="flex space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, staggerChildren: 0.1 }}
            >
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    className={`p-2 px-4 hover:text-neutral-950 dark:hover:text-neutral-200 transition-colors ${
                      activeTab === item.path ? 'text-neutral-950 dark:text-neutral-200' : 'text-neutral-400'
                    }`}
                    onMouseEnter={handleMouseOver}
                    onMouseLeave={handleMouseOut}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              className='rounded-full'
              layout
              style={underlineStyle}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            />
          </div>
        </div>
        {os !== 'darwin' ? (
          <motion.div
            className='no-drag text-center items-center text-lg'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
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
          </motion.div>
        ) : (
          <div className='no-drag text-center items-center text-lg'>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Navbar;
