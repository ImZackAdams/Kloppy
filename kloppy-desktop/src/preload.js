// Kloppy preload script.
// Runs before the renderer with access to a limited Electron API.
// Nothing is exposed yet — this exists so the safe wiring is in place
// for when Kloppy learns real tricks (notes, reminders, etc.).

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('kloppy', {
  version: '0.0.1',
});
