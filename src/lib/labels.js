export const CATEGORIES = [
  { id: 'arriba', label: 'Arriba', hint: 'Camisas, blusas, playeras' },
  { id: 'encima', label: 'Encima', hint: 'Sacos, chamarras, suéteres' },
  { id: 'abajo', label: 'Abajo', hint: 'Pantalones, faldas, shorts' },
  { id: 'vestido', label: 'Vestidos', hint: 'Vestidos y monos' },
  { id: 'calzado', label: 'Calzado', hint: 'Zapatos, tenis, botas' },
  { id: 'accesorio', label: 'Accesorios', hint: 'Bolsas, cinturones, joyería' }
];
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const OCCASIONS = [
  { id: 'casual', label: 'Casual' },
  { id: 'oficina', label: 'Oficina' },
  { id: 'formal', label: 'Formal' },
  { id: 'deporte', label: 'Deporte' },
  { id: 'noche', label: 'Noche' }
];

export const WARMTH = [
  { id: 'ligera', label: 'Ligera' },
  { id: 'media', label: 'Media' },
  { id: 'abrigadora', label: 'Abrigadora' }
];

export const AUDIENCE = [
  { id: 'mujer', label: 'Mujer' },
  { id: 'hombre', label: 'Hombre' },
  { id: 'unisex', label: 'Unisex' }
];

export const CONDITIONS = [
  { id: 'nuevo_etiqueta', label: 'Nuevo con etiqueta' },
  { id: 'como_nuevo', label: 'Como nuevo' },
  { id: 'buen_estado', label: 'Buen estado' }
];
export const conditionLabel = (id) => CONDITIONS.find((c) => c.id === id)?.label ?? id;

export const ORDER_STEPS = [
  { id: 'apartado', label: 'Apartado', detail: 'La prenda quedó reservada para ti' },
  { id: 'recoleccion_programada', label: 'Recolección programada', detail: 'Pasamos por la prenda con el vendedor' },
  { id: 'recogido', label: 'Recogido y verificado', detail: 'Revisamos que coincida con la publicación' },
  { id: 'en_camino', label: 'En camino', detail: 'Vamos a tu domicilio' },
  { id: 'entregado', label: 'Entregado', detail: 'Tienes 48 horas para revisarla' },
  { id: 'conforme', label: 'Conforme', detail: 'Se libera el pago al vendedor' }
];
export const orderStatusLabel = (id) =>
  ({ incidencia: 'Con incidencia', cancelado: 'Cancelado' }[id] ?? ORDER_STEPS.find((s) => s.id === id)?.label ?? id);

export const money = (n) =>
  n == null ? '—' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export const daysSince = (d) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null);
