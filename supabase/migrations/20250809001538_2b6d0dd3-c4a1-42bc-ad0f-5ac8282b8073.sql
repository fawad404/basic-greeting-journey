-- Add foreign key relationship between ad_accounts and users tables
ALTER TABLE public.ad_accounts 
ADD CONSTRAINT fk_ad_accounts_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;