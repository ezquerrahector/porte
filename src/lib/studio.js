// Foto de estudio: quita el fondo en el propio teléfono (modelo U²-Net pequeño, licencia Apache 2.0,
// servido desde la app) y coloca la prenda sobre un fondo oscuro de estudio con luz central y sombra.
// Nada sale del dispositivo. La primera vez descarga ~17 MB (modelo + motor); después queda en caché.

const SIZE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
let sessionPromise = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import('onnxruntime-web/wasm');
      const base = import.meta.env.BASE_URL;
      ort.env.wasm.wasmPaths = { wasm: `${base}ort/ort-wasm-simd-threaded.wasm`, mjs: `${base}ort/ort-wasm-simd-threaded.mjs` };
      ort.env.wasm.numThreads = 1;
      const session = await ort.InferenceSession.create(`${base}models/u2netp.onnx`, { executionProviders: ['wasm'] });
      return { ort, session };
    })().catch((e) => { sessionPromise = null; throw e; });
  }
  return sessionPromise;
}

const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

async function loadBitmap(file, max = 1600) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = canvas(Math.round(bmp.width * s), Math.round(bmp.height * s));
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

async function predictMask(src) {
  const { ort, session } = await getSession();
  const small = canvas(SIZE, SIZE);
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(src, 0, 0, SIZE, SIZE);
  const px = sctx.getImageData(0, 0, SIZE, SIZE).data;
  let max = 1;
  for (let i = 0; i < px.length; i += 4) max = Math.max(max, px[i], px[i + 1], px[i + 2]);
  const input = new Float32Array(3 * SIZE * SIZE);
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    for (let ch = 0; ch < 3; ch++) input[ch * SIZE * SIZE + p] = (px[i + ch] / max - MEAN[ch]) / STD[ch];
  }
  const feeds = { [session.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]) };
  const out = await session.run(feeds);
  const pred = out[session.outputNames[0]].data;
  let lo = Infinity, hi = -Infinity;
  for (const v of pred) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const mask = canvas(SIZE, SIZE);
  const mctx = mask.getContext('2d');
  const img = mctx.createImageData(SIZE, SIZE);
  for (let p = 0; p < SIZE * SIZE; p++) {
    let a = (pred[p] - lo) / (hi - lo || 1);
    a = Math.min(1, Math.max(0, (a - 0.15) / 0.7)); // contraste suave del borde
    img.data[p * 4 + 3] = Math.round(a * 255);
  }
  mctx.putImageData(img, 0, 0);
  return mask;
}

function cutout(src, mask) {
  const c = canvas(src.width, src.height);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(mask, 0, 0, src.width, src.height);
  // caja que contiene la prenda
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = 0, y1 = 0, area = 0;
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    if (data[(y * width + x) * 4 + 3] > 40) { area++; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  }
  const coverage = area / ((width / 2) * (height / 2));
  return { c, box: { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }, coverage };
}

function compose({ c, box }, W = 960, H = 1200) {
  const out = canvas(W, H);
  const ctx = out.getContext('2d');
  const g = ctx.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H * 0.45, H * 0.75);
  g.addColorStop(0, '#45403C');
  g.addColorStop(0.55, '#24211F');
  g.addColorStop(1, '#121110');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const s = Math.min((W * 0.78) / box.w, (H * 0.74) / box.h);
  const dw = box.w * s, dh = box.h * s;
  const dx = (W - dw) / 2, dy = (H - dh) / 2 - H * 0.02;
  // sombra de piso
  const sh = ctx.createRadialGradient(W / 2, dy + dh + 10, 4, W / 2, dy + dh + 10, dw * 0.55);
  sh.addColorStop(0, 'rgba(0,0,0,0.55)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.save(); ctx.translate(0, dy + dh + 10); ctx.scale(1, 0.12); ctx.translate(0, -(dy + dh + 10));
  ctx.fillRect(0, dy + dh + 10 - dw, W, dw * 2); ctx.restore();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.drawImage(c, box.x, box.y, box.w, box.h, dx, dy, dw, dh);
  return new Promise((res) => out.toBlob(res, 'image/jpeg', 0.88));
}

// Devuelve { blob, ok }. ok=false si no se pudo separar bien la prenda (se usa la foto original).
export async function studioPhoto(file) {
  const src = await loadBitmap(file);
  const mask = await predictMask(src);
  const cut = cutout(src, mask);
  if (cut.coverage < 0.04 || cut.coverage > 0.92) return { blob: null, ok: false };
  return { blob: await compose(cut), ok: true };
}

export const preloadStudio = () => getSession().catch(() => {});
