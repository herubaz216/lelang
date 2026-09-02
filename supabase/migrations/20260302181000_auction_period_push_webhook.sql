CREATE OR REPLACE FUNCTION public.notify_auction_period_insert_webhook()
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
  IF NEW.status <> 'active' THEN
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
    'table', 'auction_periods',
    'schema', 'public',
    'record', jsonb_build_object(
      'id', NEW.id,
      'company_id', NEW.company_id,
      'code', NEW.code,
      'title', NEW.title,
      'status', NEW.status,
      'start_at', NEW.start_at,
      'end_at', NEW.end_at
    )
  );

  SELECT net.http_post(
    url := 'https://lelang.amscorp.id/api/push/notify-period',
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

CREATE OR REPLACE FUNCTION public.notify_auction_period_update_webhook()
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
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status IS DISTINCT FROM 'active' AND NEW.status = 'active')
    OR (
      OLD.status NOT IN ('finished', 'cancelled')
      AND NEW.status IN ('finished', 'cancelled')
    )
  ) THEN
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
    'type', 'UPDATE',
    'table', 'auction_periods',
    'schema', 'public',
    'record', jsonb_build_object(
      'id', NEW.id,
      'company_id', NEW.company_id,
      'code', NEW.code,
      'title', NEW.title,
      'status', NEW.status,
      'start_at', NEW.start_at,
      'end_at', NEW.end_at
    ),
    'old_record', jsonb_build_object(
      'id', OLD.id,
      'company_id', OLD.company_id,
      'code', OLD.code,
      'title', OLD.title,
      'status', OLD.status,
      'start_at', OLD.start_at,
      'end_at', OLD.end_at
    )
  );

  SELECT net.http_post(
    url := 'https://lelang.amscorp.id/api/push/notify-period',
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

DROP TRIGGER IF EXISTS auction_periods_notify_push_insert_webhook ON public.auction_periods;

CREATE TRIGGER auction_periods_notify_push_insert_webhook
  AFTER INSERT ON public.auction_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_auction_period_insert_webhook();

DROP TRIGGER IF EXISTS auction_periods_notify_push_update_webhook ON public.auction_periods;

CREATE TRIGGER auction_periods_notify_push_update_webhook
  AFTER UPDATE ON public.auction_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_auction_period_update_webhook();
