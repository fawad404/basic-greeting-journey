-- Create ad_accounts table
CREATE TABLE public.ad_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  budget NUMERIC NOT NULL DEFAULT 0,
  total_topup_amount NUMERIC NOT NULL DEFAULT 0,
  access_email TEXT NOT NULL,
  country TEXT DEFAULT 'N/A',
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for ad_accounts
CREATE POLICY "Admins can manage all ad accounts" 
ON public.ad_accounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own ad accounts" 
ON public.ad_accounts 
FOR SELECT 
USING (auth.uid()::text IN (
  SELECT users.id::text 
  FROM users 
  WHERE users.id = ad_accounts.user_id
));

-- Create replacement requests table
CREATE TABLE public.account_replacement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for replacement requests
ALTER TABLE public.account_replacement_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for replacement requests
CREATE POLICY "Admins can manage all replacement requests" 
ON public.account_replacement_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own replacement requests" 
ON public.account_replacement_requests 
FOR INSERT 
WITH CHECK (auth.uid()::text IN (
  SELECT users.id::text 
  FROM users 
  WHERE users.id = account_replacement_requests.user_id
));

CREATE POLICY "Users can view their own replacement requests" 
ON public.account_replacement_requests 
FOR SELECT 
USING (auth.uid()::text IN (
  SELECT users.id::text 
  FROM users 
  WHERE users.id = account_replacement_requests.user_id
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ad_accounts_updated_at
BEFORE UPDATE ON public.ad_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_replacement_requests_updated_at
BEFORE UPDATE ON public.account_replacement_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();