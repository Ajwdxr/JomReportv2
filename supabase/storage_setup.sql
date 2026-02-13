-- SAFE VERSION: This script avoids modifying system tables directly.
-- configured to run in the Supabase SQL Editor.

-- Policy 1: Allow everyone to VIEW images in 'reports'
CREATE POLICY "Public View 123"
ON storage.objects FOR SELECT
USING ( bucket_id = 'reports' );

-- Policy 2: Allow authenticated users to UPLOAD images to 'reports'
CREATE POLICY "Auth Upload 123"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'reports' );
