// Tauri API bridge - replaces Electron IPC with Tauri commands
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save } from '@tauri-apps/plugin-dialog';

// ... (rest of imports/constants) ...

// Native dialog helpers
// Native dialog helpers
export const nativeDialog = {
  // @deprecated Use selectFile('video') instead
  selectVideoFile: async (): Promise<string | null> => {
    return nativeDialog.selectFile('video');
  },

  selectFile: async (type: 'image' | 'video' | 'any' = 'any'): Promise<string | null> => {
    try {
        let filters = [];
        if (type === 'video') {
            filters = [{ name: 'Video', extensions: ['mp4', 'mkv', 'avi', 'mov'] }];
        } else if (type === 'image') {
            filters = [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }];
        } else {
             filters = [{ name: 'Media', extensions: ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mkv', 'avi', 'mov'] }];
        }

        const file = await open({
           multiple: false,
           filters: filters
        });
        // Handle Tauri v2 return type (can be null, string, or string[] depending on options)
        // With multiple: false, it returns string | null on desktop
        return file ? (typeof file === 'string' ? file : (file as any).path) : null;
    } catch (e) {
        console.error('Dialog error:', e);
        return null;
    }
  },

  saveImage: async (base64Data: string, defaultName: string): Promise<boolean> => {
      try {
          console.log('[saveImage] Opening save dialog for:', defaultName);
          const path = await save({
              defaultPath: defaultName,
              filters: [{ name: 'Image', extensions: ['png', 'jpg'] }]
          });

          if (!path) {
              console.log('[saveImage] User cancelled save dialog');
              return false;
          }

          console.log('[saveImage] Saving to path:', path);
          console.log('[saveImage] Data length:', base64Data.length);

          await invoke('save_file', { path, dataBase64: base64Data });
          console.log('[saveImage] File saved successfully');
          return true;
      } catch (e) {
          console.error('[saveImage] Save error:', e);
          return false;
      }
  },

  saveFile: async (base64Data: string, defaultName: string, filters: { name: string; extensions: string[] }[]): Promise<boolean> => {
      try {
          console.log('[saveFile] Opening save dialog for:', defaultName);
          const path = await save({
              defaultPath: defaultName,
              filters: filters
          });

          if (!path) {
              console.log('[saveFile] User cancelled save dialog');
              return false;
          }

          console.log('[saveFile] Saving to path:', path);
          console.log('[saveFile] Data length:', base64Data.length);

          await invoke('save_file', { path, dataBase64: base64Data });
          console.log('[saveFile] File saved successfully');
          return true;
      } catch (e) {
           console.error('[saveFile] Save error:', e);
           return false;
      }
  }
};


// Simple logger
const log = {
  info: (...args: unknown[]) => console.log('[Tauri]', ...args),
  error: (...args: unknown[]) => console.error('[Tauri Error]', ...args),
  warn: (...args: unknown[]) => console.warn('[Tauri Warn]', ...args),
};

// IPC-style invoke for Tauri commands
export async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    log.error(`Error invoking ${command}:`, error);
    throw error;
  }
}

