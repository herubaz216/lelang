-- Reset harga terkini untuk item tanpa bid: current_price harus sama dengan starting_price
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
