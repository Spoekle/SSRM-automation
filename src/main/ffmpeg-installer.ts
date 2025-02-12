import { exec } from 'child_process';
import os from 'os';

export function installFfmpeg(): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let installCommand: string;

    if (platform === 'darwin') {
      // macOS - using brew
      installCommand = 'brew install ffmpeg';
    } else if (platform === 'linux') {
      // Linux - using apt-get (Debian/Ubuntu)
      installCommand = 'sudo apt-get update && sudo apt-get install -y ffmpeg';
    } else if (platform === 'win32') {
      // Windows - using Chocolatey
      installCommand = 'choco install ffmpeg -y';
    } else {
      return reject(new Error(`Unsupported platform: ${platform}`));
    }

    console.log(`Detected OS: ${platform}. Running command: ${installCommand}`);
    exec(installCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error while installing ffmpeg: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        return reject(error);
      }
      console.log(`stdout: ${stdout}`);
      console.log('ffmpeg installation completed successfully.');
      resolve();
    });
  });
}
