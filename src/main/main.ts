import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';
import { spawn, exec } from 'child_process';
import { installFfmpeg } from './ffmpeg-installer';
import { app, BrowserWindow, shell, ipcMain, WebContents } from 'electron';
import log from 'electron-log';
import { FontLibrary } from 'skia-canvas';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

require('./server');

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const installExtensions = async () => {
  if (isDebug) {
    try {
      const installer = require('electron-devtools-installer');
      const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
      const extensions = ['REACT_DEVELOPER_TOOLS'];

      return await installer.default(
        extensions.map((name) => installer[name]),
        forceDownload,
      );
    } catch (error) {
      log.error('Failed to install extensions:', error);
      return null;
    }
  }
  return null;
};

ipcMain.handle('load-fonts', async () => {
  try {
    const fonts = FontLibrary.use('Aller', ["../../../assets/fonts/Aller_It.ttf"]);
    return fonts.length;
  } catch (error) {
    log.error('Error loading fonts:', error);
    return [];
  }
});

ipcMain.handle('generate-batch-thumbnail', async (event, backgroundUrl: string, month: string, backgroundTransform?: { scale: number; x: number; y: number }) => {
  try {
    const { generateBatchThumbnail } = await import('./generation/thumbnails/batchThumbnailGenerator');
    return await generateBatchThumbnail(backgroundUrl, month, backgroundTransform);
  } catch (error) {
    log.error('Error generating batch thumbnail:', error);
    throw error;
  }
});

ipcMain.handle('generate-ssrm-thumbnail', async (event, mapData: any, chosenDiff: string, starRatings: any, backgroundImage: string) => {
  try {
    const { generateSsrmThumbnail } = await import('./generation/thumbnails/ssrmThumbnailGenerator');
    return await generateSsrmThumbnail(mapData, chosenDiff as any, starRatings, backgroundImage);
  } catch (error) {
    log.error('Error generating SSRM thumbnail:', error);
    throw error;
  }
});

