# Panduan Pengujian Food AI Rescue (FAR) PWA 🚀

Dokumen ini berisi panduan langkah-demi-langkah untuk memverifikasi fitur-fitur baru yang telah diimplementasikan dalam upgrade sistem FAR PWA.

---

## 1. Pengujian Multi-Role RBAC (Tahap 1)
Memastikan sistem membedakan hak akses dan tampilan dashboard untuk 6 jenis pengguna.

### Langkah-langkah:
1.  **Registrasi Baru**:
    *   Buka halaman `/register`.
    *   Pilih salah satu peran (Donatur Individu, Donatur Korporat, Penerima, atau Relawan).
    *   Selesaikan proses pendaftaran.
2.  **Verifikasi Dashboard**:
    *   **Donatur**: Pastikan muncul tombol "Tambah Donasi" dan ringkasan dampak sosial.
    *   **Donatur Korporat**: Pastikan terdapat widget **Gemini Corporate AI**.
    *   **Penerima (Recipient)**: Pastikan daftar makanan muncul dan bisa melakukan "Klaim".
    *   **Relawan (Volunteer)**: Pastikan muncul tab "Misi Pengantaran".
    *   **Admin**: Akses dashboard manajemen user dan statistik global.

---

## 2. Pengujian Logika Stok Kritis (Tahap 2)
Memastikan pembatasan kurir relawan aktif saat stok makanan menipis.

### Langkah-langkah:
1.  **Login sebagai Donatur**: Tambahkan makanan dengan stok **4 porsi** atau kurang.
2.  **Login sebagai Penerima**:
    *   Cari makanan yang baru saja ditambahkan (stok < 5).
    *   Klik detail makanan.
    *   **Harapan**: Opsi "Diantar Relawan" akan terkunci (disabled) dan muncul label "LIMITED".
    *   Klik opsi tersebut: Pastikan muncul modal penjelasan (Glass-morphism) yang menyarankan *Self-Pickup* atau WhatsApp.
3.  **Klaim**: Lakukan klaim dengan *Self-Pickup* dan pastikan berhasil.

---

## 3. Pengujian Gemini AI Korporat (Tahap 3)
Memastikan fitur eksklusif untuk Donatur Korporat berfungsi melalui backend proxy.

### Langkah-langkah:
1.  **Login sebagai Donatur Korporat**.
2.  **Tambah Donasi**: Tambahkan satu menu (misal: "Nasi Goreng Spesial").
3.  **Gunakan AI**:
    *   Klik **"Generate Recipe"**: Pastikan muncul saran resep kreatif untuk mengolah nasi goreng.
    *   Klik **"Eco Packaging"**: Pastikan muncul saran kemasan ramah lingkungan.
    *   Klik **"CSR Copywriting"**: Pastikan muncul teks pemasaran untuk LinkedIn/IG.
4.  **Salin Teks**: Klik tombol "Salin Teks" dan pastikan berhasil tersalin ke clipboard.

---

## 4. Pengujian QR Scan & Poin (Tahap 4)
Memastikan serah terima makanan memberikan imbalan poin sosial secara otomatis.

### Langkah-langkah:
1.  **Alur Klaim**: Login sebagai Penerima, klaim makanan, dan dapatkan **QR Code** (atau Kode Unik).
2.  **Skenario Serah Terima**:
    *   Login sebagai Donatur (untuk Self-Pickup) atau Relawan (untuk Delivery).
    *   Buka detail pesanan yang diklaim.
    *   Klik **"Verifikasi Pesanan"**.
    *   Masukkan kode unik secara manual atau gunakan kamera.
3.  **Verifikasi Hasil**:
    *   Pastikan muncul modal sukses dengan teks **"+50 Poin Sosial"**.
    *   Cek Notifikasi: Pastikan ada notifikasi baru mengenai penambahan poin.
    *   Cek Dashboard: Pastikan saldo poin di statistik dashboard bertambah 50.

---

## 5. Cek Database (Backend Verification)
Buka PHPMyAdmin atau terminal MySql untuk memastikan data tersimpan dengan benar:

```sql
-- Cek apakah poin user bertambah
SELECT name, points FROM users WHERE email = '[email_anda]';

-- Cek riwayat poin
SELECT * FROM point_histories ORDER BY created_at DESC LIMIT 1;

-- Cek status klaim
SELECT status, is_scanned FROM claims WHERE unique_code = '[kode_qr]';
```

---
**Catatan Penting:** 
Pastikan server backend (`npm run dev` di folder server) dan frontend dalam keadaan hidup. Seluruh kunci API Gemini dikelola melalui variabel lingkungan `.env` untuk keamanan.
