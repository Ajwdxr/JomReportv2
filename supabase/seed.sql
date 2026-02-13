-- Create a test user for auth (This usually happens via Auth API, but for seeding public tables we need existing UUIDs)
-- IMPORTANT: To avoid Foreign Key errors, these ID's must match users in your auth.users table.
-- You can either:
-- 1. Create users in Supabase Auth, copy their IDs, and replace the UUIDs below.
-- 2. Or if you just want to test database syntax, these are valid UUIDs but might fail FK constraints if users don't exist.

-- Seed Profiles
-- NOTE: The text 'USER_UUID_1' is not a valid UUID. We have replaced it with a generated valid UUID.
-- REPLACEMENT:
-- 'USER_UUID_1' -> '97f85f07-fd09-4b6f-ab18-c00c08ec1d3f'
-- 'USER_UUID_2' -> 'a6652675-155e-43dc-a1f7-01905fbafe08'

INSERT INTO public.profiles (id, name, avatar_url, points, badges)
VALUES 
    ('97f85f07-fd09-4b6f-ab18-c00c08ec1d3f', 'Alice Community', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', 50, '{"First Report", "Helper"}'),
    ('a6652675-155e-43dc-a1f7-01905fbafe08', 'Bob Builder', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', 120, '{"First Report", "Resolver"}');

-- Seed Reports
INSERT INTO public.reports (id, title, description, category, photo_url, location, status, creator_id, created_at)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Pothole on Main St', 'Large pothole causing traffic slowdown near the bakery.', 'Roads', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=2400', '{"lat": 40.7128, "lng": -74.0060, "address": "123 Main St"}', 'open', '97f85f07-fd09-4b6f-ab18-c00c08ec1d3f', NOW() - INTERVAL '2 days'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Broken Streetlight', 'Streetlight flickering constantly at night.', 'Lighting', 'https://images.unsplash.com/photo-1550989460-e4b7b2521f7d?auto=format&fit=crop&q=80&w=2400', '{"lat": 40.7138, "lng": -74.0050, "address": "456 Oak Ave"}', 'in_progress', 'a6652675-155e-43dc-a1f7-01905fbafe08', NOW() - INTERVAL '5 days'),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Trash accumulation in park', 'Overflowing bins in the central park area.', 'Waste', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=2400', '{"lat": 40.7148, "lng": -74.0040, "address": "Central Park Entrance"}', 'acknowledged', '97f85f07-fd09-4b6f-ab18-c00c08ec1d3f', NOW() - INTERVAL '1 day');

-- Seed Updates
INSERT INTO public.updates (report_id, user_id, content, created_at)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a6652675-155e-43dc-a1f7-01905fbafe08', 'I saw city workers inspecting this today.', NOW() - INTERVAL '1 day'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '97f85f07-fd09-4b6f-ab18-c00c08ec1d3f', 'Still flickering as of last night.', NOW() - INTERVAL '2 days');

-- Seed Confirmations
INSERT INTO public.confirmations (report_id, user_id, created_at)
VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '97f85f07-fd09-4b6f-ab18-c00c08ec1d3f', NOW() - INTERVAL '1 hour');
