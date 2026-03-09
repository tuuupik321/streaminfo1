ALTER TABLE public.telegram_channels
ADD COLUMN IF NOT EXISTS owner_user_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_telegram_channels_owner_user_id
ON public.telegram_channels (owner_user_id);
