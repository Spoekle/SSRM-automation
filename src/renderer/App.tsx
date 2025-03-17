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
import { ConfirmationModalProvider } from './contexts/ConfirmationModalContext';

export default function App() {
  const appVersion = '2.0.0-beta.3';
  const [isSplashScreen, setIsSplashScreen] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDevBranch, setIsDevBranch] = useState(() => {
    return localStorage.getItem('useDevelopmentBranch') === 'true';
  });

  const getLatestVersion = async () => {
    try {
      setIsLoading(true);
      log.info(`Fetching latest version from GitHub for ${isDevBranch ? 'development' : 'stable'} branch...`);

      // Get all releases including pre-releases
      const response = await axios.get(
        'https://api.github.com/repos/Spoekle/SSRM-automation/releases',
        { timeout: 10000 }
      );

      let versionToUse;

      if (isDevBranch) {
        // For dev branch - find the latest pre-release
        const preRelease = response.data.find((release: any) => release.prerelease);
        versionToUse = preRelease?.tag_name || '';

        // If no pre-release found, fall back to latest stable
        if (!versionToUse) {
          const stableRelease = response.data.find((release: any) => !release.prerelease);
          versionToUse = stableRelease?.tag_name || '';
        }
      } else {
        // For stable branch - find the latest stable release
        const stableRelease = response.data.find((release: any) => !release.prerelease);
        versionToUse = stableRelease?.tag_name || '';
      }

      const latest = versionToUse.replace(/^v/, '');
      setLatestVersion(latest);
      log.info(`Latest ${isDevBranch ? 'development' : 'stable'} version fetched successfully: ${latest}`);
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
      // Check for branch changes and forceVersionCheck flag
      const checkDevBranch = localStorage.getItem('useDevelopmentBranch') === 'true';
      const forceVersionCheck = localStorage.getItem('forceVersionCheck') === 'true';

      if (checkDevBranch !== isDevBranch || forceVersionCheck) {
        // Branch has changed or force check is requested
        setIsDevBranch(checkDevBranch);
        localStorage.removeItem('forceVersionCheck');
        getLatestVersion();
      } else {
        // Normal startup
        getLatestVersion();
      }
    }

    // Check if branch setting has changed
    const branchChangeHandler = () => {
      const newDevBranchSetting = localStorage.getItem('useDevelopmentBranch') === 'true';
      if (newDevBranchSetting !== isDevBranch) {
        setIsDevBranch(newDevBranchSetting);
        getLatestVersion();
      }
    };

    window.addEventListener('storage', branchChangeHandler);
    return () => {
      window.removeEventListener('storage', branchChangeHandler);
    };
  }, [isDevBranch]);

  if (isSplashScreen) {
    return <SplashScreen appVersion={appVersion} />;
  }

  return (
    <Router>
      <ConfirmationModalProvider>
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
          isDevBranch={isDevBranch}
        />
      </ConfirmationModalProvider>
    </Router>
  );
}
