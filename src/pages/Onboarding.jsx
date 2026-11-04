import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';

// Recorrido de primera vez: 4 pasos cortos. Guarda tallas, zona y estilo en el perfil
// y termina llevando a cargar la primera prenda.
const STYLES = ['Clásico', 'Minimalista', 'Casual', 'Ejecutivo', 'Atrevido', 'Deportivo'];
const COLORS = ['Neutros', 'Oscuros', 'Tierra', 'Pastel', 'Vivos'];
const STEPS = 4;

export default function Onboarding() {
  const { user, profile, setProfile } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    full_name: profile?.full_name || '', zone: profile?.zone || '', phone: profile?.phone || '',
    size_top: profile?.size_top || '', size_bottom: profile?.size_bottom || '', shoe_size: profile?.shoe_size || '',
    style: profile?.style || {}
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const toggle = (k, v) => {
    const cur = p.style[k] || [];
    setP({ ...p, style: { ...p.style, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } });
  };
  const on = (k, v) => (p.style[k] || []).includes(v);

  async function finish(goTo) {
    setBusy(true);
    const { data } = await supabase.from('profiles').update({
      full_name: p.full_name || null, zone: p.zone || null, phone: p.phone || null,
      size_top: p.size_top || null, size_bottom: p.size_bottom || null, shoe_size: p.shoe_size || null,
      style: p.style, onboarded_at: new Date().toISOString()
    }).eq('id', user.id).select().single();
    setBusy(false);
    if (data) setProfile(data);
    nav(goTo, { replace: true });
  }

  const first = (p.full_name || '').split(' ')[0];

  return (
    <div className="dark">
      <main className="screen stack" style={{ maxWidth: 520, margin: '0 auto', minHeight: '100dvh', paddingBottom: 40 }}>
        <div className="row" style={{ gap: 6 }} aria-label={`Paso ${step + 1} de ${STEPS}`}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <span key={i} style={{ flex: 1, height: 2, background: i <= step ? '#F4EFE8' : '#3A3734' }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <span className="label" style={{ color: '#BDB4A8', marginTop: 24 }}>Bienvenida a Porte</span>
            <h1 className="h1" style={{ fontSize: 40 }}>{first ? `${first},` : 'Hola,'}<br /><em>tu clóset, mejor usado.</em></h1>
            <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>En dos minutos dejamos tu perfil listo. Así cada outfit y cada prenda del Bazar se ajustan a ti.</p>
            <div className="stack" style={{ gap: 14, marginTop: 8 }}>
              {[['Outfits', 'Un look al día con tus propias prendas.'], ['Clóset', 'Cada prenda con foto de estudio.'], ['Bazar', 'Vende lo que ya no usas; pasamos por ello.']].map(([t, d]) => (
                <div key={t} className="row" style={{ alignItems: 'baseline', gap: 14, borderTop: '1px solid #3A3734', paddingTop: 14 }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: 20, minWidth: 88 }}>{t}</span>
                  <span className="muted small" style={{ lineHeight: 1.5 }}>{d}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <span className="label" style={{ color: '#BDB4A8', marginTop: 24 }}>Tus medidas</span>
            <h1 className="h1">¿Qué tallas usas?</h1>
            <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>Las usamos para mostrarte primero lo que te queda en el Bazar.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
              <label className="field">Arriba<input className="input" value={p.size_top} onChange={set('size_top')} placeholder="M" /></label>
              <label className="field">Abajo<input className="input" value={p.size_bottom} onChange={set('size_bottom')} placeholder="32" /></label>
              <label className="field">Calzado<input className="input" value={p.shoe_size} onChange={set('shoe_size')} placeholder="26" /></label>
            </div>
            <label className="field">Colonia o zona de León<input className="input" value={p.zone} onChange={set('zone')} placeholder="Ej. Jardines del Moral" /></label>
            <label className="field">WhatsApp<input className="input" type="tel" value={p.phone} onChange={set('phone')} placeholder="Para coordinar recolecciones y entregas" /></label>
          </>
        )}

        {step === 2 && (
          <>
            <span className="label" style={{ color: '#BDB4A8', marginTop: 24 }}>Tu estilo</span>
            <h1 className="h1">¿Cómo te gusta vestir?</h1>
            <div className="field">Elige uno o varios
              <div className="chips wrap">
                {STYLES.map((s) => (
                  <button key={s} type="button" className="chip" style={on('estilo', s) ? { background: '#F4EFE8', color: '#141414', borderColor: '#F4EFE8' } : { background: 'transparent', color: '#F4EFE8', borderColor: '#4A4642' }} onClick={() => toggle('estilo', s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="field">Colores que más usas
              <div className="chips wrap">
                {COLORS.map((s) => (
                  <button key={s} type="button" className="chip" style={on('colores', s) ? { background: '#F4EFE8', color: '#141414', borderColor: '#F4EFE8' } : { background: 'transparent', color: '#F4EFE8', borderColor: '#4A4642' }} onClick={() => toggle('colores', s)}>{s}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <span className="label" style={{ color: '#BDB4A8', marginTop: 24 }}>Tu primera prenda</span>
            <h1 className="h1">Así se toma<br /><em>una buena foto.</em></h1>
            <ol className="stack" style={{ margin: 0, paddingLeft: 20, gap: 12, lineHeight: 1.55, color: '#D9D2C8' }}>
              <li>Extiende la prenda sobre la cama o el piso, sin arrugas y sin otras cosas alrededor.</li>
              <li>Toma la foto desde arriba, con luz natural y sin flash.</li>
              <li>Nosotros quitamos el fondo y la dejamos en estudio, como en una boutique.</li>
            </ol>
            <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>Con algo de arriba, algo de abajo y un par de zapatos ya te proponemos tu primer outfit.</p>
          </>
        )}

        <div className="spacer" />
        <div className="stack" style={{ gap: 10 }}>
          {step < STEPS - 1 ? (
            <button className="btn light" onClick={() => setStep(step + 1)}>Continuar</button>
          ) : (
            <button className="btn light" disabled={busy} onClick={() => finish('/closet/nueva')}>Agregar mi primera prenda</button>
          )}
          {step > 0 && step < STEPS - 1 && <button className="link" style={{ color: '#BDB4A8' }} onClick={() => setStep(step - 1)}>Atrás</button>}
          {step === STEPS - 1 && <button className="link" style={{ color: '#BDB4A8' }} disabled={busy} onClick={() => finish('/outfits')}>Lo hago después</button>}
        </div>
      </main>
    </div>
  );
}
