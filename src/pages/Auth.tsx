import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import { PASSWORD_MIN, resetPasswordRedirectUrl } from '@/lib/authRules';
import { PasswordField } from './ResetPassword';

type Mode = 'login' | 'signup' | 'forgot';
type Sent = null | 'confirm' | 'reset';

async function signInWithProvider(provider: 'google' | 'apple') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  return error;
}

/**
 * Cuenta: iniciar sesión · crear cuenta · recuperar contraseña.
 * Reglas (plan F1 / decisión D10 / ACC-03):
 *  - contraseñas nuevas ≥ 8 caracteres y confirmación
 *  - los mensajes nunca revelan si un correo tiene cuenta (registro y recuperación
 *    muestran la misma confirmación genérica)
 */
export default function Auth() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'forgot' ? 'forgot' : params.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<Sent>(null);

  useEffect(() => { setError(''); }, [mode]);

  const switchMode = (m: Mode) => { setMode(m); setSent(null); setPassword(''); setConfirm(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Genérico: no se dice cuál dato falló ni si la cuenta existe (ACC-03)
          setError(error.message === 'Email not confirmed' ? t('auth_errEmailNotConfirmed') : t('auth_errInvalidCredentials'));
        } else {
          navigate('/');
        }
        return;
      }

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetPasswordRedirectUrl() });
        // Misma pantalla exista o no la cuenta. Solo se muestra error si el servicio falló (p. ej. límite de envíos).
        if (error && /rate|limit|too many/i.test(error.message)) setError(t('auth_errTooMany'));
        else setSent('reset');
        return;
      }

      // signup
      if (!displayName.trim()) { setError(t('auth_errNameRequired')); return; }
      if (password.length < PASSWORD_MIN) { setError(t('auth_errPasswordShort')); return; }
      if (password !== confirm) { setError(t('auth_errPasswordMismatch')); return; }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        const msg = error.message;
        if (msg.includes('already registered')) setSent('confirm'); // no revelar existencia de la cuenta
        else if (msg.includes('valid email')) setError(t('auth_errInvalidEmail'));
        else if (msg.includes('signup is disabled') || msg.includes('Signups not allowed')) setError(t('auth_errSignupDisabled'));
        else setError(t('auth_errGeneric'));
      } else {
        setSent('confirm');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Pantallas de "revisa tu correo" (confirmación de registro / enlace de recuperación) ──
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 game-bg">
        <div className="bg-card border rounded-xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in-up">
          <p className="text-4xl mb-3">✉️</p>
          <h2 className="text-xl font-black mb-2" style={{ color: 'hsl(var(--primary))' }}>
            {sent === 'confirm' ? t('auth_checkEmailTitle') : t('auth_resetSentTitle')}
          </h2>
          <p className="text-muted-foreground text-sm mb-2">
            {sent === 'confirm' ? t('auth_checkEmailDesc', { email }) : t('auth_resetSentDesc')}
          </p>
          <p className="text-muted-foreground text-xs mb-6">{t('auth_checkSpam')}</p>
          <button
            onClick={() => { setSent(null); setMode('login'); }}
            className="w-full py-3 rounded-lg font-bold transition-all active:scale-[0.97] mb-3"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {t('auth_goToSignIn')}
          </button>
          {sent === 'reset' && (
            <button onClick={() => { setSent(null); setEmail(''); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('auth_useOtherEmail')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const title = mode === 'login' ? t('auth_loginSubtitle') : mode === 'signup' ? t('auth_signupSubtitle') : t('auth_forgotDesc');
  const cta = loading ? t('auth_loading') : mode === 'login' ? t('auth_signIn') : mode === 'signup' ? t('auth_signUp') : t('auth_sendLink');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 game-bg">
      <div className="bg-card border rounded-xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="GeoSpeed" className="w-14 object-contain mx-auto mb-1" />
          <h1 className="leading-none"><Wordmark size="md" /></h1>
          {mode === 'forgot' && <h2 className="text-lg font-black mt-3">{t('auth_forgotTitle')}</h2>}
          <p className="text-muted-foreground text-sm mt-2">{title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t('auth_playerName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={20}
                placeholder={t('auth_playerNamePlaceholder')}
                autoComplete="nickname"
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t('auth_email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{t('auth_password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? t('auth_passwordPlaceholder') : t('auth_password')}
                  required
                  minLength={mode === 'signup' ? PASSWORD_MIN : 1}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 pr-11 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? t('auth_hidePassword') : t('auth_showPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          )}
          {mode === 'signup' && (
            <PasswordField
              label={t('auth_confirmPassword')}
              value={confirm}
              onChange={setConfirm}
              show={showPassword}
              onToggle={() => setShowPassword(v => !v)}
              placeholder={t('auth_passwordPlaceholder')}
              showLabel={t('auth_showPassword')}
              hideLabel={t('auth_hidePassword')}
              autoComplete="new-password"
            />
          )}

          {error && (
            <p className="text-sm text-red-400 text-center" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {cta}
          </button>

          {mode === 'login' && (
            <button type="button" onClick={() => switchMode('forgot')} className="w-full text-xs text-accent hover:underline">
              {t('auth_forgot')}
            </button>
          )}
        </form>

        {mode !== 'forgot' && (
          <>
            {/* ── OAuth divider ── */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('auth_orContinue')}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ── OAuth buttons ── */}
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={async () => {
                  setError('');
                  const err = await signInWithProvider('google');
                  if (err) setError(t('auth_errGeneric'));
                }}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-bold text-sm border border-border bg-muted hover:bg-muted/80 transition-all active:scale-[0.97] text-foreground"
              >
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                {t('auth_google')}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setError('');
                  const err = await signInWithProvider('apple');
                  if (err) setError(t('auth_errGeneric'));
                }}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-lg font-bold text-sm border border-border bg-muted hover:bg-muted/80 transition-all active:scale-[0.97] text-foreground"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                {t('auth_apple')}
              </button>
            </div>
          </>
        )}

        <div className="mt-5 text-center">
          {mode === 'forgot' ? (
            <button onClick={() => switchMode('login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('auth_backToLogin')}
            </button>
          ) : (
            <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {mode === 'login' ? t('auth_noAccount') : t('auth_hasAccount')}
            </button>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('auth_playAsGuest')}
          </button>
        </div>
      </div>
    </div>
  );
}
