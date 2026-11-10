import { fetchPhotoCredits, type PhotoCredit } from '@/lib/countryPhotos';
import { fetchCityPhotoCredits, type CityPhotoCredit } from '@/lib/cityPhotos';
import { fetchLandmarkCredits, type LandmarkCredit } from '@/lib/landmarkPhotos';
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#f5c842]/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-[#e8e8dc] transition hover:text-[#f5c842]"
      >
        <span className="pr-4 font-medium">{q}</span>
        <span className="shrink-0 text-[#f5c842] text-xl leading-none">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <p className="pb-4 text-[#d4d4c8]/80 leading-relaxed">{a}</p>
      )}
    </div>
  );
};

const Support = () => {
  return (
    <div className="min-h-screen bg-[#07130a] text-[#e8e8dc]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[#f5c842]/30 px-4 py-2 text-sm text-[#f5c842] transition hover:bg-[#f5c842]/10"
          >
            ← GeoSpeed Challenge
          </Link>
          <a
            href="#english"
            className="text-sm text-[#f5c842]/60 underline hover:text-[#f5c842]"
          >
            English version ↓
          </a>
        </div>

        <h1 className="mb-2 text-4xl font-extrabold text-[#f5c842]">
          Centro de Soporte
        </h1>
        <p className="mb-8 text-[#d4d4c8]/60">
          GeoSpeed Challenge &middot; Desarrollado por JuanJo Grimar
        </p>

        <div className="rounded-xl border border-[#f5c842]/10 bg-[#0d1f12] p-8">
          {/* ── SPANISH ── */}

          <h2 className="mb-6 text-2xl font-bold text-[#f5c842]">
            Preguntas Frecuentes
          </h2>

          <div className="mb-10">
            <FAQItem
              q="No puedo iniciar sesión / Mi cuenta no funciona"
              a="Verifica tu conexión a internet e intenta de nuevo. Si entras con Google, asegúrate de usar la misma cuenta con la que te registraste. Si olvidaste tu contraseña, usa la opción Olvidé mi contraseña. Si el problema persiste, escríbenos a juanjogrimar@gmail.com con una captura de pantalla del error."
            />
            <FAQItem
              q="He perdido mi progreso de juego"
              a="Si tienes una cuenta, tu progreso está guardado en ella: inicia sesión con la misma cuenta. Si juegas como invitado, tu progreso queda ligado a este dispositivo; si borras los datos de la app o cambias de dispositivo, se pierde y no podemos recuperarlo. Para conservarlo, crea una cuenta desde Ajustes."
            />
            <FAQItem
              q="La aplicación se congela o se cierra inesperadamente"
              a="Intenta cerrar y volver a abrir la app. Asegúrate de tener la última versión instalada. Si el problema continúa, reinicia tu dispositivo. Si persiste, contáctanos indicando tu modelo de dispositivo y versión del sistema operativo."
            />
            <FAQItem
              q="Los anuncios no se cargan o muestran contenido inapropiado"
              a="Los anuncios son proporcionados por Google AdMob. Si ves contenido inapropiado, puedes reportarlo directamente en el anuncio (ícono de información o triángulo). Si los anuncios no cargan, verifica tu conexión a internet."
            />
            <FAQItem
              q="No recibí mi compra / GeoSpeed Pro"
              a="Las compras se procesan con Google Play (app) o Mercado Pago (web). Si pagaste pero no recibes los beneficios: 1) Espera unos minutos y reinicia la app. 2) Verifica que estás usando la misma cuenta. 3) Si el problema persiste, envíanos tu recibo de compra a juanjogrimar@gmail.com y lo resolveremos en menos de 24 horas."
            />
            <FAQItem
              q="¿Cómo elimino mi cuenta y mis datos?"
              a="En el juego: Ajustes → Cuenta → Eliminar cuenta (se borra de inmediato). También desde la web en geospeed-challenge.vercel.app/eliminar-cuenta, o escribiéndonos a juanjogrimar@gmail.com desde el email de tu cuenta: la eliminamos con todos sus datos en un plazo máximo de 30 días."
            />
            <FAQItem
              q="Un reto o una Sala en vivo no conecta"
              a="Los retos y la Sala en vivo requieren una conexión a internet estable. Verifica tu conexión y que todos los jugadores estén en la última versión de la app. Si sigues teniendo problemas, intenta en una red diferente (Wi-Fi o datos móviles)."
            />
            <FAQItem
              q="¿Cómo desactivo las notificaciones?"
              a="Puedes desactivar las notificaciones desde la configuración de tu dispositivo: Ajustes > Notificaciones > GeoSpeed Challenge."
            />
            <FAQItem
              q="¿Cómo reporto un nombre ofensivo o a un jugador?"
              a="Toca la bandera que aparece junto a su nombre y elige el motivo. También puedes escribirnos a juanjogrimar@gmail.com con el nombre del jugador, el modo y la pantalla donde lo viste (una captura ayuda). Revisamos cada reporte y podemos cambiar el nombre o bloquear la cuenta."
            />
          </div>

          {/* Contact section */}
          <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Contáctanos</h2>
          <p className="mb-6 text-[#d4d4c8] leading-relaxed">
            Si no encontraste respuesta a tu problema en las preguntas frecuentes, no dudes en
            contactarnos. Respondemos en un plazo máximo de <strong>48 horas</strong>.
          </p>

          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:juanjogrimar@gmail.com?subject=Soporte%20GeoSpeed%20Challenge"
              className="flex flex-col items-center gap-3 rounded-xl border border-[#f5c842]/20 bg-[#07130a] p-6 text-center transition hover:border-[#f5c842]/50 hover:bg-[#f5c842]/5"
            >
              <span className="text-3xl">✉</span>
              <span className="font-semibold text-[#f5c842]">Email</span>
              <span className="text-sm text-[#d4d4c8]/70">juanjogrimar@gmail.com</span>
            </a>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#f5c842]/20 bg-[#07130a] p-6 text-center">
              <span className="text-3xl">⏱</span>
              <span className="font-semibold text-[#f5c842]">Tiempo de respuesta</span>
              <span className="text-sm text-[#d4d4c8]/70">Máximo 48 horas</span>
            </div>
          </div>

          {/* Tips for contacting */}
          <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">
            Para una respuesta más rápida, incluye:
          </h2>
          <ul className="mb-10 list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
            <li>Tu dispositivo y versión del sistema operativo (ej.: Samsung Galaxy A54, Android 14)</li>
            <li>Versión de la app (en la información de la app de tu teléfono)</li>
            <li>Descripción detallada del problema</li>
            <li>Capturas de pantalla si es posible</li>
            <li>Si es un problema de pago, incluye tu recibo o ID de transacción</li>
          </ul>

          <PhotoCredits title="Créditos de las fotos de países" intro="Las fotografías de países que aparecen en el juego pertenecen a sus autores y se usan bajo las licencias indicadas (Wikimedia Commons). Las imágenes fueron redimensionadas y convertidas a WebP; las que tienen licencia CC BY-SA se comparten bajo la misma licencia." />
          <LandmarkPhotoCredits />
          <CityPhotoCredits />
          <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Datos de los lugares</h2>
          <p className="mb-10 text-sm text-[#d4d4c8]/70">
            Las cifras de las fichas (habitantes, área, altitud, capital, año de construcción…) vienen de{' '}
            <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className="underline">Wikidata</a> (CC0, dominio público);
            los mapas, de <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener noreferrer" className="underline">Natural Earth</a> (dominio público).
            Los datos curiosos los redactó el equipo de GeoSpeed. Si encuentras un error, escríbenos.
          </p>
          <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Fotos de las reseñas</h2>
          <p className="mb-10 text-sm text-[#d4d4c8]/70">
            Las fotos adicionales de la ventana "Conoce…" se muestran directamente desde{' '}
            <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer" className="underline">Wikimedia Commons</a>,
            con su autor y su licencia (CC BY, CC BY-SA, CC0 o dominio público) debajo de cada una y un enlace a la página del archivo.
          </p>

          {/* ────────── ENGLISH VERSION ────────── */}
          <div id="english" className="border-t border-[#f5c842]/20 pt-10">
            <h1 className="mb-2 text-4xl font-extrabold text-[#f5c842]">
              Support Center
            </h1>
            <p className="mb-8 text-[#d4d4c8]/60">
              GeoSpeed Challenge &middot; Developed by JuanJo Grimar
            </p>

            <h2 className="mb-6 text-2xl font-bold text-[#f5c842]">
              Frequently Asked Questions
            </h2>

            <div className="mb-10">
              <FAQItem
                q="I can't log in / My account doesn't work"
                a="Check your internet connection and try again. If you sign in with Google, make sure you're using the same account you originally registered with. If you forgot your password, use the Forgot my password option. If the problem persists, email us at juanjogrimar@gmail.com with a screenshot of the error."
              />
              <FAQItem
                q="I lost my game progress"
                a="If you have an account, your progress is saved in it: just sign in with the same account. If you play as a guest, your progress is tied to this device; if you clear the app's data or switch devices, it is lost and we cannot recover it. To keep it, create an account from Settings."
              />
              <FAQItem
                q="The app freezes or crashes unexpectedly"
                a="Try closing and reopening the app. Make sure you have the latest version installed. If the problem continues, restart your device. If it persists, contact us with your device model and OS version."
              />
              <FAQItem
                q="Ads aren't loading or show inappropriate content"
                a="Ads are provided by Google AdMob. If you see inappropriate content, you can report it directly on the ad (info/triangle icon). If ads aren't loading, check your internet connection."
              />
              <FAQItem
                q="I didn't receive my purchase / GeoSpeed Pro"
                a="Purchases are processed through Google Play (app) or Mercado Pago (web). If you paid but don't see the benefits: 1) Wait a few minutes and restart the app. 2) Verify you're using the same account. 3) If the problem persists, send us your purchase receipt at juanjogrimar@gmail.com and we'll resolve it within 24 hours."
              />
              <FAQItem
                q="How do I delete my account and data?"
                a="In the game: Settings → Account → Delete account (deleted immediately). You can also use geospeed-challenge.vercel.app/delete-account, or email juanjogrimar@gmail.com from your account email: we delete it with all its data within 30 days at most."
              />
              <FAQItem
                q="A challenge or Live Room won't connect"
                a="Challenges and Live Rooms need a stable internet connection. Check your connection and make sure all players are on the latest version of the app. If you still have issues, try a different network (Wi-Fi or mobile data)."
              />
              <FAQItem
                q="How do I turn off notifications?"
                a="You can disable notifications from your device settings: Settings > Notifications > GeoSpeed Challenge."
              />
              <FAQItem
                q="How do I report an offensive name or a player?"
                a="Tap the flag next to their name and choose a reason. You can also email juanjogrimar@gmail.com with the player's name, the game mode and the screen where you saw it (a screenshot helps). We review every report and may change the name or block the account."
              />
            </div>

            <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Contact Us</h2>
            <p className="mb-6 text-[#d4d4c8] leading-relaxed">
              If you didn't find an answer in the FAQ, don't hesitate to contact us. We respond
              within <strong>48 hours</strong>.
            </p>

            <div className="mb-10 grid gap-4 sm:grid-cols-2">
              <a
                href="mailto:juanjogrimar@gmail.com?subject=Support%20GeoSpeed%20Challenge"
                className="flex flex-col items-center gap-3 rounded-xl border border-[#f5c842]/20 bg-[#07130a] p-6 text-center transition hover:border-[#f5c842]/50 hover:bg-[#f5c842]/5"
              >
                <span className="text-3xl">✉</span>
                <span className="font-semibold text-[#f5c842]">Email</span>
                <span className="text-sm text-[#d4d4c8]/70">juanjogrimar@gmail.com</span>
              </a>
              <div className="flex flex-col items-center gap-3 rounded-xl border border-[#f5c842]/20 bg-[#07130a] p-6 text-center">
                <span className="text-3xl">⏱</span>
                <span className="font-semibold text-[#f5c842]">Response Time</span>
                <span className="text-sm text-[#d4d4c8]/70">Up to 48 hours</span>
              </div>
            </div>

            <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">
              For a faster response, please include:
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
              <li>Your device and OS version (e.g., Samsung Galaxy A54, Android 14)</li>
              <li>App version (in your phone's app info)</li>
              <li>Detailed description of the problem</li>
              <li>Screenshots if possible</li>
              <li>If it's a payment issue, include your receipt or transaction ID</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-[#d4d4c8]/40">
          <Link to="/" className="hover:text-[#f5c842]">Inicio / Home</Link>
          <Link to="/privacy" className="hover:text-[#f5c842]">Privacidad / Privacy</Link>
          <Link to="/terms" className="hover:text-[#f5c842]">Términos / Terms</Link>
        </div>
      </div>
    </div>
  );
};

/** Créditos de las fotos de países (public/countries/credits.json). No renderiza nada si no hay fotos. */
function PhotoCredits({ title, intro }: { title: string; intro: string }) {
  const [credits, setCredits] = useState<PhotoCredit[]>([]);
  useEffect(() => { fetchPhotoCredits().then(setCredits); }, []);
  if (credits.length === 0) return null;
  return (
    <>
      <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">{title}</h2>
      <p className="mb-3 text-sm text-[#d4d4c8]/70">{intro}</p>
      <ul className="mb-10 grid gap-1 text-xs text-[#d4d4c8] sm:grid-cols-2">
        {credits.map(c => (
          <li key={c.iso}>
            <span className="font-mono text-[#f5c842]">{c.iso}</span>{c.country ? ` ${c.country}` : ''} · {c.author ?? '—'}
            {c.license && <> · {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{c.license}</a> : c.license}</>}
            {c.url && <> · <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">{c.source ?? 'Fuente'} ↗</a></>}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Créditos de las fotos de monumentos (public/landmarks/credits.json, Fase 6c). No renderiza nada si no hay fotos. */
function LandmarkPhotoCredits() {
  const [credits, setCredits] = useState<LandmarkCredit[]>([]);
  useEffect(() => { fetchLandmarkCredits().then(setCredits); }, []);
  if (credits.length === 0) return null;
  return (
    <>
      <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Créditos de las fotos de monumentos</h2>
      <p className="mb-3 text-sm text-[#d4d4c8]/70">Las fotografías de monumentos pertenecen a sus autores y se usan bajo las licencias indicadas (Wikimedia Commons). Fueron redimensionadas y convertidas a WebP; las que tienen licencia CC BY-SA se comparten bajo la misma licencia.</p>
      <ul className="mb-10 grid gap-1 text-xs text-[#d4d4c8] sm:grid-cols-2">
        {credits.map(c => (
          <li key={c.id}>
            <span className="text-[#f5c842]">{c.name}</span> · {c.author ?? '—'}
            {c.license && <> · {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{c.license}</a> : c.license}</>}
            {c.url && <> · <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">Fuente ↗</a></>}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Créditos de las fotos de ciudades (public/cities/credits.json). Los collages nombran a muchos autores: se recortan y
 *  queda el enlace a la página del archivo en Commons, que los lista todos. */
function CityPhotoCredits() {
  const [credits, setCredits] = useState<CityPhotoCredit[]>([]);
  useEffect(() => { fetchCityPhotoCredits().then(setCredits); }, []);
  if (credits.length === 0) return null;
  const short = (a: string | null) => (!a ? '—' : a.length > 90 ? `${a.slice(0, 88)}…` : a);
  return (
    <>
      <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Créditos de las fotos de ciudades</h2>
      <p className="mb-3 text-sm text-[#d4d4c8]/70">Las fotografías de ciudades pertenecen a sus autores y se usan bajo las licencias indicadas (Wikimedia Commons). Fueron redimensionadas y convertidas a WebP; las que tienen licencia CC BY-SA se comparten bajo la misma licencia.</p>
      <ul className="mb-10 grid gap-1 text-xs text-[#d4d4c8] sm:grid-cols-2">
        {credits.map(c => (
          <li key={c.id}>
            <span className="text-[#f5c842]">{c.name}</span> · {short(c.author)}
            {c.license && <> · {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{c.license}</a> : c.license}</>}
            {c.url && <> · <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">Fuente ↗</a></>}
          </li>
        ))}
      </ul>
    </>
  );
}

export default Support;
