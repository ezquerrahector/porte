import { useEffect, useRef, useState } from 'react';
import Login from './Login';

// Bienvenida cinematográfica: el movimiento sigue al scroll (sin video; dibujo y tipografía).
// Escenas: 1) PORTE + gancho · 2) "Viste con lo que tienes" (el outfit se arma) ·
// 3) "Vende lo que ya no usas" (la prenda pasa al Bazar) · 4) llamada a entrar.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p, a, b) => clamp((p - a) / (b - a)); // avance 0–1 dentro de un tramo
const ease = (t) => 1 - Math.pow(1 - t, 3);

const IVORY = '#F4EFE8';
const OX = '#9B3A48';

function Draw({ d, t, w = 1.4, color = IVORY }) {
  // trazo que se dibuja con el avance t (0–1)
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      pathLength="1" strokeDasharray="1" strokeDashoffset={1 - t} />
  );
}

const SHIRT = 'M30 18 L44 10 Q50 16 56 10 L70 18 L82 34 L72 40 L68 34 L68 86 L32 86 L32 34 L28 40 L18 34 Z M50 16 L50 86';
const BLAZER = 'M30 14 L44 8 L50 30 L56 8 L70 14 L84 40 L74 92 L56 92 L50 30 L44 92 L26 92 L16 40 Z M38 60 L44 60 M56 60 L62 60';
const PANTS = 'M32 8 L68 8 L72 92 L56 92 L50 34 L44 92 L28 92 Z M32 16 L68 16';
const SHOE = 'M14 60 Q16 44 30 42 L46 44 Q58 50 74 52 Q86 54 86 64 L86 70 L14 70 Z M14 64 L86 64';
const HANGER = 'M50 18 a6 6 0 1 1 6 6 q-6 0 -6 6 v2 L14 58 Q10 62 16 62 L84 62 Q90 62 86 58 L50 32';

function Piece({ d, t, x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(t * 1.4)}>
      <Draw d={d} t={ease(t)} />
    </g>
  );
}

