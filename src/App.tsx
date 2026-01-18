import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Titles from './pages/Titles/Titles';
import MapCard from './pages/Cards/MapCard';
import ReweightCard from './pages/Cards/ReweightCard';
import BatchThumbnail from './pages/Thumbnails/BatchThumbnail';
import SSRMThumbnail from './pages/Thumbnails/SSRMThumbnail';
import Scripts from './pages/Scripts/Scripts';
import Playlist from './pages/Playlists/Playlist';
import PlaylistThumbnail from './pages/Playlists/PlaylistThumbnail';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import GlobalLoadedMap from './components/GlobalLoadedMap';
import './App.css';
import { ConfirmationModalProvider } from './contexts/ConfirmationModalContext';

// Simple logger replacement for electron-log
const log = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
};

export default function App() {
  const appVersion = '3.0.0-beta.1';
  const [latestVersion, setLatestVersion] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDevBranch, setIsDevBranch] = useState(() => {
    return localStorage.getItem('useDevelopmentBranch') === 'true';
  });

  const getLatestVersion = async () => {
    try {
      const devBranch = localStorage.getItem('useDevelopmentBranch') === 'true';
      setIsLoading(true);
      log.info(
        `Fetching latest version from GitHub for ${devBranch ? 'development' : 'stable'} branch...`
      );

      const response = await axios.get(
        'https://api.github.com/repos/Spoekle/SSRM-automation/releases',
        { timeout: 10000 }
      );

      // Store which branch we last used
      localStorage.setItem('lastUsedBranch', devBranch ? 'dev' : 'stable');

      // Find the latest stable release
      const stableRelease = response.data.find(
        (release: { prerelease: boolean }) => !release.prerelease
      );
      const latestStableVersion = stableRelease
        ? stableRelease.tag_name.replace(/^v/, '')
        : '';
      localStorage.setItem('latestStableVersion', latestStableVersion);

      let versionToUse;

      if (devBranch) {
        const preRelease = response.data.find(
          (release: { prerelease: boolean }) => release.prerelease
        );
        versionToUse = preRelease?.tag_name || '';

        if (!versionToUse) {
          versionToUse = stableRelease?.tag_name || '';
        }
      } else {
        versionToUse = stableRelease?.tag_name || '';
      }

      const latest = versionToUse.replace(/^v/, '');
      setLatestVersion(latest);
      log.info(
        `Latest ${devBranch ? 'development' : 'stable'} version fetched successfully: ${latest}, Latest stable: ${latestStableVersion}`
      );
      return latest;
    } catch (error) {
      log.error('Error fetching latest version:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkDevBranch = localStorage.getItem('useDevelopmentBranch') === 'true';

    if (checkDevBranch !== isDevBranch) {
      setIsDevBranch(checkDevBranch);
    }
    getLatestVersion();

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

  return (
    <Router>
      <ConfirmationModalProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
          <Navbar />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar isolate">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/titles" element={<Titles />} />
              <Route path="/scripts" element={<Scripts />} />
              <Route path="/cards/map" element={<MapCard />} />
              <Route path="/cards/reweight" element={<ReweightCard />} />
              <Route path="/thumbnails/batch" element={<BatchThumbnail />} />
              <Route path="/thumbnails/ssrm" element={<SSRMThumbnail />} />
              <Route path="/playlists/playlist" element={<Playlist />} />
              <Route path="/playlists/playlist-thumbnail" element={<PlaylistThumbnail />} />
            </Routes>
          </main>

          <Footer
            appVersion={appVersion}
            latestVersion={latestVersion}
            isVersionLoading={isLoading}
            isDevBranch={isDevBranch}
            getLatestVersion={getLatestVersion}
          />
        </div>
        <GlobalLoadedMap />
      </ConfirmationModalProvider>
    </Router>
  );
}

