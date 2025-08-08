-- Create payments table for top-up requests
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_id TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid()::text IN (SELECT user_id::text FROM public.users WHERE id = payments.user_id));

-- Users can create their own payment requests
CREATE POLICY "Users can create payment requests" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid()::text IN (SELECT user_id::text FROM public.users WHERE id = payments.user_id));

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all payments
CREATE POLICY "Admins can update all payments" 
ON public.payments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_balances table to track user balances
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Users can view their own balance
CREATE POLICY "Users can view their own balance" 
ON public.user_balances 
FOR SELECT 
USING (auth.uid()::text IN (SELECT user_id::text FROM public.users WHERE id = user_balances.user_id));

-- Admins can view all balances
CREATE POLICY "Admins can view all balances" 
ON public.user_balances 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all balances
CREATE POLICY "Admins can update all balances" 
ON public.user_balances 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert balances
CREATE POLICY "Admins can insert balances" 
ON public.user_balances 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_balances_updated_at
BEFORE UPDATE ON public.user_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();