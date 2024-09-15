import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMinus } from 'react-icons/fa';
import logo from '../../../../assets/icons/logo.svg';

const { ipcRenderer } = window.require('electron');

const Navbar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [underlineStyle, setUnderlineStyle] = useState({});
  const navRef = useRef<HTMLDivElement>(null);

  const minimizeWindow = () => {
    ipcRenderer.send('minimize-window');
  };

  const clearAndCloseWindow = () => {
    localStorage.removeItem('mapId');
    localStorage.removeItem('mapInfo');
    ipcRenderer.send('close-window');
  };

  useEffect(() => {
    const currentLink = navRef.current?.querySelector('.active') as HTMLAnchorElement | null; // Ensure type safety
    if (currentLink) {
      const { offsetLeft, offsetWidth } = currentLink;
      setUnderlineStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
        background: '#ffff00',
      });
    }
  }, [currentPath]);

  return (
    <div className='drag items-center justify-center bg-neutral-300 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-200 p-4 rounded-t-3xl'>
      <div className='flex text-center justify-between'>
        <div className='flex text-center items-center text-lg'>
          <img src={logo} className='h-8 mr-2'/>
          <h1 className='text-xl font-bold items-center'>SSRM Automation</h1>
        </div>
        <div className='no-drag flex text-center items-center text-lg'>
          <div className='no-drag text-center items-center text-lg relative' ref={navRef}>
            <Link to='/' className={`text-neutral-950 dark:text-neutral-200 p-2 mx-2 ${currentPath === '/' ? 'active' : ''}`}>Home</Link>
            <Link to='/titles' className={`text-neutral-950 dark:text-neutral-200 p-2 mx-2 ${currentPath === '/titles' ? 'active' : ''}`}>Titles</Link>
            <Link to='/mapcards' className={`text-neutral-950 dark:text-neutral-200 p-2 mx-2 ${currentPath === '/mapcards' ? 'active' : ''}`}>Mapcards</Link>
            <Link to='/thumbnails' className={`text-neutral-950 dark:text-neutral-200 p-2 mx-2 ${currentPath === '/thumbnails' ? 'active' : ''}`}>Thumbnails</Link>
            <div className='absolute bottom-0 h-1 transition-all duration-200 rounded-full' style={underlineStyle}></div>
          </div>
        </div>
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
      </div>
    </div>
  );
}

export default Navbar;
