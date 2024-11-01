const { ipcRenderer } = require('electron');

// Simulate the loading process (you can replace this with actual logic)
let progress = 0;
const loadingBar = document.getElementById('loading-bar');
const interval = setInterval(() => {
  progress += 10;
  loadingBar.style.width = `${progress}%`;

  if (progress >= 100) {
    clearInterval(interval);
    // Notify the main process to open the main window
    ipcRenderer.send('splash-done');
  }
}, 500);

// Listen for update availability
ipcRenderer.on('update-available', () => {
  const updateBtn = document.getElementById('update-btn');
  updateBtn.classList.remove('hidden');
});

// Update button click handler
document.getElementById('update-btn').addEventListener('click', () => {
  ipcRenderer.send('trigger-update');
});
