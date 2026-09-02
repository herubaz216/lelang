-- Repair harus bypass trigger preserve_current_price (trigger blok penurunan harga).
ALTER TABLE public.auction_items DISABLE TRIGGER auction_items_preserve_current_price;

-- Perbaiki harga terkini yang salah karena edit admin (item tanpa bid).
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

-- Perbaiki harga terkini yang tidak sesuai bid valid tertinggi.
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

ALTER TABLE public.auction_items ENABLE TRIGGER auction_items_preserve_current_price;

CREATE OR REPLACE FUNCTION public.repair_auction_item_current_prices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_fixed integer := 0;
  v_count integer;
BEGIN
  ALTER TABLE public.auction_items DISABLE TRIGGER auction_items_preserve_current_price;

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
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_fixed := v_fixed + v_count;

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
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_fixed := v_fixed + v_count;

  ALTER TABLE public.auction_items ENABLE TRIGGER auction_items_preserve_current_price;

  RETURN v_fixed;
END;
$$;
