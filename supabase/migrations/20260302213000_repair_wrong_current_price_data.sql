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
