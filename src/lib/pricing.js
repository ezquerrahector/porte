// Precio sugerido para reventa (versión inicial por reglas; se reemplazará por modelo con ventas reales).
const BASE = { arriba: 380, encima: 750, abajo: 450, vestido: 600, calzado: 650, accesorio: 320 };
const COND = { nuevo_etiqueta: 1, como_nuevo: 0.8, buen_estado: 0.6 };

export function suggestPrice(category, condition) {
  const mid = (BASE[category] ?? 400) * (COND[condition] ?? 0.7);
  const round = (n) => Math.round(n / 10) * 10;
  return { min: round(mid * 0.85), max: round(mid * 1.15), mid: round(mid) };
}
