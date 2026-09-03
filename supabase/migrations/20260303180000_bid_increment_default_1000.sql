-- Default kelipatan bid admin: Rp 1.000 (sebelumnya Rp 10.000).
ALTER TABLE public.auction_items
  DROP CONSTRAINT IF EXISTS auction_items_bid_increment_check;

ALTER TABLE public.auction_items
  ADD CONSTRAINT auction_items_bid_increment_check
  CHECK (bid_increment >= 1000);

ALTER TABLE public.auction_items
  ALTER COLUMN bid_increment SET DEFAULT 1000;

CREATE OR REPLACE FUNCTION public.admin_create_auction_item(
  p_period_id uuid,
  p_item_name text,
  p_category text DEFAULT NULL,
  p_description text DEFAULT '',
  p_item_condition text DEFAULT NULL,
  p_status text DEFAULT 'draft',
  p_starting_price numeric DEFAULT 0,
  p_bid_increment numeric DEFAULT 1000
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
  v_increment := COALESCE(p_bid_increment, 1000);
  IF v_increment < 1000 THEN
    v_increment := 1000;
  END IF;

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

UPDATE public.auction_items
SET bid_increment = 1000,
    updated_at = now()
WHERE bid_increment = 10000;
