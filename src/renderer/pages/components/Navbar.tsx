import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes, FaMinus, FaHome, FaFileAlt, FaLayerGroup, FaImage, FaList } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../../../assets/icons/logo.svg';
import image1 from '../../../../assets/images/1.png';
import image2 from '../../../../assets/images/2.png';
import image3 from '../../../../assets/images/3.png';
import image4 from '../../../../assets/images/4.png';
import image5 from '../../../../assets/images/5.png';
import image6 from '../../../../assets/images/6.png';
import image7 from '../../../../assets/images/7.png';
import image8 from '../../../../assets/images/8.png';
import image9 from '../../../../assets/images/9.png';
import image10 from '../../../../assets/images/10.png';
import image11 from '../../../../assets/images/11.png';
import image12 from '../../../../assets/images/12.png';
import image13 from '../../../../assets/images/13.webp';
import image14 from '../../../../assets/images/14.png';
import image16 from '../../../../assets/images/16.png';

const { ipcRenderer } = window.require('electron');

const easterEggImages = [
  { src: image1, alt: 'Fumo Friend 1' },
  { src: image2, alt: 'Fumo Friend 2' },
  { src: image3, alt: 'Fumo Friend 3' },
  { src: image4, alt: 'Fumo Friend 4' },
  { src: image5, alt: 'Fumo Friend 5' },
  { src: image6, alt: 'Fumo Friend 6' },
  { src: image7, alt: 'Fumo Friend 7' },
  { src: image8, alt: 'Fumo Friend 8' },
  { src: image9, alt: 'Fumo Friend 9' },
  { src: image10, alt: 'Fumo Friend 10' },
  { src: image11, alt: 'Fumo Friend 11' },
  { src: image12, alt: 'Fumo Friend 12' },
  { src: image13, alt: 'Fumo Friend 13' },
  { src: image14, alt: 'Fumo Friend 14' },
  { src: image16, alt: 'Fumo Friend 16' }
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [isEasterEggVisible, setIsEasterEggVisible] = useState(false);
  const [easterEggStage, setEasterEggStage] = useState<'hidden' | 'showing' | 'hiding'>('hidden');
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

  const toggleEasterEgg = () => {
    if (isEasterEggVisible) {
      setIsEasterEggVisible(false);
      setEasterEggStage('hidden');
    } else {
      const currentCount = parseInt(localStorage.getItem('easterEggCounter') || '0', 10);
      const newCount = currentCount + 1;
      localStorage.setItem('easterEggCounter', newCount.toString());

      if (newCount >= 5) {
        setEasterEggStage('showing');
        setIsEasterEggVisible(true);
        localStorage.removeItem('easterEggCounter');
      }
    }
  };

  const closeEasterEgg = () => {
    setEasterEggStage('hiding');
    setIsEasterEggVisible(false);
    setEasterEggStage('hidden');
  };

  useEffect(() => {
    getOS();
  }, []);

  const navItems = [
    { path: '/titles', label: 'Titles', icon: <FaFileAlt className="mr-1" /> },
    { path: '/mapcards', label: 'Mapcards', icon: <FaLayerGroup className="mr-1" /> },
    { path: '/thumbnails', label: 'Thumbnails', icon: <FaImage className="mr-1" /> },
    { path: '/playlists', label: 'Playlists', icon: <FaList className="mr-1" /> }
  ];

  return (
    <div className='drag items-center justify-center bg-neutral-300 dark:bg-neutral-950 text-neutral-950 dark:text-neutral-200 shadow-md border-b border-neutral-200/30 dark:border-neutral-800/30'>
      <div className='mx-4 flex text-center justify-between'>
        <div className='flex text-center items-center text-lg'>
          <motion.img
            src={logo}
            className='no-drag h-8 mr-2 hover:cursor-pointer'
            onClick={toggleEasterEgg}
            whileHover={{ rotate: 10, scale: 1.1 }}
            whileTap={{ rotate: -10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <AnimatePresence mode="wait">
            {isEasterEggVisible && (
              <motion.div
                className='fixed inset-0 z-[60] flex items-center justify-center pointer-events-auto'
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: easterEggStage === 'showing' ? 1 : 0
                }}
                exit={{ 
                  opacity: 0,
                  transition: { duration: 0.8, ease: "easeInOut" }
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut"
                }}
              >
                <div className='absolute inset-0 bg-black/30 backdrop-blur-sm' onClick={closeEasterEgg} />

                {easterEggImages.map((image, index) => {
                  const positions = [

                    { top: '5%', left: '5%', rotate: -15 },
                    { top: '8%', left: '25%', rotate: 25 },
                    { top: '5%', left: '45%', rotate: -10 },
                    { top: '8%', left: '65%', rotate: 20 },
                    { top: '5%', right: '5%', rotate: -25 },
                    
                    { top: '30%', left: '2%', rotate: 15 },
                    { top: '45%', left: '1%', rotate: -5 },
                    { top: '60%', left: '3%', rotate: 10 },
                    { top: '30%', right: '2%', rotate: -20 },
                    { top: '45%', right: '1%', rotate: 25 },
                    { top: '60%', right: '3%', rotate: -15 },

                    { bottom: '5%', left: '5%', rotate: 20 },
                    { bottom: '8%', left: '25%', rotate: -25 },
                    { bottom: '5%', left: '45%', rotate: 15 },
                    { bottom: '8%', left: '65%', rotate: -10 },
                    { bottom: '5%', right: '5%', rotate: 25 }
                  ];
                  
                  const position = positions[index] || { 
                    top: `${20 + (index * 15) % 60}%`, 
                    left: `${5 + (index * 20) % 90}%`, 
                    rotate: (index * 30) % 360 - 180 
                  };
                  
                  return (
                    <motion.div
                      key={index}
                      className='absolute pointer-events-none z-10'
                      style={{
                        top: position.top,
                        left: position.left,
                        right: position.right,
                        bottom: position.bottom,
                      }}
                      initial={{ 
                        opacity: 0, 
                        scale: 0.3, 
                        rotate: position.rotate - 180,
                        y: 100 
                      }}
                      animate={{ 
                        opacity: 0.8, 
                        scale: [0.3, 1.2, 1], 
                        rotate: position.rotate,
                        y: [100, -20, 0]
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.3, 
                        rotate: position.rotate + 180,
                        y: -100 
                      }}
                      transition={{ 
                        delay: index * 0.15,
                        duration: 0.8,
                        ease: "easeOut",
                        scale: { duration: 1, ease: "backOut" }
                      }}
                      whileHover={{ 
                        scale: 1.1, 
                        rotate: position.rotate + 10,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <motion.img
                        src={image.src}
                        alt={image.alt}
                        className='w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-lg'
                        animate={{
                          y: [0, -8, 0],
                          rotate: [position.rotate, position.rotate + 5, position.rotate - 5, position.rotate]
                        }}
                        transition={{
                          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                          rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        }}
                      />
                    </motion.div>
                  );
                })}

                <motion.div
                  className='relative bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md mx-4 z-20'
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ 
                    opacity: easterEggStage === 'showing' ? 1 : 0, 
                    y: easterEggStage === 'showing' ? 0 : 50,
                    scale: easterEggStage === 'showing' ? 1 : 0.8
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 50, 
                    scale: 0.8,
                    transition: { duration: 0.5, ease: "easeInOut" }
                  }}
                  transition={{ 
                    delay: 0.3,
                    duration: 0.6, 
                    ease: "backOut",
                    type: "spring", 
                    stiffness: 200, 
                    damping: 20 
                  }}
                >
                  <motion.button
                    className='absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors shadow-lg z-30'
                    onClick={closeEasterEgg}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  >
                    <FaTimes className='w-3 h-3' />
                  </motion.button>

                  <div className='text-center space-y-4'>
                    <motion.div 
                      className='text-3xl font-bold'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      🎉 Fumo Party! 🎉
                    </motion.div>
                    
                    <motion.div 
                      className='text-lg text-neutral-700 dark:text-neutral-300 font-medium'
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      why did you make me do this bitz...
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='no-drag flex items-center cursor-pointer'
            >
              <Link to="/">
                <h1 className='ml-1 text-lg text-left font-bold items-center'>
                  SSRM
                </h1>
                <p className='ml-1 -mt-2 text-sm text-left font-semibold text-neutral-600 dark:text-neutral-400'>
                  Automation
                </p>
                <p className='ml-1 -mt-1 text-xs text-left font-semibold text-neutral-600 dark:text-neutral-400'>
                  by Spoekle
                </p>
              </Link>
          </motion.div>
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
