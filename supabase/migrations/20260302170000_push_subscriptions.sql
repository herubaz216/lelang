CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (endpoint, company_id)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_company_id_idx
  ON public.push_subscriptions (company_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
