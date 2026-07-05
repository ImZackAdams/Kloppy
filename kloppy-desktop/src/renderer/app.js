// Kloppy renderer logic.
// Buttons swap the main panel, make Kloppy talk, and update the status bar.
// Notes are real: stored on disk via the preload bridge (window.kloppy.notes).

// ---- Kloppy's words of wisdom ----

const quips = [
  "It looks like you're making questionable decisions.",
  "Have you tried turning your life off and on again?",
  "I saw what you did. I'm not mad, just... logging it.",
  "Pro tip: if you never save, you can never lose unsaved work.",
  "I live in your taskbar now. This is fine for both of us.",
  "Error 404: motivation not found. Retrying forever.",
  "Fun fact: every unread notification makes me stronger.",
];

// ---- Static panels (placeholders until their features arrive) ----

const panels = {
  welcome: {
    title: 'WELCOME.TXT',
    body: `
      <p>Kloppy is a desktop gremlin. He lives in this window now.</p>
      <p>Press a button below. Kloppy is waiting. Kloppy is patient.*</p>
      <p class="fine-print">* Kloppy is not patient.</p>`,
  },
  reminder: {
    title: 'REMIND.SYS',
    body: `
      <p>Reminder scheduled for: <b>eventually</b>.</p>
      <p>Kloppy will forget this immediately.</p>
      <p class="fine-print">Real reminders are coming in a future version.</p>`,
  },
  settings: {
    title: 'SETTINGS.INI',
    body: `
      <label class="fake-option"><input type="checkbox" checked disabled> Allow Kloppy to judge silently</label>
      <label class="fake-option"><input type="checkbox" checked disabled> Gremlin mode (cannot be disabled)</label>
      <label class="fake-option"><input type="checkbox" disabled> Respect user's time</label>
      <p class="fine-print">Settings are decorative. Kloppy does what Kloppy wants.</p>`,
  },
};

const statusLines = {
  idle: 'Kloppy is idle, suspiciously.',
  say: 'Kloppy is saying words. Nobody asked.',
  reminder: 'Kloppy will remind you at some point. Probably.',
  settings: 'Kloppy resents being configured.',
  noteSaved: 'Note swallowed whole. It is safe now. Probably.',
  noteDeleted: 'Note shredded. Kloppy ate the shreds.',
  noteEmpty: 'Kloppy refuses to store the concept of nothing.',
  noteTooLong: "That's a novel, not a note. 500 characters max.",
};

// ---- DOM helpers ----

const bubbleText = document.getElementById('bubble-text');
const panelTitle = document.getElementById('panel-title');
const panelBody = document.getElementById('panel-body');
const statusText = document.getElementById('status-text');

function say(text) {
  bubbleText.textContent = text;
}

function setStatus(text) {
  statusText.textContent = text;
}

function showPanel(name) {
  panelTitle.textContent = panels[name].title;
  panelBody.innerHTML = panels[name].body;
}

// ---- Notes panel ----

async function openNotes() {
  panelTitle.textContent = 'NOTES.DAT';
  panelBody.innerHTML = `
    <div class="note-editor">
      <textarea id="note-input" rows="3"
        placeholder="Type a note. Kloppy will guard it."></textarea>
      <button id="note-save" type="button">Save note</button>
    </div>
    <p class="fine-print">Stored locally in notes.json. Kloppy never phones home. 500 chars max.</p>
    <ul class="note-list" id="note-list"></ul>`;

  const input = document.getElementById('note-input');
  document.getElementById('note-save').addEventListener('click', saveNote);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNote();
  });

  await refreshNotes();
}

async function refreshNotes() {
  const result = await window.kloppy.notes.list();
  const listEl = document.getElementById('note-list');
  listEl.textContent = '';

  for (const note of result.notes) {
    // Built with createElement + textContent so note text is never
    // interpreted as HTML.
    const li = document.createElement('li');
    li.className = 'note';

    const text = document.createElement('p');
    text.className = 'note-text';
    text.textContent = note.text;

    const meta = document.createElement('div');
    meta.className = 'note-meta';

    const date = document.createElement('span');
    date.textContent = new Date(note.createdAt).toLocaleString();

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'note-delete';
    del.textContent = 'Shred';
    del.addEventListener('click', async () => {
      await window.kloppy.notes.remove(note.id);
      say('It never existed. We never speak of it again.');
      setStatus(statusLines.noteDeleted);
      await refreshNotes();
    });

    meta.append(date, del);
    li.append(text, meta);
    listEl.appendChild(li);
  }

  if (result.notes.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'note note-empty';
    empty.textContent = 'No notes yet. Kloppy guards an empty vault.';
    listEl.appendChild(empty);
  }
}

async function saveNote() {
  const input = document.getElementById('note-input');
  const result = await window.kloppy.notes.add(input.value);

  if (!result.ok) {
    if (result.error === 'empty') {
      say('You want me to remember... nothing? Bold. No.');
      setStatus(statusLines.noteEmpty);
    } else if (result.error === 'too-long') {
      say(`That note is over ${result.max} characters. I'm a gremlin, not a library.`);
      setStatus(statusLines.noteTooLong);
    }
    return;
  }

  input.value = '';
  say('Note saved. I am guarding it with moderate enthusiasm.');
  setStatus(statusLines.noteSaved);
  await refreshNotes();
}

// ---- Wire up the buttons ----

let quipIndex = 0;

document.getElementById('btn-say').addEventListener('click', () => {
  quipIndex = (quipIndex + 1) % quips.length;
  say(quips[quipIndex]);
  setStatus(statusLines.say);
});

document.getElementById('btn-notes').addEventListener('click', () => {
  say('Ah, the notes. I keep them in a jar.');
  openNotes();
});

document.getElementById('btn-reminder').addEventListener('click', () => {
  showPanel('reminder');
  say("I'll remember this. I remember everything.");
  setStatus(statusLines.reminder);
});

document.getElementById('btn-settings').addEventListener('click', () => {
  showPanel('settings');
  say('You can look at the settings. Looking is free.');
  setStatus(statusLines.settings);
});
