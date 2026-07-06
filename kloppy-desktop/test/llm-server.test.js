'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const llm = require('../src/llm');

test('tuned profile bounds context and disables the web UI', () => {
  const args = llm.buildServerArgs('tuned', 4242);

  assert.deepEqual(args.slice(0, 5), ['--server', '--host', '127.0.0.1', '--port', '4242']);
  assert.ok(args.includes('--no-webui'));
  assert.ok(args.includes('--ctx-size'));
  assert.equal(args[args.indexOf('--parallel') + 1], '1');
  assert.ok(!args.includes('--gpu'), 'tuned profile leaves GPU selection on auto');
});

test('tuned-cpu profile adds only the GPU kill switch', () => {
  const tuned = llm.buildServerArgs('tuned', 4242);
  const cpu = llm.buildServerArgs('tuned-cpu', 4242);

  assert.deepEqual(cpu.slice(0, tuned.length), tuned);
  assert.deepEqual(cpu.slice(tuned.length), ['--gpu', 'disable']);
});

test('minimal profile keeps only flags every llamafile understands', () => {
  const args = llm.buildServerArgs('minimal', 4242);

  assert.deepEqual(args, ['--server', '--host', '127.0.0.1', '--port', '4242']);
});

function completion(message) {
  return { choices: [{ message }] };
}

test('extractReply returns trimmed content and rejects empties', () => {
  assert.equal(llm.extractReply(completion({ content: '  Hello.  ' })), 'Hello.');
  assert.equal(llm.extractReply(completion({ content: '   ' })), null);
  assert.equal(llm.extractReply(completion({ content: 42 })), null);
  assert.equal(llm.extractReply(null), null);
  assert.equal(llm.extractReply({}), null);
});

test('extractReply strips leaked thinking scratchpads', () => {
  assert.equal(
    llm.extractReply(completion({ content: '<think>hmm, math</think>It is 391.' })),
    'It is 391.',
  );
  assert.equal(
    llm.extractReply(completion({ content: '<think>ran out of budget mid-thought' })),
    null,
    'a reply that is all thinking is no reply',
  );
});

// A fake "llamafile": a Node HTTP server speaking just enough of the
// OpenAI-compatible API (health checks + streaming chat completions via
// SSE) to exercise ask() end to end. Behavior is scripted off markers in
// the user prompt. Rejects requests that forget stream:true.
const FAKE_SERVER_SOURCE = `#!/usr/bin/env node
'use strict';
const http = require('http');
const port = Number(process.argv[process.argv.indexOf('--port') + 1]);

function sse(res, deltas) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream' });
  for (const delta of deltas) {
    res.write('data: ' + JSON.stringify({ choices: [{ delta: { content: delta } }] }) + '\\n\\n');
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"ok"}');
    return;
  }
  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const parsed = JSON.parse(body);
      if (parsed.stream !== true) {
        res.writeHead(500);
        res.end();
        return;
      }
      const prompt = parsed.messages[parsed.messages.length - 1].content;
      if (prompt.includes('DIE-MID-STREAM')) {
        sse(res, ['Partial ', 'words']);
        setTimeout(() => res.socket.destroy(), 50); // flush, then cut the wire
        return;
      }
      if (prompt.includes('ONLY-THINK')) {
        sse(res, ['<think>all scratchpad, no answer']);
        res.end('data: [DONE]\\n\\n');
        return;
      }
      sse(res, ['<think>plotting</think>', 'Hel', 'lo ', 'there.']);
      res.end('data: [DONE]\\n\\n');
    });
    return;
  }
  res.writeHead(404);
  res.end();
});
server.listen(port, '127.0.0.1');
`;

function startFakeServer(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloppy-llm-test-'));
  const fakeModel = path.join(dir, 'fake-server.llamafile');
  fs.writeFileSync(fakeModel, FAKE_SERVER_SOURCE, { mode: 0o755 });
  llm.init({
    getModelPath: () => fakeModel,
    getSetupStatus: () => null,
    getLlamafileHomeDir: () => path.join(dir, 'runtime'),
    getAssistantContext: () => ({}),
    localActions: {},
    broadcast: () => {},
  });
  t.after(async () => {
    await llm.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });
}

