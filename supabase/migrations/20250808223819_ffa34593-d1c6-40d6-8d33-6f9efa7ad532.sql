-- Add fee column to payments table
ALTER TABLE public.payments 
ADD COLUMN fee DECIMAL(10,2);