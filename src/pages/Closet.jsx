import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { CATEGORIES, daysSince } from '../lib/labels';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { SkeletonGrid } from '../lib/ui';

export default function Closet() {
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState('todo');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.from('garments').select('*').in('status', ['activa', 'en_venta']).order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []));
  }, []);
  const urls = usePhotoUrls((items || []).map((g) => g.photo_path));

  const shown = (items || []).filter((g) =>
    (cat === 'todo' || g.category === cat) &&
    (!q || `${g.name} ${g.color ?? ''} ${g.brand ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  );
  const unused = (items || []).filter((g) => g.status === 'activa' && (daysSince(g.last_worn_at ?? g.created_at) ?? 0) >= 180);

  const meta = (g) => {
    if (g.status === 'en_venta') return 'En venta';
    const d = daysSince(g.last_worn_at);
    return [g.color, d == null ? 'Sin usar aún' : d === 0 ? 'Usada hoy' : `Usada hace ${d} días`].filter(Boolean).join(' · ');
  };

  return (
    <main className="screen stack">
      <div className="between">
        <h1 className="h1">Mi clóset</h1>
        <span className="small muted">{items ? `${items.length} prendas` : ''}</span>
      </div>
      <input className="input" type="search" placeholder="Buscar por prenda, color o marca" aria-label="Buscar en mi clóset" value={q} onChange={(e) => setQ(e.target.value)} style={{ background: 'var(--mist)', border: 0 }} />
      <div className="chips" role="group" aria-label="Categoría">
        <button className={`chip ${cat === 'todo' ? 'on' : ''}`} onClick={() => setCat('todo')}>Todo</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>
      {unused.length > 0 && (
        <Link to="/bazar/vender" className="banner">
          <span><strong>{unused.length} {unused.length === 1 ? 'prenda' : 'prendas'} sin usar en 6 meses.</strong> Ponlas en venta y recogemos en tu casa.</span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      {!items && <SkeletonGrid count={6} />}
      {items && items.length === 0 && (
        <div className="empty">Tu clóset está vacío. Agrega tu primera prenda con una foto sobre un fondo liso y con buena luz.</div>
      )}
      <div className="grid2">
        {shown.map((g) => (
          <Link key={g.id} to={`/closet/${g.id}`} className="tile">
            <Ph url={urls[g.photo_path]} alt={g.name} tag={g.status === 'en_venta' ? 'EN VENTA' : null} />
            <span className="tile-name">{g.name}</span>
            <span className="tile-meta">{meta(g)}</span>
          </Link>
        ))}
      </div>
      <Link to="/closet/nueva" className="fab">+ Agregar prenda</Link>
    </main>
  );
}
