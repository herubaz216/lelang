-- Kelipatan bid mengikuti harga awal (saran default):
-- 0 - 50.000      => 3.000
-- 50.000 - 150.000 => 5.000
-- > 150.000       => 10.000
-- Admin tetap boleh override manual ke 3000/5000/10000.

CREATE OR REPLACE FUNCTION public.bid_increment_for_starting_price(p_starting_price numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_starting_price, 0) <= 50000 THEN 3000
    WHEN COALESCE(p_starting_price, 0) <= 150000 THEN 5000
    ELSE 10000
  END;
$$;

UPDATE public.auction_items
SET bid_increment = public.bid_increment_for_starting_price(starting_price),
    updated_at = now()
WHERE bid_increment IS DISTINCT FROM public.bid_increment_for_starting_price(starting_price);

ALTER TABLE public.auction_items
  DROP CONSTRAINT IF EXISTS auction_items_bid_increment_check;

ALTER TABLE public.auction_items
  ADD CONSTRAINT auction_items_bid_increment_check
  CHECK (bid_increment IN (3000, 5000, 10000));

ALTER TABLE public.auction_items
  ALTER COLUMN bid_increment SET DEFAULT 3000;

CREATE OR REPLACE FUNCTION public.admin_create_auction_item(
  p_period_id uuid,
  p_item_name text,
  p_category text DEFAULT NULL,
  p_description text DEFAULT '',
  p_item_condition text DEFAULT NULL,
  p_status text DEFAULT 'draft',
  p_starting_price numeric DEFAULT 0,
  p_bid_increment numeric DEFAULT NULL
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
  IF p_bid_increment IN (3000, 5000, 10000) THEN
    v_increment := p_bid_increment;
  ELSE
    v_increment := public.bid_increment_for_starting_price(v_starting);
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

-- Hanya auto-isi saat INSERT jika nilai tidak valid; jangan timpa edit manual.
CREATE OR REPLACE FUNCTION public.sync_bid_increment_from_starting_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.bid_increment IS NULL
       OR NEW.bid_increment NOT IN (3000, 5000, 10000) THEN
      NEW.bid_increment := public.bid_increment_for_starting_price(NEW.starting_price);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auction_items_sync_bid_increment ON public.auction_items;

CREATE TRIGGER auction_items_sync_bid_increment
  BEFORE INSERT OR UPDATE OF starting_price, bid_increment ON public.auction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_bid_increment_from_starting_price();
