import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// ===== Confirmación propia (sustituye a window.confirm) =====
const ConfirmCtx = createContext(null);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [req, setReq] = useState(null);
  const okRef = useRef(null);
  const confirm = useCallback(
    (opts) => new Promise((resolve) => setReq({ title: '¿Seguro?', ok: 'Confirmar', cancel: 'Cancelar', ...(typeof opts === 'string' ? { title: opts } : opts), resolve })),
    []
  );
  const close = (v) => { req?.resolve(v); setReq(null); };
  useEffect(() => {
    if (!req) return;
    okRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {req && (
        <div className="sheet-backdrop" onClick={() => close(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
            <span className="sheet-grip" aria-hidden="true" />
            <h2 id="sheet-title" className="h2">{req.title}</h2>
            {req.body && <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{req.body}</p>}
            <div className="stack" style={{ gap: 10, marginTop: 8 }}>
              <button ref={okRef} className={`btn ${req.danger ? 'danger' : ''}`} onClick={() => close(true)}>{req.ok}</button>
              <button className="btn ghost" onClick={() => close(false)}>{req.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

// ===== Siluetas de carga =====
export function SkeletonGrid({ count = 4, meta = 2 }) {
  return (
    <div className="grid2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stack" style={{ gap: 8 }}>
          <div className="skel" style={{ aspectRatio: '4 / 5' }} />
          {Array.from({ length: meta }).map((__, j) => <div key={j} className="skel" style={{ height: 11, width: j ? '50%' : '75%' }} />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 3 }) {
  return (
    <div aria-busy="true" aria-label="Cargando">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="row" style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
          <div className="skel" style={{ width: 56, height: 70 }} />
          <div className="stack" style={{ gap: 8, flex: 1 }}>
            <div className="skel" style={{ height: 12, width: '60%' }} />
            <div className="skel" style={{ height: 10, width: '35%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <main className="screen stack" aria-busy="true" aria-label="Cargando">
      <div className="skel" style={{ aspectRatio: '4 / 5', margin: '-28px -20px 0' }} />
      <div className="skel" style={{ height: 26, width: '70%' }} />
      <div className="skel" style={{ height: 12, width: '45%' }} />
      <div className="skel" style={{ height: 80 }} />
    </main>
  );
}
