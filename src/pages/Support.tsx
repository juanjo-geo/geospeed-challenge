import { useState } from "react";
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
            ← GeoSpeed IQ Challenge
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
          GeoSpeed IQ Challenge &middot; Desarrollado por JuanJo Grimar
        </p>

        <div className="rounded-xl border border-[#f5c842]/10 bg-[#0d1f12] p-8">
          {/* ── SPANISH ── */}

          <h2 className="mb-6 text-2xl font-bold text-[#f5c842]">
            Preguntas Frecuentes
          </h2>

          <div className="mb-10">
            <FAQItem
              q="No puedo iniciar sesion / Mi cuenta no funciona"
              a="Verifica tu conexion a internet e intenta de nuevo. Si usas inicio de sesion con Google o Apple, asegurate de usar la misma cuenta con la que te registraste. Si el problema persiste, escribenos a juanjogrimar@gmail.com con una captura de pantalla del error."
            />
            <FAQItem
              q="He perdido mi progreso de juego"
              a="El progreso se guarda localmente en tu dispositivo. Si borraste los datos de la app o cambiaste de dispositivo, el progreso local se pierde. Si tenias una cuenta creada, tu progreso en la nube se mantiene — solo inicia sesion con la misma cuenta. Si no tenias cuenta, lamentablemente no podemos recuperar datos locales."
            />
            <FAQItem
              q="La aplicacion se congela o se cierra inesperadamente"
              a="Intenta cerrar y volver a abrir la app. Asegurate de tener la ultima version instalada. Si el problema continua, reinicia tu dispositivo. Si persiste, contactanos indicando tu modelo de dispositivo y version del sistema operativo."
            />
            <FAQItem
              q="Los anuncios no se cargan o muestran contenido inapropiado"
              a="Los anuncios son proporcionados por Google AdMob/AdSense. Si ves contenido inapropiado, puedes reportarlo directamente en el anuncio (icono de info/triangulo). Si los anuncios no cargan, verifica tu conexion a internet."
            />
            <FAQItem
              q="No recibi mi compra / suscripcion premium"
              a="Las compras se procesan a traves de RevenueCat (movil) o Stripe (web). Si pagaste pero no recibes los beneficios: 1) Espera unos minutos y reinicia la app. 2) Verifica que estas usando la misma cuenta. 3) Si el problema persiste, envianos tu recibo de compra a juanjogrimar@gmail.com y lo resolveremos en menos de 24 horas."
            />
            <FAQItem
              q="Como elimino mi cuenta y mis datos?"
              a="Envianos un correo a juanjogrimar@gmail.com desde el email asociado a tu cuenta solicitando la eliminacion. Eliminaremos tu cuenta y todos los datos asociados en un plazo de 30 dias."
            />
            <FAQItem
              q="El modo multijugador no conecta"
              a="El modo multijugador requiere una conexion a internet estable. Verifica tu conexion y que ambos jugadores esten en la ultima version de la app. Si sigues teniendo problemas, intenta en una red diferente (WiFi vs datos moviles)."
            />
            <FAQItem
              q="Como desactivo las notificaciones?"
              a="Puedes desactivar las notificaciones desde la configuracion de tu dispositivo: Ajustes > Notificaciones > GeoSpeed IQ Challenge."
            />
          </div>

          {/* Contact section */}
          <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Contactanos</h2>
          <p className="mb-6 text-[#d4d4c8] leading-relaxed">
            Si no encontraste respuesta a tu problema en las preguntas frecuentes, no dudes en
            contactarnos. Respondemos en un plazo maximo de <strong>48 horas</strong>.
          </p>

          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <a
              href="mailto:juanjogrimar@gmail.com?subject=Soporte%20GeoSpeed%20IQ%20Challenge"
              className="flex flex-col items-center gap-3 rounded-xl border border-[#f5c842]/20 bg-[#07130a] p-6 text-center transition hover:border-[#f5c842]/50 hover:bg-[#f5c842]/5"
            >
              <span className="text-3xl">✉</span>
              <span className="font-semibold text-[#f5c842]">Email</span>
              <span className="text-sm text-[#d4d4c8]/70">juanjogrimar@gmail.com</span>
            </a>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#f5c842]/20 bg-[#07130a] p-6 text-center">
              <span className="text-3xl">⏱</span>
              <span className="font-semibold text-[#f5c842]">Tiempo de respuesta</span>
              <span className="text-sm text-[#d4d4c8]/70">Maximo 48 horas</span>
            </div>
          </div>

          {/* Tips for contacting */}
          <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">
            Para una respuesta mas rapida, incluye:
          </h2>
          <ul className="mb-10 list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
            <li>Tu dispositivo y version del sistema operativo (ej: iPhone 15, iOS 18.2)</li>
            <li>Version de la app (visible en la pantalla de configuracion)</li>
            <li>Descripcion detallada del problema</li>
            <li>Capturas de pantalla si es posible</li>
            <li>Si es un problema de pago, incluye tu recibo o ID de transaccion</li>
          </ul>

          {/* ────────── ENGLISH VERSION ────────── */}
          <div id="english" className="border-t border-[#f5c842]/20 pt-10">
            <h1 className="mb-2 text-4xl font-extrabold text-[#f5c842]">
              Support Center
            </h1>
            <p className="mb-8 text-[#d4d4c8]/60">
              GeoSpeed IQ Challenge &middot; Developed by JuanJo Grimar
            </p>

            <h2 className="mb-6 text-2xl font-bold text-[#f5c842]">
              Frequently Asked Questions
            </h2>

            <div className="mb-10">
              <FAQItem
                q="I can't log in / My account doesn't work"
                a="Check your internet connection and try again. If you're using Google or Apple sign-in, make sure you're using the same account you originally registered with. If the problem persists, email us at juanjogrimar@gmail.com with a screenshot of the error."
              />
              <FAQItem
                q="I lost my game progress"
                a="Progress is saved locally on your device. If you cleared the app's data or switched devices, local progress is lost. If you had an account, your cloud progress is preserved — just sign in with the same account. If you didn't have an account, unfortunately we cannot recover local data."
              />
              <FAQItem
                q="The app freezes or crashes unexpectedly"
                a="Try closing and reopening the app. Make sure you have the latest version installed. If the problem continues, restart your device. If it persists, contact us with your device model and OS version."
              />
              <FAQItem
                q="Ads aren't loading or show inappropriate content"
                a="Ads are provided by Google AdMob/AdSense. If you see inappropriate content, you can report it directly on the ad (info/triangle icon). If ads aren't loading, check your internet connection."
              />
              <FAQItem
                q="I didn't receive my purchase / premium subscription"
                a="Purchases are processed through RevenueCat (mobile) or Stripe (web). If you paid but don't see the benefits: 1) Wait a few minutes and restart the app. 2) Verify you're using the same account. 3) If the problem persists, send us your purchase receipt at juanjogrimar@gmail.com and we'll resolve it within 24 hours."
              />
              <FAQItem
                q="How do I delete my account and data?"
                a="Send us an email at juanjogrimar@gmail.com from the email address associated with your account requesting deletion. We will delete your account and all associated data within 30 days."
              />
              <FAQItem
                q="Multiplayer mode won't connect"
                a="Multiplayer mode requires a stable internet connection. Check your connection and make sure both players are on the latest version of the app. If you still have issues, try a different network (WiFi vs mobile data)."
              />
              <FAQItem
                q="How do I turn off notifications?"
                a="You can disable notifications from your device settings: Settings > Notifications > GeoSpeed IQ Challenge."
              />
            </div>

            <h2 className="mb-4 text-2xl font-bold text-[#f5c842]">Contact Us</h2>
            <p className="mb-6 text-[#d4d4c8] leading-relaxed">
              If you didn't find an answer in the FAQ, don't hesitate to contact us. We respond
              within <strong>48 hours</strong>.
            </p>

            <div className="mb-10 grid gap-4 sm:grid-cols-2">
              <a
                href="mailto:juanjogrimar@gmail.com?subject=Support%20GeoSpeed%20IQ%20Challenge"
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
              <li>Your device and OS version (e.g., iPhone 15, iOS 18.2)</li>
              <li>App version (visible in the settings screen)</li>
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
        </div>
      </div>
    </div>
  );
};

export default Support;
