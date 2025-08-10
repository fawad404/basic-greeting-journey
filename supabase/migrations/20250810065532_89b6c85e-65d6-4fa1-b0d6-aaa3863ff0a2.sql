-- Ensure request-screenshots bucket exists and has proper policies
DO $$ 
BEGIN
  -- Check if bucket exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'request-screenshots') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('request-screenshots', 'request-screenshots', false);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all screenshots" ON storage.objects;

-- Create policies for request-screenshots bucket
CREATE POLICY "Users can upload their own screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'request-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own screenshots" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'request-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all screenshots" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'request-screenshots' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);