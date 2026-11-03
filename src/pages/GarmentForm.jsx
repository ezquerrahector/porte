import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { uploadPhoto } from '../lib/photos';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { CATEGORIES, OCCASIONS, WARMTH, AUDIENCE } from '../lib/labels';

const EMPTY = { name: '', category: 'arriba', color: '', brand: '', size: '', audience: 'unisex', occasions: [], warmth: 'media', photo_path: null };

export default function GarmentForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [g, setG] = useState(id ? null : EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (id) supabase.from('garments').select('*').eq('id', id).single().then(({ data }) => setG(data));
  }, [id]);
  const urls = usePhotoUrls([g?.photo_path]);

  if (!g) return <main className="screen"><div className="loading">Cargando…</div></main>;
  const set = (k, v) => setG({ ...g, [k]: v });
  const toggleOcc = (o) => set('occasions', g.occasions.includes(o) ? g.occasions.filter((x) => x !== o) : [...g.occasions, o]);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      let photo_path = g.photo_path;
      if (file) photo_path = await uploadPhoto(file, user.id, 'closet');
      const row = {
        name: g.name.trim(), category: g.category, color: g.color || null, brand: g.brand || null, size: g.size || null,
        audience: g.audience, occasions: g.occasions, warmth: g.warmth, photo_path
      };
      const { error } = id
        ? await supabase.from('garments').update(row).eq('id', id)
        : await supabase.from('garments').insert(row);
      if (error) throw error;
      nav(id ? '/closet' : '/closet', { replace: true });
    } catch (e2) {
      setErr('No pudimos guardar la prenda. Revisa tu conexión e inténtalo de nuevo.');
      console.error(e2);
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!window.confirm('¿Quitar esta prenda de tu clóset?')) return;
    await supabase.from('garments').update({ status: 'archivada' }).eq('id', id);
    nav('/closet', { replace: true });
  }

  return (
    <main className="screen">
      <form className="stack" onSubmit={save}>
        <Link to="/closet" className="back">← Mi clóset</Link>
        <h1 className="h1">{id ? g.name : 'Nueva prenda'}</h1>
        <label className="tile" style={{ cursor: 'pointer' }}>
          <Ph url={preview || urls[g.photo_path]} alt="Foto de la prenda" />
          <span className="small muted center">{preview || g.photo_path ? 'Toca para cambiar la foto' : 'Toca para tomar o elegir la foto'}</span>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
        </label>
        <label className="field">Nombre
          <input className="input" required value={g.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Camisa Oxford" />
        </label>
        <div className="field">Tipo
          <div className="chips wrap">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} className={`chip ${g.category === c.id ? 'on' : ''}`} onClick={() => set('category', c.id)}>{c.label}</button>
            ))}
          </div>
        </div>
        <div className="grid2">
          <label className="field">Color<input className="input" value={g.color ?? ''} onChange={(e) => set('color', e.target.value)} placeholder="Blanca" /></label>
          <label className="field">Talla<input className="input" value={g.size ?? ''} onChange={(e) => set('size', e.target.value)} placeholder="M, 32, 26…" /></label>
        </div>
        <label className="field">Marca (opcional)<input className="input" value={g.brand ?? ''} onChange={(e) => set('brand', e.target.value)} /></label>
        <div className="field">¿Para qué la usas?
          <div className="chips wrap">
            {OCCASIONS.map((o) => (
              <button type="button" key={o.id} className={`chip ${g.occasions.includes(o.id) ? 'on' : ''}`} onClick={() => toggleOcc(o.id)}>{o.label}</button>
            ))}
          </div>
        </div>
        <div className="field">Qué tan abrigadora es
          <div className="chips wrap">
            {WARMTH.map((w) => (
              <button type="button" key={w.id} className={`chip ${g.warmth === w.id ? 'on' : ''}`} onClick={() => set('warmth', w.id)}>{w.label}</button>
            ))}
          </div>
        </div>
        <div className="field">Línea
          <div className="chips wrap">
            {AUDIENCE.map((a) => (
              <button type="button" key={a.id} className={`chip ${g.audience === a.id ? 'on' : ''}`} onClick={() => set('audience', a.id)}>{a.label}</button>
            ))}
          </div>
        </div>
        {err && <div className="error" role="alert">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        {id && g.status === 'activa' && (
          <>
            <Link to={`/vender/${id}`} className="btn ghost">Poner en venta</Link>
            <button type="button" className="link muted" onClick={archive}>Quitar de mi clóset</button>
          </>
        )}
        {id && g.status === 'en_venta' && <div className="ok">Esta prenda está publicada en venta.</div>}
      </form>
    </main>
  );
}
