// Kloppy's note storage (main process only).
// Notes live in a single JSON file inside Electron's userData directory:
//   [{ id, text, createdAt }, ...]  — newest first.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_NOTE_LENGTH = 500;

let notesFile = null;

// Called once at startup with app.getPath('userData').
function init(userDataDir) {
  notesFile = path.join(userDataDir, 'notes.json');
}

function load() {
  try {
    const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
    return Array.isArray(notes) ? notes : [];
  } catch {
    // Missing or corrupted file — start fresh rather than crash.
    return [];
  }
}

function save(notes) {
  fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
}

function list() {
  return { ok: true, notes: load() };
}

function add(text) {
  // Validate here in the main process: the renderer is not trusted.
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, error: 'empty' };
  }
  if (text.trim().length > MAX_NOTE_LENGTH) {
    return { ok: false, error: 'too-long', max: MAX_NOTE_LENGTH };
  }

  const note = {
    id: crypto.randomUUID(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  const notes = load();
  notes.unshift(note);
  save(notes);
  return { ok: true, note };
}

function remove(id) {
  const notes = load();
  const remaining = notes.filter((n) => n.id !== id);
  if (remaining.length === notes.length) {
    return { ok: false, error: 'not-found' };
  }
  save(remaining);
  return { ok: true };
}

module.exports = { init, list, add, remove, MAX_NOTE_LENGTH };
