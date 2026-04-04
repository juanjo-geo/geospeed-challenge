import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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

        <div className="mt-6 text-center">
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
