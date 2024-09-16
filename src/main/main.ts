/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import axios from 'axios';

// Import and run the backend server
require('./server');  // Add this to run the backend before the frontend starts

let updateCheckTimeout: NodeJS.Timeout | null = null;

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    this.checkForUpdates();
    autoUpdater.on('update-available', () => {
      // Notify user or show update UI
      console.log('Update available');
    });
    autoUpdater.on('update-downloaded', () => {
      // Notify user or show update ready UI
      console.log('Update downloaded');
    });
    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
    });
  }

  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // Add method to manually check for updates
  triggerUpdate() {
    autoUpdater.checkForUpdates();
  }
}

const appUpdater = new AppUpdater();

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

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

const createSplashWindow = async () => {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));

  splashWindow.on('closed', () => {
    splashWindow = null;
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
    frame: false,
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

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      if (splashWindow) {
        splashWindow.close();
      }
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

  new AppUpdater();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(async () => {
    //await createSplashWindow();
    // Simulate checking for updates or backend calls
    //setTimeout(async () => {
      await createMainWindow();
    //}, 5000); // Adjust the delay to match actual update checking process
    app.on('activate', () => {
      if (mainWindow === null) createMainWindow();
    });
  })
  .catch(console.log);

// Communication with preload and renderer for updates
ipcMain.on('check-update', async () => {
  // This should contact your backend instead of GitHub directly
  // Your backend should hit the GitHub releases API and return version info
  const latestVersion = await getLatestVersion();
  const currentVersion = app.getVersion();

  if (latestVersion !== currentVersion) {
    splashWindow?.webContents.send('update-available');
  }
});

ipcMain.on('trigger-update', () => {
  if (updateCheckTimeout) {
    clearTimeout(updateCheckTimeout);
  }

  // Check for updates and then initiate the update process
  appUpdater.triggerUpdate();

  // If you want to show the splash screen while updating
  // splashWindow.show();  // Assuming you have a splashWindow

  // Listen for update status and perform actions
  autoUpdater.on('update-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available');
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded');
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });
});

// Call this when you want to update the app
ipcMain.on('update-app', () => {
  autoUpdater.quitAndInstall();
});
