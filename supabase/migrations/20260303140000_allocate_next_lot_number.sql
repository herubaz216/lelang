-- Alokasi nomor LOT + insert item dalam 1 transaksi (aman multi-admin).
CREATE OR REPLACE FUNCTION public.allocate_next_lot_number(p_period_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_max integer := 0;
  v_next integer;
BEGIN
  IF public.current_user_role() NOT IN ('ga', 'accounting', 'ga_accounting') THEN
    RAISE EXCEPTION 'Tidak memiliki akses untuk menambah barang';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.auction_periods WHERE id = p_period_id
  ) THEN
    RAISE EXCEPTION 'Periode tidak ditemukan';
  END IF;

  PERFORM 1
  FROM public.auction_periods
  WHERE id = p_period_id
  FOR UPDATE;

  SELECT COALESCE(
    MAX(NULLIF(substring(ai.lot_number from '([0-9]+)[[:space:]]*$'), '')::integer),
    0
  )
  INTO v_max
  FROM public.auction_items ai
  WHERE ai.period_id = p_period_id;

  v_next := v_max + 1;
  RETURN 'LOT ' || lpad(v_next::text, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_auction_item(
  p_period_id uuid,
  p_item_name text,
  p_category text DEFAULT NULL,
  p_description text DEFAULT '',
  p_item_condition text DEFAULT NULL,
  p_status text DEFAULT 'draft',
  p_starting_price numeric DEFAULT 0,
  p_bid_increment numeric DEFAULT 10000
)
RETURNS public.auction_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_lot text;
  v_item public.auction_items;
  v_starting numeric;
  v_increment numeric;
BEGIN
  IF public.current_user_role() NOT IN ('ga', 'accounting', 'ga_accounting') THEN
    RAISE EXCEPTION 'Tidak memiliki akses untuk menambah barang';
  END IF;

  v_starting := COALESCE(p_starting_price, 0);
  v_increment := COALESCE(p_bid_increment, 10000);
  IF v_increment <= 0 THEN
    v_increment := 10000;
  END IF;

  -- Lock periode + alokasi LOT di transaksi yang sama dengan insert.
  v_lot := public.allocate_next_lot_number(p_period_id);

  INSERT INTO public.auction_items (
    period_id,
    lot_number,
    item_name,
    category,
    description,
    item_condition,
    status,
    starting_price,
    bid_increment,
    current_price
  )
  VALUES (
    p_period_id,
    v_lot,
    btrim(p_item_name),
    NULLIF(btrim(COALESCE(p_category, '')), ''),
    COALESCE(p_description, ''),
    NULLIF(btrim(COALESCE(p_item_condition, '')), ''),
    COALESCE(NULLIF(btrim(p_status), ''), 'draft'),
    v_starting,
    v_increment,
    v_starting
  )
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

GRANT EXECUTE ON FUNCTION public.allocate_next_lot_number(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_auction_item(
  uuid, text, text, text, text, text, numeric, numeric
) TO authenticated;
