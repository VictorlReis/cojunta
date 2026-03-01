CREATE OR REPLACE FUNCTION public.split_expense(p_expense_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expense   public.expenses%ROWTYPE;
  v_partner   public.partnerships%ROWTYPE;
  v_partner_user_id uuid;
  v_creator_amount  numeric(12,2);
  v_partner_amount  numeric(12,2);
  v_copy_id         uuid;
BEGIN
  -- 1. Fetch and lock the expense
  SELECT * INTO v_expense
    FROM public.expenses
    WHERE id = p_expense_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Despesa nao encontrada.' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Verify caller owns the expense
  IF v_expense.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Voce so pode dividir suas proprias despesas.' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Verify not already split
  IF v_expense.is_split THEN
    RAISE EXCEPTION 'Esta despesa ja foi dividida.' USING ERRCODE = 'P0004';
  END IF;

  IF v_expense.split_from_id IS NOT NULL THEN
    RAISE EXCEPTION 'Esta despesa e uma copia de divisao e nao pode ser dividida novamente.' USING ERRCODE = 'P0005';
  END IF;

  -- 4. Find active partnership and partner
  SELECT * INTO v_partner
    FROM public.partnerships
    WHERE status = 'active'
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voce precisa estar vinculado a um parceiro para dividir despesas.' USING ERRCODE = 'P0006';
  END IF;

  IF v_partner.user1_id = auth.uid() THEN
    v_partner_user_id := v_partner.user2_id;
  ELSE
    v_partner_user_id := v_partner.user1_id;
  END IF;

  -- 5. Calculate split amounts (creator keeps extra cent)
  v_creator_amount := CEIL(v_expense.amount * 100 / 2) / 100;
  v_partner_amount := FLOOR(v_expense.amount * 100 / 2) / 100;

  -- 6. Update original expense
  UPDATE public.expenses
    SET amount = v_creator_amount,
        is_split = true
    WHERE id = p_expense_id;

  -- 7. Insert partner's copy
  INSERT INTO public.expenses (
    user_id, partnership_id, category_id, description,
    amount, expense_date, is_shared, split_from_id, is_split
  )
  VALUES (
    v_partner_user_id, v_expense.partnership_id, v_expense.category_id,
    v_expense.description, v_partner_amount, v_expense.expense_date,
    v_expense.is_shared, p_expense_id, false
  )
  RETURNING id INTO v_copy_id;

  -- 8. Return result
  RETURN json_build_object(
    'original_id', p_expense_id,
    'copy_id', v_copy_id,
    'creator_amount', v_creator_amount,
    'partner_amount', v_partner_amount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unsplit_expense(p_expense_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_expense       public.expenses%ROWTYPE;
  v_linked        public.expenses%ROWTYPE;
  v_original_id   uuid;
  v_copy_id       uuid;
  v_restored_amount numeric(12,2);
BEGIN
  -- 1. Fetch and lock the provided expense
  SELECT * INTO v_expense
    FROM public.expenses
    WHERE id = p_expense_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Despesa nao encontrada.' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Verify caller owns this expense
  IF v_expense.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Voce so pode desfazer divisoes das suas proprias despesas.' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Determine if this is the original or the copy
  IF v_expense.is_split AND v_expense.split_from_id IS NULL THEN
    -- CASE A: Caller owns the original
    v_original_id := p_expense_id;

    -- Find the partner's copy (LIMIT 1 as a safety measure against duplicate rows)
    SELECT * INTO v_linked
      FROM public.expenses
      WHERE split_from_id = p_expense_id
      LIMIT 1
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Copia da divisao nao encontrada.' USING ERRCODE = 'P0007';
    END IF;

    v_copy_id := v_linked.id;
    v_restored_amount := v_expense.amount + v_linked.amount;

  ELSIF v_expense.split_from_id IS NOT NULL THEN
    -- CASE B: Caller owns the copy
    v_copy_id := p_expense_id;
    v_original_id := v_expense.split_from_id;

    -- Find and lock the original
    SELECT * INTO v_linked
      FROM public.expenses
      WHERE id = v_expense.split_from_id
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Despesa original nao encontrada.' USING ERRCODE = 'P0008';
    END IF;

    v_restored_amount := v_linked.amount + v_expense.amount;

  ELSE
    RAISE EXCEPTION 'Esta despesa nao faz parte de uma divisao.' USING ERRCODE = 'P0009';
  END IF;

  -- 4. Restore original amount and clear split flag
  UPDATE public.expenses
    SET amount = v_restored_amount,
        is_split = false
    WHERE id = v_original_id;

  -- 5. Delete the copy
  DELETE FROM public.expenses WHERE id = v_copy_id;

  -- 6. Return result
  RETURN json_build_object(
    'original_id', v_original_id,
    'deleted_copy_id', v_copy_id,
    'restored_amount', v_restored_amount
  );
END;
$$;