export default function Welcome() {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const total = el.offsetHeight - window.innerHeight;
        setP(clamp(-el.getBoundingClientRect().top / total));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const q = reduce ? 1 : p;
  // Escena 1
  const s1 = seg(q, 0, 0.2), out1 = seg(q, 0.2, 0.3);
  // Escena 2
  const s2 = seg(q, 0.28, 0.55), out2 = seg(q, 0.55, 0.62);
  // Escena 3
  const s3 = seg(q, 0.6, 0.85), out3 = seg(q, 0.85, 0.92);
  // Escena 4
  const s4 = seg(q, 0.9, 1);

  const fade = (inT, outT = 0) => clamp(inT * 1.6) * (1 - outT);
  const rise = (t) => `translateY(${(1 - ease(t)) * 28}px)`;
  const toForm = (modo) => { window.dispatchEvent(new CustomEvent('porte:modo', { detail: modo })); document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div style={{ background: '#121110', color: IVORY }}>
      <section ref={ref} style={{ height: reduce ? 'auto' : '520vh', position: 'relative' }}>
        <div style={{ position: reduce ? 'relative' : 'sticky', top: 0, height: '100dvh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Grano y viñeta de estudio */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, #2A2624 0%, #121110 70%)' }} />

          {/* Escena 1: marca */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, opacity: 1 - out1, transform: `scale(${1 + out1 * 0.08})` }}>
            <svg viewBox="0 0 100 70" width="150" aria-hidden="true" style={{ opacity: 0.9 }}>
              <Draw d={HANGER} t={reduce ? 1 : clamp(0.15 + s1)} w={1.1} />
            </svg>
            <h1 style={{ margin: 0, fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(56px, 16vw, 132px)', letterSpacing: `${0.42 - s1 * 0.22}em`, paddingLeft: `${0.42 - s1 * 0.22}em`, lineHeight: 1 }}>PORTE</h1>
            <p className="label" style={{ margin: 0, color: '#BDB4A8', opacity: 0.4 + s1 * 0.6 }}>Clóset · Outfits · Bazar</p>
            <span className="label" style={{ position: 'absolute', bottom: 36, color: '#8C847A', opacity: 1 - s1 * 2 }}>Desliza</span>
          </div>

          {/* Escena 2: el outfit se arma */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 24px', opacity: fade(s2, out2) }}>
            <span className="label" style={{ color: '#BDB4A8' }}>01 · Outfits</span>
            <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px, 9vw, 72px)', lineHeight: 1.05, textAlign: 'center', transform: rise(s2) }}>
              Viste con<br /><em>lo que tienes.</em>
            </h2>
            <svg viewBox="0 0 220 210" width="min(78vw, 360px)" aria-hidden="true">
              <Piece d={BLAZER} t={seg(s2, 0.05, 0.4)} x={20} y={0} />
              <Piece d={SHIRT} t={seg(s2, 0.2, 0.55)} x={110} y={-4} s={0.9} />
              <Piece d={PANTS} t={seg(s2, 0.4, 0.75)} x={62} y={100} s={1.05} />
              <Piece d={SHOE} t={seg(s2, 0.6, 0.95)} x={130} y={120} s={0.8} />
            </svg>
            <p style={{ margin: 0, maxWidth: 320, textAlign: 'center', lineHeight: 1.55, color: '#CFC6BA', opacity: seg(s2, 0.6, 1) }}>
              Cada mañana, un look con tus propias prendas: según la ocasión, el clima de León y lo que llevas tiempo sin usar.
            </p>
          </div>

          {/* Escena 3: la prenda pasa al Bazar */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '0 24px', opacity: fade(s3, out3) }}>
            <span className="label" style={{ color: '#BDB4A8' }}>02 · Bazar</span>
            <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(36px, 9vw, 72px)', lineHeight: 1.05, textAlign: 'center', transform: rise(s3) }}>
              Vende lo que<br /><em>ya no usas.</em>
            </h2>
            <svg viewBox="0 0 220 150" width="min(78vw, 360px)" aria-hidden="true">
              <g transform={`translate(${20 + ease(seg(s3, 0.15, 0.6)) * 40} 20)`}>
                <Draw d={SHIRT} t={1} />
              </g>
              <g opacity={seg(s3, 0.45, 0.75)} transform="translate(150 34)">
                <line x1="0" y1="14" x2="-14" y2="22" stroke={OX} strokeWidth="1.2" />
                <rect x="0" y="0" width="62" height="28" rx="2" fill="none" stroke={OX} strokeWidth="1.2" />
                <text x="31" y="19" textAnchor="middle" fill={IVORY} style={{ fontFamily: 'var(--serif)', fontSize: 14 }}>$1,150</text>
              </g>
            </svg>
            <p style={{ margin: 0, maxWidth: 320, textAlign: 'center', lineHeight: 1.55, color: '#CFC6BA', opacity: seg(s3, 0.6, 1) }}>
              Publícala desde tu clóset. Cuando se vende, pasamos por ella a tu puerta y la entregamos.
            </p>
          </div>

          {/* Escena 4: entrar */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: '0 28px', opacity: fade(s4), pointerEvents: s4 > 0.5 ? 'auto' : 'none' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--serif)', fontWeight: 400, fontSize: 'clamp(40px, 10vw, 80px)', letterSpacing: '0.2em', paddingLeft: '0.2em' }}>PORTE</h2>
            <p style={{ margin: 0, textAlign: 'center', lineHeight: 1.55, color: '#CFC6BA', maxWidth: 300 }}>Tu clóset, mejor usado.<br />Empieza hoy, es gratis.</p>
            <div className="stack" style={{ width: '100%', maxWidth: 320, gap: 12 }}>
              <button className="btn light" onClick={() => toForm('crear')}>Crear una cuenta</button>
              <button className="btn ghost" style={{ color: IVORY, borderColor: '#5A534C' }} onClick={() => toForm('entrar')}>Ya tengo cuenta</button>
            </div>
          </div>

          {/* Barra de avance */}
          {!reduce && <div aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, height: 2, width: `${q * 100}%`, background: OX }} />}
        </div>
      </section>
      <div id="acceso">
        <Login compact />
      </div>
    </div>
  );
}
