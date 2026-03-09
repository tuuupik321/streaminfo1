
-- Table already created in previous migration, just verify it exists
-- If the previous migration partially succeeded, this is a no-op safety check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stream_monitors') THEN
    CREATE TABLE public.stream_monitors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      platform text NOT NULL,
      username text NOT NULL,
      is_live boolean NOT NULL DEFAULT false,
      last_notified_at timestamptz,
      last_checked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(platform, username)
    );
    ALTER TABLE public.stream_monitors ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow public read" ON public.stream_monitors FOR SELECT USING (true);
    CREATE POLICY "Allow public insert" ON public.stream_monitors FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public update" ON public.stream_monitors FOR UPDATE USING (true);
    CREATE POLICY "Allow public delete" ON public.stream_monitors FOR DELETE USING (true);
  END IF;
END $$;
