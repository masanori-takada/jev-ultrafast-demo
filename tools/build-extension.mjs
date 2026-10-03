// Writes extension/panel.js (same bundle as the bookmarklet), a ready-to-load folder dist/jev-ultrafast-extension/
// and (if the `zip` CLI exists) dist/jev-ultrafast-extension.zip. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bundle } from './build-bookmarklet.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT = path.join(ROOT, 'extension');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'jev-ultrafast-extension');
const FILES = ['manifest.json', 'background.js', 'panel.js', 'README.ja.md', 'icons/icon-192.png', 'icons/icon-512.png'];

export function buildExtension() {
  fs.writeFileSync(path.join(EXT, 'panel.js'), bundle());
  fs.rmSync(OUT, { recursive: true, force: true });
  const fixed = new Date('2026-01-01T00:00:00Z'); // deterministic zip
  for (const f of FILES) {
    const to = path.join(OUT, f); fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(EXT, f), to); fs.utimesSync(to, fixed, fixed);
  }
  const zip = path.join(DIST, 'jev-ultrafast-extension.zip');
  fs.rmSync(zip, { force: true });
  let zipped = false;
  try { execFileSync('zip', ['-q', '-r', '-X', zip, ...FILES], { cwd: OUT }); zipped = true; } catch { /* zip CLI missing: use the folder */ }
  if (zipped) fs.copyFileSync(zip, path.join(ROOT, 'web', 'jev-ultrafast-extension.zip')); // published beside the app (start.html links it)
  return { zipped, out: OUT, zip };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = buildExtension();
  console.log(`extension/panel.js written; folder ${path.relative(ROOT, r.out)}${r.zipped ? `; zip ${path.relative(ROOT, r.zip)}` : '; (zip CLI not found, zip skipped)'}`);
}
