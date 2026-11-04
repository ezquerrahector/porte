import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { SkeletonRows } from '../lib/ui';

// Armar a mano: una fila deslizable por tipo de prenda; tocas una pieza por fila.
const ROWS = [
  { cat: 'encima', label: 'Encima' },
  { cat: 'arriba', label: 'Arriba' },
  { cat: 'vestido', label: 'Vestido' },
  { cat: 'abajo', label: 'Abajo' },
  { cat: 'calzado', label: 'Calzado' },
  { cat: 'accesorio', label: 'Accesorio' }
];

export default function BuildOutfit() {
  const [items, setItems] = useState(null);
  const [sel, setSel] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    supabase.from('garments').select('*').eq('status', 'activa').order('last_worn_at', { ascending: true, nullsFirst: true })
      .then(({ data }) => setItems(data || []));
  }, []);
  const urls = usePhotoUrls((items || []).map((g) => g.photo_path));
  const rows = ROWS.map((r) => ({ ...r, list: (items || []).filter((g) => g.category === r.cat) })).filter((r) => r.list.length);

  const choose = (cat, id) => {
    setMsg(null);
    setSel((s) => {
      const next = { ...s, [cat]: s[cat] === id ? undefined : id };
      if (cat === 'vestido' && next.vestido) { next.arriba = undefined; next.abajo = undefined; }
      if ((cat === 'arriba' || cat === 'abajo') && next[cat]) next.vestido = undefined;
      return next;
    });
  };
  const ids = Object.values(sel).filter(Boolean);
  const complete = sel.vestido || (sel.arriba && sel.abajo);

  async function wear() {
    const { error } = await supabase.rpc('wear_outfit', { p_garment_ids: ids, p_occasion: 'a_mano', p_temp: null });
    setMsg(error ? { error: 'No pudimos guardar tu outfit.' } : { ok: 'Listo. Registramos tu outfit de hoy.' });
  }
  async function like() {
    const { error } = await supabase.from('outfit_logs').insert({ garment_ids: ids, action: 'me_gusta', occasion: 'a_mano' });
    setMsg(error ? { error: 'No pudimos guardarlo.' } : { ok: 'Guardado en tus favoritos. Lo tomaremos en cuenta en tus sugerencias.' });
  }

  return (
    <main className="screen stack">
      <Link to="/outfits" className="back">← Outfits</Link>
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Armar a mano</span>
        <h1 className="h1">Elige una pieza<br />de cada fila.</h1>
      </div>
      {!items && <SkeletonRows count={4} />}
      {items && rows.length === 0 && <div className="empty">Agrega prendas a tu clóset para armar outfits. <Link to="/closet/nueva">Agregar prenda</Link></div>}
      {rows.map((r) => (
        <section key={r.cat} className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.label}</span>
          <div className="pickrail" role="group" aria-label={r.label}>
            <button type="button" className={`none ${!sel[r.cat] ? 'on' : ''}`} onClick={() => choose(r.cat, sel[r.cat])} aria-pressed={!sel[r.cat]}>Sin</button>
            {r.list.map((g) => (
              <button type="button" key={g.id} className={`pick ${sel[r.cat] === g.id ? 'on' : ''}`} onClick={() => choose(r.cat, g.id)} aria-pressed={sel[r.cat] === g.id} aria-label={g.name}>
                <Ph url={urls[g.photo_path]} alt="" />
              </button>
            ))}
          </div>
        </section>
      ))}
      {items && rows.length > 0 && (
        <div className="stack" style={{ gap: 10, position: 'sticky', bottom: 84, background: 'var(--paper)', paddingTop: 12 }}>
          {msg?.ok && <div className="ok" role="status">{msg.ok}</div>}
          {msg?.error && <div className="error" role="alert">{msg.error}</div>}
          <span className="small muted center">{complete ? `${ids.length} piezas seleccionadas` : 'Elige algo de arriba y de abajo, o un vestido'}</span>
          <div className="row">
            <button className="btn ghost" disabled={!complete} onClick={like}>Guardar</button>
            <button className="btn" disabled={!complete} onClick={wear}>Me lo pongo</button>
          </div>
        </div>
      )}
    </main>
  );
}
