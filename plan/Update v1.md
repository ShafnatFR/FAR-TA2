# Update v1: Database Overhaul & Core Logic Synchronization

**Tanggal:** 2026-04-09
**Tujuan:** Menstandarisasi struktur data aplikasi Food AI Rescue (FAR) agar selaras antara Frontend dan Backend, serta menambahkan fondasi fitur Gamifikasi dan Corporate AI.

## Penambahan (Added)
- **Tabel `quests`**: Database master untuk misi harian relawan.
- **Tabel `user_quests`**: Tracking progres misi harian per user dengan fitur *Daily Reset*.
- **Tabel `corporate_ai_generations`**: Media penyimpanan (persistence) untuk hasil AI resep, kemasan, dan CSR Copy.
- **Kolom `category` di `food_items`**: Mendukung klasifikasi makanan (Bakery, Groceries, dll).
- **Kolom Audit QR (`scanned_at`, `scanned_by_id`)**: Mencatat detail waktu dan pelaku verifikasi untuk keamanan.
- **Kolom `allergens` di `ai_verifications`**: Informasi alergi terpisah untuk filter pencarian.
- **Handler Baru di Server (`server/index.js`)**: 
    - `GET_QUESTS` & `UPDATE_QUEST_PROGRESS`
    - `GET_CORPORATE_AI_HISTORY` & `SAVE_CORPORATE_AI_RESULT`

## Perubahan (Modified)
- **`foodairescue.sql`**: 
    - Mengubah role `RECEIVER` menjadi `RECIPIENT` (Standardisasi terminologi).
    - Status User baru kini otomatis `PENDING` (Mendukung alur verifikasi Admin).
    - Status Makanan bertambah: `COMPLETED` dan `RESERVED`.
- **`types.ts`**: Sinkronisasi seluruh antarmuka TypeScript dengan skema SQL baru.
- **`server/index.js`**: Update `ROLE_MAP` dan default status registrasi.

## Penghapusan (Deleted)
- Tidak ada penghapusan tabel, hanya perubahan nilai Enum pada kolom status dan role.

## Tujuan Akhir
Aplikasi kini memiliki struktur data yang kokoh untuk mendukung fitur lanjutan, jejak audit yang jelas untuk verifikasi makanan, dan sistem poin yang bisa dikembangkan lebih jauh tanpa kehilangan data saat aplikasi di-refresh.
