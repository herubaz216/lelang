# Browser Push Notifications

Fitur ini mengirim notifikasi ke HP/browser visitor yang sudah mengklik **Aktifkan Notifikasi**, untuk:

- **Periode dimulai** — status periode berubah menjadi `active` (atau insert langsung `active`)
- **Periode ditutup** — status periode berubah menjadi `finished` atau `cancelled`
- **Barang baru** — admin menambahkan item dengan status `active` atau `ready` pada periode `active`

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

## Supabase trigger webhook (sudah dipasang via SQL)

Webhook **tidak** ada di menu Database. Di project ini webhook dipasang lewat **Postgres trigger + pg_net** yang memanggil API production.

| Trigger | Tabel | Event | Endpoint |
|---------|-------|-------|----------|
| `auction_items_notify_push_webhook` | `auction_items` | INSERT (`active`/`ready`) | `/api/push/notify-item` |
| `auction_periods_notify_push_insert_webhook` | `auction_periods` | INSERT (`active`) | `/api/push/notify-period` |
| `auction_periods_notify_push_update_webhook` | `auction_periods` | UPDATE (→ `active` / `finished` / `cancelled`) | `/api/push/notify-period` |

Secret disimpan di **Supabase Vault** dengan nama `push_webhook_secret` — harus sama dengan env `PUSH_WEBHOOK_SECRET` di hosting.

### Setup secret di Vault (sekali)

```sql
SELECT vault.create_secret(
  '<PUSH_WEBHOOK_SECRET>',
  'push_webhook_secret',
  'Bearer token for lelang push notify-item webhook'
);
```

### Alternatif: Dashboard Integrations

Jika ingin pakai UI Supabase: **Integrations → Webhooks** (bukan Database).

URL: `https://supabase.com/dashboard/project/<project-id>/integrations/webhooks/overview`

Jangan pasang dua webhook sekaligus (SQL trigger + dashboard) agar tidak double push.

### Kapan push terkirim

**Barang baru:**
- `record.status` adalah `active` atau `ready`
- parent `auction_periods.status` adalah `active`
- ada subscriber untuk `company_id` periode tersebut

**Periode dimulai:**
- status berubah ke `active` (mis. dari `draft`), atau insert langsung `active`

**Periode ditutup:**
- status berubah ke `finished` atau `cancelled`

## Alur singkat

1. Visitor membuka `/?company=ams` lalu klik **Aktifkan Notifikasi**
2. Browser register service worker `/sw.js` dan menyimpan subscription ke tabel `push_subscriptions`
3. Admin mengaktifkan/menutup periode, atau insert barang baru
4. Supabase trigger memanggil `/api/push/notify-period` atau `/api/push/notify-item`
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

Test periode (update):

```bash
curl -X POST http://localhost:3000/api/push/notify-period \
  -H "Authorization: Bearer <PUSH_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"UPDATE\",\"record\":{\"id\":\"...\",\"company_id\":\"...\",\"code\":\"P-001\",\"title\":\"Lelang Test\",\"status\":\"active\",\"start_at\":\"2026-01-01T00:00:00Z\",\"end_at\":\"2026-12-31T23:59:59Z\"},\"old_record\":{\"id\":\"...\",\"company_id\":\"...\",\"code\":\"P-001\",\"title\":\"Lelang Test\",\"status\":\"draft\",\"start_at\":\"2026-01-01T00:00:00Z\",\"end_at\":\"2026-12-31T23:59:59Z\"}}"
```

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
- `src/app/api/push/notify-period/route.ts`
- `src/lib/web-push.ts`
- `src/lib/push-subscriptions.ts`
- `src/lib/push-notify-item.ts`
- `src/lib/push-notify-period.ts`
- `src/lib/push-notify-shared.ts`
- `src/components/push-notification-prompt.tsx`
- `src/components/push-notification-auto-prompt.tsx`
