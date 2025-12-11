// Simple logger replacement for electron-log in Tauri
const log = {
  info: (...args: unknown[]) => console.log('[INFO]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  debug: (...args: unknown[]) => console.debug('[DEBUG]', ...args),
  verbose: (...args: unknown[]) => console.log('[VERBOSE]', ...args),
};

export default log;
