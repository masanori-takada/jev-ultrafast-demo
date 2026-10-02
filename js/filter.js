// Pure filtering logic (no DOM) for the demo site.
export const RENT_LIMITS = { '5万円': 5, '7万円': 7, '10万円': 10, '15万円': 15, '20万円': 20 };

export function filterListings(list, f = {}) {
  const wild = (v) => !v || v === 'すべて';
  const limit = f.rent && f.rent !== '上限なし' ? RENT_LIMITS[f.rent] : null;
  const kw = (f.kw || '').trim();
  return list.filter((l) =>
    (wild(f.area) || l.pref === f.area) &&
    (wild(f.type) || l.type === f.type) &&
    (wild(f.layout) || l.layout === f.layout) &&
    (limit == null || l.price <= limit) &&
    (!kw || `${l.name}${l.pref}${l.city}${l.station}${l.check}`.includes(kw)));
}
