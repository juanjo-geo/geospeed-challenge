-- Player data table for cloud sync + server-side premium validation
-- This replaces client-only localStorage for premium state

CREATE TABLE IF NOT EXISTS public.player_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stats JSONB NOT NULL DEFAULT '{"gamesPlayed":0,"bestScore":0,"totalDistance":0,"totalRounds":0}'::jsonb,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  energy JSONB NOT NULL DEFAULT '{"lives":5,"lastRegenTimestamp":0}'::jsonb,
  premium JSONB NOT NULL DEFAULT '{"isPro":false,"proExpiresAt":null,"proSource":null}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can only read/write their own data
ALTER TABLE public.player_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON public.player_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON public.player_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON public.player_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_player_data_updated ON public.player_data(updated_at DESC);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.player_data TO authenticated;
