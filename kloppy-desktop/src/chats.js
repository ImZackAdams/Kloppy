// Kloppy's chat history storage (main process only).
// Chats live in chats.json inside Electron's userData directory:
//   { activeChatId, chats: [{ id, title, createdAt, updatedAt, messages }] }
// Every message is { id, role: 'user' | 'assistant', content, createdAt }.

const path = require('path');
const crypto = require('crypto');
const storage = require('./storage');

const MAX_TITLE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 8000;
const AUTO_TITLE_LENGTH = 40;
const DEFAULT_TITLE = 'New Chat';
const ROLES = ['user', 'assistant'];

let store = null;

// Called once at startup with app.getPath('userData').
function init(userDataDir) {
  store = storage.createStore(path.join(userDataDir, 'chats.json'), {
    label: 'chats',
    validate: (value) => typeof value === 'object' && value !== null
      && !Array.isArray(value) && Array.isArray(value.chats),
  });
}

function newChat() {
  const now = new Date().toISOString();
  return {
    id: `chat_${crypto.randomUUID()}`,
    title: DEFAULT_TITLE,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function isValidMessage(msg) {
  return typeof msg === 'object' && msg !== null
    && typeof msg.id === 'string'
    && ROLES.includes(msg.role)
    && typeof msg.content === 'string'
    && typeof msg.createdAt === 'string';
}

function isValidChat(chat) {
  return typeof chat === 'object' && chat !== null
    && typeof chat.id === 'string' && chat.id.startsWith('chat_')
    && typeof chat.title === 'string' && chat.title.trim() !== ''
    && chat.title.length <= MAX_TITLE_LENGTH
    && Array.isArray(chat.messages);
}

// Loads stored chats, silently dropping any entry that doesn't look right
// (a mangled chat must never crash the app), and guarantees at least one
// chat plus an activeChatId that points at a real one.
function load() {
  const raw = store.load() ?? {};
  const chats = (Array.isArray(raw.chats) ? raw.chats : [])
    .filter(isValidChat)
    .map((chat) => ({ ...chat, messages: chat.messages.filter(isValidMessage) }));

  if (chats.length === 0) {
    // Save right away so the fresh chat keeps the same id on the next load.
    const data = { activeChatId: null, chats: [newChat()] };
    data.activeChatId = data.chats[0].id;
    save(data);
    return data;
  }

  const activeChatId = chats.some((c) => c.id === raw.activeChatId)
    ? raw.activeChatId
    : chats[0].id;
  return { activeChatId, chats };
}

function save(data) {
  store.save(data);
}

function summarize(chat) {
  return {
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messages.length,
  };
}

function list() {
  const data = load();
  return { ok: true, activeChatId: data.activeChatId, chats: data.chats.map(summarize) };
}

function getActive() {
  const data = load();
  return { ok: true, chat: data.chats.find((c) => c.id === data.activeChatId) };
}

function create() {
  const data = load();
  const chat = newChat();
  data.chats.unshift(chat);
  data.activeChatId = chat.id;
  save(data);
  return { ok: true, chat };
}

function switchTo(id) {
  const data = load();
  const chat = data.chats.find((c) => c.id === id);
  if (!chat) return { ok: false, error: 'not-found' };
  data.activeChatId = chat.id;
  save(data);
  return { ok: true, chat };
}

function rename(id, title) {
  // Validate here in the main process: the renderer is not trusted.
  if (typeof title !== 'string' || title.trim() === '') {
    return { ok: false, error: 'empty' };
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    return { ok: false, error: 'too-long', max: MAX_TITLE_LENGTH };
  }
  const data = load();
  const chat = data.chats.find((c) => c.id === id);
  if (!chat) return { ok: false, error: 'not-found' };
  chat.title = title.trim();
  chat.updatedAt = new Date().toISOString();
  save(data);
  return { ok: true, chat: summarize(chat) };
}

// Deleting the active chat moves activeChatId to another existing chat;
// deleting the last chat leaves one fresh empty chat. Never zero chats.
function remove(id) {
  const data = load();
  const index = data.chats.findIndex((c) => c.id === id);
  if (index === -1) return { ok: false, error: 'not-found' };
  data.chats.splice(index, 1);
  if (data.chats.length === 0) data.chats.push(newChat());
  if (data.activeChatId === id) data.activeChatId = data.chats[0].id;
  save(data);
  return { ok: true, activeChatId: data.activeChatId };
}

function removeAll() {
  const chat = newChat();
  save({ activeChatId: chat.id, chats: [chat] });
  return { ok: true, chat };
}

// First user message, collapsed and truncated: "How do I center a div..."
function autoTitle(content) {
  const compact = content.trim().replace(/\s+/g, ' ');
  if (compact.length <= AUTO_TITLE_LENGTH) return compact;
  return `${compact.slice(0, AUTO_TITLE_LENGTH).trimEnd()}...`;
}

function appendMessage(role, content) {
  if (!ROLES.includes(role)) return { ok: false, error: 'bad-role' };
  if (typeof content !== 'string' || content.trim() === '') {
    return { ok: false, error: 'empty' };
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: 'too-long', max: MAX_MESSAGE_LENGTH };
  }

  const data = load();
  const chat = data.chats.find((c) => c.id === data.activeChatId);
  const message = {
    id: `msg_${crypto.randomUUID()}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  // The first user message names an untitled chat after itself.
  if (chat.messages.length === 0 && role === 'user' && chat.title === DEFAULT_TITLE) {
    chat.title = autoTitle(content);
  }

  chat.messages.push(message);
  chat.updatedAt = message.createdAt;
  save(data);
  return { ok: true, message, chat: summarize(chat) };
}

function clearActive() {
  const data = load();
  const chat = data.chats.find((c) => c.id === data.activeChatId);
  chat.messages = [];
  chat.updatedAt = new Date().toISOString();
  save(data);
  return { ok: true, chat: summarize(chat) };
}

module.exports = {
  init,
  list,
  getActive,
  create,
  switchTo,
  rename,
  remove,
  removeAll,
  appendMessage,
  clearActive,
  MAX_TITLE_LENGTH,
  MAX_MESSAGE_LENGTH,
};
