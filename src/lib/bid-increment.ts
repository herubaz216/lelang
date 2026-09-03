/** Kelipatan bid dari harga awal sesuai aturan lelang. */
export function getBidIncrementByStartingPrice(startingPrice: number): number {
  const price = Math.max(0, Number(startingPrice) || 0);
  if (price <= 50_000) return 3_000;
  if (price <= 150_000) return 5_000;
  return 10_000;
}
