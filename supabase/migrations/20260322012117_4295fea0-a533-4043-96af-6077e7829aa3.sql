
-- Game rooms for multiplayer
CREATE TABLE public.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_name text NOT NULL,
  guest_name text,
  difficulty text NOT NULL DEFAULT 'easy',
  mode text NOT NULL DEFAULT 'world',
  status text NOT NULL DEFAULT 'waiting',
  host_score integer DEFAULT 0,
  guest_score integer DEFAULT 0,
  current_round integer DEFAULT 0,
  seed integer NOT NULL,
  host_ready boolean DEFAULT false,
  guest_ready boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can read rooms (needed for joining)
CREATE POLICY "Rooms are publicly readable" ON public.game_rooms FOR SELECT TO anon, authenticated USING (true);

-- Anyone can create rooms
CREATE POLICY "Anyone can create rooms" ON public.game_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can update rooms (for joining, scoring, etc.)
CREATE POLICY "Anyone can update rooms" ON public.game_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
