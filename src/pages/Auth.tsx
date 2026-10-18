import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { PASSWORD_MIN, resetPasswordRedirectUrl } from '@/lib/authRules';
import { isAnonymousSession, linkGuestEmail, setAccountPassword, prepareTransfer } from '@/lib/identity';
import AccountScreen, { AccountField, PrimaryButton, SecondaryButton, LinkButton, OrDivider, ErrorNotice, InfoNote, GuestIcon } from '@/components/account/AccountScreen';

type Mode = 'login' | 'signup' | 'forgot' | 'set-password';
type Sent = null | 'confirm' | 'reset' | 'link';
type FormError = null | { title: string; desc?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cuenta: iniciar sesión · crear cuenta · recuperar contraseña · crear contraseña (invitado que enlazó su correo).
 * Maquetas Login / Login_Error / Crear_Cuenta / Recuperar_Contrasena / Revisa_Correo (marco en AccountScreen).
 * Reglas (plan F1 / decisión D10 / ACC-03):
 *  - contraseñas nuevas ≥ 8 caracteres y confirmación
 *  - los mensajes nunca revelan si un correo tiene cuenta (registro y recuperación
 *    muestran la misma confirmación genérica; el error de acceso no dice qué dato falló)
 * Google y Apple no están en las maquetas ni activos en Supabase: solo correo y contraseña.
 */
export default function Auth() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode = params.get('mode');
  const [mode, setMode] = useState<Mode>(initialMode === 'forgot' ? 'forgot' : initialMode === 'signup' ? 'signup' : initialMode === 'set-password' ? 'set-password' : 'login');
  // Invitado con sesión anónima: "crear cuenta" enlaza el correo a su usuario (conserva todo)
  const [guest, setGuest] = useState(false);
  useEffect(() => { isAnonymousSession().then(setGuest).catch(() => {}); }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [error, setErrorState] = useState<FormError>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<Sent>(null);

  const setError = (title: string, desc?: string) => setErrorState({ title, desc });
  // El error se limpia al cambiar de modo a mano (no cuando el propio flujo cambia de modo con un aviso)
  const switchMode = (m: Mode) => { setMode(m); setSent(null); setPassword(''); setConfirm(''); setErrorState(null); };
  const goHome = () => navigate('/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorState(null);
    setLoading(true);

    try {
      if (mode === 'set-password') {
        if (password.length < PASSWORD_MIN) { setError(t('auth_errPasswordShort')); return; }
        if (password !== confirm) { setError(t('auth_errPasswordMismatch')); return; }
        if (await setAccountPassword(password)) navigate('/');
        else setError(t('auth_errGeneric'));
        return;
      }

      if (mode === 'login') {
        if (!email.trim() || !password) { setError(t('acct_errMissing')); return; }
        // Desde una sesión de invitado: ticket para traer su progreso a la cuenta (se canjea al entrar)
        await prepareTransfer();
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          // Genérico: no se dice cuál dato falló ni si la cuenta existe (ACC-03)
          if (error.message === 'Email not confirmed') setError(t('auth_errEmailNotConfirmed'));
          else setError(t('acct_errLoginTitle'), t('acct_errLoginDesc'));
        } else {
          navigate('/');
        }
        return;
      }

      if (mode === 'forgot') {
        if (!EMAIL_RE.test(email.trim())) { setError(t('auth_errInvalidEmail')); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: resetPasswordRedirectUrl() });
        // Misma pantalla exista o no la cuenta. Solo se muestra error si el servicio falló (p. ej. límite de envíos).
        if (error && /rate|limit|too many/i.test(error.message)) setError(t('auth_errTooMany'));
        else setSent('reset');
        return;
      }

      // signup
      if (!displayName.trim()) { setError(t('auth_errNameRequired')); return; }
      if (!EMAIL_RE.test(email.trim())) { setError(t('auth_errInvalidEmail')); return; }
      if (password.length < PASSWORD_MIN) { setError(t('auth_errPasswordShort')); return; }
      if (password !== confirm) { setError(t('auth_errPasswordMismatch')); return; }
      if (guest) {
        // Invitado → cuenta permanente con el mismo user_id. La contraseña se fija tras confirmar el correo.
        const r = await linkGuestEmail(email.trim(), displayName);
        if (r.ok === true) { setSent('link'); return; }
        if (r.reason === 'email_taken') { setError(t('auth_errEmailTakenGuest')); setMode('login'); return; }
        setError(r.reason === 'invalid' ? t('auth_errInvalidEmail') : t('auth_errGeneric'));
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
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

  const reveal = { shown: showPassword, onToggle: () => setShowPassword(v => !v), showLabel: t('auth_showPassword'), hideLabel: t('auth_hidePassword') };
  const errorBox = error && <ErrorNotice title={error.title} desc={error.desc} />;
  const guestButton = <SecondaryButton onClick={goHome} icon={<GuestIcon />}>{t('acct_guest')}</SecondaryButton>;

  // ── Revisa tu correo (enlace de recuperación · confirmación de registro · enlace de invitado) ──
  if (sent) {
    const desc = sent === 'confirm' ? t('auth_checkEmailDesc', { email }) : sent === 'link' ? t('auth_linkSentDesc', { email }) : t('auth_resetSentDesc');
    return (
      <AccountScreen art="envelope" title={{ lead: t('acct_checkLead'), tail: t('acct_checkTail') }} subtitle={<span className="text-foreground/90">{desc}</span>}>
        <div className="flex flex-col gap-4 short:gap-3">
          <InfoNote>{t('auth_checkSpam')}</InfoNote>
          <PrimaryButton onClick={() => { setSent(null); setMode('login'); }}>
            {sent === 'reset' ? t('auth_backToLogin') : t('auth_goToSignIn')}
          </PrimaryButton>
          {sent === 'reset' && (
            <SecondaryButton onClick={() => { setSent(null); setEmail(''); }}>{t('auth_useOtherEmail')}</SecondaryButton>
          )}
        </div>
      </AccountScreen>
    );
  }

  // ── Recuperar contraseña ──
  if (mode === 'forgot') {
    return (
      <AccountScreen art="envelope" onBack={() => switchMode('login')} backLabel={t('auth_backToLogin')} title={{ lead: t('acct_forgotLead'), tail: t('acct_forgotTail') }} subtitle={t('auth_forgotDesc')}>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 short:gap-3">
          <AccountField icon="mail" label={t('auth_email')} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" autoFocus />
          {errorBox}
          <PrimaryButton type="submit" disabled={loading}>{loading ? t('auth_loading') : t('auth_sendLink')}</PrimaryButton>
          <SecondaryButton onClick={() => switchMode('login')}>{t('auth_backToLogin')}</SecondaryButton>
          <div className="mt-2 short:mt-0"><InfoNote lines>{t('auth_checkSpam')}</InfoNote></div>
        </form>
      </AccountScreen>
    );
  }

  // ── Crear tu contraseña (invitado que confirmó su correo) ──
  if (mode === 'set-password') {
    return (
      <AccountScreen art="key" title={{ lead: t('acct_setPassLead'), tail: t('acct_setPassTail') }} subtitle={t('auth_setPasswordDesc')}>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 short:gap-3">
          <AccountField icon="lock" label={t('reset_newPassword')} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth_passwordPlaceholder')} autoComplete="new-password" reveal={reveal} />
          <AccountField icon="lock" label={t('acct_confirmNew')} type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" reveal={reveal} />
          {errorBox}
          <PrimaryButton type="submit" disabled={loading}>{loading ? t('auth_loading') : t('auth_setPasswordCta')}</PrimaryButton>
        </form>
      </AccountScreen>
    );
  }

  // ── Crear cuenta ──
  if (mode === 'signup') {
    return (
      <AccountScreen
        art="globe"
        onBack={goHome}
        backLabel={t('back')}
        title={{ lead: t('acct_signupLead'), tail: t('acct_signupTail') }}
        subtitle={guest ? t('auth_signupGuestSubtitle') : t('acct_signupSub')}
        hero={{ lead: t('acct_signupHeroLead'), tail: t('acct_signupHeroTail'), stack: true }}
        card
        cardTitle={t('acct_signupCard')}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 short:gap-2.5">
          {guest && <p className="hidden lg:block -mt-3 mb-1 text-center text-sm text-brand-sky">{t('auth_signupGuestSubtitle')}</p>}
          <AccountField icon="user" label={t('auth_playerName')} hideLabelOnMobile placeholder={t('auth_playerName')} type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={20} autoComplete="nickname" />
          <AccountField icon="mail" label={t('auth_email')} hideLabelOnMobile placeholder={t('auth_email')} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
          <AccountField icon="lock" label={t('auth_password')} hideLabelOnMobile placeholder={t('auth_password')} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" reveal={reveal} />
          <AccountField icon="lock" label={t('auth_confirmPassword')} hideLabelOnMobile placeholder={t('auth_confirmPassword')} type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" reveal={reveal} />
          {errorBox}
          <div className="mt-1"><PrimaryButton type="submit" disabled={loading}>{loading ? t('auth_loading') : t('auth_signUp')}</PrimaryButton></div>
          <p className="text-center text-base lg:hidden">
            {t('acct_hasAccount')} <span className="text-foreground/60 mx-1">·</span> <LinkButton onClick={() => switchMode('login')}>{t('acct_signInLink')}</LinkButton>
          </p>
          <div className="hidden lg:block">
            <SecondaryButton onClick={() => switchMode('login')}>{t('acct_hasAccount')} · {t('acct_signInLink')}</SecondaryButton>
          </div>
          <OrDivider label={t('acct_or')} />
          {guestButton}
        </form>
      </AccountScreen>
    );
  }

  // ── Iniciar sesión (con el aviso de error genérico de Login_Error) ──
  return (
    <AccountScreen
      art="globe"
      onBack={goHome}
      backLabel={t('back')}
      title={{ lead: t('acct_loginLead'), tail: t('acct_loginTail') }}
      subtitle={t('acct_loginSub')}
      hero={{ lead: t('acct_loginLead'), tail: t('acct_loginTail'), sub: t('acct_loginSub') }}
      card
      cardTitle={t('acct_loginCard')}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5 short:gap-2.5">
        {guest && <p className="-mt-2 lg:-mt-3 text-center text-sm text-brand-sky">{t('auth_loginGuestSubtitle')}</p>}
        <AccountField icon="mail" label={t('auth_email')} placeholder={t('acct_emailPh')} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
        <AccountField icon="lock" label={t('auth_password')} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" reveal={reveal} />
        {errorBox}
        <div className="mt-1"><PrimaryButton type="submit" disabled={loading}>{loading ? t('auth_loading') : t('auth_signIn')}</PrimaryButton></div>
        <SecondaryButton onClick={() => switchMode('signup')}>{t('acct_createAccount')}</SecondaryButton>
        <p className="text-center"><LinkButton onClick={() => switchMode('forgot')}>{t('auth_forgot')}</LinkButton></p>
        <OrDivider label={t('acct_or')} />
        {guestButton}
      </form>
    </AccountScreen>
  );
}
