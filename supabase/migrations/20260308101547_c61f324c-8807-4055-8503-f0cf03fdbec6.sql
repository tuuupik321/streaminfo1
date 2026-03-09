
-- Create storage bucket for telegram images
INSERT INTO storage.buckets (id, name, public) VALUES ('telegram-images', 'telegram-images', true);

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'telegram-images');

-- Allow public insert
CREATE POLICY "Public insert access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'telegram-images');

-- Allow public delete
CREATE POLICY "Public delete access" ON storage.objects FOR DELETE USING (bucket_id = 'telegram-images');

-- Create telegram_channels table
CREATE TABLE public.telegram_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  channel_name TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for telegram_channels
ALTER TABLE public.telegram_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.telegram_channels FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.telegram_channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.telegram_channels FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.telegram_channels FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_telegram_channels_updated_at
  BEFORE UPDATE ON public.telegram_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
