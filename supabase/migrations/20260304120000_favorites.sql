CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.auction_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_user_item_unique UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_created_at_idx
  ON public.favorites (user_id, created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_own_select" ON public.favorites;
CREATE POLICY "favorites_own_select"
  ON public.favorites FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_own_insert" ON public.favorites;
CREATE POLICY "favorites_own_insert"
  ON public.favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_own_delete" ON public.favorites;
CREATE POLICY "favorites_own_delete"
  ON public.favorites FOR DELETE
  USING (user_id = auth.uid());
