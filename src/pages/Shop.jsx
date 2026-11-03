import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { CATEGORIES, conditionLabel, money } from '../lib/labels';
import { usePhotoUrls, Ph } from '../lib/Photo';

const FILTERS = [
  { id: 'todo', label: 'Todo' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'hombre', label: 'Hombre' },
  ...CATEGORIES.map((c) => ({ id: `cat:${c.id}`, label: c.label }))
];

export default function Shop() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [f, setF] = useState('todo');

  useEffect(() => {
    supabase.from('listings').select('*').eq('status', 'publicada').neq('seller_id', user.id).order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setItems(data || []));
  }, [user.id]);
  const urls = usePhotoUrls((items || []).map((l) => l.photo_paths[0]));

  const shown = (items || []).filter((l) => {
    if (f === 'todo') return true;
    if (f.startsWith('cat:')) return l.category === f.slice(4);
    return l.audience === f || l.audience === 'unisex';
  });

  return (
    <main className="screen stack">
      <div className="stack" style={{ gap: 6 }}>
        <h1 className="h1">Bazar</h1>
        <span className="small muted">Compra y vende ropa con la comunidad Porte en León</span>
      </div>
      <div className="row">
        <Link to="/bazar/vender" className="btn" style={{ height: 46 }}>+ Vender</Link>
        <Link to="/pedidos" className="btn ghost" style={{ height: 46 }}>Mis pedidos</Link>
      </div>
      <div className="chips" role="group" aria-label="Filtrar">
        {FILTERS.map((x) => (
          <button key={x.id} className={`chip ${f === x.id ? 'on' : ''}`} onClick={() => setF(x.id)}>{x.label}</button>
        ))}
      </div>
      <Link to="/muy-pronto" className="dark-banner">
        <span className="stack" style={{ gap: 4 }}>
          <span className="small" style={{ letterSpacing: 2, color: 'var(--gold)' }}>MUY PRONTO</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Tienda y membresía Porte</span>
        </span>
        <span aria-hidden="true">→</span>
      </Link>
      <span className="eyebrow">Prendas de la comunidad Porte en León</span>
      {!items && <div className="loading">Cargando prendas…</div>}
      {items && shown.length === 0 && (
        <div className="empty">Aún no hay prendas con este filtro. Las primeras publicaciones del piloto aparecerán aquí.</div>
      )}
      <div className="grid2">
        {shown.map((l) => (
          <Link key={l.id} to={`/bazar/p/${l.id}`} className="tile">
            <Ph url={urls[l.photo_paths[0]]} alt={l.title} />
            <span className="price">{money(l.price)}</span>
            <span className="tile-name">{l.title}</span>
            <span className="tile-meta">{[l.size && `Talla ${l.size}`, conditionLabel(l.condition)].filter(Boolean).join(' · ')}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
