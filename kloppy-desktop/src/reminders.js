// Kloppy's reminder storage (main process only).
// Reminders live in reminders.json inside Electron's userData directory:
//   [{ id, text, dueAt, completed, createdAt, notifiedAt? }, ...]
// notifiedAt records when the OS notification for the current dueAt fired,
// so restarts never re-notify an occurrence that was already announced.

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
  // Completing ends this due occurrence; clear notification state so any
  // future reschedule of the reminder starts clean.
  delete reminder.notifiedAt;
  save(reminders);
  return { ok: true };
}

// Reminders that should fire an OS notification: past due, not completed,
// and not yet notified for this due occurrence. notifiedAt is compared
// against dueAt (not treated as a boolean) so moving dueAt later — a snooze
// or a recurring roll — re-arms the notification automatically.
function dueForNotification(now = new Date()) {
  return load().filter((r) => {
    if (r.completed) return false;
    const due = new Date(r.dueAt);
    if (!(due <= now)) return false; // also skips unparseable dates
    return !r.notifiedAt || new Date(r.notifiedAt) < due;
  });
}

function markNotified(id) {
  const reminders = load();
  const reminder = reminders.find((r) => r.id === id);
  if (!reminder) {
    return { ok: false, error: 'not-found' };
  }
  reminder.notifiedAt = new Date().toISOString();
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

module.exports = {
  init,
  list,
  add,
  complete,
  remove,
  dueForNotification,
  markNotified,
  MAX_REMINDER_LENGTH,
};
