'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const notes = require('../src/notes');
const reminders = require('../src/reminders');

function tempUserData(t, prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('notes validate input and persist newest first', (t) => {
  const dir = tempUserData(t, 'kloppy-notes-');
  notes.init(dir);

  assert.deepEqual(notes.list(), { ok: true, notes: [] });
  assert.deepEqual(notes.add('   '), { ok: false, error: 'empty' });
  assert.deepEqual(notes.add('x'.repeat(notes.MAX_NOTE_LENGTH + 1)), {
    ok: false,
    error: 'too-long',
    max: notes.MAX_NOTE_LENGTH,
  });

  const first = notes.add('  buy milk  ');
  const second = notes.add('water plants');
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.note.text, 'buy milk');
  assert.equal(second.note.text, 'water plants');

  assert.deepEqual(notes.list().notes.map((note) => note.text), [
    'water plants',
    'buy milk',
  ]);

  notes.init(dir);
  assert.deepEqual(notes.list().notes.map((note) => note.text), [
    'water plants',
    'buy milk',
  ]);

  assert.deepEqual(notes.remove('missing'), { ok: false, error: 'not-found' });
  assert.deepEqual(notes.remove(first.note.id), { ok: true });
  assert.deepEqual(notes.list().notes.map((note) => note.text), ['water plants']);
});

test('reminders validate input, persist, complete, and remove', (t) => {
  const dir = tempUserData(t, 'kloppy-reminders-');
  reminders.init(dir);

  assert.deepEqual(reminders.list(), { ok: true, reminders: [] });
  assert.deepEqual(reminders.add('', '2026-07-05T10:00:00.000Z'), {
    ok: false,
    error: 'empty',
  });
  assert.deepEqual(
    reminders.add('x'.repeat(reminders.MAX_REMINDER_LENGTH + 1), '2026-07-05T10:00:00.000Z'),
    {
      ok: false,
      error: 'too-long',
      max: reminders.MAX_REMINDER_LENGTH,
    }
  );
  assert.deepEqual(reminders.add('stretch', 'not a date'), {
    ok: false,
    error: 'bad-date',
  });

  const added = reminders.add('  stretch  ', '2026-07-05T10:00:00.000Z');
  assert.equal(added.ok, true);
  assert.equal(added.reminder.text, 'stretch');
  assert.equal(added.reminder.dueAt, '2026-07-05T10:00:00.000Z');
  assert.equal(added.reminder.completed, false);

  reminders.init(dir);
  assert.equal(reminders.list().reminders[0].completed, false);

  assert.deepEqual(reminders.complete('missing'), { ok: false, error: 'not-found' });
  assert.deepEqual(reminders.complete(added.reminder.id), { ok: true });

  reminders.init(dir);
  assert.equal(reminders.list().reminders[0].completed, true);

  assert.deepEqual(reminders.remove('missing'), { ok: false, error: 'not-found' });
  assert.deepEqual(reminders.remove(added.reminder.id), { ok: true });
  assert.deepEqual(reminders.list(), { ok: true, reminders: [] });
});
