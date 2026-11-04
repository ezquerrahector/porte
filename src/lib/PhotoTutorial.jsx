import { useEffect, useState } from 'react';

// Tutorial animado tipo "historias": 4 escenas que avanzan solas (o tocando).
const SHIRT = 'M30 18 L44 10 Q50 16 56 10 L70 18 L82 34 L72 40 L68 34 L68 86 L32 86 L32 34 L28 40 L18 34 Z M50 16 L50 86';
const DUR = 4200;

const SCENES = [
  { title: 'Extiéndela', text: 'Sobre la cama o el piso, sin arrugas y sin nada alrededor.' },
  { title: 'Luz natural, sin flash', text: 'Cerca de una ventana y de día. El flash aplana la tela y cambia el color.' },
  { title: 'Desde arriba, completa', text: 'Párate encima y deja un poco de espacio alrededor de la prenda.' },
  { title: 'Nosotros hacemos el resto', text: 'Quitamos el fondo y la dejamos en estudio, como en una boutique.' }
];

function Scene({ i }) {
  const shirt = (fill = '#3F5F8A', extra = {}) => <path d={SHIRT} fill={fill} stroke="rgba(255,255,255,.55)" strokeWidth="1.2" strokeLinejoin="round" {...extra} />;
  if (i === 0) return (
    <svg viewBox="0 0 200 200" width="100%" aria-hidden="true">
      <rect x="20" y="40" width="160" height="130" rx="6" fill="#D9C7AD" />
      <rect x="20" y="40" width="160" height="22" rx="6" fill="#EDE3D3" />
      <g className="tut-unfold" style={{ transformOrigin: '100px 110px' }}><g transform="translate(55 62) scale(0.9)">{shirt()}</g></g>
    </svg>
  );
  if (i === 1) return (
    <svg viewBox="0 0 200 200" width="100%" aria-hidden="true">
      <rect x="22" y="24" width="60" height="78" rx="3" fill="none" stroke="#F4EFE8" strokeWidth="2" />
      <line x1="52" y1="24" x2="52" y2="102" stroke="#F4EFE8" strokeWidth="1.5" /><line x1="22" y1="63" x2="82" y2="63" stroke="#F4EFE8" strokeWidth="1.5" />
      <polygon className="tut-light" points="82,30 190,120 190,190 82,102" fill="#F4E7C8" />
      <g transform="translate(100 108) scale(0.75)">{shirt()}</g>
      <g transform="translate(150 30)" className="tut-noflash">
        <circle cx="16" cy="16" r="16" fill="none" stroke="#E8B4B8" strokeWidth="2" />
        <path d="M18 6 L10 18 H16 L14 26 L22 14 H16 Z" fill="#E8B4B8" /><line x1="5" y1="27" x2="27" y2="5" stroke="#E8B4B8" strokeWidth="2.5" />
      </g>
    </svg>
  );
  if (i === 2) return (
    <svg viewBox="0 0 200 200" width="100%" aria-hidden="true">
      <rect x="10" y="20" width="180" height="170" rx="6" fill="#D9C7AD" />
      <g transform="translate(55 52) scale(0.9)">{shirt()}</g>
      <g className="tut-phone">
        <rect x="38" y="30" width="124" height="150" rx="14" fill="none" stroke="#F4EFE8" strokeWidth="3" />
        {[[48, 42, 1, 1], [152, 42, -1, 1], [48, 168, 1, -1], [152, 168, -1, -1]].map(([x, y, sx, sy], k) => (
          <path key={k} d={`M${x} ${y + 14 * sy} V${y} H${x + 14 * sx}`} fill="none" stroke="#F4EFE8" strokeWidth="2.5" />
        ))}
      </g>
      <circle className="tut-ok" cx="170" cy="36" r="13" fill="#2E7D4F" /><path className="tut-ok" d="M164 36 l4 4 l8 -9" fill="none" stroke="#fff" strokeWidth="2.5" />
    </svg>
  );
  return (
    <svg viewBox="0 0 200 200" width="100%" aria-hidden="true">
      <defs>
        <radialGradient id="tutstudio" cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#45403C" /><stop offset="0.6" stopColor="#24211F" /><stop offset="1" stopColor="#121110" /></radialGradient>
        <clipPath id="tutwipe"><rect className="tut-wipe" x="0" y="0" width="200" height="200" /></clipPath>
      </defs>
      <rect x="10" y="10" width="180" height="180" rx="6" fill="#D9C7AD" />
      <g transform="translate(55 48) scale(0.9)">{shirt()}</g>
      <g clipPath="url(#tutwipe)">
        <rect x="10" y="10" width="180" height="180" rx="6" fill="url(#tutstudio)" />
        <ellipse cx="100" cy="132" rx="42" ry="5" fill="rgba(0,0,0,.5)" />
        <g transform="translate(55 48) scale(0.9)">{shirt()}</g>
      </g>
    </svg>
  );
}

export default function PhotoTutorial({ onDone }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || i >= SCENES.length) return;
    const t = setTimeout(() => setI((n) => n + 1), DUR);
    return () => clearTimeout(t);
  }, [i, paused]);
  const done = i >= SCENES.length;
  const cur = Math.min(i, SCENES.length - 1);

  return (
    <div className="tut" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}>
      <div className="tut-bars" aria-hidden="true">
        {SCENES.map((_, k) => (
          <span key={k}><i style={{ width: k < i ? '100%' : k === i && !done ? undefined : 0 }} className={k === i && !done ? (paused ? 'run paused' : 'run') : ''} key={`${k}-${i}`} /></span>
        ))}
      </div>
      <div className="tut-stage" key={cur}><Scene i={cur} /></div>
      <div className="stack" style={{ gap: 6, minHeight: 92 }} aria-live="polite">
        <span className="h2" style={{ color: '#F4EFE8' }}>{cur + 1}. {SCENES[cur].title}</span>
        <span className="muted" style={{ lineHeight: 1.5 }}>{SCENES[cur].text}</span>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button type="button" className="link" style={{ color: '#BDB4A8' }} onClick={() => setI(0)}>Ver de nuevo</button>
        {!done && <button type="button" className="link" style={{ color: '#F4EFE8' }} onClick={() => setI((n) => n + 1)}>Siguiente</button>}
        {done && onDone && <button type="button" className="link" style={{ color: '#F4EFE8' }} onClick={onDone}>Entendido</button>}
      </div>
    </div>
  );
}
