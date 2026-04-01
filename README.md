# 🥗 FoodAI Rescue (FAR) - Dokumentasi Proyek

FoodAI Rescue (FAR) adalah platform manajemen donasi makanan yang menggunakan kecerdasan buatan (Gemini AI) untuk verifikasi kelayakan makanan dan penghitungan dampak sosial.

---

## 🚀 Langkah-Langkah Menjalankan Aplikasi

### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
- **Node.js** (Versi 18 atau lebih baru)
- **MySQL** (XAMPP atau MySQL Server local)

### 2. Instalasi Dependensi
Anda perlu menginstal library di dua folder (Frontend & Backend):

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 3. Konfigurasi Database
1. Buka MySQL (misal: phpMyAdmin).
2. Buat database baru dengan nama `foodairescue`.
3. Import file SQL yang ada di folder `server/`:
   - Import `server/foodairescue.sql` (Struktur Tabel).
   - (Opsional) Import `server/dataDumy.sql` (Data Percobaan).
4. Pastikan konfigurasi di file `.env` sudah sesuai:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=foodairescue
   PORT=5000
   ```

### 4. Jalankan Migrasi (Penting)
Jalankan perintah ini untuk memastikan struktur tabel terbaru sudah diterapkan:
```bash
node server/migrate_db.cjs
```

### 5. Menjalankan Aplikasi
Buka dua terminal atau command prompt:

**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173` (Vite default).

---

## 👥 Penjelasan Peran (User Roles)

Berikut adalah peran-peran yang tersedia dalam sistem FoodAI Rescue:

### 1. 🦸 Donatur (Provider)
*   **Tujuan**: Pihak yang memiliki kelebihan makanan layak konsumsi.
*   **Fitur Utama**: 
    - Menambahkan item makanan baru.
    - Mendapatkan verifikasi AI otomatis (layak/tidak, halal score, dll).
    - Melihat statistik dampak sosial (CO2 yang dikurangi, air yang dihemat).
    - Verifikasi pengambilan makanan melalui scan QR Code.

### 2. 👋 Penerima (Receiver)
*   **Tujuan**: Individu atau organisasi yang membutuhkan bantuan makanan.
*   **Fitur Utama**:
    - Menjelajahi makanan yang tersedia di sekitar lokasi.
    - Melakukan klaim makanan.
    - Membuat permintaan makanan (food requests).
    - Memberikan rating dan review setelah menerima donasi.

### 3. 🚴 Relawan (Volunteer)
*   **Tujuan**: Pihak yang membantu mobilisasi atau pengantaran makanan.
*   **Fitur Utama**:
    - Mengambil tugas pengantaran (misi).
    - Navigasi lokasi dari donatur ke penerima.
    - Melakukan dokumentasi pengambilan dan penyerahan makanan.
    - Mendapatkan poin reputasi dari setiap misi yang diselesaikan.

### 4. 🛠️ Admin / Manager
*   **Tujuan**: Pengawas dan pengelola ekosistem sistem.
*   **Fitur Utama**:
    - Dashboard ringkasan total dampak sosial dan distribusi makanan.
    - Manajemen pengguna (verifikasi, suspend, dll).
    - Penanganan laporan (reports) kendala di lapangan.
    - Pengaturan target sistem dan broadcast informasi.

### 5. 👑 Super Admin
*   **Tujuan**: Pemegang akses penuh sistem.
*   **Fitur Utama**:
    - Memiliki semua fungsi Admin.
    - Manajemen akun Admin lainnya.
    - Melihat log aktivitas sistem secara menyeluruh.

---

## 🤖 Integrasi AI
Aplikasi ini menggunakan **Google Gemini AI** untuk:
1. **Analisis Gambar**: Mendeteksi apakah foto makanan yang diunggah layak dan bukan benda mati/sampah.
2. **Kualitas & Kandungan**: Mengestimasi skor kehalalan dan mendeteksi bahan alergen.
3. **Kalkulasi Dampak**: Menghitung potensi penghematan sumber daya alam berdasarkan jenis makanan.
