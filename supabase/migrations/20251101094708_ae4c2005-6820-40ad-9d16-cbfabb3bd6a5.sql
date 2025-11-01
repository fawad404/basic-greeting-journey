-- Add missing columns to ad_accounts table
ALTER TABLE public.ad_accounts
ADD COLUMN IF NOT EXISTS budget numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_topup_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_email text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS notes text;

-- Add missing note column to payments table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS note text;

-- Create user_balances table
CREATE TABLE IF NOT EXISTS public.user_balances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_balances
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_balances
CREATE POLICY "Users can view their own balance"
ON public.user_balances
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all balances"
ON public.user_balances
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own balance"
ON public.user_balances
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update balances"
ON public.user_balances
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for user_balances updated_at
CREATE TRIGGER update_user_balances_updated_at
BEFORE UPDATE ON public.user_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();