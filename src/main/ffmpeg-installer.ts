import { spawn } from 'child_process';
import os from 'os';

export function installFfmpeg(progressCallback?: (msg: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    progressCallback && progressCallback('Beginning ffmpeg installation process...');

    const platform = os.platform();
    let command: string;
    let args: string[];
    let platformName: string;

    progressCallback && progressCallback(`Detected platform: ${platform}. Determining installation strategy...`);

    switch (platform) {
      case 'darwin':
        platformName = 'MacOS';
        command = 'brew';
        args = ['install', 'ffmpeg'];
        break;

      case 'linux':
        platformName = 'Linux';
        command = 'bash';
        args = ['-c', 'sudo apt-get update && sudo apt-get install -y ffmpeg'];
        break;

      case 'win32':
        platformName = 'Windows';
        command = 'powershell';
        args = [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          `Start-Process powershell -Verb runAs -Wait -WindowStyle Normal -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command "if (!(Get-Command choco -ErrorAction SilentlyContinue)) { Write-Output ''Chocolatey not found. Installing Chocolatey...''; iex ((New-Object System.Net.WebClient).DownloadString(''https://community.chocolatey.org/install.ps1'')); Write-Output ''Chocolatey installation complete.''; Start-Sleep -Seconds 5 } Write-Output ''Installing ffmpeg...''; choco install ffmpeg -y; Write-Output ''ffmpeg installation completed successfully.''"'`
        ];
        break;

      default:
        const err = new Error(`Unsupported platform: ${platform}`);
        progressCallback && progressCallback(`Error: ${err.message}`);
        return reject(err);
    }

    progressCallback && progressCallback(`Platform name: ${platformName}`);
    progressCallback && progressCallback(`Command: ${command}`);
    progressCallback && progressCallback(`Arguments: ${JSON.stringify(args)}`);

    progressCallback && progressCallback('Starting installation (running elevated on Windows)...');
    const child = spawn(command, args, { shell: true, windowsHide: true });

    child.stdout.on('data', (data) => {
      progressCallback && progressCallback(`stdout: ${data.toString()}`);
    });

    child.stderr.on('data', (data) => {
      progressCallback && progressCallback(`stderr: ${data.toString()}`);
    });

    child.on('error', (error) => {
      progressCallback && progressCallback(`Error event from child process: ${error.message}`);
      reject(error);
    });

    child.on('close', (code) => {
      progressCallback && progressCallback(`Child process closed with exit code: ${code}`);
      if (code === 0) {
        progressCallback && progressCallback('ffmpeg installation completed successfully.');
        resolve();
      } else {
        progressCallback && progressCallback(`ffmpeg installation failed with exit code ${code}.`);
        reject(new Error(`Installation failed with exit code ${code}`));
      }
    });
  });
}