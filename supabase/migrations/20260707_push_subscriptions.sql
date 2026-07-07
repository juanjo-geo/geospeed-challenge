-- Web Push: guarda las suscripciones de los navegadores/PWA para enviar notificaciones
create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  p256dh      text,
  auth        text,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- El cliente (anon) puede registrar/actualizar su suscripción por endpoint.
-- La lectura y borrado masivo los hace la Edge Function con service_role (bypassa RLS).
drop policy if exists "push_insert" on public.push_subscriptions;
create policy "push_insert" on public.push_subscriptions
  for insert with check (true);

drop policy if exists "push_update" on public.push_subscriptions;
create policy "push_update" on public.push_subscriptions
  for update using (true) with check (true);
