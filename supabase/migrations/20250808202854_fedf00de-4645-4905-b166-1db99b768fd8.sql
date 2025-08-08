-- Allow anonymous users to check if an email exists (for login validation)
CREATE POLICY "Allow email existence check" 
ON public.users 
FOR SELECT 
TO anon
USING (true);