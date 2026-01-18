import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaTimes,
  FaMinus,
  FaFileAlt,
  FaLayerGroup,
  FaImage,
  FaList,
  FaScroll,
  FaExchangeAlt,
  FaImages,
  FaStar,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getCurrentWindow } from '@tauri-apps/api/window';
import logo from '../../../assets/icons/icon.png';
import DropdownMenu from '../ui/DropdownMenu';

function Navbar() {
  const navRef = useRef<HTMLDivElement>(null);
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
    if ((e.target as HTMLElement).closest('button, a, .no-drag')) {
      return;
    }
    try {
      const appWindow = getCurrentWindow();
      await appWindow.startDragging();
    } catch (error) {
    }
  };

  const navCategories = [
    {
      label: 'Text',
      icon: <FaFileAlt className="mr-1" />,
      activeColor: 'blue',
      items: [
        { path: '/titles', label: 'Titles', icon: <FaFileAlt /> },
        { path: '/scripts', label: 'Scripts', icon: <FaScroll /> },
      ],
    },
    {
      label: 'Cards',
      icon: <FaLayerGroup className="mr-1" />,
      activeColor: 'purple',
      items: [
        { path: '/cards/map', label: 'Map Card', icon: <FaLayerGroup /> },
        { path: '/cards/reweight', label: 'Reweight', icon: <FaExchangeAlt /> },
      ],
    },
    {
      label: 'Thumbnails',
      icon: <FaImage className="mr-1" />,
      activeColor: 'yellow',
      items: [
        { path: '/thumbnails/batch', label: 'Batch', icon: <FaImages /> },
        { path: '/thumbnails/ssrm', label: 'SSRM', icon: <FaStar /> },
      ],
    },
    {
      label: 'Playlists',
      icon: <FaList className="mr-1" />,
      activeColor: 'amber',
      items: [
        { path: '/playlists/playlist', label: 'Playlist', icon: <FaList /> },
        { path: '/playlists/playlist-thumbnail', label: 'Thumbnail', icon: <FaImage /> },
      ],
    },
  ];

  return (
    <div
      role="presentation"
      onMouseDown={handleDragStart}
      className="glass-subtle items-center justify-center text-neutral-950 dark:text-neutral-200 shadow-md select-none cursor-default relative z-50"
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
              <p className="ml-1 -mt-1 text-xs text-left font-medium text-neutral-500 dark:text-neutral-500">
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
            <div className="z-20 flex space-x-1 bg-neutral-200/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-inner border border-neutral-300/50 dark:border-neutral-700/50">
              {/* Dropdown categories */}
              {navCategories.map((category) => (
                <DropdownMenu
                  key={category.label}
                  label={category.label}
                  icon={category.icon}
                  items={category.items}
                  activeColor={category.activeColor}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="text-center items-center text-lg flex space-x-1">
          <motion.button
            onClick={minimizeWindow}
            whileHover={{
              scale: 1.1,
            }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg hover:bg-neutral-400/20 dark:hover:bg-neutral-700/50 transition-all duration-200"
            title="Minimize"
          >
            <FaMinus className="text-neutral-500 dark:text-neutral-400" />
          </motion.button>
          <motion.button
            onClick={closeWindow}
            whileHover={{
              scale: 1.1,
            }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-all duration-200 group"
            title="Close"
          >
            <FaTimes className="text-neutral-500 dark:text-neutral-400 group-hover:text-red-500 transition-colors" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
