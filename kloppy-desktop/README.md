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
  main.js       # Electron main process: window + app lifecycle
  preload.js    # Safe bridge between main and renderer
  renderer/
    index.html  # The Kloppy window
    styles.css  # Retro styling
    app.js      # UI logic
```

## Security defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- Preload script exposes only an explicit, minimal API
