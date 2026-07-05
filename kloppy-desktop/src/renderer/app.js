// Kloppy renderer logic.
// Buttons swap the main panel between placeholder states,
// make Kloppy talk, and update the status bar.

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

// ---- Panel placeholder states (real features arrive later) ----

const panels = {
  welcome: {
    title: 'WELCOME.TXT',
    body: `
      <p>Kloppy is a desktop gremlin. He lives in this window now.</p>
      <p>Press a button below. Kloppy is waiting. Kloppy is patient.*</p>
      <p class="fine-print">* Kloppy is not patient.</p>`,
  },
  notes: {
    title: 'NOTES.DAT',
    body: `
      <p>NOTES.DAT could not be found.</p>
      <p>Kloppy checked twice. Kloppy even looked behind the recycle bin.</p>
      <p class="fine-print">Note storage is coming in a future version.</p>`,
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
  notes: 'Kloppy is pretending to look for your notes.',
  reminder: 'Kloppy will remind you at some point. Probably.',
  settings: 'Kloppy resents being configured.',
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

// ---- Wire up the buttons ----

let quipIndex = 0;

document.getElementById('btn-say').addEventListener('click', () => {
  quipIndex = (quipIndex + 1) % quips.length;
  say(quips[quipIndex]);
  setStatus(statusLines.say);
});

document.getElementById('btn-notes').addEventListener('click', () => {
  showPanel('notes');
  say('Notes? Bold of you to assume I kept them.');
  setStatus(statusLines.notes);
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
