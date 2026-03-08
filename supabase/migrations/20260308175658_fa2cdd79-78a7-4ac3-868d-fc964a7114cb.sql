
-- Create enums (use IF NOT EXISTS via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_status') THEN
    CREATE TYPE public.access_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 1. Create user_roles FIRST (is_admin depends on it)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- 3. Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  status access_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users can view own request"
ON public.access_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own request"
ON public.access_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
ON public.access_requests FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update requests"
ON public.access_requests FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));
