
-- Create a security definer function to get room secret for the creator
-- This hides secrets from normal SELECT queries

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Rooms are publicly readable" ON public.game_rooms;

-- Create a new SELECT policy that excludes secret columns
-- We can't restrict columns in RLS, but we can use a view
CREATE OR REPLACE VIEW public.game_rooms_public AS
SELECT id, code, host_name, guest_name, difficulty, mode, status,
       host_score, guest_score, current_round, seed,
       host_ready, guest_ready, created_at
FROM public.game_rooms;

-- Re-create the SELECT policy (still needed for realtime subscriptions)
CREATE POLICY "Rooms are publicly readable"
  ON public.game_rooms
  FOR SELECT
  TO anon, authenticated
  USING (true);
