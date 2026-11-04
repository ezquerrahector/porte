// Motor de outfits (versión 1, por reglas): combina prendas propias según ocasión, clima,
// lo que llevas tiempo sin usar y lo que te gustó o no. Explica siempre por qué propone cada look.

const pick = (arr, score) => {
  if (!arr.length) return null;
  const scored = arr.map((g) => ({ g, s: score(g) + Math.random() * 0.8 }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0].g;
};

const daysUnused = (g) => (g.last_worn_at ? (Date.now() - new Date(g.last_worn_at)) / 86400000 : 60);

// Armonía de color por reglas de estilismo: los neutros combinan con todo; dos colores
// protagonistas distintos se penalizan; la misma familia (tono sobre tono) suma.
const NEUTRALS = ['negr', 'blanc', 'gris', 'beige', 'arena', 'camel', 'caf', 'marr', 'crema', 'hueso', 'marino', 'navy', 'mezclilla', 'denim', 'kaki', 'caqui', 'taupe', 'chocolate', 'ivory', 'marfil', 'nude', 'oliva', 'plata'];
const FAMILIES = { rojo: ['roj', 'vino', 'guind', 'borgo', 'tinto', 'cereza'], azul: ['azul', 'celest', 'turque', 'cobalt'], verde: ['verd', 'menta', 'esmeral'], rosa: ['ros', 'fucsi', 'magent'], amarillo: ['amarill', 'mostaz', 'ocre'], naranja: ['naranj', 'coral', 'terracot', 'ladrill'], morado: ['morad', 'lila', 'lavand', 'violet'] };
const norm = (c) => (c || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const isNeutral = (c) => !c || NEUTRALS.some((n) => norm(c).includes(n));
const family = (c) => Object.entries(FAMILIES).find(([, ks]) => ks.some((k) => norm(c).includes(k)))?.[0] ?? norm(c);
function colorFit(g, chosen) {
  if (isNeutral(g.color)) return 0.4;
  const bold = chosen.filter((p) => !isNeutral(p.color));
  if (!bold.length) return 0.6; // un color protagonista sobre base neutra
  return bold.every((p) => family(p.color) === family(g.color)) ? 0.5 : -2;
}

export function buildOutfit(garments, { occasion = 'casual', temp = 22, disliked = [], exclude = [] } = {}) {
  const active = garments.filter((g) => g.status === 'activa' && !exclude.includes(g.id));
  const by = (cat) => active.filter((g) => g.category === cat);
  const fitsOccasion = (g) => (g.occasions?.length ? (g.occasions.includes(occasion) ? 2 : -1) : 0);
  const fitsTemp = (g) => {
    if (temp <= 16) return g.warmth === 'abrigadora' ? 2 : g.warmth === 'ligera' ? -1 : 0.5;
    if (temp >= 27) return g.warmth === 'ligera' ? 2 : g.warmth === 'abrigadora' ? -2 : 0;
    return g.warmth === 'media' ? 1 : 0.3;
  };
  const freshness = (g) => Math.min(daysUnused(g), 90) / 30;
  const dislike = (g) => (disliked.includes(g.id) ? -1.5 : 0);
  const pieces = [];
  const score = (g) => fitsOccasion(g) + fitsTemp(g) + freshness(g) + dislike(g) + colorFit(g, pieces.map((p) => p.g));
  const dress = pick(by('vestido'), score);
  const useDress = dress && (by('arriba').length === 0 || by('abajo').length === 0 || Math.random() < 0.35);
  if (useDress) pieces.push({ slot: 'VESTIDO', g: dress });
  else {
    const top = pick(by('arriba'), score);
    if (top) pieces.push({ slot: 'ARRIBA', g: top });
    const bottom = pick(by('abajo'), score);
    if (bottom) pieces.push({ slot: 'ABAJO', g: bottom });
  }
  const needsLayer = temp <= 20 || occasion === 'formal' || occasion === 'oficina';
  if (needsLayer) {
    const layer = pick(by('encima'), score);
    if (layer) pieces.push({ slot: 'ENCIMA', g: layer });
  }
  const shoes = pick(by('calzado'), score);
  if (shoes) pieces.push({ slot: 'CALZADO', g: shoes });
  const acc = pick(by('accesorio'), score);
  if (acc && Math.random() < 0.6) pieces.push({ slot: 'ACCESORIO', g: acc });

  const reasons = [];
  if (pieces.some((p) => p.g.occasions?.includes(occasion))) reasons.push(`prendas pensadas para ${occasion}`);
  reasons.push(temp <= 16 ? `capas abrigadoras para ${temp} °C` : temp >= 27 ? `telas ligeras para ${temp} °C` : `peso medio para ${temp} °C`);
  const bold = pieces.filter((p) => !isNeutral(p.g.color));
  if (pieces.length > 1) reasons.push(bold.length === 0 ? 'base neutra que combina sin esfuerzo' : bold.length === 1 ? `un solo color protagonista (${bold[0].g.color.toLowerCase()}) sobre base neutra` : 'tono sobre tono en la misma familia de color');
  const forgotten = pieces.filter((p) => daysUnused(p.g) >= 45);
  if (forgotten.length) { const n = forgotten.map((p) => p.g.name.toLowerCase()); reasons.push(`rescata ${n.length > 1 ? n.slice(0, -1).join(', ') + ' y ' + n.at(-1) : n[0]}, que no usas hace tiempo`); }

  const complete = pieces.some((p) => p.slot === 'VESTIDO') || (pieces.some((p) => p.slot === 'ARRIBA') && pieces.some((p) => p.slot === 'ABAJO'));
  return { pieces, reasons, complete };
}

export function closetGaps(garments) {
  const active = garments.filter((g) => g.status === 'activa');
  const count = (c) => active.filter((g) => g.category === c).length;
  const gaps = [];
  if (count('arriba') + count('vestido') === 0) gaps.push('algo para arriba o un vestido');
  if (count('abajo') === 0 && count('vestido') === 0) gaps.push('algo para abajo');
  if (count('calzado') === 0) gaps.push('un par de zapatos');
  return gaps;
}
