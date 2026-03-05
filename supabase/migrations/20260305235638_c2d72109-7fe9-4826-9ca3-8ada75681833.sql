-- Create birthday-videos bucket (public for Meta WhatsApp API access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('birthday-videos', 'birthday-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to birthday videos
CREATE POLICY "Public read access for birthday videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'birthday-videos');

-- Only admins can upload/update birthday videos
CREATE POLICY "Admins can upload birthday videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'birthday-videos'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admins can update birthday videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'birthday-videos'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

CREATE POLICY "Admins can delete birthday videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'birthday-videos'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);