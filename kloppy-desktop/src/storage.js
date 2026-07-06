// Durable JSON storage shared by Kloppy's persistence modules (main process only).
//
// Guarantees, per file:
//   - Atomic writes: data goes to <file>.tmp, then renames over the target,
//     so a crash mid-write can never truncate the real file.
//   - Backups: after every successful parse of the primary file, its contents
//     are mirrored to <file>.bak. A corrupt primary never touches the backup.
//   - Recovery: if the primary won't parse, the backup is used; if both are
//     bad, callers fall back to their defaults. Either way Kloppy grumbles
//     about it once, to the renderer, instead of failing silently.

const fs = require('fs');

// Warnings can fire before the window exists (storage loads at startup),
// so they queue here until main.js registers a delivery callback.
let deliver = null;
const pending = [];
const warnedFiles = new Set(); // files Kloppy has already grumbled about

function emitWarning(message) {
  if (deliver) deliver(message);
  else pending.push(message);
}

function onWarning(callback) {
  deliver = callback;
  while (pending.length > 0) deliver(pending.shift());
}

// `validate` decides whether parsed JSON has the shape the caller expects;
// wrong-shape data is treated exactly like a file that failed to parse.
function createStore(file, { label = 'data', validate = () => true } = {}) {
  const bakFile = `${file}.bak`;

  function warnOnce(message) {
    if (warnedFiles.has(file)) return;
    warnedFiles.add(file);
    emitWarning(message);
  }

  // Mirror the just-parsed primary contents to the backup — atomically, and
  // only when it changed. Best effort: a failed backup must not fail a load.
  function refreshBackup(raw) {
    try {
      try {
        if (fs.readFileSync(bakFile, 'utf8') === raw) return;
      } catch {
        // No readable backup yet — write one below.
      }
      const tmp = `${bakFile}.tmp`;
      fs.writeFileSync(tmp, raw);
      fs.renameSync(tmp, bakFile);
    } catch {
      // The primary is still good; carry on without a fresh backup.
    }
  }

  function readJson(target) {
    const raw = fs.readFileSync(target, 'utf8');
    const data = JSON.parse(raw);
    if (!validate(data)) throw new Error('unexpected shape');
    return { raw, data };
  }

  // Returns the stored value, or null when nothing usable exists yet.
  function load() {
    let primaryMissing = false;
    try {
      const { raw, data } = readJson(file);
      refreshBackup(raw);
      return data;
    } catch (err) {
      primaryMissing = Boolean(err) && err.code === 'ENOENT';
    }

    try {
      const { data } = readJson(bakFile);
      warnOnce(`Your ${label} file got mangled, so I restored my backup copy. Crisis handled. You're welcome.`);
      return data;
    } catch (err) {
      const backupMissing = Boolean(err) && err.code === 'ENOENT';
      // Nothing on disk at all is a normal first run, not a disaster.
      if (!primaryMissing || !backupMissing) {
        warnOnce(`Your ${label} file was corrupted beyond saving, and so was my backup. We start fresh. I feel nothing.`);
      }
      return null;
    }
  }

  function save(data) {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }

  return { load, save };
}

module.exports = { createStore, onWarning };
