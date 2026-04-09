# Update v3: Optimasi Performa & Histori Data

**Tanggal:** 2026-04-09
**Tujuan:** Memastikan aplikasi tetap responsif saat skala data membesar (Scalability) serta menyediakan fitur arsip untuk pencapaian relawan di masa lalu.

## Penambahan (Added)
- **Indexing SQL**: Menambahkan index pada kolom `points` dan `role` di tabel `users`. Hal ini memungkinkan pencarian peringkat (Leaderboard) tetap berjalan secara Realtime dengan kecepatan tinggi (milidetik).
- **Tabel `leaderboard_snapshots`**: Berfungsi sebagai "Hall of Fame" untuk menyimpan data peringkat mingguan/bulanan agar tidak hilang saat poin user bertambah di masa depan.
- **Tabel `user_impact_stats` (Caching)**: Menyimpan pra-kalkulasi dampak sosial (CO2, air, dll) per user. 
- **API `GET_LEADERBOARD_HISTORY`**: Memberikan akses ke data peringkat historis dari tabel snapshots.
- **Fungsi `generateLeaderboardSnapshot`**: Mekanisme untuk memotret data peringkat saat ini ke dalam arsip.

## Perubahan (Modified)
- **`server/index.js`**: 
    - Fungsi `verifyOrderQR` kini secara otomatis memicu sinkronisasi data dampak sosial ke tabel cache saat transaksi dinyatakan selesai (`COMPLETED`).
    - Peningkatan logika penanganan error pada sinkronisasi data.

## Penghapusan (Deleted)
- Tidak ada penghapusan fitur, semua perubahan bersifat add-on untuk optimasi.

## Tujuan Akhir
Aplikasi kini siap untuk menangani volume transaksi yang lebih besar tanpa penurunan performa pada dashboard, sekaligus memberikan apresiasi lebih kepada relawan melalui catatan sejarah peringkat (Historical Leaderboard).
