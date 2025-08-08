-- Create users table for authentication + role management
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow a logged-in user to view ONLY their own record
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.email() = email);

-- Allow service_role (server-side / admin panel backend) to manage all users
CREATE POLICY "Service role can manage users" 
ON public.users 
FOR ALL 
USING (auth.role() = 'service_role');

-- Auto-update timestamp on record update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user
INSERT INTO public.users (email, role)
VALUES ('mrrobot34404@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;