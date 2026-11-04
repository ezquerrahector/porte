import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { buildOutfit, closetGaps } from '../lib/outfits';
import { getWeather } from '../lib/weather';
import { OCCASIONS } from '../lib/labels';
import { usePhotoUrls, Ph } from '../lib/Photo';
import { SkeletonGrid } from '../lib/ui';

const today = () =>
  new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export default function Outfits() {
  const { profile } = useAuth();
  const [garments, setGarments] = useState(null);
  const [weather, setWeather] = useState({ temp: 22, ok: false });
  const [occasion, setOccasion] = useState(() => (new Date().getDay() % 6 === 0 ? 'casual' : 'oficina'));
  const [disliked, setDisliked] = useState([]);
  const [seed, setSeed] = useState(0);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    supabase.from('garments').select('*').eq('status', 'activa').then(({ data }) => setGarments(data || []));
    getWeather().then(setWeather);
    supabase.from('outfit_logs').select('garment_ids').eq('action', 'no_me_gusta').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setDisliked((data || []).flatMap((r) => r.garment_ids)));
  }, []);

  const outfit = useMemo(
    () => (garments ? buildOutfit(garments, { occasion, temp: weather.temp, disliked }) : null),
    // seed fuerza una nueva combinación con "Ver otro"
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [garments, occasion, weather.temp, seed]
  );
  const urls = usePhotoUrls(outfit ? outfit.pieces.map((p) => p.g.photo_path) : []);
  const ids = outfit ? outfit.pieces.map((p) => p.g.id) : [];

  async function wear() {
    const { error } = await supabase.rpc('wear_outfit', { p_garment_ids: ids, p_occasion: occasion, p_temp: weather.temp });
    setMsg(error ? { error: 'No pudimos guardar tu outfit.' } : { ok: 'Guardado. Te lo tomamos en cuenta para próximas sugerencias.' });
  }
  async function dislike() {
    await supabase.from('outfit_logs').insert({ garment_ids: ids, action: 'no_me_gusta', occasion, temp_c: weather.temp });
    setDisliked((d) => [...d, ...ids]);
    setSeed((s) => s + 1);
    setMsg(null);
  }

  const firstName = profile?.full_name?.split(' ')[0];
  const gaps = garments ? closetGaps(garments) : [];

  return (
    <main className="screen stack">
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">{today()} · {weather.temp} °C en León</span>
        <h1 className="h1">{firstName ? `${firstName}, tu outfit de hoy` : 'Tu outfit de hoy'}</h1>
      </div>
      <div className="chips" role="group" aria-label="Ocasión">
        {OCCASIONS.map((o) => (
          <button key={o.id} className={`chip ${occasion === o.id ? 'on' : ''}`} onClick={() => { setOccasion(o.id); setMsg(null); }}>{o.label}</button>
        ))}
      </div>

      {!garments && <SkeletonGrid count={4} meta={1} />}

      {garments && !outfit?.complete && (
        <div className="empty stack">
          <span className="h2" style={{ color: 'var(--ink)' }}>Armemos tu clóset</span>
          <span>Para proponerte outfits necesito al menos {gaps.join(', ') || 'unas prendas más'}. Tómales foto: toma un minuto por prenda.</span>
          <Link to="/closet/nueva" className="btn">Agregar prenda</Link>
        </div>
      )}

      {outfit?.complete && (
        <>
          <div className="grid2">
            {outfit.pieces.map((p) => (
              <Link key={p.g.id} to={`/closet/${p.g.id}`} className="tile">
                <Ph url={urls[p.g.photo_path]} alt={p.g.name} />
                <span className="eyebrow" style={{ fontSize: 11 }}>{p.slot}</span>
                <span className="tile-name">{p.g.name}</span>
              </Link>
            ))}
          </div>
          <div className="card small" style={{ lineHeight: 1.5, color: 'var(--soft)' }}>
            <strong style={{ color: 'var(--ink)' }}>Por qué este look:</strong> {outfit.reasons.join('; ')}.
          </div>
          {msg?.ok && <div className="ok" role="status">{msg.ok}</div>}
          {msg?.error && <div className="error" role="alert">{msg.error}</div>}
          <div className="row">
            <button className="btn ghost" onClick={() => { setSeed((s) => s + 1); setMsg(null); }}>Ver otro</button>
            <button className="btn" onClick={wear}>Me lo pongo</button>
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 24 }}>
            <button className="link muted" style={{ textDecoration: 'none' }} onClick={dislike}>No es mi estilo</button>
            <Link className="link" to="/outfits/armar">Armar a mano</Link>
          </div>
        </>
      )}
    </main>
  );
}
