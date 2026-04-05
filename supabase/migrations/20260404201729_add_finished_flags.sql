-- Add host_finished / guest_finished flags so the result screen can
-- reliably detect who has submitted their final score.
-- Before this fix, host_score/guest_score defaulted to 0, making
-- MultiplayerResultScreen think both players had finished from the start.

ALTER TABLE public.game_rooms
  ADD COLUMN IF NOT EXISTS host_finished boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_finished boolean DEFAULT false NOT NULL;

-- Rebuild the public view to include the new columns
CREATE OR REPLACE VIEW public.game_rooms_public AS
SELECT id, code, host_name, guest_name, difficulty, mode, status,
       host_score, guest_score, current_round, seed,
       host_ready, guest_ready,
       host_finished, guest_finished,
       created_at
FROM public.game_rooms;
