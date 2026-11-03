import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { uploadPhoto } from '../lib/photos';
import { suggestPrice } from '../lib/pricing';
import { CONDITIONS, money, daysSince, categoryLabel } from '../lib/labels';
import { usePhotoUrls, Ph } from '../lib/Photo';

function PickGarment() {
  const [items, setItems] = useState(null);
  const [mine, setMine] = useState([]);
  useEffect(() => {
    supabase.from('garments').select('*').eq('status', 'activa').then(({ data }) => {
      const list = (data || []).sort((a, b) => (daysSince(b.last_worn_at ?? b.created_at) ?? 0) - (daysSince(a.last_worn_at ?? a.created_at) ?? 0));
      setItems(list);
    });
    supabase.auth.getUser().then(({ data }) =>
      supabase.from('listings').select('*').eq('seller_id', data.user.id).neq('status', 'cancelada').order('created_at', { ascending: false })
        .then(({ data: l }) => setMine(l || [])));
  }, []);
  const urls = usePhotoUrls([...(items || []).map((g) => g.photo_path), ...mine.map((l) => l.photo_paths[0])]);
  const statusTxt = { publicada: 'Publicada', apartada: 'Apartada · en proceso', vendida: 'Vendida' };

  return (
    <main className="screen stack">
      <Link to="/bazar" className="back">← Bazar</Link>
      <h1 className="h1">Vender</h1>
      <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>Elige una prenda de tu clóset. Tú pones el precio; cuando se venda, pasamos por ella a tu domicilio.</p>
      {mine.length > 0 && (
        <div className="stack" style={{ gap: 0 }}>
          <span className="eyebrow" style={{ marginBottom: 4 }}>Mis publicaciones</span>
          {mine.map((l) => (
            <Link key={l.id} to={`/bazar/p/${l.id}`} className="list-row">
              <div className="row">
                <Ph className="thumb" url={urls[l.photo_paths[0]]} alt={l.title} />
                <div className="stack" style={{ gap: 3 }}>
                  <span style={{ fontWeight: 500 }}>{l.title}</span>
                  <span className="small muted">{statusTxt[l.status]}</span>
                </div>
              </div>
              <span className="price">{money(l.price)}</span>
            </Link>
          ))}
        </div>
      )}
      <span className="eyebrow">De tu clóset · primero lo que menos usas</span>
      {!items && <div className="loading">Cargando…</div>}
      {items?.length === 0 && (
        <div className="empty">No tienes prendas disponibles. <Link to="/closet/nueva">Agrega una a tu clóset</Link> para poder venderla.</div>
      )}
      <div className="grid2">
        {(items || []).map((g) => {
          const d = daysSince(g.last_worn_at);
          return (
            <Link key={g.id} to={`/bazar/vender/${g.id}`} className="tile">
              <Ph url={urls[g.photo_path]} alt={g.name} />
              <span className="tile-name">{g.name}</span>
              <span className="tile-meta">{d == null ? 'Sin usar aún' : `Usada hace ${d} días`}</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function SellForm({ garmentId }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [g, setG] = useState(null);
  const [files, setFiles] = useState([]);
  const [condition, setCondition] = useState('como_nuevo');
  const [defects, setDefects] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    supabase.from('garments').select('*').eq('id', garmentId).single().then(({ data }) => setG(data));
  }, [garmentId]);
  const urls = usePhotoUrls([g?.photo_path]);
  if (!g) return <main className="screen"><div className="loading">Cargando…</div></main>;

  const sug = suggestPrice(g.category, condition);
  const addFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setFiles((x) => [...x, { f, url: URL.createObjectURL(f) }].slice(0, 3));
  };

  async function publish(e) {
    e.preventDefault();
    const p = Number(String(price || sug.mid).replace(/[^0-9.]/g, ''));
    if (!p || p < 50) { setErr('Pon un precio de al menos $50.'); return; }
    if (!g.photo_path && files.length === 0) { setErr('Agrega al menos una foto actual de la prenda.'); return; }
    setBusy(true); setErr(null);
    try {
      const extra = [];
      for (const x of files) extra.push(await uploadPhoto(x.f, user.id, 'ventas'));
      const photo_paths = [...extra, ...(g.photo_path ? [g.photo_path] : [])];
      const { data, error } = await supabase.from('listings').insert({
        garment_id: g.id, title: g.name, description: description || null, category: g.category, audience: g.audience,
        size: g.size, brand: g.brand, color: g.color, condition, defects: defects || null, price: p,
        suggested_min: sug.min, suggested_max: sug.max, photo_paths
      }).select('id').single();
      if (error) throw error;
      await supabase.from('garments').update({ status: 'en_venta' }).eq('id', g.id);
      nav(`/bazar/p/${data.id}`, { replace: true });
    } catch (e2) {
      console.error(e2);
      setErr('No pudimos publicar. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <form className="stack" onSubmit={publish}>
        <Link to="/bazar/vender" className="back">← Elegir otra prenda</Link>
        <h1 className="h1">Poner en venta</h1>
        <div className="row">
          <Ph className="thumb" url={urls[g.photo_path]} alt={g.name} />
          <div className="stack" style={{ gap: 3 }}>
            <span style={{ fontWeight: 500 }}>{g.name}</span>
            <span className="small muted">{[categoryLabel(g.category), g.size && `Talla ${g.size}`, g.color].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        <div className="field">Fotos actuales (hasta 3)
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            {files.map((x) => <Ph key={x.url} url={x.url} alt="Foto nueva" />)}
            {files.length < 3 && (
              <label className="ph" style={{ border: '1px dashed #B5ADA4', background: '#fff', cursor: 'pointer', fontSize: 24, color: 'var(--muted)' }} aria-label="Agregar foto">
                +
                <input type="file" accept="image/*" capture="environment" onChange={addFile} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <span className="small muted" style={{ fontWeight: 400 }}>Fotos reales de hoy, con luz natural, de frente y de cualquier detalle.</span>
        </div>
        <div className="field">Estado
          <div className="chips wrap">
            {CONDITIONS.map((c) => (
              <button type="button" key={c.id} className={`chip ${condition === c.id ? 'on' : ''}`} onClick={() => setCondition(c.id)}>{c.label}</button>
            ))}
          </div>
        </div>
        <label className="field">Defectos (si tiene)
          <input className="input" value={defects} onChange={(e) => setDefects(e.target.value)} placeholder="Ej. botón flojo, sin defectos" />
        </label>
        <label className="field">Descripción (opcional)
          <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tela, corte, por qué te encantaba…" />
        </label>
        <div className="card stack" style={{ gap: 10 }}>
          <div className="between"><span className="eyebrow">Precio sugerido</span><span style={{ fontWeight: 500 }}>{money(sug.min)} – {money(sug.max)}</span></div>
          <label className="between" style={{ fontWeight: 600, alignItems: 'center' }}>Tu precio
            <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(sug.mid)} aria-label="Tu precio en pesos" style={{ width: 130, textAlign: 'right', fontWeight: 600, borderColor: 'var(--ink)' }} />
          </label>
          <div className="kv"><span>Comisión Porte</span><span>Por definir</span></div>
          <div className="kv"><span>Tu parte de la logística</span><span>Por definir</span></div>
        </div>
        <p className="small muted" style={{ margin: 0, lineHeight: 1.5 }}>Recogemos en tu domicilio solo cuando se venda. Recibes tu dinero cuando el comprador confirme que todo está bien.</p>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Publicando…' : 'Publicar'}</button>
      </form>
    </main>
  );
}

export default function Sell() {
  const { garmentId } = useParams();
  return garmentId ? <SellForm garmentId={garmentId} /> : <PickGarment />;
}
