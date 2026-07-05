// Kloppy renderer logic.
// Cycles through Kloppy's words of "wisdom" when the button is clicked.

const messages = [
  "It looks like you're making questionable decisions.",
  "Have you tried turning your life off and on again?",
  "I saw what you did. I'm not mad, just... logging it.",
  "Pro tip: if you never save, you can never lose unsaved work.",
  "I live in your taskbar now. This is fine for both of us.",
  "Error 404: motivation not found. Retrying forever.",
];

let messageIndex = 0;

const messageEl = document.getElementById('message');
const askButton = document.getElementById('ask-kloppy');

askButton.addEventListener('click', () => {
  messageIndex = (messageIndex + 1) % messages.length;
  messageEl.textContent = messages[messageIndex];
});
