import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { SkeletonRows } from '../lib/ui';
import { evaluateOutfit, suggestFix } from '../lib/outfits';
import { getWeather } from '../lib/weather';
import { OCCASIONS, accessoryLabel } from '../lib/labels';

// Armar a mano: una fila por tipo de prenda (accesorios: varios a la vez).
// Mientras eliges, Porte te dice si el look funciona y qué cambiar si no.
const ROWS = [
  { cat: 'encima', label: 'Encima' },
  { cat: 'arriba', label: 'Arriba' },
  { cat: 'vestido', label: 'Vestido' },
  { cat: 'abajo', label: 'Abajo' },
  { cat: 'calzado', label: 'Calzado' },
  { cat: 'accesorio', label: 'Accesorios · puedes elegir varios', multi: true }
];
const TONE = { 'Se ve muy bien': { bg: '#E5F4E4', fg: '#1E5B22' }, 'Funciona, con detalles': { bg: '#F9EEDA', fg: '#7A5200' }, 'No combina': { bg: '#FBEBEB', fg: '#8A1C1C' } };

export default function BuildOutfit() {
  const [items, setItems] = useState(null);
  const [sel, setSel] = useState({});
  const [accs, setAccs] = useState([]);
  const [occasion, setOccasion] = useState(null);
  const [temp, setTemp] = useState(22);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    supabase.from('garments').select('*').eq('status', 'activa').order('last_worn_at', { ascending: true, nullsFirst: true })
      .then(({ data }) => setItems(data || []));
    getWeather().then((w) => setTemp(w.temp));
  }, []);
  const urls = usePhotoUrls((items || []).map((g) => g.photo_path));
  const rows = ROWS.map((r) => ({ ...r, list: (items || []).filter((g) => g.category === r.cat) })).filter((r) => r.list.length);
  const byId = useMemo(() => Object.fromEntries((items || []).map((g) => [g.id, g])), [items]);

  const choose = (cat, id) => {
    setMsg(null);
    if (cat === 'accesorio') { setAccs((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id])); return; }
    setSel((s) => {
      const next = { ...s, [cat]: s[cat] === id ? undefined : id };
      if (cat === 'vestido' && next.vestido) { next.arriba = undefined; next.abajo = undefined; }
      if ((cat === 'arriba' || cat === 'abajo') && next[cat]) next.vestido = undefined;
      return next;
    });
  };
  const ids = [...Object.values(sel).filter(Boolean), ...accs];
  const pieces = ids.map((id) => byId[id]).filter(Boolean);
  const opts = { occasion, temp };
  const ev = items ? evaluateOutfit(pieces, opts) : null;
  const fixes = ev?.complete && ev.score < 85 ? suggestFix(pieces, items, opts) : [];

  function applyFix(f) {
    setMsg(null);
    if (f.replace.category === 'accesorio') {
      setAccs((a) => (f.with ? a.map((x) => (x === f.replace.id ? f.with.id : x)) : a.filter((x) => x !== f.replace.id)));
    } else setSel((s) => ({ ...s, [f.replace.category]: f.with.id }));
  }

  async function wear() {
    const { error } = await supabase.rpc('wear_outfit', { p_garment_ids: ids, p_occasion: occasion || 'a_mano', p_temp: temp });
    setMsg(error ? { error: 'No pudimos guardar tu outfit.' } : { ok: 'Listo. Registramos tu outfit de hoy.' });
  }
  async function like() {
    const { error } = await supabase.from('outfit_logs').insert({ garment_ids: ids, action: 'me_gusta', occasion: occasion || 'a_mano', temp_c: temp });
    setMsg(error ? { error: 'No pudimos guardarlo.' } : { ok: 'Guardado. Lo tomaremos en cuenta en tus sugerencias.' });
  }

  return (
    <main className="screen stack">
      <Link to="/outfits" className="back">← Outfits</Link>
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Armar a mano · {temp} °C en León</span>
        <h1 className="h1">Elige una pieza de cada fila</h1>
      </div>
      <div className="chips" role="group" aria-label="¿Para qué es?">
        {OCCASIONS.map((o) => (
          <button key={o.id} className={`chip ${occasion === o.id ? 'on' : ''}`} onClick={() => setOccasion(occasion === o.id ? null : o.id)}>{o.label}</button>
        ))}
      </div>
      {!items && <SkeletonRows count={4} />}
      {items && rows.length === 0 && <div className="empty">Agrega prendas a tu clóset para armar outfits. <Link to="/closet/nueva">Agregar prenda</Link></div>}
      {rows.map((r) => (
        <section key={r.cat} className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.label}</span>
          <div className="pickrail" role="group" aria-label={r.label}>
            {!r.multi && <button type="button" className={`none ${!sel[r.cat] ? 'on' : ''}`} onClick={() => sel[r.cat] && choose(r.cat, sel[r.cat])} aria-pressed={!sel[r.cat]}>Sin</button>}
            {r.list.map((g) => {
              const on = r.multi ? accs.includes(g.id) : sel[r.cat] === g.id;
              return (
                <button type="button" key={g.id} className={`pick ${on ? 'on' : ''}`} onClick={() => choose(r.cat, g.id)} aria-pressed={on} aria-label={g.name}>
                  <Ph url={urls[g.photo_path]} alt="" />
                  {r.multi && <span className="small muted" style={{ display: 'block', padding: '4px 2px 0', fontSize: 11 }}>{accessoryLabel(g.subtype)}</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {ev?.complete && (
        <section className="card stack" style={{ gap: 10 }} aria-live="polite">
          <div className="between" style={{ alignItems: 'center' }}>
            <span className="h2">¿Cómo se ve?</span>
            <span style={{ padding: '6px 10px', borderRadius: 14, fontSize: 13, fontWeight: 600, background: TONE[ev.verdict].bg, color: TONE[ev.verdict].fg }}>{ev.verdict}</span>
          </div>
          {ev.issues.filter((i) => i.sev > 0).map((i, k) => (
            <div key={k} className="row small" style={{ alignItems: 'flex-start', gap: 8 }}><span aria-hidden="true" style={{ color: i.sev === 2 ? '#8A1C1C' : '#7A5200' }}>●</span><span style={{ lineHeight: 1.45 }}>{i.msg}</span></div>
          ))}
          {ev.goods.map((g, k) => (
            <div key={`g${k}`} className="row small" style={{ alignItems: 'flex-start', gap: 8 }}><span aria-hidden="true" style={{ color: '#1E5B22' }}>✓</span><span style={{ lineHeight: 1.45 }}>{g}</span></div>
          ))}
          {fixes.length > 0 && <span className="eyebrow" style={{ marginTop: 4 }}>Te sugerimos</span>}
          {fixes.map((f) => (
            <div key={f.replace.id} className="row" style={{ gap: 10 }}>
              <Ph className="thumb" url={f.with ? urls[f.with.photo_path] : urls[f.replace.photo_path]} alt="" />
              <span className="small" style={{ flex: 1, lineHeight: 1.45 }}>{f.with ? <>Cambia <strong>{f.replace.name}</strong> por <strong>{f.with.name}</strong></> : <>Quita <strong>{f.replace.name}</strong></>}</span>
              <button className="btn" style={{ width: 'auto', height: 40, padding: '0 14px', fontSize: 14 }} onClick={() => applyFix(f)}>{f.with ? 'Cambiar' : 'Quitar'}</button>
            </div>
          ))}
          {ev.score < 85 && fixes.length === 0 && <span className="small muted">No encontramos en tu clóset una pieza que lo mejore. Prueba cambiando la que marcamos.</span>}
        </section>
      )}

      {items && rows.length > 0 && (
        <div className="stack" style={{ gap: 10, position: 'sticky', bottom: 84, background: 'var(--paper)', paddingTop: 12 }}>
          {msg?.ok && <div className="ok" role="status">{msg.ok}</div>}
          {msg?.error && <div className="error" role="alert">{msg.error}</div>}
          {!ev?.complete && <span className="small muted center">Elige algo de arriba y de abajo, o un vestido</span>}
          <div className="row">
            <button className="btn ghost" disabled={!ev?.complete} onClick={like}>Guardar</button>
            <button className="btn" disabled={!ev?.complete} onClick={wear}>Me lo pongo</button>
          </div>
        </div>
      )}
    </main>
  );
}
