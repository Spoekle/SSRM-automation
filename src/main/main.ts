import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';
import { spawn, exec } from 'child_process';
import { installFfmpeg } from './ffmpeg-installer';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import log from 'electron-log';
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

ipcMain.handle('update-application', async (event) => {
  try {
    log.info('Update application handler triggered');
    let useDevelopmentBranch = false;
    try {
      const result = await event.sender.executeJavaScript(
        'localStorage.getItem("useDevelopmentBranch")'
      );
      useDevelopmentBranch = result === 'true';
    } catch (e) {
      log.error('Error reading branch preference:', e);
    }

    const response = await axios.get('https://api.github.com/repos/Spoekle/SSRM-automation/releases');

    let targetRelease;
    if (useDevelopmentBranch) {
      targetRelease = response.data.find((release: any) => release.prerelease);
      if (!targetRelease) {
        targetRelease = response.data.find((release: any) => !release.prerelease);
      }
    } else {
      targetRelease = response.data.find((release: any) => !release.prerelease);
    }

    if (!targetRelease) {
      throw new Error('No release found.');
    }

    let asset;
    if (process.platform === 'win32') {
      asset = targetRelease.assets.find((a: any) => a.name.endsWith('.exe'));
    } else if (process.platform === 'darwin') {
      asset = targetRelease.assets.find((a: any) => a.name.endsWith('.dmg'));
    } else if (process.platform === 'linux') {
      asset = targetRelease.assets.find((a: any) => a.name.endsWith('.AppImage'));
    }

    if (!asset) {
      throw new Error(`No suitable executable found for ${process.platform} platform.`);
    }

    const downloadPath = path.join(os.tmpdir(), asset.name);
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

    return new Promise((resolve, reject) => {
      writer.on('finish', async () => {
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('update-progress', 'Download complete. Installing update...');
        });
        try {
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
    width: 300,
    height: 420,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    show: false,
    icon: getAssetPath('favicon-32x32.png'),
    webPreferences: {
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
    transparent: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 720, y: 25 },
    icon: getAssetPath('favicon-32x32.png'),
    webPreferences: {
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
