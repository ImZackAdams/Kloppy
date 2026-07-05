// Kloppy's tray/window icon, drawn entirely in code — no image assets.
// A tiny pixel-art version of the website's paperclip-and-sticky-note mascot.

const { nativeImage } = require('electron');

// One character per pixel:
//   .  transparent      K  black outline      S  silver wire
//   Y  sticky note      D  note fold          P  pink notice
//   B  shoe/sign brown
const ART = [
  '................................',
  '................................',
  '.........KKKKKKKKK..............',
  '.......KKSSSSSSSSSKK............',
  '......KSSS......SSSSK...........',
  '.....KSSS........SSSSK..........',
  '.....KSS..........SSSK..........',
  '.....KSS...KKKKKKKKKKKKK........',
  '.....KSS..KYYYYYYYYYYYYYK...PP..',
  '.....KSS..KYYKKYYYKKYYYYK..PPPP.',
  '.....KSS..KYYKKYYYKKYYYYK..PPPP.',
  '.....KSS..KYYYYYYYYYYYYYK...PP..',
  '.....KSS..KYYYYKYYKYYYYYK.......',
  '.....KSS..KYYYYYYYYYYYYYK.......',
  '.....KSS..KYYYYYYYYYYYYYK.......',
  '.....KSS...KYYYYDDDDDDYK........',
  '.....KSS....KKKKKKKKKKK.........',
  '.....KSS...........SSSK.........',
  '.....KSS...........SSSK.........',
  '.....KSS..KKKKK....SSSK.........',
  '.....KSS.KSSSSSK...SSSK.........',
  '.....KSS.KSSSSSK...SSSK.........',
  '.....KSS.KSSSSSK...SSSK.........',
  '.....KSS..KKKKK....SSSK.........',
  '.....KSS...........SSSK.........',
  '......KSS.........SSSK..........',
  '.......KSSS.....SSSSK...........',
  '........KSSSSSSSSSSK............',
  '.........KKKKKKKKKK.............',
  '...........KK..KK...............',
  '..........KBB..BBK..............',
  '.........KBBB..BBBK.............',
];

// [red, green, blue, alpha] per palette character
const PALETTE = {
  '.': [0, 0, 0, 0],
  K: [0, 0, 0, 255],
  S: [198, 205, 210, 255],
  Y: [246, 226, 162, 255],
  D: [216, 189, 122, 255],
  P: [233, 162, 191, 255],
  B: [74, 59, 52, 255],
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
