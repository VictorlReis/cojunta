-- Migration 005: Change categories from partnership-scoped to user-scoped
-- Users can now create categories independently of having a partner.
-- Partners automatically see each other's categories via the updated RLS SELECT policy.

-- Drop all existing custom category RLS policies from migration 004
DROP POLICY IF EXISTS "Users can view global and partnership categories" ON public.categories;
DROP POLICY IF EXISTS "Users can create partnership categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update partnership categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete partnership categories" ON public.categories;

-- SELECT: global fallback OR own categories OR active partner's categories
CREATE POLICY "Users can view categories" ON public.categories
  FOR SELECT USING (
    -- Global fallback ("Sem Categoria")
    (partnership_id IS NULL AND created_by IS NULL)
    -- Own categories
    OR created_by = auth.uid()
    -- Active partner's categories
    OR created_by IN (
      SELECT CASE WHEN user1_id = auth.uid() THEN user2_id ELSE user1_id END
      FROM public.partnerships
      WHERE status = 'active'
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- INSERT: any authenticated user can create a category for themselves
CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (
    partnership_id IS NULL
    AND created_by = auth.uid()
  );

-- UPDATE: only the creator can update their own category
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (
    created_by = auth.uid()
    AND partnership_id IS NULL
  );

-- DELETE: only the creator can delete their own category
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (
    created_by = auth.uid()
    AND partnership_id IS NULL
  );
