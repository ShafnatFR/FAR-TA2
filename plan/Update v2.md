# Update v2: Optimasi API & Standardisasi Komunikasi

**Tanggal:** 2026-04-09
**Tujuan:** Meningkatkan efisiensi pengambilan data peringkat (Leaderboard) dan menyeragamkan pesan sistem agar lebih profesional dan mudah dipahami.

## Penambahan (Added)
- **API `GET_LEADERBOARD`**: Memindahkan logika perhitungan peringkat dari Frontend ke Backend. Pencarian top 10 relawan kini dilakukan langsung di SQL, yang jauh lebih cepat dan efisien untuk data besar.
- **Audit QR Details**: (Dari penyelesaian Phase 2 sebelumnya) Kolom `scanned_at` dan `scanned_by_id` kini aktif mencatat setiap transaksi verifikasi.

## Perubahan (Modified)
- **`server/index.js`**: 
    - Penyeragaman pesan sukses dan error ke dalam Bahasa Indonesia yang formal.
    - Pemetaan status error HTTP (401, 404, 409) yang lebih akurat untuk memudahkan debugging di frontend.
    - Perbaikan logika router untuk mendukung aksi-aksi baru.
- **`constants.ts`**: Menyelaraskan kunci teknis `receiver` menjadi `recipient` agar konsisten dengan tipe data dan skema database.

## Penghapusan (Deleted)
- Menghapus logika perhitungan leaderboard manual di sisi frontend (dipindahkan ke server).

## Tujuan Akhir
Aplikasi menjadi lebih ringan karena beban perhitungan dipindahkan ke server, serta memiliki alur komunikasi API yang lebih standar dan mudah dipelihara.
