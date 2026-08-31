# LelangCorp — Platform Lelang Internal

Website lelang aset operasional perusahaan, dibangun dengan **Next.js 16** + **Supabase**.

## Fitur

- **Halaman publik**: daftar lot, detail barang, form penawaran (NIK + KTP)
- **Real-time bidding**: harga & riwayat bid update otomatis via Supabase Realtime
- **Dashboard staff**: kelola periode, barang, foto, bidder, laporan
- **Role-based access**: `ga`, `accounting`, `bidder`

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth, PostgreSQL, Storage, Realtime, RPC)

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public API key |

## Struktur Halaman

| Route | Akses | Deskripsi |
|-------|-------|-----------|
| `/` | Publik | Landing + periode aktif |
| `/lots` | Publik | Grid semua lot |
| `/lots/[id]` | Publik | Detail lot + form bid |
| `/login` | Publik | Login staff |
| `/admin` | Staff | Dashboard |
| `/admin/periods` | GA/Accounting | CRUD periode lelang |
| `/admin/items` | GA/Accounting | CRUD barang + upload foto |
| `/admin/bidders` | GA/Accounting | Kelola peserta lelang |
| `/admin/reports` | GA/Accounting | Laporan bid + audit log |

## Database

Menggunakan Supabase PostgreSQL dengan RPC functions:

- `place_public_bid` — ajukan penawaran
- `get_public_bid_feed` — riwayat bid publik
- `upsert_bidder` — kelola peserta lelang

## Build & Deploy

```bash
npm run build
npm start
```

## License

Private — internal use only.
