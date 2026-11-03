import { useState } from 'react';
import { supabase } from '../supabase';

const authError = (m = '') => {
  if (/Invalid login/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(m)) return 'Confirma tu correo con el enlace que te enviamos.';
  if (/already registered/i.test(m)) return 'Ese correo ya tiene cuenta. Entra con tu contraseña.';
  if (/invitaci/i.test(m) || /Database error saving new user/i.test(m)) return 'El código de invitación no es válido o ya se usó.';
  if (/Password should be/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  return m || 'Algo salió mal. Inténtalo de nuevo.';
};

export default function Login() {
  const [mode, setMode] = useState('entrar');
  const [form, setForm] = useState({ code: '', name: '', email: '', password: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) throw error;
      } else if (mode === 'crear') {
        const { data: valid } = await supabase.rpc('check_invite', { p_code: form.code });
        if (!valid) throw new Error('invitación');
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { invite_code: form.code.trim().toUpperCase(), full_name: form.name.trim() },
            emailRedirectTo: window.location.origin + window.location.pathname
          }
        });
        if (error) throw error;
        if (!data.session) setMsg({ ok: 'Listo. Te enviamos un correo para confirmar tu cuenta; ábrelo desde este teléfono.' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: window.location.origin + window.location.pathname
        });
        if (error) throw error;
        setMsg({ ok: 'Te enviamos un correo para restablecer tu contraseña.' });
      }
    } catch (err) {
      setMsg({ error: authError(err.message) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dark">
      <div className="app" style={{ background: 'transparent', padding: 'calc(env(safe-area-inset-top) + 64px) 32px 40px' }}>
        <div className="stack" style={{ flex: 1, justifyContent: 'center', minHeight: 220 }}>
          <div className="wordmark">PORTE</div>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: '#D9D4CE' }}>
            Viste con lo que tienes.<br />Vende lo que ya no usas.
          </p>
        </div>
        <form className="stack" onSubmit={submit}>
          {mode === 'crear' && (
            <>
              <label className="field">Código de invitación
                <input className="input" required value={form.code} onChange={set('code')} placeholder="PORTE-XXXX" autoCapitalize="characters" style={{ letterSpacing: 2 }} />
              </label>
              <label className="field">Tu nombre
                <input className="input" required value={form.name} onChange={set('name')} autoComplete="name" />
              </label>
            </>
          )}
          <label className="field">Correo electrónico
            <input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" placeholder="tu@correo.com" />
          </label>
          {mode !== 'recuperar' && (
            <label className="field">Contraseña
              <input className="input" type="password" required minLength={8} value={form.password} onChange={set('password')} autoComplete={mode === 'crear' ? 'new-password' : 'current-password'} />
            </label>
          )}
          {msg?.error && <div className="error" role="alert">{msg.error}</div>}
          {msg?.ok && <div className="ok" role="status">{msg.ok}</div>}
          <button className="btn light" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'Un momento…' : mode === 'entrar' ? 'ENTRAR' : mode === 'crear' ? 'CREAR MI CUENTA' : 'ENVIAR CORREO'}
          </button>
          <div className="center small" style={{ color: '#BDB6AF', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mode === 'entrar' ? (
              <>
                <button type="button" className="link" style={{ color: '#fff' }} onClick={() => { setMode('crear'); setMsg(null); }}>Tengo una invitación</button>
                <button type="button" className="link" style={{ color: '#BDB6AF' }} onClick={() => { setMode('recuperar'); setMsg(null); }}>Olvidé mi contraseña</button>
              </>
            ) : (
              <button type="button" className="link" style={{ color: '#fff' }} onClick={() => { setMode('entrar'); setMsg(null); }}>Ya tengo cuenta</button>
            )}
            <span>Acceso solo por invitación · Piloto León</span>
          </div>
        </form>
      </div>
    </div>
  );
}
