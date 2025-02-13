import { spawn } from 'child_process';
import os from 'os';

export function installFfmpeg(progressCallback?: (msg: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command: string;
    let args: string[];
    let platformName: string;

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
            '-ExecutionPolicy', 'Bypass',
            '-Command',
            "Start-Process powershell -Verb runAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"Set-ExecutionPolicy AllSigned; " +
            "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; " +
            "if (-Not (Get-Command choco -ErrorAction SilentlyContinue)) { " +
              "iex ((New-Object System.Net.WebClient).DownloadString(\\\"https://community.chocolatey.org/install.ps1\\\")) " +
            "}; choco install ffmpeg -y; " +
            "Write-Output \\\"Installation finished. Press Enter to exit.\\\"; " +
            "Read-Host -Prompt \\\"Press Enter to exit\\\"\"'"
          ];
          break;
      default:
        return reject(new Error(`Unsupported platform: ${platform}`));
    }

    progressCallback && progressCallback(`Detected OS: ${platformName}. Starting installation...`);

    const child = spawn(command, args, { shell: true });

    child.stdout.on('data', (data: Buffer) => {
      progressCallback && progressCallback(data.toString());
    });

    child.stderr.on('data', (data: Buffer) => {
      progressCallback && progressCallback(data.toString());
    });

    child.on('error', (error) => {
      progressCallback && progressCallback(`Error while installing: ${error.message}`);
      reject(error);
    });

    child.on('close', (code) => {
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