ipcMain.handle('check-scoresaber', async () => {
  try {
    const response = await axios.get('https://scoresaber.com/api/', {
      timeout: 5000
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    log.error('ScoreSaber API check failed:', error);
    return false;
  }
});

ipcMain.handle('check-beatsaver', async () => {
  try {
    const response = await axios.get('https://api.beatsaver.com/maps/id/3d56e', {
      timeout: 5000
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    log.error('BeatSaver API check failed:', error);
    return false;
  }
});

ipcMain.handle('splash-complete', () => {
  return createMainWindow().then(() => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    return true;
  });
});

ipcMain.handle('force-check-update', async () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  await createSplashWindow(true);
  return true;
});

ipcMain.handle('check-ffmpeg', async () => {
  return new Promise<boolean>((resolve) => {
    exec('ffmpeg -version', (error, stdout, stderr) => {
      resolve(!error);
    });
  });
});

ipcMain.handle('install-ffmpeg', async (event) => {
  await installFfmpeg((progress) => {
    event.sender.send('ffmpeg-install-progress', progress);
  });
  return true;
});

ipcMain.handle('reinstall-ffmpeg', async (event) => {
  await installFfmpeg((progress) => {
    event.sender.send('ffmpeg-install-progress', progress);
  });
  return true;
});

ipcMain.handle('check-handler-exists', (event, channelName) => {
  const channelHandlers = ipcMain.eventNames().includes(channelName);
  return channelHandlers;
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

interface GitHubRelease {
  tag_name: string;
  prerelease: boolean;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
}

ipcMain.handle('update-application', async (event, options: { useStable?: boolean; targetVersion?: string } = {}) => {
  const { useStable = false, targetVersion = null } = options;

  try {
    log.info('=== UPDATE APPLICATION HANDLER TRIGGERED ===');
    log.info(`Options: useStable=${useStable}, targetVersion=${targetVersion || 'not specified'}`);

    let useDevelopmentBranch = false;

    // Read the branch preference from localStorage if not explicitly specified
    if (!useStable && !targetVersion) {
      try {
        // Fix typing for executeJavaScript
        const result = await (event.sender as WebContents).executeJavaScript(
          'localStorage.getItem("useDevelopmentBranch")'
        );
        useDevelopmentBranch = result === 'true';
        log.info(`Branch preference from localStorage: ${useDevelopmentBranch ? 'development' : 'stable'}`);
      } catch (e) {
        log.error('Error reading branch preference:', e);
      }
    } else {
      log.info(`Using explicit update options, ignoring localStorage branch preference`);
    }

    // Properly type the response data
    const response = await axios.get<GitHubRelease[]>('https://api.github.com/repos/Spoekle/SSRM-automation/releases');

    // Log available releases for debugging
    log.info(`Found ${response.data.length} releases. First few releases:`);
    response.data.slice(0, 3).forEach((release, i) => {
      log.info(`[${i}] ${release.tag_name} (${release.prerelease ? 'beta' : 'stable'})`);
    });

    // Group releases by type
    const stableReleases = response.data.filter((release) => !release.prerelease);
    const betaReleases = response.data.filter((release) => release.prerelease);

    log.info(`Found ${stableReleases.length} stable and ${betaReleases.length} beta releases`);

    // DECISION TREE: Determine which release to use
    let targetRelease: GitHubRelease | null = null;

    // CASE 1: Specific version requested
    if (targetVersion) {
      log.info(`Looking for specific version: ${targetVersion}`);
      const versionPatterns = [targetVersion, `v${targetVersion}`];

      for (const pattern of versionPatterns) {
        const found = response.data.find((release) =>
          release.tag_name.toLowerCase() === pattern.toLowerCase());

        if (found) {
          targetRelease = found;
          log.info(`Found exact requested version: ${targetRelease.tag_name}`);
          break;
        }
      }

      if (!targetRelease) {
        log.warn(`Requested version "${targetVersion}" not found!`);
      }
    }

    // CASE 2: Stable explicitly requested
    if (!targetRelease && useStable) {
      log.info(`Stable version explicitly requested`);
      targetRelease = stableReleases[0] || null;
      if (targetRelease) {
        log.info(`Using latest stable release: ${targetRelease.tag_name}`);
      } else {
        log.warn(`No stable releases found!`);
      }
    }

    // CASE 3: Branch-based selection
    if (!targetRelease) {
      if (useDevelopmentBranch) {
        log.info(`Using development branch selection logic`);
        targetRelease = betaReleases[0] || stableReleases[0] || null;
        log.info(`Selected release based on dev branch: ${targetRelease?.tag_name}`);
      } else {
        log.info(`Using stable branch selection logic`);
        targetRelease = stableReleases[0] || null;
        log.info(`Selected release based on stable branch: ${targetRelease?.tag_name}`);
      }
    }

    if (!targetRelease) {
      throw new Error('No release found.');
    }

    log.info(`FINAL SELECTION: ${targetRelease.tag_name} (${targetRelease.prerelease ? 'beta' : 'stable'})`);

    let asset = null;
    if (process.platform === 'win32') {
      asset = targetRelease.assets.find((a) => a.name.endsWith('.exe')) || null;
    } else if (process.platform === 'darwin') {
      asset = targetRelease.assets.find((a) => a.name.endsWith('.dmg')) || null;
    } else if (process.platform === 'linux') {
      asset = targetRelease.assets.find((a) => a.name.endsWith('.AppImage')) || null;
    }

    if (!asset) {
      throw new Error(`No suitable executable found for ${process.platform} platform.`);
    }

    // Extract the version from the selected release (without 'v' prefix)
    const versionToDownload = targetRelease.tag_name.replace(/^v/, '');
    const downloadPath = path.join(os.tmpdir(), `SSRM-automation-${versionToDownload}${path.extname(asset.name)}`);

    log.info(`Selected asset: ${asset.name}`);
    log.info(`Downloading update to: ${downloadPath}`);

    const writer = fs.createWriteStream(downloadPath);

    const downloadResponse = await axios({
      url: asset.browser_download_url,
      method: 'GET',
      responseType: 'stream',
    });

    const totalLength = parseInt(downloadResponse.headers['content-length'], 10);
    let downloaded = 0;

    downloadResponse.data.on('data', (chunk: Buffer) => {
      downloaded += chunk.length;
      const percent = Math.floor((downloaded / totalLength) * 100);
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('update-progress', `Downloading update... ${percent}%`);
      });
    });

    downloadResponse.data.pipe(writer);

    return new Promise<string>((resolve, reject) => {
      writer.on('finish', async () => {
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('update-progress', 'Download complete. Installing update...');
        });
        try {
          log.info(`Download completed for version ${versionToDownload}`);
          if (process.platform === 'win32') {
            const child = spawn(downloadPath, {
              detached: true,
              stdio: 'ignore',
              shell: true,
            });
            child.unref();

            let countdown = 2;
            const interval = setInterval(() => {
              BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send('update-progress', `Restarting application in ${countdown}...`);
              });
              countdown--;
              if (countdown < 0) {
                clearInterval(interval);
                BrowserWindow.getAllWindows().forEach(win => {
                  win.webContents.send('update-progress', 'Restarting application...');
                });
                app.quit();
              }
            }, 1000);
          } else if (process.platform === 'darwin') {
            await shell.openPath(downloadPath);
            BrowserWindow.getAllWindows().forEach(win => {
              win.webContents.send('update-progress', 'DMG file opened. Please follow the installation instructions.');
            });
          } else {
            await fs.promises.chmod(downloadPath, '755');
            await shell.openPath(path.dirname(downloadPath));
            BrowserWindow.getAllWindows().forEach(win => {
              win.webContents.send('update-progress', 'AppImage downloaded. Please run it to install the update.');
            });
          }
          resolve('Update process started');
        } catch (error) {
          log.error('Error in update process:', error);
          reject(error);
        }
      });
      writer.on('error', (err) => {
        log.error('Error downloading update:', err);
        reject(err);
      });
    });
  } catch (error) {
    log.error('Error updating application:', error);
    throw error;
  }
});

const createSplashWindow = async (forceCheck = false) => {
  if (splashWindow !== null) {
    return;
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  splashWindow = new BrowserWindow({
    show: false,
    width: 300,
    height: 420,
    resizable: false,
    transparent: false,
    titleBarStyle: 'hidden',
    alwaysOnTop: true,
    icon: getAssetPath('favicon-32x32.png'),
    webPreferences: {
      nodeIntegrationInWorker: true,
      nodeIntegration: true,
      contextIsolation: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  const forceCheckParam = forceCheck ? '&forceCheck=true' : '';
  splashWindow.loadURL(resolveHtmlPath('index.html', `?splash=true${forceCheckParam}`));

  splashWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.show();
    }
  });
};

const createMainWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 800,
    height: 518,
    resizable: false,
    transparent: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 720, y: 25 },
    icon: getAssetPath('favicon-32x32.png'),
    webPreferences: {
      nodeIntegrationInWorker: true,
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  ipcMain.on('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('close-window', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.on('open-devtools', () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      (input.key === 'F12' ||
      (input.control && input.shift && input.key.toLowerCase() === 'i') ||
      (input.meta && input.alt && input.key.toLowerCase() === 'i'))
    ) {
      mainWindow?.webContents.openDevTools();
      event.preventDefault();
    }
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  return mainWindow;
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(async () => {
    await createSplashWindow();
  })
  .catch(log.error);
