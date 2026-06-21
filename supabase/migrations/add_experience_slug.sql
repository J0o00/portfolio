-- Migration: Add slug column to experience table

-- 1. Add the column (nullable first to allow existing rows)
ALTER TABLE public.experience ADD COLUMN slug TEXT UNIQUE;

-- 2. Generate slugs for existing rows based on role_title and organization
UPDATE public.experience 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      role_title || '-' || COALESCE(organization, ''), 
      '[^a-zA-Z0-9]+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  )
) || '-' || id
WHERE slug IS NULL;

-- 3. Make the column NOT NULL
ALTER TABLE public.experience ALTER COLUMN slug SET NOT NULL;
