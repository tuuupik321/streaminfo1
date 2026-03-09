
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id text NOT NULL UNIQUE,
  display_name text,
  role text NOT NULL DEFAULT 'moderator' CHECK (role IN ('owner', 'moderator')),
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  added_by text
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.team_members FOR DELETE USING (true);

-- Seed the owner
INSERT INTO public.team_members (telegram_id, display_name, role, added_by)
VALUES ('524053673', 'Owner', 'owner', 'system');
