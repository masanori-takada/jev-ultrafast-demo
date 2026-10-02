// Optional "Jev mode": ask the Vercel AI Gateway (model typesafe-ai/jev) to disambiguate low-confidence matches.
// The API key is NEVER stored in code or in the repo; the panel keeps the user's own key in localStorage only.
export const JEV_ENDPOINT = 'https://ai-gateway.vercel.sh/v1/evaluate';
export const JEV_MODEL = 'typesafe-ai/jev';
export const KEY_STORAGE = 'jev.gatewayKey';

/** @returns {Promise<{id:string, confidence:number, probabilities:object}|null>} null on any failure or when no key. */
export async function askJev({ key, url, intent, candidates, fetchFn = globalThis.fetch, endpoint = JEV_ENDPOINT }) {
  if (!key || !candidates?.length || !fetchFn) return null;
  const criteria = {};
  for (const c of candidates) criteria[c.id] = c.description;
  const body = {
    model: JEV_MODEL,
    state: `page: ${url}\nintent: ${intent}\ncandidate controls:\n${candidates.map((c) => `- ${c.id}: ${c.description}`).join('\n')}`,
    questions: { q: { type: 'choice', question: `次の指示に最も合うコントロールはどれか: ${intent}`, criteria } },
  };
  try {
    const res = await fetchFn(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
    if (!res.ok) return null;
    const j = await res.json();
    const a = j?.answers?.q;
    if (!a || !(a.choice in criteria)) return null;
    return { id: a.choice, confidence: a.confidence ?? null, probabilities: a.probabilities ?? null };
  } catch { return null; }
}
