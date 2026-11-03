import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { money, orderStatusLabel } from '../lib/labels';

export default function Balance() {
  const { user, profile, setProfile } = useAuth();
  const [sales, setSales] = useState(null);
  const [edit, setEdit] = useState(false);
  const [p, setP] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('orders').select('*, listing:listings(title)').eq('seller_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setSales(data || []));
  }, [user.id]);
  useEffect(() => { if (profile) setP(profile); }, [profile]);

  const live = (sales || []).filter((o) => o.status !== 'cancelado');
  const available = live.filter((o) => o.status === 'conforme').reduce((s, o) => s + Number(o.price), 0);
  const inProcess = live.filter((o) => o.status !== 'conforme').reduce((s, o) => s + Number(o.price), 0);

  async function saveProfile(e) {
    e.preventDefault();
    const row = { full_name: p.full_name, phone: p.phone, zone: p.zone, size_top: p.size_top, size_bottom: p.size_bottom, shoe_size: p.shoe_size };
    const { data, error } = await supabase.from('profiles').update(row).eq('id', user.id).select().single();
    if (!error) { setProfile(data); setEdit(false); setSaved(true); }
  }
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });

  return (
    <main className="screen stack">
      <h1 className="h1">Mi saldo</h1>
      <div className="stack" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 4, padding: 20, gap: 14 }}>
        <div className="stack" style={{ gap: 4 }}>
          <span className="small" style={{ letterSpacing: 1.5, color: '#D9D4CE' }}>DISPONIBLE</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 40 }}>{money(available)}</span>
          <span className="small" style={{ color: '#BDB6AF' }}>Antes de comisión y logística (por definir)</span>
        </div>
        <div className="between small" style={{ color: '#D9D4CE' }}><span>En proceso</span><span>{money(inProcess)}</span></div>
        <button className="btn" disabled style={{ background: '#3A3734', borderColor: '#3A3734', color: '#BDB6AF' }}>Retirar · se activa con los pagos</button>
      </div>

      <div className="between"><span style={{ fontWeight: 600 }}>Mis ventas</span><Link to="/pedidos" className="small">Ver pedidos</Link></div>
      {!sales && <div className="loading">Cargando…</div>}
      {sales?.length === 0 && <div className="empty">Aún no vendes nada. <Link to="/vitrina/vender">Pon en venta</Link> lo que ya no usas.</div>}
      <div>
        {live.map((o) => (
          <Link key={o.id} to={`/pedidos/${o.id}`} className="list-row">
            <div className="stack" style={{ gap: 3 }}>
              <span style={{ fontWeight: 500 }}>{o.listing?.title}</span>
              <span className="small muted">{orderStatusLabel(o.status)}</span>
            </div>
            <span className="price">{money(o.price)}</span>
          </Link>
        ))}
      </div>

      <div className="between" style={{ marginTop: 12 }}>
        <span className="h2">Mi perfil</span>
        {!edit && <button className="link" onClick={() => { setEdit(true); setSaved(false); }}>Editar</button>}
      </div>
      {saved && <div className="ok">Perfil actualizado.</div>}
      {!edit ? (
        <div className="card">
          <div className="kv"><span>Nombre</span><span>{profile?.full_name || '—'}</span></div>
          <div className="kv"><span>Correo</span><span>{user.email}</span></div>
          <div className="kv"><span>Teléfono</span><span>{profile?.phone || '—'}</span></div>
          <div className="kv"><span>Colonia / zona</span><span>{profile?.zone || '—'}</span></div>
          <div className="kv"><span>Tallas</span><span>{[profile?.size_top, profile?.size_bottom, profile?.shoe_size].filter(Boolean).join(' · ') || '—'}</span></div>
        </div>
      ) : (
        <form className="stack" onSubmit={saveProfile}>
          <label className="field">Nombre<input className="input" value={p.full_name ?? ''} onChange={set('full_name')} /></label>
          <label className="field">Teléfono (WhatsApp)<input className="input" type="tel" value={p.phone ?? ''} onChange={set('phone')} /></label>
          <label className="field">Colonia / zona de León<input className="input" value={p.zone ?? ''} onChange={set('zone')} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            <label className="field">Arriba<input className="input" value={p.size_top ?? ''} onChange={set('size_top')} placeholder="M" /></label>
            <label className="field">Abajo<input className="input" value={p.size_bottom ?? ''} onChange={set('size_bottom')} placeholder="32" /></label>
            <label className="field">Calzado<input className="input" value={p.shoe_size ?? ''} onChange={set('shoe_size')} placeholder="26" /></label>
          </div>
          <button className="btn">Guardar</button>
        </form>
      )}
      <Link to="/muy-pronto" className="dark-banner">
        <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>Tienda y membresía · Muy pronto</span><span aria-hidden="true">→</span>
      </Link>
      {profile?.is_admin && <Link to="/operacion" className="btn ghost">Panel de operación</Link>}
      <button className="link muted" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
    </main>
  );
}
