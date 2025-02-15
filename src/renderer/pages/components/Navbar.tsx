import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMinus } from 'react-icons/fa';
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

useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const addToCounter = () => {
    if (easterEggCounter === 5) {
      setEasterEggCounter(0);
      return;
    }
    setEasterEggCounter(prevCounter => prevCounter + 1);
  };

  useEffect(() => {
    const currentLink = navRef.current?.querySelector('.active') as HTMLAnchorElement | null;
    if (currentLink) {
      const { offsetLeft, offsetWidth } = currentLink;
      setUnderlineStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        background: '#ffff00',
      });
    }
    getOS();
  }, [currentPath]);

  const handleMouseOver = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const { offsetLeft, offsetWidth } = event.currentTarget;
    setUnderlineStyle({
      left: `${offsetLeft}px`,
      width: `${offsetWidth}px`,
      background: '#ffff00',
    });
  };

  const handleMouseOut = () => {
    const currentLink = navRef.current?.querySelector('.active') as HTMLAnchorElement | null;
    if (currentLink) {
      const { offsetLeft, offsetWidth } = currentLink;
      setUnderlineStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        background: '#ffff00',
      });
    } else {
      setUnderlineStyle({});
    }
  };

  return (
    <div className='drag items-center justify-center bg-neutral-300 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-200 p-4 rounded-t-3xl'>
      <div className='flex text-center justify-between'>
        <div className='flex text-center items-center text-lg'>
          <img src={logo} className='no-drag h-8 mr-2' onClick={addToCounter}/>
          { easterEggCounter === 5 &&
            <img src={background} className='absolute z-50 w-80 h-auto left-56 top-20 animate-jump-in rounded-lg drop-shadow-lg hover:invert' onClick={addToCounter}/>
          }
          <h1 className='text-xl font-bold items-center'>SSRM Automation</h1>
        </div>
        <div className='no-drag flex text-center items-center text-lg'>
          <div className='no-drag text-center items-center text-lg relative' ref={navRef}>
            <Link to='/' className={`p-2 px-4 hover:active ${currentPath === '/' ? 'active text-neutral-950 dark:text-neutral-200' : 'text-neutral-400'}`} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Home</Link>
            <Link to='/titles' className={`p-2 px-4 hover:active ${currentPath === '/titles' ? 'active text-neutral-950 dark:text-neutral-200' : 'text-neutral-400'}`} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Titles</Link>
            <Link to='/mapcards' className={`p-2 px-4 hover:active ${currentPath === '/mapcards' ? 'active text-neutral-950 dark:text-neutral-200' : 'text-neutral-400'}`} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Mapcards</Link>
            <Link to='/thumbnails' className={`p-2 px-4 hover:active ${currentPath === '/thumbnails' ? 'active text-neutral-950 dark:text-neutral-200' : 'text-neutral-400'}`} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Thumbnails</Link>
            <div className='absolute bottom--1 h-1 transition-all duration-200 rounded-full' style={underlineStyle}></div>
          </div>
        </div>
        {os !== 'darwin' ? (
          <div className='no-drag text-center items-center text-lg'>
            <button
              className='hover:bg-orange-500 hover:text-white rounded-md p-2 mr-2 transition duration-200'
              onClick={minimizeWindow}
            >
              <FaMinus/>
            </button>
            <button
              className='hover:bg-red-500 hover:text-white rounded-md p-2 transition duration-200'
              onClick={clearAndCloseWindow}
            >
              <FaTimes/>
            </button>
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
