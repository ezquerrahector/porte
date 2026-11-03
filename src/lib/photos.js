import { supabase } from '../supabase';

// Reduce la foto a máx. 1200 px y la convierte a JPEG para ahorrar datos y almacenamiento.
async function shrink(file, max = 1200) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
}

export async function uploadPhoto(file, userId, folder = 'closet') {
  const blob = await shrink(file);
  const path = `${userId}/${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

const cache = new Map();
export async function signedUrls(paths) {
  const missing = [...new Set(paths.filter((p) => p && !cache.has(p)))];
  if (missing.length) {
    const { data } = await supabase.storage.from('photos').createSignedUrls(missing, 60 * 60 * 6);
    (data || []).forEach((d) => d.signedUrl && cache.set(d.path, d.signedUrl));
  }
  return Object.fromEntries(paths.filter(Boolean).map((p) => [p, cache.get(p)]));
}
