
-- Fix the security definer view by setting it to SECURITY INVOKER
ALTER VIEW public.game_rooms_public SET (security_invoker = on);
