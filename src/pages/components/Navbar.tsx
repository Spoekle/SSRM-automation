import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTimes,
  FaMinus,
  FaFileAlt,
  FaLayerGroup,
  FaImage,
  FaList,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import logo from '../../../assets/icons/icon.png';

function Navbar() {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [os, setOS] = useState('windows');
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

  // Detect OS from user agent
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) {
      setOS('macos');
    } else if (ua.includes('linux')) {
      setOS('linux');
    } else {
      setOS('windows');
    }
  }, []);

  const minimizeWindow = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const closeWindow = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    // Only start dragging if clicking on the navbar background, not on buttons/links
    if ((e.target as HTMLElement).closest('button, a, .no-drag')) {
      return;
    }
    try {
      const appWindow = getCurrentWindow();
      await appWindow.startDragging();
    } catch (error) {
      // Ignore errors
    }
  };

  const navItems = [
    {
      path: '/titles',
      label: 'Titles',
      icon: <FaFileAlt className="mr-1" />,
    },
    {
      path: '/mapcards',
      label: 'Mapcards',
      icon: <FaLayerGroup className="mr-1" />,
    },
    {
      path: '/thumbnails',
      label: 'Thumbnails',
      icon: <FaImage className="mr-1" />,
    },
    {
      path: '/playlists',
      label: 'Playlists',
      icon: <FaList className="mr-1" />,
    },
  ];

  return (
    <div
      role="presentation"
      onMouseDown={handleDragStart}
      className="items-center justify-center bg-neutral-300 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-200 shadow-md border-b border-neutral-200/30 dark:border-neutral-800/30 select-none cursor-default"
    >
      <div className="mx-4 flex text-center justify-between">
        <div className="flex text-center items-center text-lg">
          <motion.img
            src={logo}
            className="h-8 mr-2 hover:cursor-pointer"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center cursor-pointer"
          >
            <Link to="/">
              <h1 className="ml-1 text-lg text-left font-bold items-center">
                SSRM
              </h1>
              <p className="ml-1 -mt-2 text-sm text-left font-semibold text-neutral-600 dark:text-neutral-400">
                Automation
              </p>
              <p className="ml-1 -mt-1 text-xs text-left font-semibold text-neutral-600 dark:text-neutral-400">
                by Spoekle
              </p>
            </Link>
          </motion.div>
        </div>
        <div className="mx-2 my-2 flex text-center items-center">
          <div
            className="text-center items-center text-md relative"
            ref={navRef}
          >
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
        <div className="text-center items-center text-lg flex space-x-2">
          {os !== 'macos' && (
            <>
              <motion.button
                onClick={minimizeWindow}
                whileHover={{
                  scale: 1.1,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-neutral-400/30 dark:hover:bg-neutral-700/50 transition-colors"
                title="Minimize"
              >
                <FaMinus className="text-neutral-600 dark:text-neutral-400" />
              </motion.button>
              <motion.button
                onClick={closeWindow}
                whileHover={{
                  scale: 1.1,
                  backgroundColor: 'rgba(239, 68, 68, 0.3)',
                }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-red-400/30 transition-colors"
                title="Close"
              >
                <FaTimes className="text-neutral-600 dark:text-neutral-400 hover:text-red-500" />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
