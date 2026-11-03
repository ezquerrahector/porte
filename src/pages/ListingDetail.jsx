import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { categoryLabel, conditionLabel, money } from '../lib/labels';
import { usePhotoUrls, Hanger } from '../lib/Photo';

export default function ListingDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [l, setL] = useState(null);
  const [step, setStep] = useState('ver');
  const [addr, setAddr] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    supabase.from('listings').select('*').eq('id', id).single().then(({ data }) => setL(data));
  }, [id]);
  useEffect(() => { if (profile?.phone) setPhone(profile.phone); }, [profile]);
  const urls = usePhotoUrls(l?.photo_paths || []);
  if (!l) return <main className="screen"><div className="loading">Cargando…</div></main>;

  const mine = l.seller_id === user.id;

  async function reserve(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { data, error } = await supabase.rpc('reserve_listing', { p_listing: l.id, p_address: addr.trim(), p_phone: phone.trim() });
    setBusy(false);
    if (error) { setErr(/disponible/.test(error.message) ? 'Alguien más la apartó primero. Esta prenda ya no está disponible.' : 'No pudimos apartarla. Inténtalo de nuevo.'); return; }
    if (phone && phone !== profile?.phone) await supabase.from('profiles').update({ phone }).eq('id', user.id);
    nav(`/pedidos/${data}`, { replace: true });
  }

  async function withdraw() {
    if (!window.confirm('¿Retirar esta prenda de la venta? Regresará a tu clóset.')) return;
    await supabase.from('listings').update({ status: 'cancelada' }).eq('id', l.id);
    if (l.garment_id) await supabase.from('garments').update({ status: 'activa' }).eq('id', l.garment_id);
    nav('/vender', { replace: true });
  }

  return (
    <main className="screen stack">
      <div className="sheet-photo" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', position: 'relative' }}>
        {l.photo_paths.length === 0 && <div style={{ margin: 'auto' }}><Hanger /></div>}
        {l.photo_paths.map((p) => (
          <div key={p} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {urls[p] ? <img src={urls[p]} alt={l.title} /> : <Hanger />}
          </div>
        ))}
      </div>
      <Link to="/comprar" className="back">← Comprar</Link>
      <div className="between">
        <h1 className="h1" style={{ fontSize: 28 }}>{l.title}</h1>
        <span style={{ fontSize: 22, fontWeight: 600 }}>{money(l.price)}</span>
      </div>
      <span className="small muted">
        {[categoryLabel(l.category), l.size && `Talla ${l.size}`, conditionLabel(l.condition), l.color, l.brand].filter(Boolean).join(' · ')}
      </span>
      {l.description && <p style={{ margin: 0, lineHeight: 1.55 }}>{l.description}</p>}
      <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
        <div className="kv"><span>Defectos</span><span>{l.defects || 'Ninguno reportado'}</span></div>
        <div className="kv"><span>Vendedor</span><span>Comunidad Porte · León</span></div>
        <div className="kv"><span>Envío a tu domicilio</span><span>Por definir</span></div>
        <div className="kv"><span>Revisión al recibir</span><span>48 horas</span></div>
      </div>

      {mine && (
        <>
          <div className="ok">Esta es tu publicación · {l.status === 'publicada' ? 'visible para compradores' : l.status}</div>
          {l.status === 'publicada' && <button className="btn ghost" onClick={withdraw}>Retirar de la venta</button>}
        </>
      )}

      {!mine && l.status !== 'publicada' && <div className="error">Esta prenda ya fue apartada por alguien más.</div>}

      {!mine && l.status === 'publicada' && step === 'ver' && (
        <>
          <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>
            Recogemos la prenda con el vendedor, la revisamos y te la entregamos. Si no coincide con la publicación, la reportas en 48 horas.
          </p>
          <button className="btn" onClick={() => setStep('apartar')}>Apartar</button>
          <span className="small muted center">Los pagos en línea se activan muy pronto. Tu apartado queda reservado.</span>
        </>
      )}

      {!mine && l.status === 'publicada' && step === 'apartar' && (
        <form className="stack" onSubmit={reserve}>
          <span className="h2">¿A dónde te la llevamos?</span>
          <label className="field">Dirección de entrega en León
            <textarea className="input" required value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Calle, número, colonia y referencias" />
          </label>
          <label className="field">Teléfono (WhatsApp)
            <input className="input" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </label>
          {err && <div className="error" role="alert">{err}</div>}
          <button className="btn" disabled={busy}>{busy ? 'Apartando…' : `Apartar por ${money(l.price)}`}</button>
          <button type="button" className="link muted" onClick={() => setStep('ver')}>Cancelar</button>
        </form>
      )}
    </main>
  );
}
