-- Update the request-screenshots bucket to be public for admin viewing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'request-screenshots';

-- Update storage policies to allow public read access for admins
DROP POLICY IF EXISTS "Public read access for admins" ON storage.objects;

CREATE POLICY "Public read access for admins" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'request-screenshots');