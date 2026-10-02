// Generates web/icons/*.png (pure Node, zlib) and the SVG icons. No downloads.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/icons');
fs.mkdirSync(out, { recursive: true });

const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size; x++) { const [r, g, b, a] = pixel(x / size, y / size); raw.set([r, g, b, a], y * (size * 4 + 1) + 1 + x * 4); } }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// dark rounded square with a green house and a blue bolt-ish diamond
const inRR = (x, y, r) => { const dx = Math.max(Math.abs(x - 0.5) - (0.5 - r), 0), dy = Math.max(Math.abs(y - 0.5) - (0.5 - r), 0); return dx * dx + dy * dy <= r * r; };
const pixel = (x, y) => {
  if (!inRR(x, y, 0.2)) return [0, 0, 0, 0];
  const house = y > 0.45 && y < 0.8 && x > 0.28 && x < 0.72 || (y > 0.25 && y <= 0.45 && Math.abs(x - 0.5) < (y - 0.25) * 1.2 + 0.02);
  const door = y > 0.6 && y < 0.8 && x > 0.45 && x < 0.55;
  if (door) return [14, 17, 28, 255];
  if (house) return [74, 210, 149, 255];
  const d = Math.abs(x - 0.72) + Math.abs(y - 0.28); if (d < 0.12) return [79, 109, 245, 255];
  return [14, 17, 28, 255];
};
for (const s of [192, 512]) fs.writeFileSync(path.join(out, `icon-${s}.png`), png(s, pixel));
const svg = (r) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${r}" fill="#0e111c"/><path d="M28 78V47L50 27l22 20v31z" fill="#4ad295"/><rect x="45" y="60" width="10" height="18" fill="#0e111c"/><path d="M72 16l12 12-12 12-12-12z" fill="#4f6df5"/></svg>`;
fs.writeFileSync(path.join(out, 'icon.svg'), svg(20));
fs.writeFileSync(path.join(out, 'maskable.svg'), svg(0));
console.log('icons written to', out);
