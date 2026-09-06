CREATE OR REPLACE FUNCTION public.get_item_bid_counts(p_item_ids uuid[])
RETURNS TABLE (item_id uuid, bid_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.item_id, count(*)::bigint AS bid_count
  FROM public.bids b
  WHERE b.item_id = ANY (p_item_ids)
  GROUP BY b.item_id;
$$;

REVOKE ALL ON FUNCTION public.get_item_bid_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_item_bid_counts(uuid[]) TO anon, authenticated;
