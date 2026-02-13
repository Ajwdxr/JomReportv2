-- Allow authenticated users to insert their own profile
-- This is needed for users who signed up before the auto-create trigger was working
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
