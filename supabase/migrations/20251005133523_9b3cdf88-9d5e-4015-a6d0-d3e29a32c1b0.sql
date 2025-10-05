-- Create storage bucket for AI-generated songs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-songs',
  'ai-songs',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the ai-songs bucket
CREATE POLICY "Users can upload their own AI songs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-songs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "AI songs are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ai-songs');

CREATE POLICY "Users can delete their own AI songs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-songs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);