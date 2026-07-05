'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const settings = require('../src/settings');

function tempUserData(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloppy-settings-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('settings validates, trims, and persists supported values', (t) => {
  const dir = tempUserData(t);
  settings.init(dir);

  assert.deepEqual(settings.get().settings, {
    launchMinimized: false,
    randomCommentary: true,
    commentaryFrequency: 'medium',
    theme: 'midnight',
    modelPath: '',
    userName: '',
  });

  const result = settings.update({
    launchMinimized: true,
    randomCommentary: false,
    commentaryFrequency: 'cursed',
    theme: 'toxic',
    modelPath: '  /tmp/brain.llamafile  ',
    userName: '  Zack  ',
  });

  assert.equal(result.ok, true);
  assert.equal(result.settings.launchMinimized, true);
  assert.equal(result.settings.randomCommentary, false);
  assert.equal(result.settings.commentaryFrequency, 'cursed');
  assert.equal(result.settings.theme, 'toxic');
  assert.equal(result.settings.modelPath, '/tmp/brain.llamafile');
  assert.equal(result.settings.userName, 'Zack');

  settings.init(dir);
  assert.equal(settings.get().settings.userName, 'Zack');
  assert.equal(settings.get().settings.launchMinimized, true);
});

test('settings rejects invalid updates without saving partial changes', (t) => {
  const dir = tempUserData(t);
  settings.init(dir);

  assert.equal(settings.update({ theme: 'beige', userName: 'Ada' }).ok, true);

  assert.deepEqual(settings.update({ theme: 'neon' }), { ok: false, error: 'invalid' });
  assert.equal(settings.get().settings.theme, 'beige');

  assert.deepEqual(settings.update({ userName: 'x'.repeat(81) }), {
    ok: false,
    error: 'invalid',
  });
  assert.equal(settings.get().settings.userName, 'Ada');

  assert.deepEqual(settings.update({ theme: 'toxic', userName: 42 }), {
    ok: false,
    error: 'invalid',
  });
  assert.equal(settings.get().settings.theme, 'beige');
  assert.equal(settings.get().settings.userName, 'Ada');
});
