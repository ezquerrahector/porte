import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../App';
import { StyleArt, STYLE_INFO, Swatches } from '../lib/StyleArt';
import PhotoTutorial from '../lib/PhotoTutorial';

// Recorrido de primera vez: 4 pasos cortos. Guarda tallas, zona y estilo en el perfil
// y termina llevando a cargar la primera prenda.
const STYLES = ['Clásico', 'Minimalista', 'Casual', 'Ejecutivo', 'Atrevido', 'Deportivo'];
const COLORS = ['Neutros', 'Oscuros', 'Tierra', 'Pastel', 'Vivos'];
const STEPS = 5;
const COLOR_INFO = { Neutros: 'Negro, blanco, gris, beige, marino', Oscuros: 'Negro, carbón, marino, vino', Tierra: 'Café, camel, terracota, olivo', Pastel: 'Rosa, cielo, menta, lavanda', Vivos: 'Rojo, azul rey, amarillo, verde' };

export default function Onboarding() {
  const { user, profile, setProfile } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    full_name: profile?.full_name || '', postal_code: profile?.postal_code || '', phone: profile?.phone || '',
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
      full_name: p.full_name || null, postal_code: p.postal_code || null, phone: p.phone || null,
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
            <h1 className="h1" style={{ fontSize: 40 }}>{first ? `${first},` : 'Hola,'}<br />tu clóset, mejor usado.</h1>
            <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>En dos minutos dejamos tu perfil listo. Así cada outfit y cada prenda del Bazar se ajustan a ti.</p>
            <div className="stack" style={{ gap: 14, marginTop: 8 }}>
              {[['Outfits', 'Un look al día con tus propias prendas.'], ['Clóset', 'Cada prenda con foto de estudio.'], ['Bazar', 'Vende lo que ya no usas; pasamos por ello.']].map(([t, d]) => (
                <div key={t} className="row" style={{ alignItems: 'baseline', gap: 14, borderTop: '1px solid #3A3734', paddingTop: 14 }}>
                  <span style={{ fontFamily: 'var(--serif)', fontStretch: '118%', fontWeight: 600, fontSize: 18, minWidth: 88 }}>{t}</span>
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
            <label className="field">Código postal
              <input className="input" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={p.postal_code} onChange={(e) => setP({ ...p, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="37000" />
              {p.postal_code.length === 5 && (p.postal_code < '37000' || p.postal_code > '37699') && (
                <span className="small" style={{ color: '#E8B4B8', fontWeight: 400, lineHeight: 1.5 }}>Por ahora recolectamos y entregamos solo en León. Tu clóset y tus outfits funcionan desde cualquier lugar.</span>
              )}
            </label>
            <label className="field">WhatsApp<input className="input" type="tel" value={p.phone} onChange={set('phone')} placeholder="Para coordinar recolecciones y entregas" /></label>
          </>
        )}

        {step === 2 && (
          <>
            <span className="label" style={{ color: '#BDB4A8', marginTop: 24 }}>Tu estilo · elige uno o varios</span>
            <h1 className="h1">¿Cómo te gusta vestir?</h1>
            <div className="grid2" style={{ gap: 10 }}>
              {STYLES.map((s) => (
                <button key={s} type="button" className={`style-card ${on('estilo', s) ? 'on' : ''}`} aria-pressed={on('estilo', s)} onClick={() => toggle('estilo', s)}>
                  <span className="art"><StyleArt name={s} /></span>
                  <span style={{ fontWeight: 600 }}>{s}</span>
                  <span className="small" style={{ color: '#BDB4A8', lineHeight: 1.4 }}>{STYLE_INFO[s]}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <span className="label" style={{ color: '#BDB4A8', marginTop: 24 }}>Tus colores · elige uno o varios</span>
            <h1 className="h1">¿Qué colores usas más?</h1>
            <div className="stack" style={{ gap: 10 }}>
              {COLORS.map((s) => (
                <button key={s} type="button" className={`palette-row ${on('colores', s) ? 'on' : ''}`} aria-pressed={on('colores', s)} onClick={() => toggle('colores', s)}>
                  <span className="stack" style={{ gap: 2, textAlign: 'left' }}>
                    <span style={{ fontWeight: 600 }}>{s}</span>
                    <span className="small" style={{ color: '#BDB4A8' }}>{COLOR_INFO[s]}</span>
                  </span>
                  <Swatches name={s} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <span className="label" style={{ color: '#BDB4A8', marginTop: 24 }}>Tu primera prenda</span>
            <h1 className="h1">Así se toma una buena foto</h1>
            <PhotoTutorial />
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
