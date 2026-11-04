import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const QUIZ = [
  { id: 'estilo', q: '¿Cómo describes tu estilo?', opts: ['Clásico', 'Minimalista', 'Casual', 'Atrevido', 'Deportivo'] },
  { id: 'colores', q: '¿Qué colores usas más?', opts: ['Neutros', 'Oscuros', 'Tierra', 'Pastel', 'Vivos'], multi: true },
  { id: 'ocasion', q: '¿Para qué necesitas ropa nueva?', opts: ['Oficina', 'Fines de semana', 'Eventos', 'Viajes', 'Deporte'], multi: true },
  { id: 'presupuesto', q: '¿Cuánto gastarías por prenda?', opts: ['Hasta $500', '$500 – $1,000', '$1,000 – $2,000', 'Más de $2,000'] }
];

export default function Soon() {
  const nav = useNavigate();
  const [joined, setJoined] = useState(false);
  const [quiz, setQuiz] = useState({});
  const [mode, setMode] = useState('info');

  useEffect(() => {
    supabase.from('waitlist').select('*').maybeSingle().then(({ data }) => {
      if (data) { setJoined(true); setQuiz(data.quiz || {}); }
    });
  }, []);

  async function save(extra = {}) {
    const row = { interests: ['tienda', 'membresia'], quiz: { ...quiz, ...extra } };
    const { error } = await supabase.from('waitlist').upsert(row);
    if (!error) setJoined(true);
  }
  const choose = (qid, opt, multi) => {
    const cur = quiz[qid];
    const next = multi ? (cur?.includes(opt) ? cur.filter((x) => x !== opt) : [...(cur || []), opt]) : opt;
    setQuiz({ ...quiz, [qid]: next });
  };
  const on = (qid, opt) => (Array.isArray(quiz[qid]) ? quiz[qid].includes(opt) : quiz[qid] === opt);

  return (
    <div className="dark">
      <main className="screen stack" style={{ maxWidth: 520, margin: '0 auto' }}>
        <button className="back link" style={{ color: '#D9D4CE', textDecoration: 'none' }} onClick={() => nav(-1)}>← Volver</button>
        <span className="small" style={{ color: 'var(--gold)' }}>Muy pronto</span>
        <h1 className="h1" style={{ fontSize: 34 }}>Ropa nueva elegida para ti</h1>

        {mode === 'info' && (
          <>
            <div className="card stack" style={{ borderColor: '#3A3734', gap: 8 }}>
              <span className="h2" style={{ fontSize: 20 }}>Tienda Porte</span>
              <span className="muted" style={{ lineHeight: 1.5 }}>Compra prendas de tiendas de León que combinan con lo que ya tienes en tu clóset.</span>
            </div>
            <div className="card stack" style={{ borderColor: '#3A3734', gap: 8 }}>
              <span className="h2" style={{ fontSize: 20 }}>Membresía Porte</span>
              <span className="muted" style={{ lineHeight: 1.5 }}>Cada mes una selección según tu estilo y presupuesto. Tienes 7 días para probarla en casa y pagas solo lo que te quedas.</span>
            </div>
            {joined && <div className="ok">Ya estás en la lista de espera. Te avisaremos primero.</div>}
            <button className="btn light" onClick={() => setMode('quiz')}>{Object.keys(quiz).length ? 'Editar mi quiz de estilo' : 'Haz tu quiz de estilo'}</button>
            {!joined && <button className="btn ghost" style={{ color: '#fff', borderColor: '#fff' }} onClick={() => save()}>Unirme a la lista de espera</button>}
            <p className="small muted center" style={{ margin: 0 }}>Tu quiz nos ayuda a elegir tu primera selección.</p>
          </>
        )}

        {mode === 'quiz' && (
          <>
            {QUIZ.map((q) => (
              <div key={q.id} className="stack" style={{ gap: 10 }}>
                <span style={{ fontWeight: 600 }}>{q.q}{q.multi && <span className="muted small"> · elige varias</span>}</span>
                <div className="chips wrap">
                  {q.opts.map((o) => (
                    <button key={o} className={`chip ${on(q.id, o) ? 'on' : ''}`} style={on(q.id, o) ? { background: '#fff', color: 'var(--ink)', borderColor: '#fff' } : { background: 'transparent', color: '#fff', borderColor: '#4A4642' }} onClick={() => choose(q.id, o, q.multi)}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn light" onClick={async () => { await save(); setMode('info'); }}>Guardar y unirme a la lista</button>
          </>
        )}
      </main>
    </div>
  );
}
