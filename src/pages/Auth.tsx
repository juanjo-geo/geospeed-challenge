import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

async function signInWithProvider(provider: 'google' | 'apple') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  return error;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : error.message === 'Email not confirmed'
          ? 'Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja.'
          : error.message);
      } else {
        navigate('/');
      }
    } else {
      if (!displayName.trim()) {
        setError('Ingresa tu nombre de jugador');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setConfirmSent(true);
      }
    }
    setLoading(false);
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 game-bg">
        <div className="bg-card border rounded-xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
          <p className="text-4xl mb-3">✉️</p>
          <h2 className="text-xl font-black mb-2" style={{ color: 'hsl(var(--primary))' }}>¡Revisa tu email!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Enviamos un enlace de confirmación a <strong className="text-foreground">{email}</strong>. Haz clic en él para activar tu cuenta.
          </p>
          <button
            onClick={() => { setConfirmSent(false); setIsLogin(true); }}
            className="w-full py-3 rounded-lg font-bold transition-all active:scale-[0.97]"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            IR A INICIAR SESIÓN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 game-bg">
      <div className="bg-card border rounded-xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black" style={{ color: 'hsl(var(--primary))', fontFamily: 'Impact, system-ui' }}>
            📍 GEOSPEED
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? 'Inicia sesión para guardar tu progreso' : 'Crea tu cuenta de jugador'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Nombre de jugador</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={20}
                placeholder="Tu nombre en el ranking"
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {loading ? 'CARGANDO...' : isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
          </button>
        </form>

        {/* ── OAuth divider ── */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">o continúa con</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── OAuth buttons ── */}
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            onClick={async () => {
              setError('');
              const err = await signInWithProvider('google');
              if (err) setError(err.message);
            }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-bold text-sm border border-border bg-muted hover:bg-muted/80 transition-all active:scale-[0.97] text-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continuar con Google
          </button>

          <button
            type="button"
            onClick={async () => {
              setError('');
              const err = await signInWithProvider('apple');
              if (err) setError(err.message);
            }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-bold text-sm border border-border bg-muted hover:bg-muted/80 transition-all active:scale-[0.97] text-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continuar con Apple
          </button>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Jugar sin cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
