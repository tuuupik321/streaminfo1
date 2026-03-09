
-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read ad images" ON storage.objects FOR SELECT USING (bucket_id = 'ad-images');

-- Allow authenticated or anon insert
CREATE POLICY "Allow upload ad images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ad-images');

-- Allow update/delete
CREATE POLICY "Allow update ad images" ON storage.objects FOR UPDATE USING (bucket_id = 'ad-images');
CREATE POLICY "Allow delete ad images" ON storage.objects FOR DELETE USING (bucket_id = 'ad-images');
