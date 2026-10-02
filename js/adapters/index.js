// Adapter registry. 'generic' works on any site; recipes only add hints. Auto-select by location.hostname
// (override: window.JEV_ADAPTER = 'demo' | 'suumo-sp' | 'generic').
import { demoAdapter } from './demo.js';
import { suumoAdapter } from './suumo.js';
import { genericSteps, englishize } from '../generic/agent.js';
import { parseIntents } from '../generic/intent.js';

export const genericAdapter = {
  id: 'generic', name: '汎用エンジン', shield: false, tabLabel: '', defaultPrompt: '東京 1LDK 10万円以下', match: () => true,
  parse: parseIntents, instr: englishize, buildSteps: genericSteps, hints: {},
};
export const ADAPTERS = [suumoAdapter, demoAdapter, genericAdapter];

export function pickAdapter(hostname, override) {
  if (override) { const a = ADAPTERS.find((x) => x.id === override); if (a) return a; }
  return ADAPTERS.find((a) => a.recipe && a.match(hostname)) || genericAdapter;
}
