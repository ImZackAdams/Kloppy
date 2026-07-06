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
    theme: 'dark',
    personalityMode: 'goblin',
    modelPath: '',
    userName: '',
  });

  const result = settings.update({
    launchMinimized: true,
    randomCommentary: false,
    commentaryFrequency: 'cursed',
    theme: 'light',
    personalityMode: 'quiet',
    modelPath: '  /tmp/brain.llamafile  ',
    userName: '  Zack  ',
  });

  assert.equal(result.ok, true);
  assert.equal(result.settings.launchMinimized, true);
  assert.equal(result.settings.randomCommentary, false);
  assert.equal(result.settings.commentaryFrequency, 'cursed');
  assert.equal(result.settings.theme, 'light');
  assert.equal(result.settings.personalityMode, 'quiet');
  assert.equal(result.settings.modelPath, '/tmp/brain.llamafile');
  assert.equal(result.settings.userName, 'Zack');

  settings.init(dir);
  assert.equal(settings.get().settings.userName, 'Zack');
  assert.equal(settings.get().settings.launchMinimized, true);
});

test('settings rejects invalid updates without saving partial changes', (t) => {
  const dir = tempUserData(t);
  settings.init(dir);

  assert.equal(settings.update({ theme: 'light', personalityMode: 'helpful', userName: 'Ada' }).ok, true);

  assert.deepEqual(settings.update({ theme: 'neon' }), { ok: false, error: 'invalid' });
  assert.equal(settings.get().settings.theme, 'light');

  assert.deepEqual(settings.update({ personalityMode: 'feral' }), {
    ok: false,
    error: 'invalid',
  });
  assert.equal(settings.get().settings.personalityMode, 'helpful');

  assert.deepEqual(settings.update({ userName: 'x'.repeat(81) }), {
    ok: false,
    error: 'invalid',
  });
  assert.equal(settings.get().settings.userName, 'Ada');

  assert.deepEqual(settings.update({ theme: 'dark', userName: 42 }), {
    ok: false,
    error: 'invalid',
  });
  assert.equal(settings.get().settings.theme, 'light');
  assert.equal(settings.get().settings.userName, 'Ada');
});

test('settings migrates unsupported old display and personality values', (t) => {
  const dir = tempUserData(t);
  fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify({
    launchMinimized: true,
    randomCommentary: true,
    commentaryFrequency: 'medium',
    theme: 'toxic',
    personalityMode: 'feral',
    modelPath: '',
    userName: 'Ada',
  }));

  settings.init(dir);
  const result = settings.get();

  assert.equal(result.settings.launchMinimized, true);
  assert.equal(result.settings.theme, 'dark');
  assert.equal(result.settings.personalityMode, 'goblin');
  assert.equal(result.settings.userName, 'Ada');

  const stored = JSON.parse(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'));
  assert.equal(stored.theme, 'dark');
  assert.equal(stored.personalityMode, 'goblin');
});
