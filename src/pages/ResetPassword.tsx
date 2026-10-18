import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n';
import { PASSWORD_MIN } from '@/lib/authRules';
import AccountScreen, { AccountField, PrimaryButton, SecondaryButton, ErrorNotice } from '@/components/account/AccountScreen';

type Stage = 'checking' | 'form' | 'success' | 'invalid';

/**
 * /reset-password — destino del enlace de recuperación (maquetas Nueva_Contrasena, Contrasena_Actualizada
 * y el estado de enlace inválido/vencido).
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
    // Solo en desarrollo: /reset-password?stage=form|success|invalid para revisar cada estado sin un enlace real
    const preview = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('stage') : null;
    if (preview === 'form' || preview === 'success' || preview === 'invalid') { setStage(preview); return; }
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
    if (saving) return;
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

  const toLogin = () => navigate('/auth');

  if (stage === 'success') {
    return (
      <AccountScreen
        art="keyCheck"
        title={{ lead: t('acct_updatedLead'), tail: t('acct_updatedTail'), stack: true }}
        subtitle={<><span className="block lg:font-bold lg:text-foreground">{t('acct_updatedLine')}</span>{t('reset_successDesc')}</>}
        card
      >
        <PrimaryButton onClick={toLogin}>{t('reset_goSignIn')}</PrimaryButton>
      </AccountScreen>
    );
  }

  if (stage === 'invalid') {
    return (
      <AccountScreen art="hourglass" onBack={toLogin} backLabel={t('auth_backToLogin')} title={{ lead: t('acct_invalidLead'), tail: t('acct_invalidTail') }} subtitle={t('reset_invalidDesc')}>
        <div className="flex flex-col gap-4 short:gap-3">
          <PrimaryButton onClick={() => navigate('/auth?mode=forgot')}>{t('reset_requestNew')}</PrimaryButton>
          <SecondaryButton onClick={toLogin}>{t('auth_backToLogin')}</SecondaryButton>
        </div>
      </AccountScreen>
    );
  }

  const reveal = { shown: show, onToggle: () => setShow(v => !v), showLabel: t('auth_showPassword'), hideLabel: t('auth_hidePassword') };
  return (
    <AccountScreen
      art="key"
      onBack={toLogin}
      backLabel={t('auth_backToLogin')}
      title={{ lead: t('acct_newPassLead'), tail: t('acct_newPassTail') }}
      subtitle={stage === 'checking' ? <span className="animate-pulse">{t('reset_checking')}</span> : t('reset_desc')}
    >
      {stage === 'form' && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 short:gap-3">
          <AccountField icon="lock" label={t('reset_newPassword')} type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth_passwordPlaceholder')} autoComplete="new-password" reveal={reveal} autoFocus />
          <AccountField icon="lock" label={t('acct_confirmNew')} type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" reveal={reveal} />
          {error && <ErrorNotice title={error} />}
          <PrimaryButton type="submit" disabled={saving}>{saving ? t('auth_loading') : t('reset_save')}</PrimaryButton>
          <SecondaryButton onClick={toLogin}>{t('auth_backToLogin')}</SecondaryButton>
        </form>
      )}
    </AccountScreen>
  );
}
