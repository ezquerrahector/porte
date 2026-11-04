import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { ORDER_STEPS, money, orderStatusLabel } from '../lib/labels';
import { SkeletonRows, useConfirm } from '../lib/ui';

const NEXT = { apartado: 'recoleccion_programada', recoleccion_programada: 'recogido', recogido: 'en_camino', en_camino: 'entregado', entregado: 'conforme' };

function OrderCard({ o, reload }) {
  const confirm = useConfirm();
  const [win, setWin] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState(null);
  const next = NEXT[o.status];
  const needsWindow = next === 'recoleccion_programada' || next === 'en_camino';

  async function go(status) {
    setErr(null);
    const { error } = await supabase.rpc('advance_order', { p_order: o.id, p_status: status, p_note: note || null, p_window: win || null });
    if (error) setErr(error.message); else { setWin(''); setNote(''); reload(); }
  }

  return (
    <div className="card stack" style={{ gap: 10 }}>
      <div className="between">
        <strong>P-{String(o.folio).padStart(4, '0')} · {o.listing?.title}</strong>
        <span>{money(o.price)}</span>
      </div>
      <span className="small muted">{orderStatusLabel(o.status)} · {new Date(o.created_at).toLocaleString('es-MX')}</span>
      <div className="small" style={{ lineHeight: 1.5 }}>
        <div><strong>Entregar en:</strong> {o.buyer_address || '—'}</div>
        <div><strong>Tel. comprador:</strong> {o.buyer_phone || '—'}</div>
        <div><strong>Vendedor:</strong> {o.seller?.full_name || '—'} · {o.seller?.phone || 'sin teléfono'} · {o.seller?.zone || 'sin zona'}</div>
      </div>
      {next && (
        <>
          {needsWindow && <input className="input" value={win} onChange={(e) => setWin(e.target.value)} placeholder="Ventana: jueves 10:00 – 13:00" aria-label="Ventana de horario" />}
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota interna (opcional)" aria-label="Nota" />
          <button className="btn" onClick={() => go(next)}>Pasar a: {ORDER_STEPS.find((s) => s.id === next)?.label}</button>
        </>
      )}
      {!['conforme', 'cancelado'].includes(o.status) && (
        <div className="row">
          <button className="btn ghost" onClick={() => go('incidencia')}>Incidencia</button>
          <button className="btn ghost" onClick={async () => (await confirm({ title: '¿Cancelar el pedido?', body: 'La prenda vuelve a publicarse en el Bazar.', ok: 'Cancelar pedido', cancel: 'Volver', danger: true })) && go('cancelado')}>Cancelar</button>
        </div>
      )}
      {err && <div className="error">{err}</div>}
    </div>
  );
}

export default function Admin() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState(null);
  const [invites, setInvites] = useState([]);
  const [code, setCode] = useState('');
  const [uses, setUses] = useState(1);
  const [filter, setFilter] = useState('activos');

  async function load() {
    const { data } = await supabase.from('orders').select('*, listing:listings(title), seller:profiles!orders_seller_id_fkey(full_name, phone, zone)').order('created_at', { ascending: false });
    setOrders(data || []);
    const { data: inv } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
    setInvites(inv || []);
  }
  useEffect(() => { if (profile?.is_admin) load(); }, [profile]);
  if (profile && !profile.is_admin) return <Navigate to="/outfits" replace />;

  async function addInvite(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase() || `PORTE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await supabase.from('invites').insert({ code: c, max_uses: Number(uses) || 1 });
    setCode(''); load();
  }

  const shown = (orders || []).filter((o) => (filter === 'activos' ? !['conforme', 'cancelado'].includes(o.status) : true));

  return (
    <main className="screen stack">
      <Link to="/saldo" className="back">← Saldo</Link>
      <h1 className="h1">Operación</h1>
      <div className="chips">
        <button className={`chip ${filter === 'activos' ? 'on' : ''}`} onClick={() => setFilter('activos')}>Pedidos activos</button>
        <button className={`chip ${filter === 'todos' ? 'on' : ''}`} onClick={() => setFilter('todos')}>Todos</button>
      </div>
      {!orders && <SkeletonRows />}
      {orders && shown.length === 0 && <div className="empty">Sin pedidos por atender.</div>}
      {shown.map((o) => <OrderCard key={o.id} o={o} reload={load} />)}

      <span className="h2" style={{ marginTop: 12 }}>Invitaciones</span>
      <form className="row" onSubmit={addInvite}>
        <input className="input" style={{ flex: 2 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código (o automático)" aria-label="Código" />
        <input className="input" style={{ flex: 1 }} type="number" min="1" value={uses} onChange={(e) => setUses(e.target.value)} aria-label="Usos" />
        <button className="btn" style={{ width: 'auto' }}>Crear</button>
      </form>
      <div>
        {invites.map((i) => (
          <div key={i.code} className="list-row">
            <span style={{ fontWeight: 600, letterSpacing: 1 }}>{i.code}</span>
            <span className="small muted">{i.uses}/{i.max_uses} usos</span>
          </div>
        ))}
      </div>
    </main>
  );
}
