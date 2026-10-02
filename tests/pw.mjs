// Resolve playwright-core (local) or playwright (global) and the preinstalled chromium.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
function load() {
  for (const n of ['playwright-core', 'playwright', '/opt/node22/lib/node_modules/playwright', '/opt/node22/lib/node_modules/playwright-core']) {
    try { return require(n); } catch {}
  }
  throw new Error('playwright not found');
}
export const { chromium } = load();
export function chromePath() {
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  for (const d of fs.readdirSync(base).filter((x) => x.startsWith('chromium-'))) {
    for (const sub of ['chrome-linux/chrome', 'chrome-linux64/chrome']) {
      const f = `${base}/${d}/${sub}`; if (fs.existsSync(f)) return f;
    }
  }
  return undefined;
}
export const launch = () => chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });
