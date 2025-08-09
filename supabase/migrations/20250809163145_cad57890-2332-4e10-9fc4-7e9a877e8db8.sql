-- Add username and telegram_username fields to users table
ALTER TABLE public.users 
ADD COLUMN username TEXT,
ADD COLUMN telegram_username TEXT;

-- Add unique constraint for username to prevent duplicates
ALTER TABLE public.users 
ADD CONSTRAINT users_username_unique UNIQUE (username);