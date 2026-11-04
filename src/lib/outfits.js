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
  // Accesorios con reglas: cinturón a juego con el zapato, corbata solo en looks formales, un reloj
  const accs = by('accesorio');
  const ofType = (t) => accs.filter((g) => g.subtype === t);
  if (pieces.some((p) => p.slot === 'ABAJO')) {
    const belts = ofType('cinturon');
    const match = shoes && leather(shoes) ? belts.filter((b) => leather(b) === leather(shoes)) : belts;
    const belt = pick(match.length ? match : [], score);
    if (belt) pieces.push({ slot: 'CINTURÓN', g: belt });
  }
  if ((occasion === 'formal' || (occasion === 'oficina' && Math.random() < 0.5)) && pieces.some((p) => p.slot === 'ARRIBA')) {
    const tie = pick(ofType('corbata'), score);
    if (tie) pieces.push({ slot: 'CORBATA', g: tie });
  }
  const watch = pick(ofType('reloj'), score);
  if (watch && Math.random() < 0.7) pieces.push({ slot: 'RELOJ', g: watch });
  const others = accs.filter((g) => !['cinturon', 'corbata', 'reloj'].includes(g.subtype));
  const extra = pick(others, score);
  if (extra && Math.random() < 0.5) pieces.push({ slot: 'ACCESORIO', g: extra });

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

// ===== Evaluador de outfits armados a mano =====
// Revisa color, formalidad, ocasión, clima y reglas de accesorios; da un veredicto y,
// si algo no funciona, busca en el clóset la prenda que mejor lo resuelve.

const FORMALITY = { deporte: 0, casual: 1, noche: 2, oficina: 2, formal: 3 };
const OCC_LABEL = { casual: 'casual', oficina: 'oficina', formal: 'algo formal', deporte: 'deporte', noche: 'la noche' };
const metal = (g) => { const c = norm(`${g.color || ''} ${g.name || ''}`); return /dorad|\boro\b|gold/.test(c) ? 'dorado' : /platead|plata|silver|acero/.test(c) ? 'plateado' : null; };
const leather = (g) => { const c = norm(g.color || ''); return /negr/.test(c) ? 'negro' : /(caf|marr|camel|chocolate|cogna|miel|tan)/.test(c) ? 'cafe' : null; };
const lower = (s) => (s || '').toLowerCase();

