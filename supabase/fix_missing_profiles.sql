-- Insert missing profiles for existing auth users
INSERT INTO public.profiles (id, name, avatar_url, updated_at)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', email, 'User'), 
    COALESCE(raw_user_meta_data->>'avatar_url', ''),
    now()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Ensure the trigger is actually enabled (idempotent check)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
