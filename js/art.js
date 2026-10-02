// Generated inline-SVG "photos". Pure functions -> data URIs. No external assets.
export const ART_KINDS = ['mountain', 'tiger', 'pier', 'shore', 'trees', 'facade', 'sky', 'park', 'bottles', 'tools', 'steam'];

const W = 280, H = 330;
const rnd = (seed) => { let s = (seed * 9301 + 49297) % 233280; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };
const wrap = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${inner}</svg>`;
const grad = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

const SCENES = {
  mountain: () => wrap(`<rect width="${W}" height="${H}" fill="url(#s)"/><ellipse cx="60" cy="60" rx="70" ry="22" fill="#fff" opacity=".8"/><ellipse cx="230" cy="40" rx="60" ry="16" fill="#fff" opacity=".6"/>
    <polygon points="0,330 120,70 160,150 190,110 280,330" fill="#5d5b5b"/><polygon points="120,70 100,130 118,120 130,150 150,125 160,150" fill="#f2f2f2"/><polygon points="0,330 0,250 90,260 160,300 280,270 280,330" fill="#3c3a3a"/>`, grad('s', '#9db4c8', '#dfe6ea')),
  tiger: () => wrap(`<rect width="${W}" height="${H}" fill="url(#s)"/><ellipse cx="140" cy="190" rx="105" ry="125" fill="#c9792a"/><ellipse cx="140" cy="215" rx="55" ry="62" fill="#f4e3c8"/>
    <polygon points="55,95 70,40 105,85" fill="#c9792a"/><polygon points="225,95 210,40 175,85" fill="#c9792a"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${40 + i * 6},${130 + i * 24} q22,-8 38,6" stroke="#2a1608" stroke-width="7" fill="none"/><path d="M${240 - i * 6},${130 + i * 24} q-22,-8 -38,6" stroke="#2a1608" stroke-width="7" fill="none"/>`).join('')}
    <ellipse cx="105" cy="165" rx="12" ry="8" fill="#e8c04a"/><ellipse cx="175" cy="165" rx="12" ry="8" fill="#e8c04a"/><circle cx="105" cy="165" r="4" fill="#111"/><circle cx="175" cy="165" r="4" fill="#111"/>
    <ellipse cx="140" cy="205" rx="14" ry="9" fill="#3a2418"/>`, grad('s', '#5a4a2c', '#2b2418')),
  pier: () => wrap(`<rect width="${W}" height="150" fill="url(#s)"/><rect y="150" width="${W}" height="${H - 150}" fill="url(#w)"/>
    <rect x="0" y="195" width="${W}" height="12" fill="#c9b79a"/>${[20, 70, 120, 170, 220].map((x) => `<rect x="${x}" y="207" width="7" height="60" fill="#8d7a5f"/>`).join('')}
    <path d="M0,260 q35,-14 70,0 t70,0 t70,0 t70,0 V330 H0Z" fill="#fff" opacity=".55"/><path d="M0,290 q35,-14 70,0 t70,0 t70,0 t70,0 V330 H0Z" fill="#fff" opacity=".4"/>`,
    grad('s', '#d8e6ee', '#f7efe2') + grad('w', '#6fa6b8', '#2f6f85')),
  shore: () => wrap(`<rect width="${W}" height="140" fill="url(#s)"/><rect y="140" width="${W}" height="100" fill="#5c9fb5"/>
    <rect x="150" y="70" width="90" height="75" fill="#f3f3f0"/><rect x="170" y="90" width="14" height="22" fill="#6a8ca4"/><rect x="200" y="90" width="14" height="22" fill="#6a8ca4"/><polygon points="145,70 195,40 245,70" fill="#b3523c"/>
    <path d="M0,240 q30,-30 70,-10 t80,-10 t70,10 t60,-5 V330 H0Z" fill="#7b7468"/><path d="M0,290 q40,-24 90,-6 t90,-4 t100,6 V330 H0Z" fill="#5d574d"/>`, grad('s', '#bcd8ea', '#eaf3f6')),
  trees: () => { const r = rnd(7); return wrap(`<rect width="${W}" height="${H}" fill="url(#s)"/>${Array.from({ length: 16 }, (_, i) => { const x = 8 + i * 17 + r() * 8, w = 4 + r() * 6, top = 20 + r() * 80; const g = 90 + Math.floor(r() * 70); return `<rect x="${x}" y="${top}" width="${w}" height="${H}" fill="rgb(${g},${g},${g})" opacity=".85"/><ellipse cx="${x + w / 2}" cy="${top}" rx="${16 + r() * 10}" ry="${28 + r() * 14}" fill="rgb(${g - 30},${g - 30},${g - 30})" opacity=".7"/>`; }).join('')}<rect width="${W}" height="${H}" fill="#fff" opacity=".18"/>`, grad('s', '#cfcfcf', '#7d7d7d')); },
  facade: () => wrap(`<rect width="${W}" height="${H}" fill="url(#s)"/><rect x="30" y="50" width="220" height="280" fill="#d8d2c6"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${50 + (i % 3) * 68}" y="${70 + Math.floor(i / 3) * 62}" width="46" height="40" fill="#5a7b91"/><rect x="${50 + (i % 3) * 68}" y="${108 + Math.floor(i / 3) * 62}" width="46" height="5" fill="#a69f90"/>`).join('')}`, grad('s', '#a7c8dc', '#e7eef0')),
  sky: () => wrap(`<rect width="${W}" height="${H}" fill="url(#s)"/><circle cx="210" cy="80" r="30" fill="#ffe9a8"/><ellipse cx="70" cy="110" rx="60" ry="18" fill="#fff" opacity=".9"/><ellipse cx="110" cy="125" rx="50" ry="14" fill="#fff" opacity=".8"/>
    <rect x="40" y="200" width="60" height="130" fill="#7c8da0"/><rect x="110" y="170" width="70" height="160" fill="#95a5b5"/><rect x="190" y="215" width="55" height="115" fill="#6f8296"/>`, grad('s', '#5aa0e0', '#cfe6f8')),
  park: () => wrap(`<rect width="${W}" height="150" fill="url(#s)"/><rect y="150" width="${W}" height="${H - 150}" fill="#79b05a"/>${[50, 130, 210].map((x, i) => `<rect x="${x}" y="${120 - i * 8}" width="12" height="80" fill="#7a5a3a"/><circle cx="${x + 6}" cy="${105 - i * 8}" r="${38 + i * 4}" fill="#3f8f3f"/>`).join('')}<path d="M120,330 Q150,230 190,190" stroke="#e7d9b0" stroke-width="26" fill="none"/>`, grad('s', '#cfe8f5', '#f5faf0')),
  bottles: () => wrap(`<rect width="${W}" height="${H}" fill="#a8825a"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 48 - 4}" y="0" width="30" height="${H}" fill="#8d6a46"/>`).join('')}${[30, 90, 150, 215].map((x, i) => `<rect x="${x}" y="${150 + (i % 2) * 20}" width="34" height="110" rx="10" fill="#6fb77a" opacity=".85"/><rect x="${x + 11}" y="${112 + (i % 2) * 20}" width="12" height="44" fill="#6fb77a" opacity=".85"/>`).join('')}`),
  tools: () => wrap(`<rect width="${W}" height="${H}" fill="#cdbfa8"/><rect x="30" y="60" width="200" height="22" rx="5" fill="#444" transform="rotate(-18 130 70)"/><circle cx="85" cy="230" r="42" fill="#2c3e50"/><circle cx="85" cy="230" r="14" fill="#cdbfa8"/><rect x="150" y="190" width="90" height="26" fill="#b5651d" transform="rotate(12 195 200)"/><rect x="60" y="130" width="120" height="14" fill="#888" transform="rotate(30 120 137)"/>`),
  steam: () => wrap(`<rect width="${W}" height="${H}" fill="url(#s)"/><path d="M0,200 q40,-50 90,-20 t90,-10 t100,20 V330 H0Z" fill="#6b6459"/><path d="M0,265 q60,-30 120,-5 t160,0 V330 H0Z" fill="#4c4740"/>${[60, 120, 180].map((x) => `<ellipse cx="${x}" cy="150" rx="26" ry="60" fill="#fff" opacity=".35"/>`).join('')}`, grad('s', '#9db7c2', '#e9eef0')),
};

export function svgPhoto(kind, seed = 1) {
  const fn = SCENES[kind] || SCENES.sky;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fn(seed));
}
