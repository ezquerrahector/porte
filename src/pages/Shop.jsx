import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { CATEGORIES, conditionLabel, money, categoryLabel } from '../lib/labels';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { SkeletonGrid } from '../lib/ui';

const FILTERS = [
  { id: 'todo', label: 'Todo' },
  { id: 'favoritas', label: '♥ Favoritas' },
  { id: 'talla', label: 'Mi talla' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'hombre', label: 'Hombre' },
  ...CATEGORIES.map((c) => ({ id: `cat:${c.id}`, label: c.label }))
];
const SORTS = [
  { id: 'recientes', label: 'Más recientes' },
  { id: 'menor', label: 'Precio: menor a mayor' },
  { id: 'mayor', label: 'Precio: mayor a menor' }
];
const norm = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Heart({ on, onClick }) {
  return (
    <button type="button" className="heart" aria-pressed={on} aria-label={on ? 'Quitar de favoritas' : 'Guardar en favoritas'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill={on ? '#6B1E2A' : 'none'} stroke={on ? '#6B1E2A' : '#141414'} strokeWidth="1.6" aria-hidden="true">
        <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 5 6.2 5c2 0 3.2 1.1 3.8 2.2C10.6 6.1 11.8 5 13.8 5 17 5 18.8 8.3 17.2 11.4 15 15.6 12 20 12 20z" transform="translate(1 0)" />
      </svg>
    </button>
  );
}

export async function toggleFavorite(listingId, isFav) {
  return isFav
    ? supabase.from('favorites').delete().eq('listing_id', listingId)
    : supabase.from('favorites').insert({ listing_id: listingId });
}

export default function Shop() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState(null);
  const [favs, setFavs] = useState(new Set());
  const [f, setF] = useState('todo');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recientes');

  useEffect(() => {
    supabase.from('listings').select('*').eq('status', 'publicada').neq('seller_id', user.id).order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => setItems(data || []));
    supabase.from('favorites').select('listing_id').then(({ data }) => setFavs(new Set((data || []).map((r) => r.listing_id))));
  }, [user.id]);
  const urls = usePhotoUrls((items || []).map((l) => l.photo_paths[0]));

  const mySizes = [profile?.size_top, profile?.size_bottom, profile?.shoe_size].filter(Boolean).map(norm);
  const shown = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    let list = (items || []).filter((l) => {
      if (f === 'favoritas' && !favs.has(l.id)) return false;
      if (f === 'talla' && !(l.size && mySizes.includes(norm(l.size)))) return false;
      if (f === 'mujer' || f === 'hombre') { if (!(l.audience === f || l.audience === 'unisex')) return false; }
      if (f.startsWith('cat:') && l.category !== f.slice(4)) return false;
      if (words.length) {
        const hay = norm([l.title, l.brand, l.color, l.size, categoryLabel(l.category), l.description].join(' '));
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    if (sort === 'menor') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'mayor') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [items, favs, f, q, sort, mySizes.join('|')]);

  async function fav(id) {
    const isFav = favs.has(id);
    setFavs((s) => { const n = new Set(s); isFav ? n.delete(id) : n.add(id); return n; });
    const { error } = await toggleFavorite(id, isFav);
    if (error) setFavs((s) => { const n = new Set(s); isFav ? n.add(id) : n.delete(id); return n; });
  }

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
      <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: saco, Zara, negro, talla M…" aria-label="Buscar en el Bazar" style={{ background: 'var(--mist)', border: 0 }} />
      <div className="chips" role="group" aria-label="Filtrar">
        {FILTERS.map((x) => (
          <button key={x.id} className={`chip ${f === x.id ? 'on' : ''}`} onClick={() => setF(x.id)}>{x.label}</button>
        ))}
      </div>
      {f === 'talla' && mySizes.length === 0 && (
        <div className="banner"><span>Agrega tus tallas en <Link to="/saldo">tu perfil</Link> para usar este filtro.</span></div>
      )}
      <Link to="/muy-pronto" className="dark-banner">
        <span className="stack" style={{ gap: 4 }}>
          <span className="small" style={{ color: 'var(--gold)' }}>Muy pronto</span>
          <span style={{ fontFamily: 'var(--serif)', fontStretch: '118%', fontWeight: 600, fontSize: 18 }}>Tienda y membresía Porte</span>
        </span>
        <span aria-hidden="true">→</span>
      </Link>
      <div className="between" style={{ alignItems: 'center' }}>
        <span className="eyebrow">{items ? `${shown.length} ${shown.length === 1 ? 'prenda' : 'prendas'}` : 'Prendas'}</span>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      {!items && <SkeletonGrid count={4} meta={3} />}
      {items && shown.length === 0 && (
        <div className="empty">{f === 'favoritas' ? 'Aún no guardas favoritas. Toca el corazón de una prenda para guardarla.' : q ? 'No encontramos prendas con esa búsqueda.' : 'Aún no hay prendas con este filtro. Las primeras publicaciones del piloto aparecerán aquí.'}</div>
      )}
      <div className="grid2">
        {shown.map((l) => (
          <Link key={l.id} to={`/bazar/p/${l.id}`} className="tile">
            <div style={{ position: 'relative' }}>
              <Ph url={urls[l.photo_paths[0]]} alt={l.title} />
              <Heart on={favs.has(l.id)} onClick={() => fav(l.id)} />
            </div>
            <span className="price">{money(l.price)}</span>
            <span className="tile-name">{l.title}</span>
            <span className="tile-meta">{[l.size && `Talla ${l.size}`, conditionLabel(l.condition)].filter(Boolean).join(' · ')}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
