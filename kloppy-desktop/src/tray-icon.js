// Kloppy's tray and window icon, drawn entirely in code with no image assets.
// A tiny pixel art version of the whitepaper paperclip mascot with the fund cup.

const { nativeImage } = require('electron');

// One character per pixel:
//   .  transparent      K  black outline      S  silver wire
//   Y  sticky note      C  fund cup           L  cup label
const ART = [
  '................................',
  '................................',
  '...........KKKKKK...............',
  '.........KKSSSSSSKK.............',
  '........KSS......SSK............',
  '.......KSS........SSK...........',
  '.......KSS........SSK...........',
  '.......KSS..KKKKKKKKKK..........',
  '.......KSS.KYYYYYYYYYYK.........',
  '.......KSS.KYYKKYYKKYYK.........',
  '.......KSS.KYYKKYYKKYYK.........',
  '.......KSS.KYYYYYYYYYYK.........',
  '.......KSS.KYYYKKKKYYYK.........',
  '.......KSS.KYYYYYYYYYYK.........',
  '.......KSS..KKKKKKKKKK..........',
  '.......KSS........SSK...........',
  '.......KSS........SSK...........',
  '.......KSS........SSK...KKKK....',
  '.......KSS........SSK..KCCCCK...',
  '.......KSS..KKKK..SSK..KCLLK....',
  '.......KSS.KSSSSK.SSK..KCCCCK...',
  '.......KSS.KSSSSK.SSK...KKKK....',
  '.......KSS.KSSSSK.SSK...........',
  '.......KSS..KKKK..SSK...........',
  '.......KSS........SSK...........',
  '........KSS......SSK............',
  '.........KSS....SSK.............',
  '..........KSSSSSSK..............',
  '...........KKKKKK...............',
  '................................',
  '................................',
  '................................',
];

// [red, green, blue, alpha] per palette character
const PALETTE = {
  '.': [0, 0, 0, 0],
  K: [0, 0, 0, 255],
  S: [198, 205, 210, 255],
  Y: [246, 226, 162, 255],
  C: [205, 233, 255, 180],
  L: [245, 237, 210, 255],
};

function createTrayIcon() {
  const size = ART.length;
  if (!ART.every((row) => row.length === size)) {
    throw new Error('Tray icon art must be square.');
  }

  const buffer = Buffer.alloc(size * size * 4);

  ART.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const [r, g, b, a] = PALETTE[char];
      const offset = (y * size + x) * 4;
      // createFromBitmap expects BGRA byte order.
      buffer[offset] = b;
      buffer[offset + 1] = g;
      buffer[offset + 2] = r;
      buffer[offset + 3] = a;
    });
  });

  return nativeImage.createFromBitmap(buffer, { width: size, height: size });
}

module.exports = { createTrayIcon };
