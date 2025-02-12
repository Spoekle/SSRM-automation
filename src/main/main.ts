import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import axios from 'axios';
import { spawn, exec } from 'child_process';
import { installFfmpeg } from './ffmpeg-installer';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

require('./server');

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
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

  ipcMain.handle('check-ffmpeg', async () => {
    return new Promise<boolean>((resolve) => {
      exec('ffmpeg -version', (error, stdout, stderr) => {
        resolve(!error);
      });
    });
  });

  ipcMain.handle('install-ffmpeg', async () => {
    await installFfmpeg();
    return true;
  });

  ipcMain.handle('reinstall-ffmpeg', async () => {
    await installFfmpeg();
    return true;
  });

  ipcMain.handle('update-application', async () => {
    try {
      const response = await axios.get('https://api.github.com/repos/Spoekle/SSRM-automation/releases/latest');
      const latestRelease = response.data;
      const asset = latestRelease.assets.find((a: any) => a.name.endsWith('.exe'));

      if (!asset) {
        throw new Error('No executable found in the latest release.');
      }

      const downloadPath = path.join(os.tmpdir(), asset.name);
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
        writer.on('finish', () => {
          BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('update-progress', 'Download complete. Installing update...');
          });
          try {
            const child = spawn(downloadPath, {
              detached: true,
              stdio: 'ignore',
              shell: true,
            });
            child.unref();
          } catch (error) {
            reject(error);
            return;
          }

          let countdown = 3;
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
          resolve('Update started');
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
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

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(async () => {

      await createMainWindow();
  })
  .catch(console.log);
