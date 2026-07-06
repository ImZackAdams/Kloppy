// Kloppy's settings storage (main process only).
// Settings live in settings.json inside Electron's userData directory.

const path = require('path');
const storage = require('./storage');

const DEFAULTS = {
  launchMinimized: false,        // stored now, wired up in a future version
  randomCommentary: true,
  commentaryFrequency: 'medium', // low | medium | cursed
  theme: 'midnight',             // midnight | beige | toxic
  modelPath: '',                 // path to a llamafile executable ('' = no local model)
  userName: '',                  // optional local profile name for chat memory
};

const MAX_PATH_LENGTH = 4096;
const MAX_NAME_LENGTH = 80;

const FREQUENCIES = ['low', 'medium', 'cursed'];
const THEMES = ['midnight', 'beige', 'toxic'];

let store = null;

// Called once at startup with app.getPath('userData').
function init(userDataDir) {
  store = storage.createStore(path.join(userDataDir, 'settings.json'), {
    label: 'settings',
    validate: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
  });
}

function load() {
  // Unknown or missing keys fall back to defaults.
  return { ...DEFAULTS, ...(store.load() ?? {}) };
}

function save(settings) {
  store.save(settings);
}

function get() {
  return { ok: true, settings: load() };
}

// Accepts a partial update; validates each key it knows about.
function update(partial) {
  if (typeof partial !== 'object' || partial === null) {
    return { ok: false, error: 'invalid' };
  }

  const settings = load();

  if ('launchMinimized' in partial) {
    if (typeof partial.launchMinimized !== 'boolean') return { ok: false, error: 'invalid' };
    settings.launchMinimized = partial.launchMinimized;
  }
  if ('randomCommentary' in partial) {
    if (typeof partial.randomCommentary !== 'boolean') return { ok: false, error: 'invalid' };
    settings.randomCommentary = partial.randomCommentary;
  }
  if ('commentaryFrequency' in partial) {
    if (!FREQUENCIES.includes(partial.commentaryFrequency)) return { ok: false, error: 'invalid' };
    settings.commentaryFrequency = partial.commentaryFrequency;
  }
  if ('theme' in partial) {
    if (!THEMES.includes(partial.theme)) return { ok: false, error: 'invalid' };
    settings.theme = partial.theme;
  }
  if ('modelPath' in partial) {
    if (typeof partial.modelPath !== 'string' || partial.modelPath.length > MAX_PATH_LENGTH) {
      return { ok: false, error: 'invalid' };
    }
    settings.modelPath = partial.modelPath.trim();
  }
  if ('userName' in partial) {
    if (typeof partial.userName !== 'string' || partial.userName.length > MAX_NAME_LENGTH) {
      return { ok: false, error: 'invalid' };
    }
    settings.userName = partial.userName.trim();
  }

  save(settings);
  return { ok: true, settings };
}

module.exports = { init, get, update };
