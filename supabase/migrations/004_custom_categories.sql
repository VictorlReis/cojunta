-- Migration 004: Custom Categories (Partnership-Scoped)
-- Transforms the categories table from a static global table into a partnership-scoped,
-- user-creatable table. Inserts a global "Sem Categoria" fallback, reassigns all
-- existing expenses, removes old seeded categories, and updates RLS policies.

-- 1. Add new columns
ALTER TABLE public.categories
  ADD COLUMN partnership_id uuid REFERENCES public.partnerships(id) ON DELETE CASCADE,
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Insert the global fallback BEFORE deleting anything
INSERT INTO public.categories (name, icon, color, partnership_id, created_by)
VALUES ('Sem Categoria', 'circle-help', '#9CA3AF', NULL, NULL);

-- 3. Reassign all expenses from old categories to "Sem Categoria"
UPDATE public.expenses
SET category_id = (SELECT id FROM public.categories WHERE name = 'Sem Categoria' AND partnership_id IS NULL)
WHERE category_id != (SELECT id FROM public.categories WHERE name = 'Sem Categoria' AND partnership_id IS NULL);

-- 4. Delete old seeded categories (now safe -- no expenses reference them)
DELETE FROM public.categories
WHERE partnership_id IS NULL AND name != 'Sem Categoria';

-- 5. Drop old unique constraint and add new partial indexes
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
CREATE UNIQUE INDEX idx_categories_name_partnership ON public.categories(name, partnership_id) WHERE partnership_id IS NOT NULL;
CREATE UNIQUE INDEX idx_categories_name_global ON public.categories(name) WHERE partnership_id IS NULL;

-- 6. Add lookup indexes
CREATE INDEX idx_categories_partnership ON public.categories(partnership_id);
CREATE INDEX idx_categories_created_by ON public.categories(created_by);

-- 7. Drop old RLS policy, add new ones
DROP POLICY "Authenticated users can view categories" ON public.categories;

-- SELECT: global + own partnership
CREATE POLICY "Users can view global and partnership categories" ON public.categories
  FOR SELECT USING (
    partnership_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.partnerships
      WHERE status = 'active'
        AND id = categories.partnership_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- INSERT: only into own active partnership
CREATE POLICY "Users can create partnership categories" ON public.categories
  FOR INSERT WITH CHECK (
    partnership_id IS NOT NULL
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.partnerships
      WHERE status = 'active'
        AND id = categories.partnership_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- UPDATE: only own partnership's categories
CREATE POLICY "Users can update partnership categories" ON public.categories
  FOR UPDATE USING (
    partnership_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.partnerships
      WHERE status = 'active'
        AND id = categories.partnership_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- DELETE: only own partnership's categories
CREATE POLICY "Users can delete partnership categories" ON public.categories
  FOR DELETE USING (
    partnership_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.partnerships
      WHERE status = 'active'
        AND id = categories.partnership_id
        AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );
