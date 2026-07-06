// Kloppy's reminder storage (main process only).
// Reminders live in reminders.json inside Electron's userData directory:
//   [{ id, text, dueAt, completed, createdAt }, ...]

const path = require('path');
const crypto = require('crypto');
const storage = require('./storage');

const MAX_REMINDER_LENGTH = 200;

let store = null;

// Called once at startup with app.getPath('userData').
function init(userDataDir) {
  store = storage.createStore(path.join(userDataDir, 'reminders.json'), {
    label: 'reminders',
    validate: Array.isArray,
  });
}

function load() {
  return store.load() ?? [];
}

function save(reminders) {
  store.save(reminders);
}

function list() {
  return { ok: true, reminders: load() };
}

function add(text, dueAt) {
  // Validate here in the main process: the renderer is not trusted.
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, error: 'empty' };
  }
  if (text.trim().length > MAX_REMINDER_LENGTH) {
    return { ok: false, error: 'too-long', max: MAX_REMINDER_LENGTH };
  }
  const due = new Date(dueAt);
  if (typeof dueAt !== 'string' || Number.isNaN(due.getTime())) {
    return { ok: false, error: 'bad-date' };
  }

  const reminder = {
    id: crypto.randomUUID(),
    text: text.trim(),
    dueAt: due.toISOString(),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const reminders = load();
  reminders.push(reminder);
  save(reminders);
  return { ok: true, reminder };
}

function complete(id) {
  const reminders = load();
  const reminder = reminders.find((r) => r.id === id);
  if (!reminder) {
    return { ok: false, error: 'not-found' };
  }
  reminder.completed = true;
  save(reminders);
  return { ok: true };
}

function remove(id) {
  const reminders = load();
  const remaining = reminders.filter((r) => r.id !== id);
  if (remaining.length === reminders.length) {
    return { ok: false, error: 'not-found' };
  }
  save(remaining);
  return { ok: true };
}

module.exports = { init, list, add, complete, remove, MAX_REMINDER_LENGTH };
