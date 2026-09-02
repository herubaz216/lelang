CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_auction_item_insert_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, vault, net, extensions
AS $$
DECLARE
  webhook_secret text;
  payload jsonb;
  request_id bigint;
BEGIN
  IF NEW.status NOT IN ('active', 'ready') THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'push_webhook_secret'
  LIMIT 1;

  IF webhook_secret IS NULL OR webhook_secret = '' THEN
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'auction_items',
    'schema', 'public',
    'record', jsonb_build_object(
      'id', NEW.id,
      'period_id', NEW.period_id,
      'lot_number', NEW.lot_number,
      'item_name', NEW.item_name,
      'status', NEW.status
    )
  );

  SELECT net.http_post(
    url := 'https://lelang.amscorp.id/api/push/notify-item',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auction_items_notify_push_webhook ON public.auction_items;

CREATE TRIGGER auction_items_notify_push_webhook
  AFTER INSERT ON public.auction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_auction_item_insert_webhook();
