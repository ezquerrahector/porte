// Ilustraciones planas (flat lay) para elegir estilo y paleta de color en el recorrido.
const P = {
  shirt: 'M30 18 L44 10 Q50 16 56 10 L70 18 L82 34 L72 40 L68 34 L68 86 L32 86 L32 34 L28 40 L18 34 Z',
  tee: 'M28 16 L42 10 Q50 18 58 10 L72 16 L86 30 L74 40 L68 34 L68 84 L32 84 L32 34 L26 40 L14 30 Z',
  blazer: 'M30 14 L44 8 L50 30 L56 8 L70 14 L84 40 L74 92 L56 92 L50 30 L44 92 L26 92 L16 40 Z',
  hoodie: 'M34 16 Q50 2 66 16 L80 24 L90 46 L78 52 L72 44 L72 90 L28 90 L28 44 L22 52 L10 46 L20 24 Z',
  jacket: 'M30 14 L44 10 L50 24 L56 10 L70 14 L86 36 L76 44 L72 38 L72 82 L28 82 L28 38 L24 44 L14 36 Z',
  pants: 'M32 8 L68 8 L72 92 L56 92 L50 34 L44 92 L28 92 Z',
  jogger: 'M32 8 L68 8 L70 84 L72 92 L56 92 L56 84 L50 36 L44 84 L44 92 L28 92 L30 84 Z',
  shoe: 'M14 60 Q16 44 30 42 L46 44 Q58 50 74 52 Q86 54 86 64 L86 70 L14 70 Z',
  sneaker: 'M12 62 Q14 46 28 44 L44 46 Q56 52 76 54 Q88 56 88 64 L88 70 L12 70 Z',
  boot: 'M26 20 L48 20 L50 52 Q70 54 84 60 Q88 64 86 72 L22 72 Z',
  tie: 'M47 20 L53 20 L56 26 L52 30 L58 70 L50 80 L42 70 L48 30 L44 26 Z'
};

function G({ d, fill, x, y, s = 1, stroke = 'rgba(0,0,0,.18)', detail }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={1.2 / s} strokeLinejoin="round" />
      {detail}
    </g>
  );
}

const LOOKS = {
  'Clásico': [
    { d: P.blazer, fill: '#1F2A44', x: 4, y: 6, s: 0.9 },
    { d: P.shirt, fill: '#F6F4EF', x: 74, y: 4, s: 0.7 },
    { d: P.pants, fill: '#8C8C8C', x: 120, y: 8, s: 0.85 },
    { d: P.shoe, fill: '#6B4423', x: 76, y: 70, s: 0.6 }
  ],
  'Minimalista': [
    { d: P.tee, fill: '#FFFFFF', x: 8, y: 10, s: 0.9 },
    { d: P.pants, fill: '#1A1A1A', x: 92, y: 8, s: 0.85 },
    { d: P.sneaker, fill: '#F2F2F2', x: 20, y: 76, s: 0.6 }
  ],
  'Casual': [
    { d: P.tee, fill: '#B8B3AA', x: 6, y: 10, s: 0.85 },
    { d: P.pants, fill: '#3F5F8A', x: 88, y: 8, s: 0.85 },
    { d: P.sneaker, fill: '#FFFFFF', x: 14, y: 76, s: 0.6 }
  ],
  'Ejecutivo': [
    { d: P.blazer, fill: '#2E2E33', x: 2, y: 6, s: 0.9 },
    { d: P.shirt, fill: '#CFE0F2', x: 76, y: 4, s: 0.7, detail: <path d={P.tie} fill="#6B1E2A" /> },
    { d: P.pants, fill: '#2E2E33', x: 122, y: 8, s: 0.85 },
    { d: P.shoe, fill: '#111111', x: 76, y: 70, s: 0.6 }
  ],
  'Atrevido': [
    { d: P.jacket, fill: '#141414', x: 4, y: 8, s: 0.9 },
    { d: P.tee, fill: '#C8102E', x: 78, y: 6, s: 0.68 },
    { d: P.pants, fill: '#5A5A5A', x: 124, y: 8, s: 0.82 },
    { d: P.boot, fill: '#1E1E1E', x: 74, y: 66, s: 0.62 }
  ],
  'Deportivo': [
    { d: P.hoodie, fill: '#5B6B4A', x: 4, y: 6, s: 0.9 },
    { d: P.jogger, fill: '#9A9DA3', x: 92, y: 8, s: 0.85 },
    { d: P.sneaker, fill: '#FFFFFF', x: 16, y: 76, s: 0.6 }
  ]
};

export const STYLE_INFO = {
  'Clásico': 'Saco, camisa, pantalón de vestir y mocasines.',
  'Minimalista': 'Pocas piezas, cortes limpios, blanco y negro.',
  'Casual': 'Playera, jeans y tenis para todos los días.',
  'Ejecutivo': 'Traje, camisa, corbata y zapato formal.',
  'Atrevido': 'Piel, color intenso y botas; te gusta destacar.',
  'Deportivo': 'Sudadera, pants y tenis; comodidad primero.'
};

export function StyleArt({ name }) {
  const pieces = LOOKS[name] || [];
  return (
    <svg viewBox="0 0 200 120" width="100%" role="img" aria-label={`Ejemplo de estilo ${name}: ${STYLE_INFO[name] || ''}`}>
      {pieces.map((p, i) => <G key={i} {...p} />)}
    </svg>
  );
}

export const PALETTES = {
  'Neutros': ['#111111', '#FFFFFF', '#9A9A9A', '#D8C9B1', '#1F2A44'],
  'Oscuros': ['#111111', '#2B2B2B', '#1F2A44', '#3B1F24', '#2E3A2F'],
  'Tierra': ['#8A5A3B', '#C19A6B', '#6B4F2A', '#A0522D', '#556B2F'],
  'Pastel': ['#F4C2C2', '#BCD4E6', '#C8E6C9', '#FFF1B6', '#D7C4F0'],
  'Vivos': ['#D7263D', '#1B98E0', '#F4D35E', '#2ECC71', '#FF6F00']
};

export function Swatches({ name }) {
  return (
    <span style={{ display: 'flex' }} aria-hidden="true">
      {(PALETTES[name] || []).map((c, i) => (
        <span key={c} style={{ width: 26, height: 26, borderRadius: 13, background: c, border: '1px solid rgba(255,255,255,.25)', marginLeft: i ? -6 : 0 }} />
      ))}
    </span>
  );
}
