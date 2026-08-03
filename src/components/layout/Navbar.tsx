import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
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
import NotificationDropdown from './NotificationDropdown';
import TaskDropdown from './TaskDropdown';

function Navbar() {
  const navRef = useRef<HTMLDivElement>(null);
  const isMac = typeof window !== 'undefined' && (
    (navigator.userAgent && navigator.userAgent.toUpperCase().includes('MAC'))
  );

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
      <div className="relative mx-4 my-2 flex text-center">
        <div className="flex text-center items-center text-lg">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <Link to="/" className={`flex cursor-pointer ${isMac ? 'items-end' : 'items-center'}`}>
              <img
                src={logo}
                className={`mr-2 ${isMac ? 'h-8 mr-6' : 'h-10'}`}
              />

              <div>
                <h1 className="ml-1 text-lg text-left font-bold items-center">
                  SSRM
                </h1>
                <p className="ml-1 -mt-2 text-sm text-left font-semibold text-neutral-600 dark:text-neutral-400">
                  Automation
                </p>
                <p className="ml-1 -mt-1 text-xs text-left font-medium text-neutral-500 dark:text-neutral-500">
                  by Spoekle
                </p>
              </div>
            </Link>
          </motion.div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex text-center items-center">
          <div
            className="text-center items-center text-md relative"
            ref={navRef}
          >
            <div className="z-20 flex space-x-1 bg-neutral-200/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-inner border border-neutral-300/50 dark:border-neutral-700/50">
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
        <div className="absolute right-0 -bottom-2 flex space-x-2 text-center items-center bg-neutral-200/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-t-lg px-1 py-0.5 shadow-inner border border-neutral-300/50 dark:border-neutral-700/50">
          <TaskDropdown />
          <NotificationDropdown />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
