import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import log from 'electron-log';
import Home from './pages/Home';
import Titles from './pages/Titles/Titles';
import MapCards from './pages/Cards/MapCards';
import Thumbnails from './pages/Thumbnails/Thumbnails';
import Navbar from './pages/components/Navbar';
import Footer from './pages/components/Footer';
import SplashScreen from './pages/SplashScreen/SplashScreen';
import './App.css';

export default function App() {
  const appVersion = '1.7.2';
  const [isSplashScreen, setIsSplashScreen] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');

  const getLatestVersion = async () => {
    try {
      const response = await axios.get(
        'https://api.github.com/repos/Spoekle/SSRM-automation/releases/latest'
      );
      const data = response.data;
      setLatestVersion(data.tag_name.replace(/^v/, ''));
    } catch (error) {
      log.error('Error fetching latest version:', error);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    setIsSplashScreen(queryParams.get('splash') === 'true');
    getLatestVersion();
  }, []);

  if (isSplashScreen) {
    return <SplashScreen appVersion={appVersion} />;
  }

  return (
    <Router>
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/titles" element={<Titles />} />
          <Route path="/mapcards" element={<MapCards />} />
          <Route path="/thumbnails" element={<Thumbnails />} />
        </Routes>
      </div>
      <Footer appVersion={appVersion} latestVersion={latestVersion} />
    </Router>
  );
}
