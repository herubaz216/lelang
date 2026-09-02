# Browser Push Notifications

Fitur ini mengirim notifikasi ke HP/browser visitor yang sudah mengklik **Aktifkan Notifikasi**, saat admin menambahkan barang baru dengan status `active` atau `ready` pada periode `active`.

## Environment variables

Tambahkan ke `.env.local` (development) dan production (`lelang.amscorp.id`):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@amscorp.id
PUSH_WEBHOOK_SECRET=...
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

`PUSH_WEBHOOK_SECRET` bisa berupa string acak panjang (mis. `openssl rand -hex 32`).

## Supabase Database Webhook (wajib di production)

Setelah deploy API route, buat webhook di Supabase Dashboard:

1. **Database → Webhooks → Create a new hook**
2. **Table:** `auction_items`
3. **Events:** `INSERT`
4. **HTTP method:** `POST`
5. **URL:** `https://lelang.amscorp.id/api/push/notify-item`
6. **HTTP Headers:**
   - `Authorization: Bearer <PUSH_WEBHOOK_SECRET>`
   - `Content-Type: application/json`
7. Payload default Supabase sudah cukup (harus menyertakan field `record`)

Webhook hanya mengirim push jika:

- `record.status` adalah `active` atau `ready`
- parent `auction_periods.status` adalah `active`
- ada subscriber untuk `company_id` periode tersebut

## Alur singkat

1. Visitor membuka `/?company=ams` lalu klik **Aktifkan Notifikasi**
2. Browser register service worker `/sw.js` dan menyimpan subscription ke tabel `push_subscriptions`
3. Admin insert barang baru ke `auction_items`
4. Supabase webhook memanggil `/api/push/notify-item`
5. Server mengirim Web Push ke semua subscription perusahaan terkait

## Testing lokal

1. Isi env VAPID + `PUSH_WEBHOOK_SECRET`
2. Jalankan `npm run dev`
3. Buka `http://localhost:3000/?company=ams` di Chrome
4. Klik **Aktifkan Notifikasi**
5. Trigger manual webhook:

```bash
curl -X POST http://localhost:3000/api/push/notify-item \
  -H "Authorization: Bearer <PUSH_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d "{\"record\":{\"id\":\"...\",\"period_id\":\"...\",\"lot_number\":\"LOT 001\",\"item_name\":\"Test Item\",\"status\":\"active\"}}"
```

Pastikan `period_id` mengarah ke periode `active` milik perusahaan yang sama dengan subscription.

## Catatan platform

| Platform | Perilaku |
|----------|----------|
| Android Chrome | Langsung setelah izin notifikasi |
| Desktop Chrome/Edge | Langsung setelah izin notifikasi |
| iOS Safari 16.4+ | User harus **Add to Home Screen**, lalu buka dari icon PWA |

## File terkait

- `public/sw.js` — service worker
- `public/manifest.webmanifest` — manifest PWA
- `src/app/api/push/subscribe/route.ts`
- `src/app/api/push/unsubscribe/route.ts`
- `src/app/api/push/notify-item/route.ts`
- `src/lib/web-push.ts`
- `src/lib/push-subscriptions.ts`
- `src/lib/push-notify-item.ts`
- `src/components/push-notification-prompt.tsx`
