// Supabase Edge Function: envía notificaciones Web Push con personalidad de la mascota.
// Deploy:  supabase functions deploy send-push
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (supabase secrets set ...)
// Invocar: POST { "type": "streak" | "lives" | "daily" }  (por cron o manual)
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails('mailto:juanjogrimar@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

// Copys con personalidad + ícono = imagen de la mascota (juice Capa 8/retención)
const MESSAGES: Record<string, { title: string; body: string; icon: string }> = {
  streak: { title: '😢 ¡Tu racha está en peligro!', body: 'Juega una partida antes de medianoche para no perderla.', icon: '/mascot/sad.png' },
  lives:  { title: '❤️ ¡Vidas llenas!',            body: 'Tienes 5 vidas listas. ¡Hora de jugar!',                 icon: '/mascot/celebrate.png' },
  daily:  { title: '🌍 Nuevo desafío diario',       body: '¡Las ciudades de hoy te esperan! 🎯',                    icon: '/mascot/wink.png' },
};

Deno.serve(async (req) => {
  const { type = 'daily' } = await req.json().catch(() => ({}));
  const msg = MESSAGES[type] ?? MESSAGES.daily;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: subs } = await supabase.from('push_subscriptions').select('*');

  let sent = 0, removed = 0;
  for (const s of subs ?? []) {
    const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
    const payload = JSON.stringify({ title: msg.title, body: msg.body, icon: msg.icon, tag: type });
    try {
      await webpush.sendNotification(subscription, payload);
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) { // suscripción muerta → limpiar
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        removed++;
      }
    }
  }
  return new Response(JSON.stringify({ sent, removed }), { headers: { 'Content-Type': 'application/json' } });
});
