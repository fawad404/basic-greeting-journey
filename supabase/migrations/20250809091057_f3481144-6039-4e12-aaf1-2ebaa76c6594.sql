-- Add a column to store user balance at time of transaction
ALTER TABLE public.payments 
ADD COLUMN user_balance_at_time numeric DEFAULT NULL;