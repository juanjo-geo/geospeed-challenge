import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n';
import Wordmark from '@/components/ui/Wordmark';
import { PASSWORD_MIN } from '@/lib/authRules';

type Stage = 'checking' | 'form' | 'success' | 'invalid';

/**
 * /reset-password — destino del enlace de recuperación (maquetas Nueva contraseña,
 * Contraseña actualizada y Enlace no disponible).
 *
 * Supabase procesa el hash del enlace (#access_token…&type=recovery) al cargar y emite
 * PASSWORD_RECOVERY. Si el enlace venció llega #error=…&error_code=otp_expired.
 * Tras guardar la contraseña se cierra la sesión: el usuario inicia sesión él mismo
 * (no se asume acceso automático).
 */
export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || '';
    if (/error=|error_code=/.test(hash)) {
      setStage('invalid');
      return;
    }
    let settled = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        settled = true;
        setStage('form');
      }
    });
    // Si la sesión ya estaba procesada antes de montar (recarga de la página)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (settled) return;
      if (session && /type=recovery/.test(hash)) { settled = true; setStage('form'); }
    });
    // Sin evento en 4 s → el enlace no sirvió
    const timer = setTimeout(() => { if (!settled) { settled = true; setStage('invalid'); } }, 4000);
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < PASSWORD_MIN) { setError(t('auth_errPasswordShort')); return; }
    if (password !== confirm) { setError(t('auth_errPasswordMismatch')); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      // Enlace reutilizado / sesión caducada entre la carga y el envío
      if (/expired|invalid|session/i.test(error.message)) setStage('invalid');
      else setError(t('auth_errGeneric'));
      return;
    }
    await supabase.auth.signOut();
    setStage('success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 short:p-3 game-bg">
      <div className="bg-card border rounded-xl p-8 short:p-5 max-w-sm w-full shadow-2xl animate-fade-in-up">
        <div className="text-center mb-6 short:mb-3">
          <img src="/logo.png" alt="GeoSpeed" className="w-14 short:w-10 object-contain mx-auto mb-1" />
          <h1 className="leading-none"><Wordmark size="md" /></h1>
        </div>

        {stage === 'checking' && (
          <p className="text-center text-sm text-muted-foreground animate-pulse">{t('reset_checking')}</p>
        )}

        {stage === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-black">{t('reset_title')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('reset_desc')}</p>
            </div>
            <PasswordField
              label={t('reset_newPassword')}
              value={password}
              onChange={setPassword}
              show={show}
              onToggle={() => setShow(v => !v)}
              placeholder={t('auth_passwordPlaceholder')}
              showLabel={t('auth_showPassword')}
              hideLabel={t('auth_hidePassword')}
              autoComplete="new-password"
            />
            <PasswordField
              label={t('auth_confirmPassword')}
              value={confirm}
              onChange={setConfirm}
              show={show}
              onToggle={() => setShow(v => !v)}
              placeholder={t('auth_passwordPlaceholder')}
              showLabel={t('auth_showPassword')}
              hideLabel={t('auth_hidePassword')}
              autoComplete="new-password"
            />
            {error && <p className="text-sm text-red-400 text-center" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {saving ? t('auth_loading') : t('reset_save')}
            </button>
            <button type="button" onClick={() => navigate('/auth')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('auth_backToLogin')}
            </button>
          </form>
        )}

        {stage === 'success' && (
          <div className="text-center">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="text-xl font-black mb-2" style={{ color: 'hsl(var(--accent))' }}>{t('reset_successTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('reset_successDesc')}</p>
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-3 rounded-lg font-bold transition-all active:scale-[0.97]"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {t('reset_goSignIn')}
            </button>
          </div>
        )}

        {stage === 'invalid' && (
          <div className="text-center">
            <p className="text-4xl mb-3">⏳</p>
            <h2 className="text-xl font-black mb-2">{t('reset_invalidTitle')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('reset_invalidDesc')}</p>
            <button
              onClick={() => navigate('/auth?mode=forgot')}
              className="w-full py-3 rounded-lg font-bold transition-all active:scale-[0.97] mb-3"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {t('reset_requestNew')}
            </button>
            <button onClick={() => navigate('/auth')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('auth_backToLogin')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PasswordField({ label, value, onChange, show, onToggle, placeholder, showLabel, hideLabel, autoComplete }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
  placeholder: string; showLabel: string; hideLabel: string; autoComplete: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={PASSWORD_MIN}
          autoComplete={autoComplete}
          className="w-full px-4 py-3 pr-11 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? hideLabel : showLabel}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}
