import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-10 mb-4 text-2xl font-bold text-[#f5c842]">{children}</h2>
);

const SubSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mb-6">
    <h3 className="mb-2 text-lg font-semibold text-[#f5c842]/80">{title}</h3>
    <div className="text-[#d4d4c8] leading-relaxed">{children}</div>
  </div>
);

const Text = ({ children }: { children: ReactNode }) => (
  <p className="text-[#d4d4c8] leading-relaxed">{children}</p>
);

const External = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">
    {children}
  </a>
);

const Mail = () => (
  <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
    juanjogrimar@gmail.com
  </a>
);

/** Proveedores que reciben datos (sección 4). Si se agrega o se quita uno, actualizar también docs/GeoSpeed_Contenido_App_Play.md. */
const PROVIDERS = [
  { name: "Supabase", es: "Autenticación, base de datos y funciones del juego", en: "Authentication, database and game features", href: "https://supabase.com/privacy" },
  { name: "Google Analytics 4", es: "Analítica de uso", en: "Usage analytics", href: "https://policies.google.com/privacy" },
  { name: "Google AdMob", es: "Publicidad (app de Android)", en: "Advertising (Android app)", href: "https://policies.google.com/technologies/ads" },
  { name: "Google Play / RevenueCat", es: "Compras dentro de la app", en: "In-app purchases", href: "https://www.revenuecat.com/privacy" },
  { name: "Mercado Pago", es: "Pagos en la web", en: "Web payments", href: "https://www.mercadopago.com.co/privacidad" },
  { name: "Cloudflare Turnstile", es: "Protección contra cuentas automáticas", en: "Protection against automated accounts", href: "https://www.cloudflare.com/privacypolicy/" },
  { name: "Brevo", es: "Correos de la cuenta", en: "Account emails", href: "https://www.brevo.com/legal/privacypolicy/" },
  { name: "Vercel", es: "Alojamiento del sitio web", en: "Website hosting", href: "https://vercel.com/legal/privacy-policy" },
  { name: "Wikimedia Commons", es: "Fotos de las reseñas de lugares", en: "Photos in the place stories", href: "https://foundation.wikimedia.org/wiki/Policy:Privacy_policy" },
];

