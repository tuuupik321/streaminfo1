DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'telegram_channels'
  ) THEN
    ALTER TABLE public.telegram_channels
      ADD COLUMN IF NOT EXISTS chat_username TEXT;

    ALTER TABLE public.telegram_channels
      ADD COLUMN IF NOT EXISTS owner_user_id BIGINT;

    CREATE INDEX IF NOT EXISTS idx_telegram_channels_chat_username
      ON public.telegram_channels (chat_username);

    CREATE INDEX IF NOT EXISTS idx_telegram_channels_owner_user_id
      ON public.telegram_channels (owner_user_id);
  END IF;
END $$;
