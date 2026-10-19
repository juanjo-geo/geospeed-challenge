import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import AccountScreen, { PrimaryButton, SecondaryButton, InfoNote } from '@/components/account/AccountScreen';
import DeleteAccountDialog from '@/components/account/DeleteAccountDialog';

/**
 * Página pública para borrar la cuenta (Google Play pide un enlace web, además de la opción dentro de la
 * app en Ajustes → Cuenta). Con sesión de cuenta muestra el botón; sin sesión, lleva a iniciar sesión y
 * vuelve aquí (/auth?next=/eliminar-cuenta). También explica el camino por correo.
 */
export default function DeleteAccount() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isAnonymous, loading } = useAuth();
  // Solo en desarrollo: ?preview=dialog abre el aviso sin sesión para revisar su diseño
  const [open, setOpen] = useState(() => import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'dialog');
  const signedIn = !!user && !isAnonymous;

  return (
    <AccountScreen
      art="envelopeAlert"
      onBack={() => navigate('/')}
      backLabel={t('back')}
      title={{ lead: t('delpage_titleLead'), tail: t('delpage_titleTail') }}
      subtitle={t('delpage_subtitle')}
      card
    >
      <div className="flex flex-col gap-4 short:gap-3 text-left">
        <div>
          <p className="font-extrabold">{t('delpage_whatTitle')}</p>
          <p className="text-sm text-foreground/80 leading-snug mt-1">{t('delpage_whatDesc')}</p>
        </div>
        <div>
          <p className="font-extrabold">{t('delpage_keptTitle')}</p>
          <p className="text-sm text-foreground/80 leading-snug mt-1">{t('del_paymentsNote')}</p>
        </div>
        <div>
          <p className="font-extrabold">{t('delpage_howTitle')}</p>
          <ol className="text-sm text-foreground/80 leading-snug mt-1 list-decimal pl-5 space-y-1">
            <li>{t('delpage_howApp')}</li>
            <li>{t('delpage_howWeb')}</li>
            <li>{t('delpage_howEmail')}</li>
          </ol>
        </div>

        {!loading && (signedIn ? (
          <>
            <p className="text-sm text-foreground/80">{t('delpage_signedInAs', { email: user?.email ?? '' })}</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full rounded-2xl bg-destructive py-3.5 font-black text-white tracking-wide"
            >
              {t('settings_deleteAccount')}
            </button>
          </>
        ) : (
          <>
            <PrimaryButton onClick={() => navigate('/auth?next=/eliminar-cuenta')}>{t('delpage_signInToDelete')}</PrimaryButton>
            <SecondaryButton onClick={() => navigate('/')}>{t('delpage_backToGame')}</SecondaryButton>
          </>
        ))}
        <InfoNote lines>
          <a href="mailto:juanjogrimar@gmail.com?subject=Eliminar%20cuenta%20GeoSpeed%20Challenge" className="text-accent underline underline-offset-4">juanjogrimar@gmail.com</a>
        </InfoNote>
      </div>
      {open && <DeleteAccountDialog onClose={() => setOpen(false)} />}
    </AccountScreen>
  );
}
