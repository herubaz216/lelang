-- Harga terkini harus selalu:
-- - MAX(bid non-cancelled) jika masih ada bid
-- - starting_price jika tidak ada bid
-- Ini memperbaiki hapus bid admin yang sebelumnya diblok turun oleh trigger lama.

CREATE OR REPLACE FUNCTION public.preserve_current_price_on_item_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_max_bid numeric;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT MAX(b.amount)
  INTO v_max_bid
  FROM public.bids b
  WHERE b.item_id = NEW.id
    AND b.status <> 'cancelled';

  IF v_max_bid IS NULL THEN
    NEW.current_price := NEW.starting_price;
  ELSE
    NEW.current_price := v_max_bid;
  END IF;

  RETURN NEW;
END;
$$;

-- Perbaiki data orphan: current_price tidak sinkron dengan bid / harga awal.
ALTER TABLE public.auction_items DISABLE TRIGGER auction_items_preserve_current_price;

UPDATE public.auction_items ai
SET current_price = COALESCE(bid_max.max_amount, ai.starting_price),
    updated_at = now()
FROM (
  SELECT ai2.id,
         (
           SELECT MAX(b.amount)
           FROM public.bids b
           WHERE b.item_id = ai2.id
             AND b.status <> 'cancelled'
         ) AS max_amount
  FROM public.auction_items ai2
) bid_max
WHERE ai.id = bid_max.id
  AND ai.current_price IS DISTINCT FROM COALESCE(bid_max.max_amount, ai.starting_price);

ALTER TABLE public.auction_items ENABLE TRIGGER auction_items_preserve_current_price;
