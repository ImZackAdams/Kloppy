// Kloppy main process.
// Creates the app window and handles cross-platform lifecycle.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const notes = require('./notes');
const reminders = require('./reminders');

function createWindow() {
  const win = new BrowserWindow({
    width: 640,
    height: 720,
    minWidth: 360,
    minHeight: 420,
    title: 'Kloppy',
    backgroundColor: '#1f7a6d',
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
  // Storage lives next to the app's other user data.
  notes.init(app.getPath('userData'));
  reminders.init(app.getPath('userData'));

  // IPC endpoints the preload bridge is allowed to call.
  ipcMain.handle('notes:list', () => notes.list());
  ipcMain.handle('notes:add', (_event, text) => notes.add(text));
  ipcMain.handle('notes:delete', (_event, id) => notes.remove(id));

  ipcMain.handle('reminders:list', () => reminders.list());
  ipcMain.handle('reminders:add', (_event, text, dueAt) => reminders.add(text, dueAt));
  ipcMain.handle('reminders:complete', (_event, id) => reminders.complete(id));
  ipcMain.handle('reminders:delete', (_event, id) => reminders.remove(id));

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
