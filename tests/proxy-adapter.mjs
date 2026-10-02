// Test helpers: load the CommonJS proxy function and serve it over plain node:http, mimicking the vercel.json rewrite
// '/p/:host/:path*' -> '/api/p?host=:host&path=:path*' (query string kept). No internet involved.
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const handler = require('../proxy/api/p.js');

export function startProxy(port = 0) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const m = /^\/p\/([^/]+)(?:\/(.*))?$/.exec(u.pathname);
    if (m) {
      const q = new URLSearchParams({ host: decodeURIComponent(m[1]), path: m[2] ?? '' });
      for (const [k, v] of u.searchParams) q.append(k, v);
      req.url = `/api/p?${q}`;
    }
    Promise.resolve(handler(req, res)).catch((e) => { res.statusCode = 500; res.end(String(e)); });
  });
  return new Promise((resolve) => srv.listen(port, '127.0.0.1', () => resolve(srv)));
}
export const portOf = (s) => s.address().port;
