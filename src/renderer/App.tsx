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
import GlobalLoadedMap from './components/GlobalLoadedMap';
import SplashScreen from './pages/SplashScreen/SplashScreen';
import './App.css';

export default function App() {
  const appVersion = '1.7.2';
  const [isSplashScreen, setIsSplashScreen] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getLatestVersion = async () => {
    try {
      setIsLoading(true);
      log.info('Fetching latest version from GitHub...');
      const response = await axios.get(
        'https://api.github.com/repos/Spoekle/SSRM-automation/releases/latest',
        { timeout: 10000 }
      );
      const data = response.data;
      const latest = data.tag_name.replace(/^v/, '');
      setLatestVersion(latest);
      log.info(`Latest version fetched successfully: ${latest}`);
      return latest;
    } catch (error) {
      log.error('Error fetching latest version:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const isSplash = queryParams.get('splash') === 'true';
    setIsSplashScreen(isSplash);

    if (!isSplash) {
      getLatestVersion();
    }
  }, []);

  if (isSplashScreen) {
    return <SplashScreen appVersion={appVersion} />;
  }

  return (
    <Router>
      <Navbar />
      <GlobalLoadedMap />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/titles" element={<Titles />} />
          <Route path="/mapcards" element={<MapCards />} />
          <Route path="/thumbnails" element={<Thumbnails />} />
        </Routes>
      </div>
      <Footer
        appVersion={appVersion}
        latestVersion={latestVersion}
        isVersionLoading={isLoading}
      />
    </Router>
  );
}
