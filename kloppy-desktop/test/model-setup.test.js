'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const modelSetup = require('../src/model-setup');

function tempUserData(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloppy-model-setup-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('setup status mapping exposes active setup states to llm', () => {
  const downloading = {
    state: 'downloading',
    detail: '',
    bytesReceived: 12,
    totalBytes: 34,
  };
  const verifying = {
    state: 'verifying',
    detail: 'existing',
    bytesReceived: 34,
    totalBytes: 34,
  };

  assert.deepEqual(modelSetup.statusForLlm(downloading, '/tmp/model.llamafile', false), downloading);
  assert.deepEqual(modelSetup.statusForLlm(verifying, '', false), verifying);
  assert.deepEqual(modelSetup.statusForLlm({ state: 'ready', detail: '' }, '', true), {
    state: 'ready',
    detail: '',
  });
});

test('setup status mapping falls back based on saved model path', () => {
  assert.deepEqual(modelSetup.statusForLlm({ state: 'ready', detail: '' }, '', false), {
    state: 'not-configured',
    detail: '',
  });
  assert.deepEqual(modelSetup.statusForLlm({ state: 'failed', detail: 'bad-checksum' }, '', false), {
    state: 'failed',
    detail: 'bad-checksum',
  });
  assert.equal(
    modelSetup.statusForLlm({ state: 'failed', detail: 'old-download' }, '/tmp/model.llamafile', false),
    null
  );
  assert.equal(
    modelSetup.statusForLlm({ state: 'ready', detail: '' }, '/tmp/model.llamafile', false),
    null
  );
});

test('getStatusForLlm includes default model info without downloading', (t) => {
  const dir = tempUserData(t);
  let modelPath = '';

  modelSetup.init({
    userDataDir: dir,
    getModelPath: () => modelPath,
    saveModelPath: () => ({ ok: true }),
    onStatusChanged: () => {},
  });

  const notConfigured = modelSetup.getStatusForLlm();
  assert.equal(notConfigured.state, 'not-configured');
  assert.equal(notConfigured.defaultModel.name, 'Qwen3.5 0.8B Q8_0');
  assert.equal(notConfigured.defaultModel.installPath.startsWith(dir), true);

  modelPath = path.join(dir, 'model.llamafile');
  assert.equal(modelSetup.getStatusForLlm(), null);
});
