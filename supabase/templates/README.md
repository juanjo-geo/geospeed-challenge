# Correos de cuenta (Supabase Auth)

Plantillas con la identidad de GeoSpeed, en español con una línea en inglés. Se pegan a mano en
**Supabase → Authentication → Emails → Templates** (el CLI no tiene permisos para publicarlas).
El logo se carga desde `https://geospeed-challenge.vercel.app/email-logo.png` (`public/email-logo.png`).

| Plantilla de Supabase | Archivo | Asunto |
|---|---|---|
| Confirm signup | `confirmar-cuenta.html` | Confirma tu cuenta de GeoSpeed Challenge |
| Reset Password | `recuperar-contrasena.html` | Restablece tu contraseña de GeoSpeed Challenge |
| Change Email Address | `confirmar-correo.html` | Confirma tu correo en GeoSpeed Challenge |

"Change Email Address" es el correo que recibe un **invitado** cuando guarda su progreso en una cuenta
(`linkGuestEmail` → `updateUser({ email })`). Magic Link, Invite y Reauthentication no se usan.

Envío: SMTP de **Brevo** (plan gratis, 300 correos al día, sin dominio propio; decisión de JuanJo
2026-10-19). Supabase → Authentication → Emails → SMTP Settings: host `smtp-relay.brevo.com`, puerto
`587`, usuario = login SMTP de Brevo, contraseña = clave SMTP de Brevo (nunca en el repositorio),
remitente = correo verificado en Brevo, nombre "GeoSpeed Challenge".
