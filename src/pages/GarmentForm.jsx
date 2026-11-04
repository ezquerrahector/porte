import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { uploadPhoto } from '../lib/photos';
import { studioPhoto, preloadStudio } from '../lib/studio';
import PhotoTutorial from '../lib/PhotoTutorial';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { CATEGORIES, OCCASIONS, WARMTH, AUDIENCE } from '../lib/labels';
import { SkeletonDetail, useConfirm } from '../lib/ui';

const EMPTY = { name: '', category: 'arriba', color: '', brand: '', size: '', audience: 'unisex', occasions: [], warmth: 'media', photo_path: null };

export default function GarmentForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const confirm = useConfirm();
  const [g, setG] = useState(id ? null : EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  // Foto de estudio: fondo oscuro uniforme, procesada en el propio teléfono
  const [studio, setStudio] = useState({ status: 'idle', blob: null, url: null });
  const [useStudio, setUseStudio] = useState(true);
  const [tut, setTut] = useState(false);

  useEffect(() => { preloadStudio(); }, []);
  useEffect(() => {
    if (id) supabase.from('garments').select('*').eq('id', id).single().then(({ data }) => setG(data));
  }, [id]);
  const urls = usePhotoUrls([g?.photo_path]);

  if (!g) return <SkeletonDetail />;
  const set = (k, v) => setG({ ...g, [k]: v });
  const toggleOcc = (o) => set('occasions', g.occasions.includes(o) ? g.occasions.filter((x) => x !== o) : [...g.occasions, o]);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStudio({ status: 'working', blob: null, url: null });
    studioPhoto(f)
      .then((r) => setStudio(r.ok ? { status: 'ok', blob: r.blob, url: URL.createObjectURL(r.blob) } : { status: 'fail', blob: null, url: null }))
      .catch(() => setStudio({ status: 'fail', blob: null, url: null }));
  }
  const studioReady = studio.status === 'ok' && useStudio;
  const shownPhoto = studioReady ? studio.url : preview;

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      let photo_path = g.photo_path;
      if (file) photo_path = await uploadPhoto(studioReady ? studio.blob : file, user.id, 'closet');
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
    if (!(await confirm({ title: '¿Quitar esta prenda de tu clóset?', body: 'Dejará de aparecer en tus outfits.', ok: 'Quitar prenda', danger: true }))) return;
    await supabase.from('garments').update({ status: 'archivada' }).eq('id', id);
    nav('/closet', { replace: true });
  }

  return (
    <main className="screen">
      <form className="stack" onSubmit={save}>
        <Link to="/closet" className="back">← Mi clóset</Link>
        <h1 className="h1">{id ? g.name : 'Nueva prenda'}</h1>
        <label className="tile" style={{ cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <Ph url={shownPhoto || urls[g.photo_path]} alt="Foto de la prenda" />
            {studio.status === 'working' && (
              <div className="studio-working" role="status">Preparando foto de estudio…</div>
            )}
          </div>
          <span className="small muted center">{preview || g.photo_path ? 'Toca para cambiar la foto' : 'Toca para tomar o elegir la foto'}</span>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
        </label>
        <button type="button" className="link" style={{ alignSelf: 'center' }} onClick={() => setTut(!tut)}>{tut ? 'Cerrar tutorial' : '¿Cómo tomo una buena foto?'}</button>
        {tut && (
          <div style={{ background: '#141414', borderRadius: 8, padding: 16 }}>
            <PhotoTutorial onDone={() => setTut(false)} />
          </div>
        )}
        {studio.status === 'ok' && (
          <label className="row small" style={{ justifyContent: 'center', gap: 8 }}>
            <input type="checkbox" checked={useStudio} onChange={(e) => setUseStudio(e.target.checked)} /> Usar fondo de estudio
          </label>
        )}
        {studio.status === 'fail' && (
          <p className="small muted center" style={{ margin: 0 }}>No pudimos separar la prenda del fondo; guardaremos tu foto original. Prueba sobre una superficie lisa.</p>
        )}
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
        <button className="btn" disabled={busy || studio.status === 'working'}>{busy ? 'Guardando…' : studio.status === 'working' ? 'Preparando foto…' : 'Guardar'}</button>
        {id && g.status === 'activa' && (
          <>
            <Link to={`/bazar/vender/${id}`} className="btn ghost">Poner en venta</Link>
            <button type="button" className="link muted" onClick={archive}>Quitar de mi clóset</button>
          </>
        )}
        {id && g.status === 'en_venta' && <div className="ok">Esta prenda está publicada en venta.</div>}
      </form>
    </main>
  );
}
