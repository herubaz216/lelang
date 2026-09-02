CREATE OR REPLACE FUNCTION public.preserve_current_price_on_item_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.starting_price IS DISTINCT FROM OLD.starting_price
     AND NEW.current_price IS DISTINCT FROM OLD.current_price
     AND NEW.current_price = NEW.starting_price
     AND OLD.current_price IS DISTINCT FROM NEW.starting_price THEN
    NEW.current_price := OLD.current_price;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auction_items_preserve_current_price ON public.auction_items;

CREATE TRIGGER auction_items_preserve_current_price
  BEFORE UPDATE ON public.auction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.preserve_current_price_on_item_update();
