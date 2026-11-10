import { Link } from "react-router-dom";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 mb-4 text-2xl font-bold text-[#f5c842]">{children}</h2>
);

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#07130a] text-[#e8e8dc]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[#f5c842]/30 px-4 py-2 text-sm text-[#f5c842] transition hover:bg-[#f5c842]/10"
          >
            &larr; GeoSpeed Challenge
          </Link>
          <a
            href="#english"
            className="text-sm text-[#f5c842]/60 underline hover:text-[#f5c842]"
          >
            English version &darr;
          </a>
        </div>

        <h1 className="mb-2 text-4xl font-extrabold text-[#f5c842]">
          Términos y Condiciones
        </h1>
        <p className="mb-2 text-sm text-[#d4d4c8]/60">
          Última actualización: 9 de noviembre de 2026
        </p>
        <p className="mb-8 text-sm text-[#d4d4c8]/60">
          Aplicación: GeoSpeed Challenge &middot; Desarrollador: JuanJo Grimar
        </p>

        <div className="rounded-xl border border-[#f5c842]/10 bg-[#0d1f12] p-8">
          {/* ── SPANISH VERSION ── */}

          <SectionTitle>1. Aceptación de los Términos</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Al descargar, instalar o utilizar GeoSpeed Challenge (&quot;la App&quot;),
            aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo
            con alguno de ellos, no debes usar la App. Nos reservamos el derecho de
            modificar estos términos en cualquier momento; la versión actualizada será
            publicada en esta página con la nueva fecha de actualización.
          </p>

          <SectionTitle>2. Descripción del Servicio</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            GeoSpeed Challenge es un juego de geografía interactivo disponible en la web
            (geospeed-challenge.vercel.app) y en Android. La App ofrece varios modos de
            juego, entre ellos Clásico, 60s de Caos, Desafío diario, Desafío Mundial, Sprint,
            Entrenamiento, retos con amigos, Sala en vivo y quizzes, además de packs
            regionales. El juego es gratuito, con compras opcionales dentro de la app y
            publicidad.
          </p>

          <SectionTitle>3. Cuenta de Usuario</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            No necesitas registrarte para jugar: como invitado, el juego crea una sesión
            anónima para guardar tu progreso. Algunas funciones, como Sprint o crear una Sala
            en vivo, requieren una cuenta registrada. Si creas una cuenta, eres responsable de
            mantener la confidencialidad de tus credenciales y no debes compartirla con
            terceros. GeoSpeed Challenge está dirigida a personas de 13 años o más. Puedes
            eliminar tu cuenta en cualquier momento desde Ajustes o en{" "}
            <Link to="/eliminar-cuenta" className="text-[#f5c842] underline">
              geospeed-challenge.vercel.app/eliminar-cuenta
            </Link>
            . Nos reservamos el derecho de suspender o eliminar cuentas que violen estos
            términos o que muestren actividad sospechosa.
          </p>

          <SectionTitle>4. Sistema de Vidas</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            La App utiliza un sistema de vidas: puedes tener un máximo de 5 y se recupera una
            cada 20 minutos. Varios modos consumen una vida por partida; otros, como
            Entrenamiento y los quizzes, no. Puedes obtener vidas adicionales viendo anuncios
            de video recompensados o mediante compras dentro de la app, y GeoSpeed Pro incluye
            vidas infinitas. Las vidas obtenidas por anuncios son gratuitas y no generan
            ninguna obligación de pago.
          </p>

          <SectionTitle>5. Compras Dentro de la App</SectionTitle>
          <p className="mb-4 text-[#d4d4c8] leading-relaxed">
            La App ofrece compras opcionales: GeoSpeed Pro (mensual, anual o de por vida: vidas
            infinitas, sin anuncios y packs exclusivos) y paquetes de vidas. El precio se
            muestra antes de confirmar la compra.
          </p>
          <p className="mb-4 text-[#d4d4c8] leading-relaxed">
            En la app de Android, las compras se procesan a través de Google Play. Las
            suscripciones mensual y anual de GeoSpeed Pro se renuevan automáticamente hasta que
            las canceles en Google Play.
          </p>
          <p className="mb-4 text-[#d4d4c8] leading-relaxed">
            En la web, las compras se procesan a través de Mercado Pago. Los precios se muestran
            en dólares (US$) y Mercado Pago cobra el equivalente en pesos colombianos (COP).
            Pro mensual dura 30 días y Pro anual 365 días desde el pago; son pagos únicos que no
            se renuevan.
          </p>
          <p className="text-[#d4d4c8] leading-relaxed">
            Todas las compras son finales, salvo lo dispuesto por las políticas de reembolso de
            Google Play o Mercado Pago y por la legislación aplicable. Si un pago se reembolsa o
            se anula, podemos retirar lo que se compró con él.
          </p>

          <SectionTitle>6. Publicidad</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            La versión gratuita de la app de Android muestra anuncios proporcionados por Google
            AdMob. Pueden ser anuncios intersticiales (entre partidas) o anuncios de video
            recompensados (opcionales, para obtener vidas). Puedes eliminar los anuncios
            adquiriendo GeoSpeed Pro.
          </p>

          <SectionTitle>7. Conducta del Usuario</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed mb-4">
            Al usar la App, te comprometes a no:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
            <li>Utilizar trampas, bots, scripts o herramientas automatizadas que alteren el juego.</li>
            <li>Manipular el sistema de puntuación, los rankings o los multiplicadores de forma fraudulenta.</li>
            <li>Intentar acceder a cuentas de otros usuarios o a sistemas no autorizados.</li>
            <li>Usar la App para cualquier propósito ilegal o no autorizado.</li>
            <li>Interferir con el funcionamiento normal de los servidores o la infraestructura.</li>
          </ul>

          <SectionTitle>8. Propiedad Intelectual</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Todo el contenido de la App, incluyendo pero no limitado a: código fuente, diseño,
            gráficos, logotipos, íconos, los catálogos de lugares, el sistema de puntuación y la
            marca &quot;GeoSpeed Challenge&quot;, es propiedad de JuanJo Grimar o se utiliza con
            la debida licencia. No se concede ninguna licencia para reproducir, distribuir o
            crear obras derivadas sin autorización expresa por escrito. Se exceptúan las fotos y
            los datos de terceros (Wikimedia Commons, Wikidata, Natural Earth y otros), que se
            rigen por sus propias licencias libres; sus créditos están en la página de{" "}
            <Link to="/support" className="text-[#f5c842] underline">
              Soporte
            </Link>
            .
          </p>

          <SectionTitle>9. Contenido Generado por Usuarios</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed mb-4">
            Algunas funciones te permiten crear contenido que otros jugadores pueden ver: tu
            nombre de jugador, los nombres de tus quizzes y tu apodo en una Sala en vivo. Eres
            responsable de ese contenido, y no puede incluir:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
            <li>Insultos, acoso, amenazas, discurso de odio o discriminación.</li>
            <li>Contenido sexual o violencia explícita.</li>
            <li>Contenido que promueva actividades ilegales.</li>
            <li>Suplantación de otra persona o datos personales de terceros.</li>
            <li>Spam, publicidad o enlaces.</li>
          </ul>
          <p className="mt-4 text-[#d4d4c8] leading-relaxed">
            Si ves contenido o a un jugador que incumpla estas reglas, usa el botón de reportar (la bandera junto a su nombre) o escríbenos a{" "}
            <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
              juanjogrimar@gmail.com
            </a>{" "}
            con el nombre y la pantalla donde lo viste. Podemos cambiar o eliminar ese contenido
            y suspender o bloquear la cuenta responsable sin previo aviso.
          </p>

          <SectionTitle>10. Disponibilidad del Servicio</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            No garantizamos que la App esté disponible de forma ininterrumpida o libre de errores.
            Podemos realizar mantenimiento, actualizaciones o modificaciones sin previo aviso.
            No somos responsables por pérdida de datos de juego, puntuaciones o progreso debido
            a problemas técnicos, actualizaciones o interrupciones del servicio.
          </p>

          <SectionTitle>11. Limitación de Responsabilidad</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            La App se proporciona &quot;tal como está&quot; (as is) sin garantías de ningún tipo,
            expresas o implícitas. En la máxima medida permitida por la ley aplicable, JuanJo
            Grimar no será responsable por daños directos, indirectos, incidentales, especiales
            o consecuentes derivados del uso o la imposibilidad de uso de la App.
          </p>

          <SectionTitle>12. Ley Aplicable</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Estos términos se rigen por las leyes de la República de Colombia. Cualquier
            controversia se someterá a los tribunales competentes de Colombia, sin perjuicio
            de los derechos que asistan al consumidor según la legislación de protección al
            consumidor de su país de residencia.
          </p>

          <SectionTitle>13. Terminación</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Podemos suspender o terminar tu acceso a la App en cualquier momento si violas
            estos términos. En caso de terminación, las secciones relativas a propiedad
            intelectual, limitación de responsabilidad y ley aplicable seguirán vigentes.
          </p>

          <SectionTitle>14. Contacto</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Si tienes preguntas sobre estos términos, contáctanos:
          </p>
          <ul className="mt-2 list-none space-y-1 text-[#d4d4c8]">
            <li><strong>Desarrollador:</strong> JuanJo Grimar</li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
                juanjogrimar@gmail.com
              </a>
            </li>
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
              Terms &amp; Conditions
            </h1>
            <p className="mb-2 text-sm text-[#d4d4c8]/60">
              Last updated: November 9, 2026
            </p>
            <p className="mb-8 text-sm text-[#d4d4c8]/60">
              App: GeoSpeed Challenge &middot; Developer: JuanJo Grimar
            </p>

            <SectionTitle>1. Acceptance of Terms</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              By downloading, installing, or using GeoSpeed Challenge (&quot;the App&quot;),
              you agree to these Terms and Conditions in full. If you do not agree with any
              of these terms, you must not use the App. We reserve the right to modify these
              terms at any time; the updated version will be posted on this page with a new
              update date.
            </p>

            <SectionTitle>2. Service Description</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              GeoSpeed Challenge is an interactive geography game available on the web
              (geospeed-challenge.vercel.app) and on Android. The App offers several game modes,
              including Classic, 60s of Chaos, Daily Challenge, World Challenge, Sprint, Training,
              challenges with friends, Live Room and quizzes, as well as regional packs. The game
              is free to play, with optional in-app purchases and advertising.
            </p>

            <SectionTitle>3. User Account</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              You do not need to register to play: as a guest, the game creates an anonymous
              session to save your progress. Some features, such as Sprint or hosting a Live Room,
              require a registered account. If you create an account, you are responsible for
              keeping your credentials confidential, and you must not share your account with
              third parties. GeoSpeed Challenge is intended for people aged 13 or older. You can
              delete your account at any time from Settings or at{" "}
              <Link to="/delete-account" className="text-[#f5c842] underline">
                geospeed-challenge.vercel.app/delete-account
              </Link>
              . We reserve the right to suspend or delete accounts that violate these terms or
              show suspicious activity.
            </p>

            <SectionTitle>4. Lives System</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              The App uses a lives system: you can hold up to 5 lives, and one is restored every
              20 minutes. Several modes use one life per game; others, such as Training and
              quizzes, do not. You can get extra lives by watching rewarded video ads or through
              in-app purchases, and GeoSpeed Pro includes unlimited lives. Lives obtained through
              ads are free and do not create any payment obligation.
            </p>

            <SectionTitle>5. In-App Purchases</SectionTitle>
            <p className="mb-4 text-[#d4d4c8] leading-relaxed">
              The App offers optional purchases: GeoSpeed Pro (monthly, yearly or lifetime:
              unlimited lives, no ads and exclusive packs) and life packs. The price is shown
              before you confirm the purchase.
            </p>
            <p className="mb-4 text-[#d4d4c8] leading-relaxed">
              In the Android app, purchases are processed through Google Play. The monthly and
              yearly GeoSpeed Pro subscriptions renew automatically until you cancel them in
              Google Play.
            </p>
            <p className="mb-4 text-[#d4d4c8] leading-relaxed">
              On the web, purchases are processed through Mercado Pago. Prices are shown in US
              dollars (US$) and Mercado Pago charges the equivalent in Colombian pesos (COP). Pro
              monthly lasts 30 days and Pro yearly 365 days from payment; they are one-time
              payments that do not renew.
            </p>
            <p className="text-[#d4d4c8] leading-relaxed">
              All purchases are final, except as provided by the refund policies of Google Play or
              Mercado Pago and by applicable law. If a payment is refunded or reversed, we may
              remove what was bought with it.
            </p>

            <SectionTitle>6. Advertising</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              The free version of the Android app displays ads provided by Google AdMob. They may
              be interstitial ads (between games) or rewarded video ads (optional, to obtain
              lives). You can remove ads by purchasing GeoSpeed Pro.
            </p>

            <SectionTitle>7. User Conduct</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed mb-4">
              When using the App, you agree not to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
              <li>Use cheats, bots, scripts, or automated tools that alter gameplay.</li>
              <li>Fraudulently manipulate the scoring system, rankings, or multipliers.</li>
              <li>Attempt to access other users' accounts or unauthorized systems.</li>
              <li>Use the App for any illegal or unauthorized purpose.</li>
              <li>Interfere with the normal operation of servers or infrastructure.</li>
            </ul>

            <SectionTitle>8. Intellectual Property</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              All content in the App, including but not limited to: source code, design,
              graphics, logos, icons, the place catalogs, the scoring system, and the
              &quot;GeoSpeed Challenge&quot; brand, is the property of JuanJo Grimar or is used
              under appropriate license. No license is granted to reproduce, distribute, or
              create derivative works without express written authorization. Third-party photos
              and data (Wikimedia Commons, Wikidata, Natural Earth and others) are excluded and
              governed by their own open licenses; their credits are on the{" "}
              <Link to="/support" className="text-[#f5c842] underline">
                Support
              </Link>{" "}
              page.
            </p>

            <SectionTitle>9. User-Generated Content</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed mb-4">
              Some features let you create content that other players can see: your player name,
              the names of your quizzes, and your nickname in a Live Room. You are responsible for
              that content, and it must not include:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
              <li>Insults, harassment, threats, hate speech, or discrimination.</li>
              <li>Sexual content or graphic violence.</li>
              <li>Content that promotes illegal activities.</li>
              <li>Impersonation of another person or other people's personal data.</li>
              <li>Spam, advertising, or links.</li>
            </ul>
            <p className="mt-4 text-[#d4d4c8] leading-relaxed">
              If you see content or a player breaking these rules, use the report button (the flag next to their name) or email{" "}
              <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
                juanjogrimar@gmail.com
              </a>{" "}
              with the name and the screen where you saw it. We may change or remove that content
              and suspend or block the responsible account without prior notice.
            </p>

            <SectionTitle>10. Service Availability</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              We do not guarantee that the App will be available on an uninterrupted or
              error-free basis. We may perform maintenance, updates, or modifications without
              prior notice. We are not responsible for loss of game data, scores, or progress
              due to technical issues, updates, or service interruptions.
            </p>

            <SectionTitle>11. Limitation of Liability</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              The App is provided &quot;as is&quot; without warranties of any kind, express or
              implied. To the maximum extent permitted by applicable law, JuanJo Grimar shall
              not be liable for any direct, indirect, incidental, special, or consequential
              damages arising from the use or inability to use the App.
            </p>

            <SectionTitle>12. Governing Law</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              These terms are governed by the laws of the Republic of Colombia. Any disputes
              shall be submitted to the competent courts of Colombia, without prejudice to the
              rights of the consumer under the consumer protection legislation of their country
              of residence.
            </p>

            <SectionTitle>13. Termination</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              We may suspend or terminate your access to the App at any time if you violate
              these terms. Upon termination, the sections relating to intellectual property,
              limitation of liability, and governing law shall remain in effect.
            </p>

            <SectionTitle>14. Contact</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              If you have questions about these terms, contact us:
            </p>
            <ul className="mt-2 list-none space-y-1 text-[#d4d4c8]">
              <li><strong>Developer:</strong> JuanJo Grimar</li>
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
                  juanjogrimar@gmail.com
                </a>
              </li>
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
          <Link to="/privacy" className="hover:text-[#f5c842]">Privacidad / Privacy</Link>
          <Link to="/support" className="hover:text-[#f5c842]">Soporte / Support</Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;
