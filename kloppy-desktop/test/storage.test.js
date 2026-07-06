'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const storage = require('../src/storage');
const notes = require('../src/notes');

function tempUserData(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function collectWarnings() {
  const warnings = [];
  storage.onWarning((message) => warnings.push(message));
  return warnings;
}

test('save writes atomically: full tmp file, then rename over the target', (t) => {
  const dir = tempUserData(t, 'kloppy-storage-');
  const file = path.join(dir, 'notes.json');
  const store = storage.createStore(file, { label: 'notes', validate: Array.isArray });

  const renames = [];
  const realRename = fs.renameSync;
  fs.renameSync = (from, to) => {
    // At rename time the tmp file must already hold the complete payload,
    // and the real file must not have been touched directly.
    renames.push({ from, to, tmpContents: fs.readFileSync(from, 'utf8') });
    return realRename(from, to);
  };
  t.after(() => { fs.renameSync = realRename; });

  store.save([{ id: '1', text: 'hello' }]);

  assert.equal(renames.length, 1);
  assert.equal(renames[0].from, `${file}.tmp`);
  assert.equal(renames[0].to, file);
  assert.deepEqual(JSON.parse(renames[0].tmpContents), [{ id: '1', text: 'hello' }]);
  assert.equal(fs.existsSync(`${file}.tmp`), false);
  assert.deepEqual(store.load(), [{ id: '1', text: 'hello' }]);
});

test('loading a missing file returns null without any warning', (t) => {
  const dir = tempUserData(t, 'kloppy-storage-');
  const warnings = collectWarnings();
  const store = storage.createStore(path.join(dir, 'fresh.json'), { label: 'notes' });

  assert.equal(store.load(), null);
  assert.deepEqual(warnings, []);
});

test('corrupted primary recovers from .bak with a single warning', (t) => {
  const dir = tempUserData(t, 'kloppy-storage-');
  const file = path.join(dir, 'reminders.json');
  const warnings = collectWarnings();
  const store = storage.createStore(file, { label: 'reminders', validate: Array.isArray });

  store.save(['good data']);
  assert.deepEqual(store.load(), ['good data']); // successful parse creates the backup
  assert.deepEqual(JSON.parse(fs.readFileSync(`${file}.bak`, 'utf8')), ['good data']);

  fs.writeFileSync(file, '{ definitely not json');

  assert.deepEqual(store.load(), ['good data']);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /backup/);

  // The corrupted primary must never clobber the known-good backup,
  // and the warning must not repeat on later loads.
  assert.deepEqual(JSON.parse(fs.readFileSync(`${file}.bak`, 'utf8')), ['good data']);
  assert.deepEqual(store.load(), ['good data']);
  assert.equal(warnings.length, 1);
});

test('wrong-shape JSON counts as corruption and recovers from .bak', (t) => {
  const dir = tempUserData(t, 'kloppy-storage-');
  const file = path.join(dir, 'watched.json');
  const warnings = collectWarnings();
  const store = storage.createStore(file, { label: 'watched folders', validate: Array.isArray });

  store.save(['/home/somewhere']);
  store.load();
  fs.writeFileSync(file, '{"valid": "json, wrong shape"}');

  assert.deepEqual(store.load(), ['/home/somewhere']);
  assert.equal(warnings.length, 1);
});

test('falls back to defaults with one warning when primary and .bak are both bad', (t) => {
  const dir = tempUserData(t, 'kloppy-storage-');
  const file = path.join(dir, 'actions.json');
  const warnings = collectWarnings();
  const store = storage.createStore(file, { label: 'saved actions', validate: Array.isArray });

  fs.writeFileSync(file, 'garbage');
  fs.writeFileSync(`${file}.bak`, 'also garbage');

  assert.equal(store.load(), null);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /start fresh/);

  assert.equal(store.load(), null);
  assert.equal(warnings.length, 1);
});

test('notes module survives a corrupted primary end to end', (t) => {
  const dir = tempUserData(t, 'kloppy-storage-notes-');
  const warnings = collectWarnings();
  notes.init(dir);

  const added = notes.add('do not lose me');
  assert.equal(added.ok, true);
  notes.list(); // successful parse creates notes.json.bak

  fs.writeFileSync(path.join(dir, 'notes.json'), '<html>not json</html>');

  assert.deepEqual(notes.list().notes.map((n) => n.text), ['do not lose me']);
  assert.equal(warnings.length, 1);

  // A save repairs the primary; later loads are clean and warning-free.
  const second = notes.add('back to normal');
  assert.equal(second.ok, true);
  assert.deepEqual(notes.list().notes.map((n) => n.text), ['back to normal', 'do not lose me']);
  assert.equal(warnings.length, 1);
});
