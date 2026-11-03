import { useEffect, useState } from 'react';
import { signedUrls } from './photos';

export function usePhotoUrls(paths) {
  const key = paths.filter(Boolean).join('|');
  const [urls, setUrls] = useState({});
  useEffect(() => {
    if (!key) return;
    let alive = true;
    signedUrls(key.split('|')).then((u) => alive && setUrls(u));
    return () => { alive = false; };
  }, [key]);
  return urls;
}

export function Hanger() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="#B5ADA4" strokeWidth="1.5" aria-hidden="true">
      <path d="M24 12a4 4 0 1 1 4 4c-2 0-4 1.5-4 4v1L6 34h36L24 21" />
    </svg>
  );
}

export function Ph({ url, alt, tag, className = 'ph' }) {
  return (
    <div className={className}>
      {url ? <img src={url} alt={alt} loading="lazy" /> : <Hanger />}
      {tag && <span className="tag">{tag}</span>}
    </div>
  );
}
