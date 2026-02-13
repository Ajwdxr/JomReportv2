-- Add admin-related columns
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Create policy for Admins to view all data (This is tricky with RLS if we don't have a 'role' column in profiles to check against in SQL)
-- However, strict 'admin' role check is often done in Application Logic (Server Components) or via Custom Claims in JWT.
-- For simpler implementation without Custom Claims, we can add a 'role' column to profiles and sync it.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update RLS policies to allow admins to do everything
-- We need to define what an admin is in RLS. 
-- CREATE POLICY "Admins can do everything" ON ...
-- For now, we will handle sensitive admin actions via Service Role in Server Actions or by checking the role column in RLS.

-- Let's add RLS for 'is_hidden'. 
-- Ordinary users should NOT see hidden reports.
-- We need to update the "Reports are viewable by everyone" policy.

DROP POLICY IF EXISTS "Reports are viewable by everyone." ON public.reports;
CREATE POLICY "Reports are viewable by everyone." ON public.reports
    FOR SELECT USING (is_hidden = false OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Add policy for admins to update reports (hide/lock)
CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Add policy for admins to ban users
CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Set specific user as admin (replace with specific email if known, or handle manually)
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';
