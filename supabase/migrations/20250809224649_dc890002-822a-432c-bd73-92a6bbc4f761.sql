-- Add foreign key relationships to requests table
ALTER TABLE public.requests 
ADD CONSTRAINT fk_requests_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.requests 
ADD CONSTRAINT fk_requests_ad_account_id 
FOREIGN KEY (ad_account_id) REFERENCES public.ad_accounts(id) ON DELETE SET NULL;