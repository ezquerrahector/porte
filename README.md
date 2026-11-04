# Porte

Viste con lo que tienes. Vende lo que ya no usas.

Web app instalable (PWA) de Porte, piloto en León, Gto. Fase 1:

- **Outfits**: propuesta diaria con tus propias prendas, según ocasión, clima de León y lo que no usas hace tiempo.
- **Clóset**: una foto por prenda, categorías, uso y prendas olvidadas.
- **Bazar**: como un marketplace; ves lo que vende la comunidad y desde ahí publicas lo tuyo (de tu clóset a la venta con precio sugerido). Se aparta sin cobro mientras se conecta la pasarela de pagos; recolección a domicilio solo cuando se vende.
- **Saldo**: ventas, pedidos con seguimiento y revisión de 48 horas.
- **Muy pronto**: tienda y membresía con quiz de estilo y lista de espera.
- **Operación** (administradores): avance de pedidos e invitaciones.

## Tecnología

React + Vite + vite-plugin-pwa · Supabase (Postgres con RLS, Auth, Storage) · GitHub Pages vía GitHub Actions (publicación automática desde `main`).

## Producción

En línea en **https://portestyle.com** (dominio en Cloudflare, publicado con GitHub Pages).

Cada push a `main` publica automáticamente. Las migraciones de base de datos están en `supabase/migrations/`.

```bash
npm install
npm run dev     # local
npm run build   # build de producción
```
