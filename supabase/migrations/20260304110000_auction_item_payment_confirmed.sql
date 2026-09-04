-- Tandai konfirmasi pembayaran pemenang lot (setelah close).
ALTER TABLE public.auction_items
  ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;

ALTER TABLE public.auction_items
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz NULL;

COMMENT ON COLUMN public.auction_items.payment_confirmed IS
  'Admin menandai bahwa pemenang sudah membayar untuk lot ini.';
