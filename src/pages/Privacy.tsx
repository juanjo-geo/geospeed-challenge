import { Link } from "react-router-dom";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-10 mb-4 text-2xl font-bold text-[#f5c842]">{children}</h2>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="mb-2 text-lg font-semibold text-[#f5c842]/80">{title}</h3>
    <div className="text-[#d4d4c8] leading-relaxed">{children}</div>
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
          Politica de Privacidad
        </h1>
        <p className="mb-2 text-sm text-[#d4d4c8]/60">
          Ultima actualizacion: 17 de mayo de 2026
        </p>
        <p className="mb-8 text-sm text-[#d4d4c8]/60">
          Aplicacion: GeoSpeed IQ Challenge &middot; Desarrollador: JuanJo Grimar
        </p>

        <div className="rounded-xl border border-[#f5c842]/10 bg-[#0d1f12] p-8">
          {/* ── SPANISH VERSION ── */}

          <SectionTitle>1. Introduccion</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            GeoSpeed IQ Challenge (&quot;la App&quot;) es un juego de geografia desarrollado por
            JuanJo Grimar (&quot;nosotros&quot;, &quot;nos&quot;). Esta politica de privacidad describe
            como recopilamos, usamos y protegemos tu informacion cuando usas nuestra aplicacion
            en dispositivos moviles (iOS/Android) y en la web (geospeed-challenge.vercel.app).
          </p>

          <SectionTitle>2. Datos que Recopilamos</SectionTitle>

          <SubSection title="2.1 Datos de cuenta (opcional)">
            <p>
              Si decides crear una cuenta a traves de Supabase Auth, recopilamos tu direccion
              de correo electronico y/o los datos basicos de tu perfil de proveedor social
              (Google, Apple). Esto es necesario para guardar tu progreso entre dispositivos
              y participar en el modo multijugador.
            </p>
          </SubSection>

          <SubSection title="2.2 Datos de juego">
            <p>
              Almacenamos localmente en tu dispositivo (localStorage/AsyncStorage): progreso del
              juego, configuracion de preferencias, grupo de pruebas A/B, y puntuaciones. Si
              tienes una cuenta, estos datos tambien se sincronizan con nuestra base de datos
              en Supabase.
            </p>
          </SubSection>

          <SubSection title="2.3 Datos de analitica">
            <p>
              Utilizamos Google Analytics 4 (GA4) para recopilar datos anonimizados de uso, como
              paginas visitadas, eventos de juego, tipo de dispositivo y pais. Estos datos nos
              ayudan a mejorar la experiencia del juego. GA4 puede utilizar cookies o
              identificadores de dispositivo.
            </p>
          </SubSection>

          <SubSection title="2.4 Datos de pago">
            <p>
              Los pagos se procesan a traves de terceros seguros:{" "}
              <strong>RevenueCat</strong> (para compras dentro de la app en iOS y Android) y{" "}
              <strong>Stripe</strong> (para pagos en la web). Nosotros <em>no</em> almacenamos
              numeros de tarjeta de credito ni datos bancarios. Consulta las politicas de
              privacidad de{" "}
              <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">
                RevenueCat
              </a>{" "}
              y{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">
                Stripe
              </a>{" "}
              para mas informacion.
            </p>
          </SubSection>

          <SubSection title="2.5 Datos de publicidad">
            <p>
              La App muestra anuncios a traves de <strong>Google AdSense</strong> (web) y{" "}
              <strong>Google AdMob</strong> (movil). Estos servicios pueden recopilar
              identificadores de publicidad, datos del dispositivo y cookies para mostrar
              anuncios personalizados. Puedes gestionar tus preferencias de anuncios en la
              configuracion de tu dispositivo o en{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">
                adssettings.google.com
              </a>.
            </p>
          </SubSection>

          <SectionTitle>3. Cookies y Almacenamiento Local</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Usamos <strong>localStorage</strong> del navegador para almacenar preferencias de
            juego y progreso. Los servicios de terceros (GA4, AdSense, Supabase) pueden
            establecer cookies propias. No usamos cookies de rastreo propias adicionales.
          </p>

          <SectionTitle>4. Servicios de Terceros</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#d4d4c8]">
              <thead>
                <tr className="border-b border-[#f5c842]/20">
                  <th className="py-2 pr-4 font-semibold text-[#f5c842]">Servicio</th>
                  <th className="py-2 pr-4 font-semibold text-[#f5c842]">Proposito</th>
                  <th className="py-2 font-semibold text-[#f5c842]">Politica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5c842]/10">
                <tr><td className="py-2 pr-4">Supabase</td><td className="py-2 pr-4">Autenticacion, base de datos, multijugador en tiempo real</td><td className="py-2"><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">Ver</a></td></tr>
                <tr><td className="py-2 pr-4">Google Analytics 4</td><td className="py-2 pr-4">Analitica de uso</td><td className="py-2"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">Ver</a></td></tr>
                <tr><td className="py-2 pr-4">RevenueCat</td><td className="py-2 pr-4">Gestion de suscripciones y compras in-app (movil)</td><td className="py-2"><a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">Ver</a></td></tr>
                <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Procesamiento de pagos (web)</td><td className="py-2"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">Ver</a></td></tr>
                <tr><td className="py-2 pr-4">Google AdMob / AdSense</td><td className="py-2 pr-4">Publicidad</td><td className="py-2"><a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">Ver</a></td></tr>
              </tbody>
            </table>
          </div>

          <SectionTitle>5. Privacidad de Menores (COPPA)</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            GeoSpeed IQ Challenge tiene una clasificacion de edad de <strong>4+</strong> y esta
            disenada para ser apta para todas las edades. No recopilamos intencionalmente
            informacion personal de menores de 13 anos. La App no requiere registro para jugar.
            Si descubrimos que hemos recopilado datos de un menor sin consentimiento parental,
            los eliminaremos de inmediato. Si eres padre/madre o tutor y crees que tu hijo ha
            proporcionado informacion personal, contactanos a{" "}
            <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
              juanjogrimar@gmail.com
            </a>.
          </p>

          <SectionTitle>6. Retencion de Datos</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Los datos locales (localStorage) permanecen en tu dispositivo hasta que los borres
            manualmente o desinstales la App. Los datos de cuenta en Supabase se conservan
            mientras mantengas una cuenta activa. Puedes solicitar la eliminacion de tu cuenta
            y todos los datos asociados en cualquier momento escribiendo a{" "}
            <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
              juanjogrimar@gmail.com
            </a>.
          </p>

          <SectionTitle>7. Tus Derechos</SectionTitle>
          <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
            <li>Acceder a los datos personales que tenemos sobre ti.</li>
            <li>Solicitar la correccion o eliminacion de tus datos.</li>
            <li>Solicitar la eliminacion completa de tu cuenta.</li>
            <li>Retirar tu consentimiento para el procesamiento de datos en cualquier momento.</li>
            <li>Presentar una queja ante la autoridad de proteccion de datos de tu pais.</li>
          </ul>
          <p className="mt-3 text-[#d4d4c8] leading-relaxed">
            Para ejercer cualquiera de estos derechos, escribenos a{" "}
            <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
              juanjogrimar@gmail.com
            </a>.
          </p>

          <SectionTitle>8. Seguridad</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Implementamos medidas de seguridad razonables para proteger tu informacion,
            incluyendo cifrado en transito (HTTPS/TLS) y acceso restringido a bases de datos.
            Sin embargo, ningun metodo de transmision por Internet es 100% seguro.
          </p>

          <SectionTitle>9. Venta de Datos</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed font-semibold">
            No vendemos, intercambiamos ni transferimos tu informacion personal a terceros con
            fines comerciales.
          </p>

          <SectionTitle>10. Cambios a esta Politica</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Podemos actualizar esta politica periodicamente. Cualquier cambio sera publicado en
            esta pagina con una nueva fecha de actualizacion. Te recomendamos revisarla
            periodicamente.
          </p>

          <SectionTitle>11. Contacto</SectionTitle>
          <p className="text-[#d4d4c8] leading-relaxed">
            Si tienes preguntas sobre esta politica de privacidad, contactanos:
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
              Privacy Policy
            </h1>
            <p className="mb-2 text-sm text-[#d4d4c8]/60">
              Last updated: May 17, 2026
            </p>
            <p className="mb-8 text-sm text-[#d4d4c8]/60">
              App: GeoSpeed IQ Challenge &middot; Developer: JuanJo Grimar
            </p>

            <SectionTitle>1. Introduction</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              GeoSpeed IQ Challenge (&quot;the App&quot;) is a geography game developed by JuanJo
              Grimar (&quot;we&quot;, &quot;us&quot;). This privacy policy describes how we collect,
              use, and protect your information when you use our application on mobile devices
              (iOS/Android) and on the web (geospeed-challenge.vercel.app).
            </p>

            <SectionTitle>2. Data We Collect</SectionTitle>

            <SubSection title="2.1 Account Data (optional)">
              <p>
                If you choose to create an account through Supabase Auth, we collect your email
                address and/or basic profile data from your social provider (Google, Apple). This
                is necessary to save your progress across devices and participate in multiplayer
                mode.
              </p>
            </SubSection>

            <SubSection title="2.2 Game Data">
              <p>
                We store locally on your device (localStorage/AsyncStorage): game progress,
                preference settings, A/B test group, and scores. If you have an account, this
                data is also synced with our Supabase database.
              </p>
            </SubSection>

            <SubSection title="2.3 Analytics Data">
              <p>
                We use Google Analytics 4 (GA4) to collect anonymized usage data such as pages
                visited, game events, device type, and country. This data helps us improve the
                game experience. GA4 may use cookies or device identifiers.
              </p>
            </SubSection>

            <SubSection title="2.4 Payment Data">
              <p>
                Payments are processed through secure third parties:{" "}
                <strong>RevenueCat</strong> (for in-app purchases on iOS and Android) and{" "}
                <strong>Stripe</strong> (for web payments). We do <em>not</em> store credit card
                numbers or banking data. See the privacy policies of{" "}
                <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">
                  RevenueCat
                </a>{" "}
                and{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">
                  Stripe
                </a>{" "}
                for more information.
              </p>
            </SubSection>

            <SubSection title="2.5 Advertising Data">
              <p>
                The App displays ads through <strong>Google AdSense</strong> (web) and{" "}
                <strong>Google AdMob</strong> (mobile). These services may collect advertising
                identifiers, device data, and cookies to serve personalized ads. You can manage
                your ad preferences in your device settings or at{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">
                  adssettings.google.com
                </a>.
              </p>
            </SubSection>

            <SectionTitle>3. Cookies & Local Storage</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              We use browser <strong>localStorage</strong> to store game preferences and
              progress. Third-party services (GA4, AdSense, Supabase) may set their own cookies.
              We do not use additional first-party tracking cookies.
            </p>

            <SectionTitle>4. Third-Party Services</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#d4d4c8]">
                <thead>
                  <tr className="border-b border-[#f5c842]/20">
                    <th className="py-2 pr-4 font-semibold text-[#f5c842]">Service</th>
                    <th className="py-2 pr-4 font-semibold text-[#f5c842]">Purpose</th>
                    <th className="py-2 font-semibold text-[#f5c842]">Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5c842]/10">
                  <tr><td className="py-2 pr-4">Supabase</td><td className="py-2 pr-4">Authentication, database, realtime multiplayer</td><td className="py-2"><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">View</a></td></tr>
                  <tr><td className="py-2 pr-4">Google Analytics 4</td><td className="py-2 pr-4">Usage analytics</td><td className="py-2"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">View</a></td></tr>
                  <tr><td className="py-2 pr-4">RevenueCat</td><td className="py-2 pr-4">Subscription & in-app purchase management (mobile)</td><td className="py-2"><a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">View</a></td></tr>
                  <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Payment processing (web)</td><td className="py-2"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">View</a></td></tr>
                  <tr><td className="py-2 pr-4">Google AdMob / AdSense</td><td className="py-2 pr-4">Advertising</td><td className="py-2"><a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[#f5c842] underline">View</a></td></tr>
                </tbody>
              </table>
            </div>

            <SectionTitle>5. Children's Privacy (COPPA)</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              GeoSpeed IQ Challenge has an age rating of <strong>4+</strong> and is designed to
              be suitable for all ages. We do not knowingly collect personal information from
              children under 13. The App does not require registration to play. If we discover
              that we have collected data from a child without parental consent, we will delete
              it immediately. If you are a parent or guardian and believe your child has provided
              personal information, contact us at{" "}
              <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
                juanjogrimar@gmail.com
              </a>.
            </p>

            <SectionTitle>6. Data Retention</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              Local data (localStorage) remains on your device until you manually clear it or
              uninstall the App. Account data on Supabase is retained as long as you maintain an
              active account. You may request deletion of your account and all associated data at
              any time by writing to{" "}
              <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
                juanjogrimar@gmail.com
              </a>.
            </p>

            <SectionTitle>7. Your Rights</SectionTitle>
            <ul className="list-disc space-y-2 pl-6 text-[#d4d4c8] leading-relaxed">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Request complete deletion of your account.</li>
              <li>Withdraw your consent for data processing at any time.</li>
              <li>File a complaint with your country's data protection authority.</li>
            </ul>
            <p className="mt-3 text-[#d4d4c8] leading-relaxed">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:juanjogrimar@gmail.com" className="text-[#f5c842] underline">
                juanjogrimar@gmail.com
              </a>.
            </p>

            <SectionTitle>8. Security</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              We implement reasonable security measures to protect your information, including
              encryption in transit (HTTPS/TLS) and restricted database access. However, no
              method of transmission over the Internet is 100% secure.
            </p>

            <SectionTitle>9. Data Sales</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed font-semibold">
              We do not sell, trade, or transfer your personal information to third parties for
              commercial purposes.
            </p>

            <SectionTitle>10. Changes to This Policy</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              We may update this policy periodically. Any changes will be posted on this page
              with a new update date. We recommend reviewing it periodically.
            </p>

            <SectionTitle>11. Contact</SectionTitle>
            <p className="text-[#d4d4c8] leading-relaxed">
              If you have questions about this privacy policy, contact us:
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
          <Link to="/terms" className="hover:text-[#f5c842]">Terminos / Terms</Link>
          <Link to="/support" className="hover:text-[#f5c842]">Soporte / Support</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
