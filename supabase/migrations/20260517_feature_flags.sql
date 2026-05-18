-- Feature flags table for A/B testing
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.feature_flags (id, flags) VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read, only authenticated admins can write
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read flags"
  ON public.feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Only service role can update flags"
  ON public.feature_flags FOR UPDATE
  USING (auth.role() = 'service_role');