const ProviderTable = ({ lang }: { lang: "es" | "en" }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm text-[#d4d4c8]">
      <thead>
        <tr className="border-b border-[#f5c842]/20">
          <th className="py-2 pr-4 font-semibold text-[#f5c842]">{lang === "es" ? "Servicio" : "Service"}</th>
          <th className="py-2 pr-4 font-semibold text-[#f5c842]">{lang === "es" ? "Propósito" : "Purpose"}</th>
          <th className="py-2 font-semibold text-[#f5c842]">{lang === "es" ? "Política" : "Policy"}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#f5c842]/10">
        {PROVIDERS.map((p) => (
          <tr key={p.name}>
            <td className="py-2 pr-4">{p.name}</td>
            <td className="py-2 pr-4">{p[lang]}</td>
            <td className="py-2"><External href={p.href}>{lang === "es" ? "Ver" : "View"}</External></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Privacy = () => {
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
          Política de Privacidad
        </h1>
        <p className="mb-2 text-sm text-[#d4d4c8]/60">
          Última actualización: 9 de noviembre de 2026
        </p>
        <p className="mb-8 text-sm text-[#d4d4c8]/60">
          Aplicación: GeoSpeed Challenge &middot; Desarrollador: GeoSpeed Games (JuanJo Grimar)
        </p>

        <div className="rounded-xl border border-[#f5c842]/10 bg-[#0d1f12] p-8">
          {/* ── SPANISH VERSION ── */}

          <SectionTitle>1. Introducción</SectionTitle>
          <Text>
            GeoSpeed Challenge (&quot;la App&quot;) es un juego de geografía desarrollado por
            GeoSpeed Games (JuanJo Grimar; &quot;nosotros&quot;). Esta política explica qué datos
            recopilamos, para qué los usamos y con quién los compartimos cuando usas la App en
            dispositivos móviles o en la web (geospeed-challenge.vercel.app).
          </Text>

          <SectionTitle>2. Datos que Recopilamos</SectionTitle>

          <SubSection title="2.1 Sesión de invitado y cuenta">
            <p>
              Para guardar tus partidas sin pedirte un registro, la App crea una sesión de invitado
              con un identificador anónimo, sin correo ni nombre. Si creas una cuenta, recopilamos
              tu correo electrónico y tu contraseña (Supabase Auth la guarda cifrada; nosotros no
              podemos verla). Si entras con Google, Google nos comparte tu nombre, tu correo y tu
              foto de perfil: usamos el correo para identificar tu cuenta y tu nombre de pila como
              nombre de jugador (puedes cambiarlo en tu perfil); la foto no se muestra en el juego.
            </p>
          </SubSection>

          <SubSection title="2.2 Perfil de jugador">
            <p>
              Guardamos el nombre de jugador y el avatar que elijas, y tu país, que sugerimos a
              partir del idioma o la zona horaria de tu teléfono y puedes cambiar en tu perfil. Tu
              nombre de jugador, avatar, país, títulos y puntajes son visibles para otros jugadores
              en los rankings, los retos, las salas en vivo y los quizzes. Si eliges una foto propia
              como imagen de perfil, se guarda solo en tu dispositivo: no la recibimos y los demás
              jugadores no la ven.
            </p>
          </SubSection>

          <SubSection title="2.3 Datos de juego">
            <p>
              En tu dispositivo guardamos tu progreso y tus preferencias. En nuestros servidores,
              ligados a tu sesión de invitado o a tu cuenta, guardamos el resultado de cada partida
              y su detalle por ronda (el lugar, dónde tocaste el mapa, el tiempo y los puntos), tu
              racha, medallas y logros, los lugares que debes repasar, y los retos, quizzes, salas
              y grupos que crees o en los que participes.
            </p>
          </SubSection>

          <SubSection title="2.4 Datos de analítica">
            <p>
              Usamos Google Analytics 4 para medir el uso de la App: pantallas, eventos de juego,
              tipo de dispositivo, idioma y país aproximado. Estos datos se asocian a un
              identificador seudónimo del dispositivo, no a tu nombre ni a tu correo. Google
              Analytics puede usar cookies o identificadores similares.
            </p>
          </SubSection>

          <SubSection title="2.5 Datos de pago">
            <p>
              Las compras en la app de Android se hacen con Google Play y se gestionan con
              RevenueCat. Las compras en la web se procesan con Mercado Pago. Nosotros{" "}
              <em>no</em> recibimos ni guardamos números de tarjeta ni datos bancarios: conservamos
              el producto comprado, la fecha, el valor y el identificador del pago para entregarte
              lo que compraste.
            </p>
          </SubSection>

          <SubSection title="2.6 Datos de publicidad">
            <p>
              La versión gratuita de la app de Android muestra anuncios de{" "}
              <strong>Google AdMob</strong>. El SDK de AdMob recopila y comparte tu dirección IP
              (con la que se puede estimar tu ubicación general), tus interacciones con la App y
              con los anuncios, datos de diagnóstico e identificadores del dispositivo (ID de
              publicidad y App Set ID) para mostrar y medir anuncios y para prevenir fraudes. Los
              anuncios pueden ser personalizados. Puedes restablecer o borrar tu ID de publicidad
              en los ajustes de Android y gestionar tus preferencias en{" "}
              <External href="https://adssettings.google.com">adssettings.google.com</External>. En
              la Unión Europea y el Reino Unido te pedimos tu consentimiento antes y puedes
              cambiarlo en Ajustes → Privacidad de los anuncios. En la web no mostramos anuncios.
            </p>
          </SubSection>

          <SubSection title="2.7 Seguridad y correos">
            <p>
              Para evitar cuentas automáticas usamos Cloudflare Turnstile al crear una sesión de
              invitado y al entrar o registrarte: analiza señales del dispositivo y del navegador y
              tu dirección IP. Los correos de la cuenta (confirmación y recuperación de contraseña)
              se envían a través de Brevo, que recibe tu dirección de correo solo para ese fin.
            </p>
          </SubSection>

          <SubSection title="2.8 Fotos y recordatorios">
            <p>
              Algunas fotos de las reseñas de lugares se cargan directamente desde Wikimedia
              Commons, que recibe tu dirección IP como cualquier sitio web. Los recordatorios de la
              App se programan en tu propio teléfono.
            </p>
          </SubSection>

          <SectionTitle>3. Cookies y Almacenamiento Local</SectionTitle>
          <Text>
            Usamos el almacenamiento local del navegador o de la App para guardar tus preferencias,
            tu progreso y tu sesión. Los servicios de terceros (Google Analytics, Cloudflare) pueden
            usar sus propias cookies. No usamos cookies de rastreo propias.
          </Text>

          <SectionTitle>4. Servicios de Terceros</SectionTitle>
          <ProviderTable lang="es" />
          <p className="mt-3 text-[#d4d4c8] leading-relaxed">
            Estos proveedores pueden tratar los datos fuera de tu país.
          </p>

          <SectionTitle>5. Privacidad de Menores</SectionTitle>
          <Text>
            GeoSpeed Challenge está dirigida a personas de <strong>13 años o más</strong>. No
            recopilamos intencionalmente información personal de menores de 13 años. Si descubrimos
            que la hemos recopilado, la eliminaremos de inmediato. Si eres padre, madre o tutor y
            crees que tu hijo nos ha dado información personal, escríbenos a <Mail />.
          </Text>

          <SectionTitle>6. Retención de Datos</SectionTitle>
          <Text>
            Los datos locales permanecen en tu dispositivo hasta que los borres o desinstales la
            App. Los datos en nuestros servidores se conservan mientras tengas una cuenta o una
            sesión de invitado con partidas. Las sesiones de invitado sin partidas ni compras se
            eliminan automáticamente a los 30 días. Puedes eliminar tu cuenta y todos sus datos en
            cualquier momento desde el juego (Ajustes → Cuenta → Eliminar cuenta; como invitado,
            Borrar mis datos), en{" "}
            <a href="/eliminar-cuenta" className="text-[#f5c842] underline">geospeed-challenge.vercel.app/eliminar-cuenta</a>{" "}
            o escribiendo a <Mail />. Google, RevenueCat y Mercado Pago conservan los registros de
            pago que les exijan sus propias obligaciones legales.
          </Text>

          <SectionTitle>7. Tus Derechos</SectionTitle>
          <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
            <li>Acceder a los datos personales que tenemos sobre ti.</li>
            <li>Solicitar la corrección o eliminación de tus datos.</li>
            <li>Solicitar la eliminación completa de tu cuenta.</li>
            <li>Retirar tu consentimiento para el tratamiento de datos en cualquier momento.</li>
            <li>Presentar una queja ante la autoridad de protección de datos de tu país.</li>
          </ul>
          <p className="mt-3 text-[#d4d4c8] leading-relaxed">
            Para ejercer cualquiera de estos derechos, escríbenos a <Mail />.
          </p>

          <SectionTitle>8. Seguridad</SectionTitle>
          <Text>
            Aplicamos medidas de seguridad razonables para proteger tu información, incluido el
            cifrado en tránsito (HTTPS/TLS) y el acceso restringido a la base de datos. Sin embargo,
            ningún método de transmisión por Internet es 100% seguro.
          </Text>

          <SectionTitle>9. Venta de Datos</SectionTitle>
          <Text>
            <strong>No vendemos tu información personal.</strong> Solo la compartimos con los
            proveedores de la sección 4 para prestar el servicio. En el caso de la publicidad,
            Google AdMob y sus socios reciben los datos descritos en la sección 2.6.
          </Text>

          <SectionTitle>10. Cambios a esta Política</SectionTitle>
          <Text>
            Podemos actualizar esta política periódicamente. Cualquier cambio se publicará en esta
            página con una nueva fecha de actualización.
          </Text>

          <SectionTitle>11. Contacto</SectionTitle>
          <Text>Si tienes preguntas sobre esta política de privacidad, escríbenos:</Text>
          <ul className="mt-2 list-none space-y-1 text-[#d4d4c8]">
            <li><strong>Desarrollador:</strong> GeoSpeed Games (JuanJo Grimar)</li>
            <li><strong>Correo:</strong> <Mail /></li>
            <li><strong>Ubicación:</strong> Colombia</li>
            <li>
              <strong>Soporte:</strong>{" "}
              <Link to="/support" className="text-[#f5c842] underline">
                geospeed-challenge.vercel.app/support
              </Link>
            </li>
          </ul>

          {/* ────────── ENGLISH VERSION ────────── */}
          <div id="english" className="mt-16 border-t border-[#f5c842]/20 pt-10">
            <h1 className="mb-2 text-4xl font-extrabold text-[#f5c842]">
              Privacy Policy
            </h1>
            <p className="mb-2 text-sm text-[#d4d4c8]/60">
              Last updated: November 9, 2026
            </p>
            <p className="mb-8 text-sm text-[#d4d4c8]/60">
              App: GeoSpeed Challenge &middot; Developer: GeoSpeed Games (JuanJo Grimar)
            </p>

            <SectionTitle>1. Introduction</SectionTitle>
            <Text>
              GeoSpeed Challenge (&quot;the App&quot;) is a geography game developed by GeoSpeed
              Games (JuanJo Grimar; &quot;we&quot;). This policy explains what data we collect, how
              we use it and who we share it with when you use the App on mobile devices or on the
              web (geospeed-challenge.vercel.app).
            </Text>

            <SectionTitle>2. Data We Collect</SectionTitle>

            <SubSection title="2.1 Guest session and account">
              <p>
                To save your games without asking you to register, the App creates a guest session
                with an anonymous identifier, with no email or name. If you create an account, we
                collect your email address and password (Supabase Auth stores it encrypted; we
                cannot see it). If you sign in with Google, Google shares your name, email address
                and profile picture with us: we use the email to identify your account and your
                first name as your player name (you can change it in your profile); the picture is
                not shown in the game.
              </p>
            </SubSection>

            <SubSection title="2.2 Player profile">
              <p>
                We store the player name and avatar you choose, and your country, which we suggest
                from your phone&apos;s language or time zone and you can change in your profile.
                Your player name, avatar, country, titles and scores are visible to other players
                in rankings, challenges, live rooms and quizzes. If you choose your own photo as your
                profile picture, it is stored only on your device: we do not receive it and other
                players cannot see it.
              </p>
            </SubSection>

            <SubSection title="2.3 Game data">
              <p>
                On your device we store your progress and preferences. On our servers, linked to
                your guest session or account, we store the result of each game and its per-round
                detail (the place, where you tapped the map, the time and the points), your streak,
                medals and achievements, the places you should review, and the challenges, quizzes,
                rooms and groups you create or join.
              </p>
            </SubSection>

            <SubSection title="2.4 Analytics data">
              <p>
                We use Google Analytics 4 to measure how the App is used: screens, game events,
                device type, language and approximate country. This data is linked to a pseudonymous
                device identifier, not to your name or email. Google Analytics may use cookies or
                similar identifiers.
              </p>
            </SubSection>

            <SubSection title="2.5 Payment data">
              <p>
                Purchases in the Android app are made through Google Play and managed with
                RevenueCat. Web purchases are processed by Mercado Pago. We do <em>not</em> receive
                or store card numbers or banking data: we keep the product purchased, the date, the
                amount and the payment identifier so we can deliver what you bought.
              </p>
            </SubSection>

            <SubSection title="2.6 Advertising data">
              <p>
                The free version of the Android app shows ads from <strong>Google AdMob</strong>.
                The AdMob SDK collects and shares your IP address (which can be used to estimate
                your general location), your interactions with the App and with ads, diagnostic
                data and device identifiers (advertising ID and App Set ID) to serve and measure ads
                and to prevent fraud. Ads may be personalized. You can reset or delete your
                advertising ID in Android settings and manage your preferences at{" "}
                <External href="https://adssettings.google.com">adssettings.google.com</External>.
                In the European Union and the United Kingdom we ask for your consent first, and you
                can change it in Settings → Ad privacy. We do not show ads on the web.
              </p>
            </SubSection>

            <SubSection title="2.7 Security and emails">
              <p>
                To prevent automated accounts we use Cloudflare Turnstile when creating a guest
                session and when you sign in or register: it analyzes device and browser signals and
                your IP address. Account emails (confirmation and password recovery) are sent
                through Brevo, which receives your email address only for that purpose.
              </p>
            </SubSection>

            <SubSection title="2.8 Photos and reminders">
              <p>
                Some photos in the place stories are loaded directly from Wikimedia Commons, which
                receives your IP address like any website. The App&apos;s reminders are scheduled on
                your own phone.
              </p>
            </SubSection>

            <SectionTitle>3. Cookies &amp; Local Storage</SectionTitle>
            <Text>
              We use the browser&apos;s or the App&apos;s local storage to keep your preferences,
              progress and session. Third-party services (Google Analytics, Cloudflare) may use
              their own cookies. We do not use first-party tracking cookies.
            </Text>

            <SectionTitle>4. Third-Party Services</SectionTitle>
            <ProviderTable lang="en" />
            <p className="mt-3 text-[#d4d4c8] leading-relaxed">
              These providers may process data outside your country.
            </p>

            <SectionTitle>5. Children&apos;s Privacy</SectionTitle>
            <Text>
              GeoSpeed Challenge is intended for people aged <strong>13 or older</strong>. We do not
              knowingly collect personal information from children under 13. If we discover that we
              have, we will delete it immediately. If you are a parent or guardian and believe your
              child has given us personal information, contact us at <Mail />.
            </Text>

            <SectionTitle>6. Data Retention</SectionTitle>
            <Text>
              Local data remains on your device until you clear it or uninstall the App. Data on our
              servers is kept as long as you have an account or a guest session with games. Guest
              sessions with no games or purchases are deleted automatically after 30 days. You can
              delete your account and all its data at any time from the game (Settings → Account →
              Delete account; as a guest, Delete my data), at{" "}
              <a href="/delete-account" className="text-[#f5c842] underline">geospeed-challenge.vercel.app/delete-account</a>{" "}
              or by writing to <Mail />. Google, RevenueCat and Mercado Pago keep the payment
              records required by their own legal obligations.
            </Text>

            <SectionTitle>7. Your Rights</SectionTitle>
            <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Request complete deletion of your account.</li>
              <li>Withdraw your consent for data processing at any time.</li>
              <li>File a complaint with your country&apos;s data protection authority.</li>
            </ul>
            <p className="mt-3 text-[#d4d4c8] leading-relaxed">
              To exercise any of these rights, email us at <Mail />.
            </p>

            <SectionTitle>8. Security</SectionTitle>
            <Text>
              We apply reasonable security measures to protect your information, including
              encryption in transit (HTTPS/TLS) and restricted database access. However, no method
              of transmission over the Internet is 100% secure.
            </Text>

            <SectionTitle>9. Data Sales</SectionTitle>
            <Text>
              <strong>We do not sell your personal information.</strong> We only share it with the
              providers in section 4 to deliver the service. For advertising, Google AdMob and its
              partners receive the data described in section 2.6.
            </Text>

            <SectionTitle>10. Changes to This Policy</SectionTitle>
            <Text>
              We may update this policy periodically. Any changes will be posted on this page with
              a new update date.
            </Text>

            <SectionTitle>11. Contact</SectionTitle>
            <Text>If you have questions about this privacy policy, contact us:</Text>
            <ul className="mt-2 list-none space-y-1 text-[#d4d4c8]">
              <li><strong>Developer:</strong> GeoSpeed Games (JuanJo Grimar)</li>
              <li><strong>Email:</strong> <Mail /></li>
              <li><strong>Location:</strong> Colombia</li>
              <li>
                <strong>Support:</strong>{" "}
                <Link to="/support" className="text-[#f5c842] underline">
                  geospeed-challenge.vercel.app/support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-[#d4d4c8]/40">
          <Link to="/" className="hover:text-[#f5c842]">Inicio / Home</Link>
          <Link to="/terms" className="hover:text-[#f5c842]">Terminos / Terms</Link>
          <Link to="/support" className="hover:text-[#f5c842]">Soporte / Support</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
