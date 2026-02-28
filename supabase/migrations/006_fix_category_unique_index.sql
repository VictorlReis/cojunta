-- Migration 006: Fix category unique index for user-scoped categories
-- The previous index required globally unique names for all rows where
-- partnership_id IS NULL, which conflicts with multiple users each creating
-- categories with the same name (e.g., two users both create "Alimentacao").
-- Replace it with a per-user unique index.

-- Drop the old global unique index (covers all rows where partnership_id IS NULL)
DROP INDEX IF EXISTS idx_categories_name_global;

-- Unique name per user (for user-created categories)
CREATE UNIQUE INDEX idx_categories_name_per_user
  ON public.categories(name, created_by)
  WHERE partnership_id IS NULL AND created_by IS NOT NULL;

-- Unique name for the global fallback entries (Sem Categoria, etc.)
CREATE UNIQUE INDEX idx_categories_name_global_fallback
  ON public.categories(name)
  WHERE partnership_id IS NULL AND created_by IS NULL;
