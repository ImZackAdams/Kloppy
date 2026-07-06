'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const chats = require('../src/chats');

function tempUserData(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kloppy-chats-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('first use yields one empty active chat with a stable id', (t) => {
  chats.init(tempUserData(t));

  const result = chats.list();
  assert.equal(result.ok, true);
  assert.equal(result.chats.length, 1);
  assert.match(result.chats[0].id, /^chat_/);
  assert.equal(result.activeChatId, result.chats[0].id);

  // The synthesized chat is saved, so its id survives a reload.
  assert.equal(chats.list().activeChatId, result.activeChatId);
});

test('creating a chat makes it active', (t) => {
  chats.init(tempUserData(t));

  const created = chats.create();
  assert.equal(created.ok, true);
  assert.match(created.chat.id, /^chat_/);
  assert.equal(created.chat.title, 'New Chat');

  const result = chats.list();
  assert.equal(result.chats.length, 2);
  assert.equal(result.activeChatId, created.chat.id);
  assert.equal(chats.getActive().chat.id, created.chat.id);
});

test('switching the active chat', (t) => {
  chats.init(tempUserData(t));
  const first = chats.getActive().chat;
  chats.create();

  const switched = chats.switchTo(first.id);
  assert.equal(switched.ok, true);
  assert.equal(chats.getActive().chat.id, first.id);

  assert.deepEqual(chats.switchTo('chat_nope'), { ok: false, error: 'not-found' });
  assert.deepEqual(chats.switchTo(42), { ok: false, error: 'not-found' });
});

test('renaming a chat', (t) => {
  chats.init(tempUserData(t));
  const chat = chats.getActive().chat;

  const renamed = chats.rename(chat.id, '  Tax Grievances  ');
  assert.equal(renamed.ok, true);
  assert.equal(renamed.chat.title, 'Tax Grievances');
  assert.equal(chats.getActive().chat.title, 'Tax Grievances');

  assert.equal(chats.rename(chat.id, '').error, 'empty');
  assert.equal(chats.rename(chat.id, 42).error, 'empty');
  assert.equal(chats.rename(chat.id, 'x'.repeat(81)).error, 'too-long');
  assert.equal(chats.rename('chat_nope', 'ok').error, 'not-found');
});

test('appending messages persists them and auto-titles the chat', (t) => {
  chats.init(tempUserData(t));

  const first = chats.appendMessage('user', 'How do I center a div without crying about it?');
  assert.equal(first.ok, true);
  assert.match(first.message.id, /^msg_/);
  assert.equal(first.chat.title, 'How do I center a div without crying abo...');

  const reply = chats.appendMessage('assistant', 'You cannot. Nobody can.');
  assert.equal(reply.ok, true);

  const active = chats.getActive().chat;
  assert.deepEqual(active.messages.map((m) => m.role), ['user', 'assistant']);
  assert.equal(active.messages[1].content, 'You cannot. Nobody can.');
  assert.ok(!Number.isNaN(Date.parse(active.messages[0].createdAt)));

  // A manually renamed chat keeps its name.
  chats.create();
  chats.rename(chats.getActive().chat.id, 'Kept Name');
  chats.appendMessage('user', 'hello there');
  assert.equal(chats.getActive().chat.title, 'Kept Name');
});

test('appendMessage rejects invalid role and content', (t) => {
  chats.init(tempUserData(t));

  assert.equal(chats.appendMessage('system', 'nope').error, 'bad-role');
  assert.equal(chats.appendMessage('wizard', 'nope').error, 'bad-role');
  assert.equal(chats.appendMessage('user', '').error, 'empty');
  assert.equal(chats.appendMessage('user', '   ').error, 'empty');
  assert.equal(chats.appendMessage('user', 42).error, 'empty');
  assert.equal(chats.appendMessage('user', 'x'.repeat(8001)).error, 'too-long');
  assert.equal(chats.getActive().chat.messages.length, 0);
});

test('deleting a non-active chat keeps the active one', (t) => {
  chats.init(tempUserData(t));
  const first = chats.getActive().chat;
  const second = chats.create().chat;

  const removed = chats.remove(first.id);
  assert.equal(removed.ok, true);
  assert.equal(removed.activeChatId, second.id);
  assert.equal(chats.list().chats.length, 1);

  assert.deepEqual(chats.remove('chat_nope'), { ok: false, error: 'not-found' });
});

test('deleting the active chat switches to another existing chat', (t) => {
  chats.init(tempUserData(t));
  const first = chats.getActive().chat;
  const second = chats.create().chat;

  const removed = chats.remove(second.id);
  assert.equal(removed.ok, true);
  assert.equal(removed.activeChatId, first.id);
  assert.equal(chats.getActive().chat.id, first.id);
});

test('deleting the only chat leaves one fresh empty chat', (t) => {
  chats.init(tempUserData(t));
  const only = chats.getActive().chat;
  chats.appendMessage('user', 'soon to be gone');

  const removed = chats.remove(only.id);
  assert.equal(removed.ok, true);

  const result = chats.list();
  assert.equal(result.chats.length, 1);
  assert.notEqual(result.chats[0].id, only.id);
  assert.equal(result.chats[0].messageCount, 0);
  assert.equal(result.activeChatId, result.chats[0].id);
});

test('deleting all chats leaves one fresh empty chat', (t) => {
  chats.init(tempUserData(t));
  chats.appendMessage('user', 'chat one');
  chats.create();
  chats.appendMessage('user', 'chat two');

  const removed = chats.removeAll();
  assert.equal(removed.ok, true);

  const result = chats.list();
  assert.equal(result.chats.length, 1);
  assert.equal(result.chats[0].title, 'New Chat');
  assert.equal(result.chats[0].messageCount, 0);
  assert.equal(result.activeChatId, result.chats[0].id);
});

test('clearing the active chat empties its messages but keeps the chat', (t) => {
  chats.init(tempUserData(t));
  chats.appendMessage('user', 'wipe this');
  const before = chats.getActive().chat;

  const cleared = chats.clearActive();
  assert.equal(cleared.ok, true);

  const after = chats.getActive().chat;
  assert.equal(after.id, before.id);
  assert.deepEqual(after.messages, []);
});

test('corrupted chats.json (and backup) falls back to one fresh chat', (t) => {
  const dir = tempUserData(t);
  fs.writeFileSync(path.join(dir, 'chats.json'), '{ not json at all');
  fs.writeFileSync(path.join(dir, 'chats.json.bak'), 'also garbage');
  chats.init(dir);

  const result = chats.list();
  assert.equal(result.ok, true);
  assert.equal(result.chats.length, 1);
  assert.equal(result.chats[0].messageCount, 0);
});

test('invalid chats and messages are dropped without crashing', (t) => {
  const dir = tempUserData(t);
  const good = {
    id: 'chat_good',
    title: 'Survivor',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    messages: [
      { id: 'msg_1', role: 'user', content: 'still here', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'msg_2', role: 'wizard', content: 'dropped', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'msg_3', role: 'assistant', content: 42, createdAt: '2026-01-01T00:00:00.000Z' },
      'not even an object',
    ],
  };
  fs.writeFileSync(path.join(dir, 'chats.json'), JSON.stringify({
    activeChatId: 'chat_good',
    chats: [good, { id: 'no-prefix', title: 'bad', messages: [] }, null, { title: 'no id' }],
  }));
  chats.init(dir);

  const result = chats.list();
  assert.equal(result.chats.length, 1);
  assert.equal(result.activeChatId, 'chat_good');
  assert.deepEqual(
    chats.getActive().chat.messages.map((m) => m.content),
    ['still here']
  );
});
