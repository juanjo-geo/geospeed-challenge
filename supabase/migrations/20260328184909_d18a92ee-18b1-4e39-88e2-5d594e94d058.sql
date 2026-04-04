
-- 1. Add room_secret columns to game_rooms for host/guest authentication
ALTER TABLE public.game_rooms
  ADD COLUMN IF NOT EXISTS host_secret uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS guest_secret uuid;

-- 2. Drop overly permissive UPDATE policy on game_rooms
DROP POLICY IF EXISTS "Anyone can update rooms" ON public.game_rooms;

-- 3. Add UPDATE policy for game_rooms restricted to service_role (edge function)
CREATE POLICY "Only service role can update rooms"
  ON public.game_rooms
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Add CHECK constraint on leaderboard score
ALTER TABLE public.leaderboard
  ADD CONSTRAINT leaderboard_score_range CHECK (score >= 0 AND score <= 200000);

-- 5. Drop overly permissive INSERT policy on leaderboard
DROP POLICY IF EXISTS "Anyone can insert scores" ON public.leaderboard;

-- 6. Create restrictive INSERT policy — only via service role (edge function)
CREATE POLICY "Only service role can insert scores"
  ON public.leaderboard
  FOR INSERT
  TO service_role
  WITH CHECK (true);
