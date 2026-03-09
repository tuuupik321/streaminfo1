
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.broadcasts FOR INSERT WITH CHECK (true);
