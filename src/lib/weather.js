// Clima actual de León, Gto. (Open-Meteo, sin llave). Si falla, la app sigue con una temperatura templada.
const LEON = { lat: 21.1236, lon: -101.68 };

export async function getWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LEON.lat}&longitude=${LEON.lon}&current=temperature_2m,precipitation&timezone=America%2FMexico_City`;
    const r = await fetch(url);
    const j = await r.json();
    return { temp: Math.round(j.current.temperature_2m), rain: j.current.precipitation > 0, ok: true };
  } catch {
    return { temp: 22, rain: false, ok: false };
  }
}
