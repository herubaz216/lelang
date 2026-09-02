CREATE OR REPLACE FUNCTION public.preserve_current_price_on_item_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_has_bids boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.bids b
    WHERE b.item_id = NEW.id
      AND b.status <> 'cancelled'
  ) INTO v_has_bids;

  IF NEW.current_price IS DISTINCT FROM OLD.current_price THEN
  -- Hanya bid yang boleh menaikkan harga terkini.
    IF NOT (NEW.current_price > OLD.current_price) THEN
      NEW.current_price := OLD.current_price;
    END IF;
  END IF;

  IF NOT v_has_bids AND NEW.starting_price IS DISTINCT FROM OLD.starting_price THEN
    NEW.current_price := NEW.starting_price;
  END IF;

  RETURN NEW;
END;
$$;

-- Perbaiki data: harga terkini mengikuti bid valid tertinggi.
UPDATE public.auction_items ai
SET current_price = bid_max.max_amount,
    updated_at = now()
FROM (
  SELECT item_id, MAX(amount) AS max_amount
  FROM public.bids
  WHERE status = 'valid'
  GROUP BY item_id
) bid_max
WHERE ai.id = bid_max.item_id
  AND ai.current_price IS DISTINCT FROM bid_max.max_amount;

-- Item tanpa bid: harga terkini = harga awal.
UPDATE public.auction_items ai
SET current_price = ai.starting_price,
    updated_at = now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.bids b
  WHERE b.item_id = ai.id
    AND b.status <> 'cancelled'
)
AND ai.current_price IS DISTINCT FROM ai.starting_price;
