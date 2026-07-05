# Kloppy Desktop

Kloppy is a retro desktop gremlin assistant, inspired by the golden age of
questionable downloadable desktop software (late 1990s / early 2000s).
He watches. He helps. Mostly he watches.

## Running

```bash
npm install
npm start
```

## Stack

- Electron
- Vanilla HTML / CSS / JavaScript
- No frameworks, no build step

## Structure

```
src/
  main.js       # Electron main process: window, lifecycle, IPC endpoints
  preload.js    # Safe bridge between main and renderer
  notes.js      # Note storage (main process only)
  renderer/
    index.html  # The Kloppy window
    styles.css  # Retro styling
    app.js      # UI logic
```

## Notes storage

Notes are saved to `notes.json` inside Electron's per-user app data
directory (`app.getPath('userData')`):

- Linux: `~/.config/kloppy-desktop/notes.json`
- macOS: `~/Library/Application Support/kloppy-desktop/notes.json`
- Windows: `%APPDATA%/kloppy-desktop/notes.json`

Each note is `{ id, text, createdAt }`, newest first. Everything stays
on your machine — Kloppy never phones home.

The renderer can't touch the filesystem. It calls `window.kloppy.notes`
(exposed by the preload script), which invokes `notes:list` / `notes:add` /
`notes:delete` over IPC; the main process validates input (no empty notes,
500-character limit) and does the file I/O.

## Security defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- Preload script exposes only an explicit, minimal API
