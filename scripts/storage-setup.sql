-- ==============================================================================
-- FixMyCity: Supabase Storage Configuration & RLS Policy Script
-- ==============================================================================
-- Run this script in the Supabase Dashboard SQL Editor (or psql console).
--
-- Goals:
-- 1. Create the `evidence` bucket (and `complaint-images`) if they do not exist.
-- 2. Ensure the bucket is marked `public = true`.
-- 3. Enable RLS on `storage.objects`.
-- 4. Create an RLS policy granting public/anonymous SELECT access to view photos.
-- 5. Create an RLS policy allowing public INSERT access for evidence uploads.
-- ==============================================================================

-- 1. Create or update the 'evidence' bucket to be public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidence',
    'evidence',
    true,
    52428800, -- 50 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Also ensure 'complaint-images' bucket exists and is public for compatibility
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaint-images',
    'complaint-images',
    true,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Make sure public flag is explicitly true
UPDATE storage.buckets
SET public = true
WHERE id IN ('evidence', 'complaint-images');

-- 3. Ensure Row Level Security is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow public / anonymous SELECT access to 'evidence' bucket
-- This allows any citizen viewing the /track page to view the photo via public URL
DROP POLICY IF EXISTS "Public Read Evidence" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to evidence" ON storage.objects;

CREATE POLICY "Allow public read access to evidence"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'evidence');

-- Policy for 'complaint-images' bucket
DROP POLICY IF EXISTS "Allow public read access to complaint-images" ON storage.objects;

CREATE POLICY "Allow public read access to complaint-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'complaint-images');

-- 5. Policy: Allow public INSERT access so evidence photos can be uploaded
DROP POLICY IF EXISTS "Allow public upload to evidence" ON storage.objects;

CREATE POLICY "Allow public upload to evidence"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'evidence');

DROP POLICY IF EXISTS "Allow public upload to complaint-images" ON storage.objects;

CREATE POLICY "Allow public upload to complaint-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'complaint-images');
