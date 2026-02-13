-- Sync roles from auth.users metadata to public.profiles
UPDATE public.profiles
SET role = COALESCE(auth.users.raw_user_meta_data->>'role', 'user')
FROM auth.users
WHERE public.profiles.id = auth.users.id;

-- Ensure future users get the role synced
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, avatar_url, role)
    VALUES (
        new.id, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url',
        COALESCE(new.raw_user_meta_data->>'role', 'user')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
