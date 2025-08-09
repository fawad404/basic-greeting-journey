-- Create requests table for all request types
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_account_id UUID,
  request_type TEXT NOT NULL CHECK (request_type IN ('topup', 'replacement', 'change_access')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  description TEXT,
  email TEXT, -- for change access requests
  screenshot_url TEXT, -- for replacement requests with screenshot
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Create policies for requests table
CREATE POLICY "Users can create their own requests" 
ON public.requests 
FOR INSERT 
WITH CHECK (auth.uid()::text IN (
  SELECT users.id::text 
  FROM users 
  WHERE users.id = requests.user_id
));

CREATE POLICY "Users can view their own requests" 
ON public.requests 
FOR SELECT 
USING (auth.uid()::text IN (
  SELECT users.id::text 
  FROM users 
  WHERE users.id = requests.user_id
));

CREATE POLICY "Admins can manage all requests" 
ON public.requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_requests_updated_at
BEFORE UPDATE ON public.requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for request screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('request-screenshots', 'request-screenshots', false);

-- Create storage policies for request screenshots
CREATE POLICY "Users can upload their own screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'request-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'request-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all request screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'request-screenshots' AND has_role(auth.uid(), 'admin'::app_role));