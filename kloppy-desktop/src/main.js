// Kloppy main process.
// Creates the app window and handles cross-platform lifecycle.

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 640,
    title: 'Kloppy',
    webPreferences: {
      // Safe defaults: the renderer has no direct access to Node.
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create a window when the dock icon is clicked
  // and no other windows are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Windows & Linux: quit when all windows are closed.
// macOS: apps conventionally stay alive until Cmd+Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