// Stub for electron ipcRenderer compatibility
// Maps Electron IPC channels to Tauri commands
export const ipcRenderer = {
  invoke: async (channel: string, ...args: unknown[]): Promise<unknown> => {
    log.info(`ipcRenderer.invoke: ${channel}`, args);

    try {
      switch (channel) {
        case 'check-scoresaber':
          return await invoke('check_scoresaber');
        case 'check-beatsaver':
          return await invoke('check_beatsaver');
        case 'load-fonts':
          return await invoke('load_fonts');
        case 'splash-complete':
          return await invoke('splash_complete');
        case 'check-ffmpeg':
          return await invoke('check_ffmpeg');
        case 'restart-app':
          return await invoke('restart_app');
        case 'force-check-update':
          return await invoke('force_check_update');
        case 'update-application':
          const updateOptions = args[0] || {};
          return await invoke('update_application', { options: updateOptions });
        case 'generate-video-thumbnail': {
          const [arg] = args;

          // Check if argument is object with videoPath/video_path
          if (arg && typeof arg === 'object') {
              const vPath = (arg as any).videoPath || (arg as any).video_path;
              if (vPath) {
                  log.info(`ipcRenderer passing videoPath to Rust: ${vPath}`);
                  // Use camelCase keys for Tauri (auto-converts to snake_case in Rust)
                  return await invoke('generate_video_thumbnail', { videoPath: vPath, videoData: null });
              }
          }

          // Fallback to data-based (legacy or small files)
          // Ensure we only pass string, if it's an object here it means path check failed
          const dataStr = typeof arg === 'string' ? arg : null;

          if (!dataStr) {
              log.error('generate-video-thumbnail: Invalid argument', arg);
              throw new Error('Invalid argument for generate-video-thumbnail');
          }

          log.info(`ipcRenderer passing videoData (base64) to Rust. Length: ${dataStr.length}`);

          return await invoke('generate_video_thumbnail', { videoData: dataStr, videoPath: null });
        }
        case 'generate-batch-thumbnail': {
          const [backgroundUrl, month, backgroundTransform] = args;
          return await invoke('generate_batch_thumbnail', {
            backgroundUrl,
            month,
            backgroundTransform: backgroundTransform || null,
          });
        }
        case 'generate-ssrm-thumbnail': {
          const [mapData, chosenDiff, starRatings, backgroundImage] = args;
          return await invoke('generate_ssrm_thumbnail', {
            mapData,
            chosenDiff,
            starRatings,
            backgroundImage,
          });
        }
        case 'generate-playlist-thumbnail': {
          const [bgUrl, mon, bgTransform] = args;
          return await invoke('generate_playlist_thumbnail', {
            backgroundUrl: bgUrl,
            month: mon,
            backgroundTransform: bgTransform || null,
          });
        }
        case 'generate-card': {
          const [mapData, starRatings, useBackground] = args;
          return await invoke('generate_card', {
            mapData,
            starRatings,
            useBackground: useBackground ?? true,
          });
        }
        case 'generate-reweight-card': {
          const [mapData, oldStarRatings, newStarRatings, chosenDiff] = args;
          return await invoke('generate_reweight_card', {
            mapData,
            oldStarRatings,
            newStarRatings,
            chosenDiff,
          });
        }
        case 'generate-card-from-config': {
          log.warn('generate-card-from-config not yet implemented');
          return null;
        }
        case 'install-ffmpeg':
          return await invoke('install_ffmpeg');
        case 'reinstall-ffmpeg':
          return await invoke('reinstall_ffmpeg');
        case 'read-image-as-base64': {
          const [arg] = args;
          if (arg && typeof arg === 'object') {
            const imagePath = (arg as any).imagePath || (arg as any).image_path;
            if (imagePath) {
              log.info(`Reading image as base64: ${imagePath}`);
              return await invoke('read_image_as_base64', { imagePath });
            }
          }
          log.error('read-image-as-base64: Invalid argument', arg);
          throw new Error('Invalid argument for read-image-as-base64');
        }
        default:
          log.warn(`Unknown IPC channel: ${channel}`);
          return null;
      }
    } catch (error) {
      log.error(`Error in ipcRenderer.invoke(${channel}):`, error);
      throw error;
    }
  },

  send: (channel: string, ...args: unknown[]): void => {
    log.info(`ipcRenderer.send: ${channel}`, args);
    // Handle window control events
    if (channel === 'minimize-window') {
      getCurrentWindow().minimize();
    } else if (channel === 'close-window') {
      getCurrentWindow().close();
    }
  },

  on: (channel: string, _callback: (...args: unknown[]) => void): void => {
    log.info(`ipcRenderer.on registered: ${channel}`);
    // Event listeners can be implemented with Tauri's event system if needed
  },

  removeListener: (channel: string, _callback: (...args: unknown[]) => void): void => {
    log.info(`ipcRenderer.removeListener: ${channel}`);
  },
};

// Window controls for Tauri
export async function minimizeWindow(): Promise<void> {
  try {
    const window = getCurrentWindow();
    await window.minimize();
  } catch (error) {
    log.error('Error minimizing window:', error);
  }
}

export async function closeWindow(): Promise<void> {
  try {
    const window = getCurrentWindow();
    await window.close();
  } catch (error) {
    log.error('Error closing window:', error);
  }
}

// Mock for window.require('electron') pattern
(window as any).require = (module: string) => {
  if (module === 'electron') {
    return { ipcRenderer };
  }
  if (module === 'os') {
    // Return a mock OS module
    return {
      platform: () => {
        // Try to detect platform from userAgent
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('win')) return 'win32';
        if (ua.includes('mac')) return 'darwin';
        if (ua.includes('linux')) return 'linux';
        return 'unknown';
      }
    };
  }
  throw new Error(`Module not found: ${module}`);
};
