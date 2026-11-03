// Motor de outfits (versión 1, por reglas): combina prendas propias según ocasión, clima,
// lo que llevas tiempo sin usar y lo que te gustó o no. Explica siempre por qué propone cada look.

const pick = (arr, score) => {
  if (!arr.length) return null;
  const scored = arr.map((g) => ({ g, s: score(g) + Math.random() * 0.8 }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0].g;
};

const daysUnused = (g) => (g.last_worn_at ? (Date.now() - new Date(g.last_worn_at)) / 86400000 : 60);

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
  const score = (g) => fitsOccasion(g) + fitsTemp(g) + freshness(g) + dislike(g);

  const pieces = [];
  const dress = pick(by('vestido'), score);
  const useDress = dress && (by('arriba').length === 0 || by('abajo').length === 0 || Math.random() < 0.35);
  if (useDress) pieces.push({ slot: 'VESTIDO', g: dress });
  else {
    const top = pick(by('arriba'), score);
    const bottom = pick(by('abajo'), score);
    if (top) pieces.push({ slot: 'ARRIBA', g: top });
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
  const forgotten = pieces.filter((p) => daysUnused(p.g) >= 45);
  if (forgotten.length) reasons.push(`rescata ${forgotten.map((p) => p.g.name.toLowerCase()).join(' y ')}, que no usas hace tiempo`);

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