test('ask streams tokens and resolves with the full reply', async (t) => {
  startFakeServer(t);

  const chunks = [];
  const result = await llm.ask('why is the sky blue?', [], (delta) => chunks.push(delta));

  assert.equal(result.ok, true);
  assert.equal(result.reply, 'Hello there.');
  assert.ok(chunks.length > 1, 'reply arrived in multiple chunks');
  assert.equal(chunks.join(''), 'Hello there.', 'streamed chunks add up to the reply, think block stripped');
});

test('a stream that dies mid-reply keeps the partial and fails without retrying', async (t) => {
  startFakeServer(t);

  const chunks = [];
  const result = await llm.ask('please DIE-MID-STREAM', [], (delta) => chunks.push(delta));

  assert.equal(result.ok, false);
  assert.equal(result.error, 'request-failed', 'existing error shape preserved');
  assert.equal(chunks.join(''), 'Partial words', 'partial tokens were delivered exactly once');
});

test('a streamed reply that is all thinking is bad-reply, with nothing forwarded', async (t) => {
  startFakeServer(t);

  const chunks = [];
  const result = await llm.ask('please ONLY-THINK', [], (delta) => chunks.push(delta));

  assert.equal(result.ok, false);
  assert.equal(result.error, 'bad-reply');
  assert.deepEqual(chunks, [], 'think-only output never reaches the renderer');
});

test('repeated startup crashes trip the crash-loop brake', async (t) => {
  // A "llamafile" that dies instantly, so every profile in the ladder fails.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloppy-llm-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fakeModel = path.join(dir, 'fake.llamafile');
  fs.writeFileSync(fakeModel, '#!/bin/sh\nexit 1\n', { mode: 0o755 });

  const statuses = [];
  llm.init({
    getModelPath: () => fakeModel,
    getSetupStatus: () => null,
    getLlamafileHomeDir: () => path.join(dir, 'runtime'),
    getAssistantContext: () => ({}),
    localActions: {},
    broadcast: (status) => statuses.push(status),
  });

  const first = await llm.ask('why is the sky blue?');
  assert.equal(first.ok, false);
  assert.equal(first.error, 'start-failed');
  assert.notEqual(first.detail, 'crash-loop', 'first failure is not yet a loop');

  await llm.ask('why is the sky blue?');
  const third = await llm.ask('why is the sky blue?');
  assert.equal(third.detail, 'crash-loop', 'brake trips after repeated failures');

  const fifth = await llm.ask('why is the sky blue?');
  assert.equal(fifth.detail, 'crash-loop', 'brake stays on without respawning');

  // Re-saving settings re-arms the brake.
  llm.refreshStatus();
  const fourth = await llm.ask('why is the sky blue?');
  assert.equal(fourth.error, 'start-failed');
  assert.notEqual(fourth.detail, 'crash-loop');

  await llm.stop();
});

test('startup failures are recorded in the server log', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloppy-llm-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fakeModel = path.join(dir, 'fake.llamafile');
  fs.writeFileSync(fakeModel, '#!/bin/sh\necho "boom: bad flags" >&2\nexit 1\n', { mode: 0o755 });

  llm.init({
    getModelPath: () => fakeModel,
    getSetupStatus: () => null,
    getLlamafileHomeDir: () => path.join(dir, 'runtime'),
    getAssistantContext: () => ({}),
    localActions: {},
    broadcast: () => {},
  });

  await llm.ask('why is the sky blue?');
  const log = fs.readFileSync(path.join(dir, 'runtime', 'server.log'), 'utf8');
  assert.match(log, /\[kloppy\] launch: --server/);
  assert.match(log, /boom: bad flags/);

  await llm.stop();
});
