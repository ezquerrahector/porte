import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { money, orderStatusLabel } from '../lib/labels';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { SkeletonRows } from '../lib/ui';

export default function Orders() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState('compras');

  useEffect(() => {
    supabase.from('orders').select('*, listing:listings(title, photo_paths)').order('created_at', { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, []);
  const urls = usePhotoUrls((rows || []).map((o) => o.listing?.photo_paths?.[0]));
  const shown = (rows || []).filter((o) => (tab === 'compras' ? o.buyer_id === user.id : o.seller_id === user.id));

  return (
    <main className="screen stack">
      <Link to="/bazar" className="back">← Bazar</Link>
      <h1 className="h1">Mis pedidos</h1>
      <div className="chips">
        <button className={`chip ${tab === 'compras' ? 'on' : ''}`} onClick={() => setTab('compras')}>Lo que compré</button>
        <button className={`chip ${tab === 'ventas' ? 'on' : ''}`} onClick={() => setTab('ventas')}>Lo que vendí</button>
      </div>
      {!rows && <SkeletonRows />}
      {rows && shown.length === 0 && <div className="empty">Aún no tienes pedidos aquí.</div>}
      <div>
        {shown.map((o) => (
          <Link key={o.id} to={`/pedidos/${o.id}`} className="list-row">
            <div className="row">
              <Ph className="thumb" url={urls[o.listing?.photo_paths?.[0]]} alt={o.listing?.title} />
              <div className="stack" style={{ gap: 3 }}>
                <span style={{ fontWeight: 500 }}>{o.listing?.title}</span>
                <span className="small muted">P-{String(o.folio).padStart(4, '0')} · {orderStatusLabel(o.status)}</span>
              </div>
            </div>
            <span className="price">{money(o.price)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
