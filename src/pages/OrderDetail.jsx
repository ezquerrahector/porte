import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { ORDER_STEPS, money, orderStatusLabel } from '../lib/labels';

const fmt = (d) => new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [o, setO] = useState(null);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState(null);

  async function load() {
    const { data } = await supabase.from('orders').select('*, listing:listings(title)').eq('id', id).single();
    setO(data);
    const { data: ev } = await supabase.from('order_events').select('*').eq('order_id', id).order('created_at');
    setEvents(ev || []);
  }
  useEffect(() => { load(); }, [id]);
  if (!o) return <main className="screen"><div className="loading">Cargando…</div></main>;

  const isBuyer = o.buyer_id === user.id;
  const idx = ORDER_STEPS.findIndex((s) => s.id === o.status);
  const at = (s) => events.filter((e) => e.status === s).at(-1)?.created_at;
  const detail = (s) => {
    if (s.id === 'recoleccion_programada' && o.pickup_window) return o.pickup_window;
    if (s.id === 'en_camino' && o.delivery_window) return o.delivery_window;
    if (s.id === 'apartado' && !isBuyer) return 'Un comprador apartó tu prenda. Tenla lista y empacada.';
    return s.detail;
  };
  const hoursLeft = o.delivered_at ? Math.max(0, 48 - Math.floor((Date.now() - new Date(o.delivered_at)) / 3600000)) : null;

  async function confirm() {
    const { error } = await supabase.rpc('confirm_order', { p_order: o.id });
    setMsg(error ? { error: 'No pudimos confirmar. Inténtalo de nuevo.' } : { ok: '¡Gracias! Confirmaste que todo está bien.' });
    load();
  }

  return (
    <main className="screen stack">
      <Link to="/pedidos" className="back">← Mis pedidos</Link>
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Pedido P-{String(o.folio).padStart(4, '0')} · {isBuyer ? 'Compra' : 'Venta'} · {money(o.price)}</span>
        <h1 className="h1" style={{ fontSize: 28 }}>{o.listing?.title}</h1>
      </div>
      {['cancelado', 'incidencia'].includes(o.status) && <div className="error">{orderStatusLabel(o.status)}. Te contactaremos por WhatsApp.</div>}
      <div className="timeline">
        {ORDER_STEPS.map((s, i) => {
          const cls = idx < 0 ? 'next' : i < idx ? 'done' : i === idx ? (s.id === 'conforme' ? 'done' : 'now') : 'next';
          return (
            <div key={s.id} className={`step ${cls}`}>
              <div className="rail"><span className="dot" />{i < ORDER_STEPS.length - 1 && <span className="bar" />}</div>
              <div className="stack" style={{ gap: 2, paddingBottom: 14 }}>
                <span className="label">{s.label}</span>
                <span className="small muted">{at(s.id) ? `${fmt(at(s.id))} · ` : ''}{detail(s)}</span>
              </div>
            </div>
          );
        })}
      </div>
      {msg?.ok && <div className="ok">{msg.ok}</div>}
      {msg?.error && <div className="error">{msg.error}</div>}
      {isBuyer && o.status === 'entregado' && (
        <div className="card stack">
          <span>Te quedan <strong>{hoursLeft} horas</strong> para revisar tu prenda.</span>
          <button className="btn" onClick={confirm}>Todo está bien</button>
          <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(`Hola Porte, tengo un problema con mi pedido P-${String(o.folio).padStart(4, '0')}`)}`} target="_blank" rel="noreferrer">Reportar un problema</a>
        </div>
      )}
      <div className="spacer" />
      <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(`Hola Porte, pregunta sobre mi pedido P-${String(o.folio).padStart(4, '0')}`)}`} target="_blank" rel="noreferrer">Contactar a Porte</a>
    </main>
  );
}
