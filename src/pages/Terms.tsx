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
            &larr; GeoSpeed IQ Challenge
          </Link>
          <a
            href="#english"
            className="text-sm text-[#f5c842]/60 underline hover:text-[#f5c842]"
          >
            English version &darr;
          </a>
        </div>

        <h1 className="mb-2 text-4xl font-extrabold text-[#f5c842]">
          Terminos y Condiciones
        </h1>
        <p className="mb-2 text-sm text-[#d4d4c8]/60">
          Ultima actualizacion: 18 de mayo de 2026
        </p>
        <p className="mb-8 text-sm text-[#d4d4c8]/60">
          Aplicacion: GeoSpeed IQ Challenge &middot; Desarrollador: JuanJo Grimar
        </p>

        <div className="rounded-xl border border-[#f5c842]/10 bg-[#0d1f12] p-8">
          {/* ── SPANISH VERSION ── */}

          <SectionTitle>1. Aceptacion de los Terminos</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Al descargar, instalar o utilizar GeoSpeed IQ Challenge (&quot;la App&quot;),
            aceptas estos Terminos y Condiciones en su totalidad. Si no estas de acuerdo
            con alguno de estos terminos, no debes usar la App. Nos reservamos el derecho
            de modificar estos terminos en cualquier momento; la version actualizada sera
            publicada en esta pagina con la nueva fecha de actualizacion.
          </p>

          <SectionTitle>2. Descripcion del Servicio</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            GeoSpeed IQ Challenge es un juego de geografia interactivo disponible en web
            (geospeed-challenge.vercel.app), iOS y Android. La App ofrece multiples modos
            de juego, incluyendo modo clasico, contrarreloj, duelos 1v1, desafio diario y
            modos regionales. El juego es gratuito con opciones de compra dentro de la app
            y publicidad.
          </p>

          <SectionTitle>3. Cuenta de Usuario</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            El registro no es obligatorio para jugar. Si creas una cuenta, eres responsable
            de mantener la confidencialidad de tus credenciales. No debes compartir tu cuenta
            con terceros. Nos reservamos el derecho de suspender o eliminar cuentas que violen
            estos terminos o que muestren actividad sospechosa.
          </p>

          <SectionTitle>4. Sistema de Vidas y Energia</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            La App utiliza un sistema de vidas (maximo 5) que se regeneran pasivamente una
            cada 20 minutos. Cada partida consume una vida. Los usuarios pueden obtener vidas
            adicionales viendo anuncios de video recompensados (rewarded ads) o mediante
            compras dentro de la app. Las vidas obtenidas por anuncios son gratuitas y no
            generan ninguna obligacion de pago.
          </p>

          <SectionTitle>5. Compras Dentro de la App</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            La App ofrece compras opcionales incluyendo: eliminacion de anuncios (GeoSpeed Pro),
            paquetes de vidas, y contenido cosmetico (Battle Pass). Los precios se muestran en
            la moneda local del usuario antes de confirmar la compra. Las compras en dispositivos
            moviles se procesan a traves de Apple App Store o Google Play Store segun la
            plataforma. Las compras en la web se procesan a traves de Stripe. Todas las compras
            son finales, salvo lo dispuesto por las politicas de reembolso de Apple, Google o
            la legislacion aplicable.
          </p>

          <SectionTitle>6. Publicidad</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            La version gratuita de la App muestra anuncios proporcionados por Google AdMob
            (movil) y Google AdSense (web). Los anuncios pueden incluir anuncios intersticiales
            (entre partidas) y anuncios de video recompensados (opcionales, para obtener vidas).
            Puedes eliminar los anuncios adquiriendo GeoSpeed Pro.
          </p>

          <SectionTitle>7. Conducta del Usuario</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed mb-4">
            Al usar la App, te comprometes a no:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
            <li>Utilizar trampas, bots, scripts o herramientas automatizadas que alteren el juego.</li>
            <li>Manipular el sistema de puntuacion, ranking o multiplicadores de forma fraudulenta.</li>
            <li>Intentar acceder a cuentas de otros usuarios o a sistemas no autorizados.</li>
            <li>Usar la App para cualquier proposito ilegal o no autorizado.</li>
            <li>Interferir con el funcionamiento normal de los servidores o la infraestructura.</li>
          </ul>

          <SectionTitle>8. Propiedad Intelectual</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Todo el contenido de la App, incluyendo pero no limitado a: codigo fuente, diseno,
            graficos, logotipos, iconos, la base de datos de ciudades, el sistema de puntuacion
            y la marca &quot;GeoSpeed IQ Challenge&quot;, es propiedad de JuanJo Grimar o se
            utiliza con la debida licencia. No se concede ninguna licencia para reproducir,
            distribuir o crear obras derivadas sin autorizacion expresa por escrito.
          </p>

          <SectionTitle>9. Contenido Generado por Usuarios</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Si la App permite a los usuarios compartir puntuaciones, iniciales en rankings o
            codigos de sala para duelos, el usuario garantiza que dicho contenido no es ofensivo,
            difamatorio ni ilegal. Nos reservamos el derecho de eliminar contenido inapropiado
            sin previo aviso.
          </p>

          <SectionTitle>10. Disponibilidad del Servicio</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            No garantizamos que la App este disponible de forma ininterrumpida o libre de errores.
            Podemos realizar mantenimiento, actualizaciones o modificaciones sin previo aviso.
            No somos responsables por perdida de datos de juego, puntuaciones o progreso debido
            a problemas tecnicos, actualizaciones o interrupciones del servicio.
          </p>

          <SectionTitle>11. Limitacion de Responsabilidad</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            La App se proporciona &quot;tal como esta&quot; (as is) sin garantias de ningun tipo,
            expresas o implicitas. En la maxima medida permitida por la ley aplicable, JuanJo
            Grimar no sera responsable por danos directos, indirectos, incidentales, especiales
            o consecuentes derivados del uso o la imposibilidad de uso de la App.
          </p>

          <SectionTitle>12. Ley Aplicable</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Estos terminos se rigen por las leyes de la Republica de Colombia. Cualquier
            controversia se sometera a los tribunales competentes de Colombia, sin perjuicio
            de los derechos que asistan al consumidor segun la legislacion de proteccion al
            consumidor de su pais de residencia.
          </p>

          <SectionTitle>13. Terminacion</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Podemos suspender o terminar tu acceso a la App en cualquier momento si violas
            estos terminos. En caso de terminacion, las secciones relativas a propiedad
            intelectual, limitacion de responsabilidad y ley aplicable seguiran vigentes.
          </p>

          <SectionTitle>14. Contacto</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Si tienes preguntas sobre estos terminos, contactanos:
          </p>
          <ul className="mt-2 list-none space-y-1 text-[#d4d4c8]">
            <li><strong>Desarrollador:</strong> JuanJo Grimar</li>
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
                juanjogrimar@gmail.com
              </a>
            </li>
            <li><strong>Ubicacion:</strong> Colombia</li>
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
              Last updated: May 18, 2026
            </p>
            <p className="mb-8 text-sm text-[#d4d4c8]/60">
              App: GeoSpeed IQ Challenge &middot; Developer: JuanJo Grimar
            </p>

            <SectionTitle>1. Acceptance of Terms</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              By downloading, installing, or using GeoSpeed IQ Challenge (&quot;the App&quot;),
              you agree to these Terms and Conditions in full. If you do not agree with any
              of these terms, you must not use the App. We reserve the right to modify these
              terms at any time; the updated version will be posted on this page with a new
              update date.
            </p>

            <SectionTitle>2. Service Description</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              GeoSpeed IQ Challenge is an interactive geography game available on the web
              (geospeed-challenge.vercel.app), iOS, and Android. The App offers multiple game
              modes including classic, time attack, 1v1 duels, daily challenge, and regional
              modes. The game is free to play with optional in-app purchases and advertising.
            </p>

            <SectionTitle>3. User Account</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              Registration is not required to play. If you create an account, you are
              responsible for maintaining the confidentiality of your credentials. You must
              not share your account with third parties. We reserve the right to suspend or
              delete accounts that violate these terms or show suspicious activity.
            </p>

            <SectionTitle>4. Lives and Energy System</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              The App uses a lives system (maximum 5) that passively regenerate one every
              20 minutes. Each game session consumes one life. Users can obtain additional
              lives by watching rewarded video ads or through in-app purchases. Lives obtained
              through ads are free and do not create any payment obligation.
            </p>

            <SectionTitle>5. In-App Purchases</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              The App offers optional purchases including: ad removal (GeoSpeed Pro), life
              packs, and cosmetic content (Battle Pass). Prices are displayed in the user's
              local currency before confirming the purchase. Mobile purchases are processed
              through Apple App Store or Google Play Store depending on the platform. Web
              purchases are processed through Stripe. All purchases are final, except as
              provided by Apple's, Google's refund policies, or applicable law.
            </p>

            <SectionTitle>6. Advertising</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              The free version of the App displays ads provided by Google AdMob (mobile) and
              Google AdSense (web). Ads may include interstitial ads (between games) and
              rewarded video ads (optional, to obtain lives). You can remove ads by purchasing
              GeoSpeed Pro.
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
              graphics, logos, icons, the city database, the scoring system, and the
              &quot;GeoSpeed IQ Challenge&quot; brand, is the property of JuanJo Grimar or
              is used under appropriate license. No license is granted to reproduce,
              distribute, or create derivative works without express written authorization.
            </p>

            <SectionTitle>9. User-Generated Content</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              If the App allows users to share scores, initials in rankings, or room codes
              for duels, the user warrants that such content is not offensive, defamatory, or
              illegal. We reserve the right to remove inappropriate content without prior
              notice.
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
