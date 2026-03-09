-- Lock admin access to one owner Telegram ID
-- Requested owner: 6983727854

DELETE FROM public.team_members WHERE telegram_id <> '6983727854';

INSERT INTO public.team_members (telegram_id, display_name, role, added_by)
VALUES ('6983727854', 'Main Owner', 'owner', 'system')
ON CONFLICT (telegram_id) DO UPDATE
SET
  role = 'owner',
  display_name = EXCLUDED.display_name,
  added_by = EXCLUDED.added_by;