export function evaluateOutfit(pieces, { occasion = null, temp = 22 } = {}) {
  const issues = [];
  const goods = [];
  const has = (cat) => pieces.some((g) => g.category === cat);
  const acc = pieces.filter((g) => g.category === 'accesorio');
  const main = pieces.filter((g) => g.category !== 'accesorio');
  const complete = has('vestido') || (has('arriba') && has('abajo'));

  // Color: un solo color protagonista (los accesorios cuentan menos)
  const bold = main.filter((g) => !isNeutral(g.color));
  const fams = [...new Set(bold.map((g) => family(g.color)))];
  if (fams.length > 1) {
    const culprit = bold[bold.length - 1];
    issues.push({ gid: culprit.id, sev: 2, msg: `${culprit.name} compite con ${lower(bold[0].name)}: dos colores protagonistas a la vez.` });
  } else if (bold.length === 1) goods.push(`Un solo color protagonista (${lower(bold[0].color)}) sobre base neutra.`);
  else if (bold.length > 1) goods.push('Tono sobre tono en la misma familia de color.');
  else if (main.length > 1) goods.push('Base neutra: combina sin esfuerzo.');
  const boldAcc = acc.filter((g) => !isNeutral(g.color) && !metal(g));
  if (bold.length && boldAcc.some((g) => family(g.color) !== family(bold[0].color))) {
    const a = boldAcc.find((g) => family(g.color) !== family(bold[0].color));
    issues.push({ gid: a.id, sev: 1, msg: `${a.name} agrega otro color fuerte; mejor un accesorio neutro o del mismo tono.` });
  }

  // Formalidad: las piezas deben compartir un nivel
  const ranged = main.filter((g) => g.occasions?.length);
  if (ranged.length > 1) {
    const ranges = ranged.map((g) => { const lv = g.occasions.map((o) => FORMALITY[o] ?? 1); return { g, lo: Math.min(...lv), hi: Math.max(...lv) }; });
    const lo = Math.max(...ranges.map((r) => r.lo)), hi = Math.min(...ranges.map((r) => r.hi));
    if (lo - hi >= 2) {
      const sorted = [...ranges].sort((a, b) => a.hi - b.hi);
      const odd = sorted[0].hi < 2 ? sorted[0] : sorted[sorted.length - 1];
      issues.push({ gid: odd.g.id, sev: 2, msg: `${odd.g.name} no está al mismo nivel de formalidad que el resto del look.` });
    } else goods.push('Todas las piezas están al mismo nivel de formalidad.');
  }

  // Ocasión elegida
  if (occasion) {
    const target = FORMALITY[occasion] ?? 1;
    main.filter((g) => g.occasions?.length && !g.occasions.includes(occasion) && Math.min(...g.occasions.map((o) => Math.abs((FORMALITY[o] ?? 1) - target))) >= 2).slice(0, 1)
      .forEach((g) => issues.push({ gid: g.id, sev: 1, msg: `${g.name} no la marcaste para ${OCC_LABEL[occasion] || occasion}.` }));
  }

  // Clima
  main.filter((g) => temp >= 27 && g.warmth === 'abrigadora').slice(0, 1)
    .forEach((g) => issues.push({ gid: g.id, sev: 1, msg: `${g.name} es muy abrigadora para ${temp} °C.` }));
  if (temp <= 15 && !has('encima') && main.some((g) => g.warmth === 'ligera')) issues.push({ gid: null, sev: 1, msg: `Hace ${temp} °C: agrega algo encima.`, addCat: 'encima' });

  // Accesorios
  if (acc.length > 4) issues.push({ gid: acc[acc.length - 1].id, sev: 1, msg: 'Demasiados accesorios: con 3 o 4 el look respira mejor.' });
  const ties = acc.filter((g) => g.subtype === 'corbata');
  if (ties.length && !has('arriba')) issues.push({ gid: ties[0].id, sev: 2, msg: 'La corbata necesita una camisa debajo.' });
  if (ties.length && main.some((g) => g.occasions?.length && Math.max(...g.occasions.map((o) => FORMALITY[o] ?? 1)) <= 1)) issues.push({ gid: ties[0].id, sev: 2, msg: 'La corbata no va con piezas casuales o deportivas.' });
  if (acc.filter((g) => g.subtype === 'reloj').length > 1) issues.push({ gid: acc.filter((g) => g.subtype === 'reloj')[1].id, sev: 2, msg: 'Dos relojes a la vez: quédate con uno.' });
  const belt = acc.find((g) => g.subtype === 'cinturon');
  const shoes = pieces.find((g) => g.category === 'calzado');
  if (belt && shoes && leather(belt) && leather(shoes) && leather(belt) !== leather(shoes)) issues.push({ gid: belt.id, sev: 1, msg: 'Cinturón y zapatos en tonos distintos: lo clásico es que coincidan.' });
  else if (belt && shoes && leather(belt) && leather(belt) === leather(shoes)) goods.push('Cinturón y zapatos del mismo tono.');
  const metals = [...new Set(acc.map(metal).filter(Boolean))];
  if (metals.length > 1) issues.push({ gid: acc.filter((g) => metal(g) === metals[1])[0].id, sev: 1, msg: 'Mezclas dorado y plateado: elige un solo metal.' });

  if (!complete) issues.push({ gid: null, sev: 0, msg: 'Falta algo de arriba y de abajo, o un vestido.' });
  else if (!shoes) issues.push({ gid: null, sev: 1, msg: 'Agrega calzado para completar el look.', addCat: 'calzado' });

  const s2 = issues.filter((i) => i.sev === 2).length, s1 = issues.filter((i) => i.sev === 1).length;
  const score = complete ? Math.max(0, 100 - 35 * s2 - 10 * s1) : 0;
  const verdict = !complete ? null : score >= 85 ? 'Se ve muy bien' : score >= 70 ? 'Funciona, con detalles' : 'No combina';
  return { score, verdict, issues: issues.sort((a, b) => b.sev - a.sev), goods, complete };
}

// Para el problema más fuerte, busca en el clóset la pieza del mismo tipo que más sube la calificación.
export function suggestFix(pieces, closet, opts) {
  const base = evaluateOutfit(pieces, opts);
  const out = [];
  for (const issue of base.issues.filter((i) => i.gid && i.sev > 0).slice(0, 2)) {
    const bad = pieces.find((g) => g.id === issue.gid);
    if (!bad) continue;
    const pool = closet.filter((g) => g.status === 'activa' && g.category === bad.category && !pieces.some((p) => p.id === g.id)
      && (bad.category !== 'accesorio' || g.subtype === bad.subtype));
    let best = null;
    for (const cand of pool) {
      const sc = evaluateOutfit(pieces.map((p) => (p.id === bad.id ? cand : p)), opts).score;
      if (sc > base.score && (!best || sc > best.score)) best = { replace: bad, with: cand, score: sc };
    }
    if (!best && bad.category === 'accesorio') {
      const sc = evaluateOutfit(pieces.filter((p) => p.id !== bad.id), opts).score;
      if (sc > base.score) best = { replace: bad, with: null, score: sc };
    }
    if (best && !out.some((o) => o.replace.id === best.replace.id)) out.push(best);
  }
  return out;
}
