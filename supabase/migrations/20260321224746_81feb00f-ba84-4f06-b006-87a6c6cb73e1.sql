-- Create leaderboard table for shared ranking
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initials TEXT NOT NULL CHECK (char_length(initials) = 3),
  score INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read the leaderboard
CREATE POLICY "Leaderboard is publicly readable"
  ON public.leaderboard FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert scores
CREATE POLICY "Anyone can insert scores"
  ON public.leaderboard FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Index for fast top-5 queries
CREATE INDEX idx_leaderboard_score ON public.leaderboard (score DESC);