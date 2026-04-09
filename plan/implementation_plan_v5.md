# Phase 5: Universal AI Sovereignty & Master Admin

Fase ini memperluas kemandirian API Key ke semua jenis donatur (Umum & Korporat) serta penerima, memperkenalkan fitur "Kitchen Scanner" bertenaga Vision AI, dan menyempurnakan kontrol Admin.

## User Review Required

> [!IMPORTANT]
> **API Key untuk Semua**: Sekarang, Donatur Umum dan Penerima juga dapat memasukkan API Key Gemini mereka sendiri di profil. Ini adalah langkah preventif agar limit API global aplikasi tidak cepat habis oleh permintaan resep atau analisis gambar yang intensif.

> [!IMPORTANT]
> **Fitur Baru: Kitchen Scanner**: Fitur ini memungkinkan Donatur Umum dan Penerima untuk memotret bahan makanan acak dan mendapatkan rekomendasi resep sisa pangan (Zero Waste Recipe). Fitur ini **tidak tersedia** untuk Relawan karena fokus tugas mereka adalah verifikasi logistik.

## Proposed Changes

### 1. Universal AI Key Management
#### [MODIFY] [ProfileIndex.tsx](file:///home/shaf/development/jagoAI/FAR/FAR-TA2/view/profile/index.tsx)
- Menampilkan menu "Pengaturan AI API" untuk semua role kecuali Relawan.
- Menghubungkan ke komponen `AIApiManagement.tsx`.

#### [NEW] [AIApiManagement.tsx](file:///home/shaf/development/jagoAI/FAR/FAR-TA2/view/profile/components/AIApiManagement.tsx)
- Antarmuka untuk input API Key pribadi (Gemini) bagi Donatur Umum, Korporat, dan Penerima.

---

### 2. Kitchen Scanner (Vision AI Recipes)
#### [NEW] [KitchenScanner.tsx](file:///home/shaf/development/jagoAI/FAR/FAR-TA2/view/common/KitchenScanner.tsx)
- Komponen kamera bertenaga Vision AI.
- Input: Foto bahan makanan.
- Output: Daftar bahan terdeteksi + Resep kreatif + Tips penyimpanan.

#### [MODIFY] [ProviderIndex.tsx](file:///home/shaf/development/jagoAI/FAR/FAR-TA2/view/provider/index.tsx) & [ReceiverIndex.tsx](file:///home/shaf/development/jagoAI/FAR/FAR-TA2/view/receiver/index.tsx)
- Menambahkan widget "Kreasikan Sisa Pangan" yang membuka `KitchenScanner`.

---

### 3. Logika Backend & Keamanan
#### [MODIFY] [server/index.js](file:///home/shaf/development/jagoAI/FAR/FAR-TA2/server/index.js)
- **Modifikasi Perutean API**: Semua permintaan AI (Recipe, Vision Scanner, CSR Writer) akan mengecek:
    1. Jika User adalah `SUBSCRIBER` -> Gunakan Master Key Korporat.
    2. Jika User punya `manual_api_key` di DB -> Gunakan Key tersebut.
    3. Jika tidak ada keduanya -> Tolak permintaan untuk fitur non-vital (menghemat Global Pool).
- **Logika Global Pool**: Tetap digunakan hanya untuk **Validasi Kualitas Pangan** (vital audit).

---

### 4. Admin Command Center
- **LogViewer.tsx**: Audit trail aktivitas sistem.
- **Subscriber Management**: Kemampuan Admin meningkatkan status donatur menjadi Subscriber.

## Verification Plan

### Manual Verification
1. **Donatur Umum**: Masukkan API Key di profil, gunakan "Kitchen Scanner", pastikan key pribadi yang digunakan.
2. **Penerima**: Gunakan Kitchen Scanner untuk mencari ide masakan.
3. **Relawan**: Pastikan tidak ada menu Scanner Bahan/Input API Key.
4. **Admin**: Cek Log untuk memastikan penggunaan API Key terdistribusi dengan benar.
