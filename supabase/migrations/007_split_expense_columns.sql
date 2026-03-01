-- Add split tracking columns to expenses
ALTER TABLE public.expenses
  ADD COLUMN is_split boolean NOT NULL DEFAULT false;

ALTER TABLE public.expenses
  ADD COLUMN split_from_id uuid DEFAULT NULL
    REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Index for finding partner copies by their original expense
CREATE INDEX idx_expenses_split_from ON public.expenses(split_from_id)
  WHERE split_from_id IS NOT NULL;
