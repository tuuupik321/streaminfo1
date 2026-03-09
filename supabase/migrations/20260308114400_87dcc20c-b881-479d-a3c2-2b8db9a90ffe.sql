
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id text NOT NULL,
  username text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  admin_reply text,
  replied_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.support_tickets FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.support_tickets FOR UPDATE USING (true);

CREATE TABLE public.event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.event_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.event_logs FOR INSERT WITH CHECK (true);
