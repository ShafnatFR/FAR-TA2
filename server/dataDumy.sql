SET FOREIGN_KEY_CHECKS = 0;

-- Kosongkan tabel agar ID dimulai dari 1 dan tidak ada duplikasi
TRUNCATE TABLE `badges`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `addresses`;
TRUNCATE TABLE `faqs`;
TRUNCATE TABLE `food_items`;
TRUNCATE TABLE `ai_verifications`;
TRUNCATE TABLE `social_impacts`;
TRUNCATE TABLE `food_requests`;
TRUNCATE TABLE `claims`;
TRUNCATE TABLE `reviews`;
TRUNCATE TABLE `reports`;
TRUNCATE TABLE `point_histories`;

-- 1. BADGES (20 Baris)
INSERT INTO `badges` (`id`, `name`, `role`, `min_points`, `description`) VALUES
(1, 'Donatur Pemula', 'DONATUR', 0, 'Memulai langkah baik berbagi makanan.'),
(2, 'Donatur Aktif', 'DONATUR', 100, 'Telah mendonasikan makanan beberapa kali.'),
(3, 'Donatur Dermawan', 'DONATUR', 500, 'Rutin berbagi makanan jumlah besar.'),
(4, 'Pahlawan Pangan', 'DONATUR', 1000, 'Duta utama donasi makanan.'),
(5, 'Legenda Donatur', 'DONATUR', 5000, 'Penyelamat puluhan ribu porsi makanan.'),
(6, 'Penerima Terdaftar', 'PENERIMA', 0, 'Terdaftar di platform sebagai penerima sah.'),
(7, 'Penerima Tertib', 'PENERIMA', 50, 'Selalu menerima makanan dengan baik.'),
(8, 'Komunitas Pangan', 'PENERIMA', 200, 'Penerima perwakilan komunitas.'),
(9, 'Penerima Jujur', 'PENERIMA', 500, 'Memberikan review jujur dan baik.'),
(10, 'Keluarga FoodAI', 'PENERIMA', 1000, 'Penerima setia yang taat aturan.'),
(11, 'Relawan Pemula', 'RELAWAN', 0, 'Relawan pengiriman baru.'),
(12, 'Kurir Kebaikan', 'RELAWAN', 100, 'Telah mengirimkan 10 donasi.'),
(13, 'Relawan Kilat', 'RELAWAN', 500, 'Pengiriman selalu tepat waktu.'),
(14, 'Pahlawan Jalanan', 'RELAWAN', 1000, 'Mendedikasikan waktu penuh untuk mengantar.'),
(15, 'Legenda Relawan', 'RELAWAN', 5000, 'Telah menyelesaikan ribuan pengiriman.'),
(16, 'Admin Magang', 'ADMIN', 0, 'Admin baru dalam pelatihan.'),
(17, 'Admin Junior', 'ADMIN', 500, 'Menangani laporan standar.'),
(18, 'Admin Senior', 'ADMIN', 1000, 'Mengelola user dan dispute berat.'),
(19, 'Admin Elite', 'ADMIN', 5000, 'Kepercayaan super tinggi.'),
(20, 'Supreme Leader', 'SUPER_ADMIN', 0, 'Pemegang kendali penuh sistem.');

-- 2. USERS (20 Baris: 5 Donatur, 5 Penerima, 5 Relawan, 4 Admin, 1 Super Admin)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `status`, `points`, `selected_badge_id`) VALUES
(1, 'Resto Nusantara', 'donatur1@mail.com', 'pass123', '08111111111', 'DONATUR', 'ACTIVE', 150, 2),
(2, 'Toko Roti Sedap', 'donatur2@mail.com', 'pass123', '08111111112', 'DONATUR', 'ACTIVE', 600, 3),
(3, 'Hotel Mawar', 'donatur3@mail.com', 'pass123', '08111111113', 'DONATUR', 'ACTIVE', 1200, 4),
(4, 'Katering Ibu Sari', 'donatur4@mail.com', 'pass123', '08111111114', 'DONATUR', 'ACTIVE', 50, 1),
(5, 'Supermarket Segar', 'donatur5@mail.com', 'pass123', '08111111115', 'DONATUR', 'ACTIVE', 5500, 5),
(6, 'Panti Asuhan Kasih', 'penerima1@mail.com', 'pass123', '08222222221', 'PENERIMA', 'ACTIVE', 60, 7),
(7, 'Komunitas Warga RT 05', 'penerima2@mail.com', 'pass123', '08222222222', 'PENERIMA', 'ACTIVE', 250, 8),
(8, 'Ibu Siti (Individu)', 'penerima3@mail.com', 'pass123', '08222222223', 'PENERIMA', 'ACTIVE', 10, 6),
(9, 'Yayasan Anak Bangsa', 'penerima4@mail.com', 'pass123', '08222222224', 'PENERIMA', 'ACTIVE', 600, 9),
(10, 'Pondok Lansia', 'penerima5@mail.com', 'pass123', '08222222225', 'PENERIMA', 'ACTIVE', 1100, 10),
(11, 'Andi (Motor)', 'relawan1@mail.com', 'pass123', '08333333331', 'RELAWAN', 'ACTIVE', 150, 12),
(12, 'Budi (Mobil)', 'relawan2@mail.com', 'pass123', '08333333332', 'RELAWAN', 'ACTIVE', 600, 13),
(13, 'Citra (Motor)', 'relawan3@mail.com', 'pass123', '08333333333', 'RELAWAN', 'ACTIVE', 1100, 14),
(14, 'Deni (Motor)', 'relawan4@mail.com', 'pass123', '08333333334', 'RELAWAN', 'ACTIVE', 50, 11),
(15, 'Eka (Mobil Box)', 'relawan5@mail.com', 'pass123', '08333333335', 'RELAWAN', 'ACTIVE', 5200, 15),
(16, 'Admin Fajar', 'admin1@mail.com', 'pass123', '08444444441', 'ADMIN', 'ACTIVE', 0, 16),
(17, 'Admin Gita', 'admin2@mail.com', 'pass123', '08444444442', 'ADMIN', 'ACTIVE', 600, 17),
(18, 'Admin Hadi', 'admin3@mail.com', 'pass123', '08444444443', 'ADMIN', 'ACTIVE', 1200, 18),
(19, 'Admin Indah', 'admin4@mail.com', 'pass123', '08444444444', 'ADMIN', 'ACTIVE', 5500, 19),
(20, 'Super Jaka', 'super@mail.com', 'pass123', '08555555555', 'SUPER_ADMIN', 'ACTIVE', 0, 20);

-- 3. ADDRESSES (20 Baris, didistribusikan ke user)
INSERT INTO `addresses` (`id`, `user_id`, `label`, `full_address`, `latitude`, `longitude`, `contact_name`, `contact_phone`, `is_primary`) VALUES
(1, 1, 'Resto Pusat', 'Jl. Braga No.1, Bandung', -6.917464, 107.619123, 'Manajer Resto', '08111111111', 1),
(2, 2, 'Toko Cabang A', 'Jl. Cihampelas, Bandung', -6.891234, 107.601234, 'Karyawan', '08111111112', 1),
(3, 3, 'Lobby Hotel', 'Jl. Asia Afrika, Bandung', -6.921234, 107.611234, 'Resepsionis', '08111111113', 1),
(4, 4, 'Dapur Pusat', 'Jl. Buah Batu, Bandung', -6.941234, 107.621234, 'Ibu Sari', '08111111114', 1),
(5, 5, 'Gudang Belakang', 'Jl. Setiabudi, Bandung', -6.871234, 107.591234, 'Kepala Gudang', '08111111115', 1),
(6, 6, 'Gedung Utama', 'Jl. Dago No. 100, Bandung', -6.881234, 107.611234, 'Pengurus Panti', '08222222221', 1),
(7, 7, 'Pos RW', 'Jl. Antapani, Bandung', -6.911234, 107.651234, 'Ketua RT', '08222222222', 1),
(8, 8, 'Rumah Tinggal', 'Kopo Permai, Bandung', -6.951234, 107.581234, 'Ibu Siti', '08222222223', 1),
(9, 9, 'Sekretariat', 'Jl. Pasteur, Bandung', -6.891234, 107.591234, 'Staf Yayasan', '08222222224', 1),
(10, 10, 'Panti Wreda', 'Cimahi, Jawa Barat', -6.871234, 107.541234, 'Pengurus Wreda', '08222222225', 1),
(11, 11, 'Kos Andi', 'Bojongsoang, Kab Bandung', -6.981234, 107.631234, 'Andi', '08333333331', 1),
(12, 12, 'Rumah Budi', 'Dayeuhkolot', -6.991234, 107.621234, 'Budi', '08333333332', 1),
(13, 13, 'Rumah Citra', 'Baleendah', -7.001234, 107.621234, 'Citra', '08333333333', 1),
(14, 14, 'Kos Deni', 'Cibiru', -6.931234, 107.711234, 'Deni', '08333333334', 1),
(15, 15, 'Garasi Eka', 'Ujung Berung', -6.911234, 107.691234, 'Eka', '08333333335', 1),
(16, 6, 'Cabang Panti', 'Lembang', -6.811234, 107.611234, 'Pengurus 2', '08222222221', 0),
(17, 1, 'Resto Cabang B', 'Pasteur', -6.891234, 107.581234, 'Manajer 2', '08111111111', 0),
(18, 5, 'Supermarket 2', 'Cicaheum', -6.901234, 107.651234, 'Supervisor', '08111111115', 0),
(19, 7, 'Balai Warga', 'Antapani Dalam', -6.915234, 107.655234, 'Sekretaris RT', '08222222222', 0),
(20, 2, 'Toko Roti Cab C', 'Dipatiukur', -6.891234, 107.611234, 'Karyawan C', '08111111112', 0);

-- 4. FOOD_ITEMS (20 Baris, provider_id harus 1-5 / DONATUR)
INSERT INTO `food_items` (`id`, `provider_id`, `name`, `description`, `initial_quantity`, `current_quantity`, `min_quantity`, `max_quantity`, `expiry_time`, `distribution_start_time`, `distribution_end_time`, `delivery_method`, `status`) VALUES
(1, 1, 'Nasi Goreng Spesial', 'Kelebihan produksi acara', 50, 20, 1, 10, '2026-03-28 20:00:00', '15:00:00', '19:00:00', 'BOTH', 'AVAILABLE'),
(2, 2, 'Roti Tawar Gandum', 'Batas jual hari ini', 30, 30, 1, 5, '2026-03-29 10:00:00', '18:00:00', '21:00:00', 'PICKUP', 'AVAILABLE'),
(3, 3, 'Buffet Sisa Breakfast', 'Sosis, telur, ayam', 100, 0, 10, 50, '2026-03-27 15:00:00', '11:00:00', '14:00:00', 'DELIVERY', 'CLAIMED'),
(4, 4, 'Nasi Kotak Ayam Bakar', 'Sisa pesanan batal', 25, 5, 1, 25, '2026-03-28 14:00:00', '12:00:00', '14:00:00', 'BOTH', 'AVAILABLE'),
(5, 5, 'Buah Apel & Jeruk', 'Kemasan sobek, buah aman', 40, 40, 5, 20, '2026-04-01 10:00:00', '08:00:00', '20:00:00', 'BOTH', 'AVAILABLE'),
(6, 1, 'Mie Goreng Seafood', 'Sisa event', 20, 20, 1, 5, '2026-03-28 21:00:00', '16:00:00', '20:00:00', 'PICKUP', 'AVAILABLE'),
(7, 2, 'Kue Sus', 'Tidak laku terjual', 15, 0, 1, 5, '2026-03-27 22:00:00', '19:00:00', '21:00:00', 'PICKUP', 'CLAIMED'),
(8, 3, 'Soto Ayam', 'Kelebihan kuah dan isi', 40, 10, 2, 10, '2026-03-28 12:00:00', '09:00:00', '11:00:00', 'DELIVERY', 'AVAILABLE'),
(9, 4, 'Snack Box', 'Isi lemper dan risoles', 50, 50, 5, 20, '2026-03-29 12:00:00', '07:00:00', '10:00:00', 'BOTH', 'AVAILABLE'),
(10, 5, 'Sayur Bayam Organik', 'Sayur sedikit layu', 30, 0, 5, 30, '2026-03-27 18:00:00', '12:00:00', '17:00:00', 'PICKUP', 'EXPIRED'),
(11, 1, 'Ayam Geprek', 'Porsi lebih', 10, 10, 1, 5, '2026-03-28 20:00:00', '14:00:00', '18:00:00', 'BOTH', 'AVAILABLE'),
(12, 2, 'Croissant Sisa', 'Sisa display', 20, 20, 1, 10, '2026-03-28 21:00:00', '18:00:00', '20:00:00', 'PICKUP', 'AVAILABLE'),
(13, 3, 'Salad Buah', 'Sisa menu hotel', 15, 5, 1, 5, '2026-03-28 10:00:00', '08:00:00', '10:00:00', 'DELIVERY', 'AVAILABLE'),
(14, 4, 'Nasi Kuning Ulang Tahun', 'Orderan di-cancel', 60, 60, 10, 60, '2026-03-28 13:00:00', '09:00:00', '12:00:00', 'BOTH', 'AVAILABLE'),
(15, 5, 'Susu Segar 1L', 'Mendekati ED', 20, 20, 1, 4, '2026-03-30 23:59:00', '08:00:00', '21:00:00', 'BOTH', 'AVAILABLE'),
(16, 1, 'Sup Iga', 'Porsi sisa malam', 10, 0, 1, 5, '2026-03-27 23:00:00', '20:00:00', '22:00:00', 'DELIVERY', 'CLAIMED'),
(17, 2, 'Muffin Coklat', 'Sisa hari ini', 25, 25, 1, 10, '2026-03-29 10:00:00', '19:00:00', '21:00:00', 'PICKUP', 'AVAILABLE'),
(18, 3, 'Pasta Bolognese', 'Menu sisa lunch', 35, 15, 2, 10, '2026-03-28 16:00:00', '13:00:00', '15:00:00', 'BOTH', 'AVAILABLE'),
(19, 4, 'Kue Tampah', 'Sisa peresmian gedung', 5, 5, 1, 5, '2026-03-28 18:00:00', '14:00:00', '17:00:00', 'BOTH', 'AVAILABLE'),
(20, 5, 'Daging Ayam Cincang', 'Kemasan rusak', 10, 10, 1, 5, '2026-03-29 12:00:00', '08:00:00', '20:00:00', 'DELIVERY', 'AVAILABLE');

-- 5. AI_VERIFICATIONS (20 Baris, tersambung ke 20 food_items)
INSERT INTO `ai_verifications` (`id`, `food_id`, `is_edible`, `halal_score`, `quality_score`, `reason`, `ingredients`) VALUES
(1, 1, 1, 100, 90, 'Kualitas warna dan tekstur sangat baik.', '["Nasi", "Bawang", "Kecap", "Telur"]'),
(2, 2, 1, 100, 85, 'Roti masih empuk, tidak ada jamur.', '["Tepung Gandum", "Ragi", "Air"]'),
(3, 3, 1, 90, 80, 'Beberapa item sedikit berminyak tapi aman.', '["Sosis Ayam", "Telur", "Sayuran"]'),
(4, 4, 1, 100, 95, 'Dikemas rapat dan rapi.', '["Nasi", "Ayam Bakar", "Sambal"]'),
(5, 5, 1, 100, 75, 'Kulit apel sedikit memar, dalam baik.', '["Apel", "Jeruk"]'),
(6, 6, 1, 95, 85, 'Warna cerah, bau normal.', '["Mie", "Udang", "Cumi"]'),
(7, 7, 1, 100, 80, 'Krim masih padat, belum asam.', '["Tepung", "Telur", "Susu", "Gula"]'),
(8, 8, 1, 100, 90, 'Kuah kaldu jernih.', '["Ayam", "Kaldu", "Bihun"]'),
(9, 9, 1, 100, 95, 'Kondisi kemasan utuh.', '["Beras Ketan", "Ayam", "Tepung", "Wortel"]'),
(10, 10, 0, 100, 40, 'Sebagian daun sudah busuk berlendir.', '["Bayam"]'),
(11, 11, 1, 100, 88, 'Ayam krispi masih bagus.', '["Ayam", "Tepung", "Cabai"]'),
(12, 12, 1, 100, 82, 'Sedikit mengeras di luar.', '["Tepung", "Mentega", "Ragi"]'),
(13, 13, 1, 100, 90, 'Potongan buah segar, saus terpisah.', '["Melon", "Semangka", "Mayones"]'),
(14, 14, 1, 100, 95, 'Kondisi utuh dan higienis.', '["Nasi", "Kunyit", "Telur Dadar"]'),
(15, 15, 1, 100, 80, 'Kemasan segel, bau normal.', '["Susu Sapi Segar"]'),
(16, 16, 1, 100, 85, 'Daging empuk, kuah baik.', '["Iga Sapi", "Wortel", "Kentang"]'),
(17, 17, 1, 100, 88, 'Tekstur lembut.', '["Coklat", "Tepung", "Telur"]'),
(18, 18, 1, 95, 80, 'Saus agak mengering di permukaan.', '["Pasta", "Daging Sapi Sisa", "Tomat"]'),
(19, 19, 1, 100, 92, 'Bentuk tradisional terjaga baik.', '["Ketan", "Gula Merah", "Kelapa"]'),
(20, 20, 1, 100, 70, 'Hanya plastik luar yang sobek.', '["Daging Ayam"]');

-- 6. SOCIAL_IMPACTS (20 Baris, tersambung ke 20 food_items)
INSERT INTO `social_impacts` (`id`, `food_id`, `total_potential_points`, `co2_per_portion`, `water_saved_liter`, `land_saved_sqm`, `impact_details`) VALUES
(1, 1, 250, 0.50, 10.5, 0.2, '{"detail": "Menghemat emisi metana dari nasi"}'),
(2, 2, 150, 0.30, 5.0, 0.1, '{"detail": "Menghemat tepung gandum"}'),
(3, 3, 500, 1.20, 50.0, 0.8, '{"detail": "Penyelamatan protein hewani tinggi dampak"}'),
(4, 4, 125, 0.80, 25.0, 0.5, '{"detail": "Dampak karbon ayam bakar"}'),
(5, 5, 200, 0.20, 15.0, 0.3, '{"detail": "Mencegah pembusukan buah berair"}'),
(6, 6, 100, 0.60, 20.0, 0.4, '{"detail": "Seafood impact saved"}'),
(7, 7, 75, 0.40, 8.0, 0.1, '{"detail": "Dairy product saved"}'),
(8, 8, 200, 0.70, 30.0, 0.5, '{"detail": "Kaldu ayam saved"}'),
(9, 9, 250, 0.30, 12.0, 0.2, '{"detail": "Snack ringan"}'),
(10, 10, 0, 0.10, 5.0, 0.1, '{"detail": "Gagal diselamatkan"}'),
(11, 11, 50, 0.80, 25.0, 0.5, '{"detail": "Ayam broiler"}'),
(12, 12, 100, 0.40, 6.0, 0.1, '{"detail": "Tepung import"}'),
(13, 13, 75, 0.20, 10.0, 0.2, '{"detail": "Buah lokal"}'),
(14, 14, 300, 0.50, 15.0, 0.3, '{"detail": "Nasi kuning bumbu"}'),
(15, 15, 100, 0.90, 40.0, 0.6, '{"detail": "Produk perah"}'),
(16, 16, 50, 2.00, 100.0, 1.5, '{"detail": "Daging sapi emisi tinggi"}'),
(17, 17, 125, 0.40, 8.0, 0.1, '{"detail": "Coklat import"}'),
(18, 18, 175, 1.50, 80.0, 1.2, '{"detail": "Daging sapi cincang"}'),
(19, 19, 25, 0.20, 5.0, 0.1, '{"detail": "Kue tradisional"}'),
(20, 20, 50, 0.80, 25.0, 0.5, '{"detail": "Protein hewani mentah"}');

-- 7. FOOD_REQUESTS (20 Baris, diposting oleh PENERIMA id 6-10)
INSERT INTO `food_requests` (`id`, `receiver_id`, `title`, `description`, `needed_quantity`, `status`) VALUES
(1, 6, 'Butuh Nasi Kotak untuk Jumat Berkah', 'Untuk 50 anak yatim', 50, 'ACTIVE'),
(2, 7, 'Kebutuhan Sembako Warga Terdampak Banjir', 'Beras dan mie instan', 100, 'ACTIVE'),
(3, 8, 'Lauk Pauk Malam Hari', 'Untuk makan malam keluarga 3 orang', 3, 'COMPLETED'),
(4, 9, 'Bahan Makanan Mentah untuk Dapur Umum', 'Sayur dan daging ayam', 20, 'ACTIVE'),
(5, 10, 'Susu dan Bubur Lansia', 'Kebutuhan nutrisi lansia tanpa gigi', 30, 'ACTIVE'),
(6, 6, 'Snack untuk Acara Belajar', 'Roti atau kue ringan', 40, 'COMPLETED'),
(7, 7, 'Makan Siang Warga Gotong Royong', 'Nasi rames bebas', 25, 'ACTIVE'),
(8, 8, 'Roti Tawar untuk Sarapan', 'Sarapan esok hari', 2, 'ACTIVE'),
(9, 9, 'Sayuran Segar', 'Kebutuhan vitamin anak panti', 15, 'ACTIVE'),
(10, 10, 'Buah-buahan Lembek', 'Pisang atau pepaya untuk lansia', 20, 'COMPLETED'),
(11, 6, 'Minuman Kemasan', 'Air mineral atau teh', 50, 'ACTIVE'),
(12, 7, 'Lauk Jadi', 'Ayam goreng atau tempe', 30, 'ACTIVE'),
(13, 8, 'Nasi Putih Matang', 'Nasi saja tidak apa-apa', 5, 'ACTIVE'),
(14, 9, 'Kue Ulang Tahun', 'Ada anak panti yang ultah', 1, 'ACTIVE'),
(15, 10, 'Biskuit Gembur', 'Cemilan sore lansia', 15, 'ACTIVE'),
(16, 6, 'Lauk Pauk Pagi', 'Telor ceplok atau dadar', 50, 'ACTIVE'),
(17, 7, 'Daging Sapi Mentah', 'Untuk masak rendang warga', 5, 'ACTIVE'),
(18, 8, 'Kecap dan Saus', 'Kebutuhan bumbu dapur', 2, 'ACTIVE'),
(19, 9, 'Makan Malam Jumat', 'Nasi box bebas', 40, 'ACTIVE'),
(20, 10, 'Bubur Kacang Ijo', 'Sarapan sehat lansia', 30, 'ACTIVE');

-- 8. CLAIMS (20 Baris. Mengaitkan Penerima (6-10), Relawan (11-15), Food (1-20), Address Penerima (6-10))
INSERT INTO `claims` (`id`, `food_id`, `receiver_id`, `volunteer_id`, `address_id`, `claimed_quantity`, `delivery_method`, `status`, `unique_code`, `is_scanned`, `completed_at`) VALUES
(1, 1, 6, 11, 6, 30, 'DELIVERY', 'COMPLETED', 'CODE001', 1, '2026-03-27 18:00:00'),
(2, 3, 7, 12, 7, 100, 'DELIVERY', 'COMPLETED', 'CODE002', 1, '2026-03-27 12:00:00'),
(3, 4, 8, NULL, 8, 5, 'PICKUP', 'COMPLETED', 'CODE003', 1, '2026-03-27 13:00:00'),
(4, 7, 9, 13, 9, 15, 'DELIVERY', 'IN_PROGRESS', 'CODE004', 0, NULL),
(5, 16, 10, NULL, 10, 10, 'PICKUP', 'COMPLETED', 'CODE005', 1, '2026-03-27 21:00:00'),
(6, 2, 6, NULL, 6, 5, 'PICKUP', 'PENDING', 'CODE006', 0, NULL),
(7, 5, 7, 14, 7, 10, 'DELIVERY', 'PENDING', 'CODE007', 0, NULL),
(8, 8, 8, 15, 8, 5, 'DELIVERY', 'COMPLETED', 'CODE008', 1, '2026-03-27 10:30:00'),
(9, 13, 9, 11, 9, 10, 'DELIVERY', 'IN_PROGRESS', 'CODE009', 0, NULL),
(10, 18, 10, NULL, 10, 10, 'PICKUP', 'PENDING', 'CODE010', 0, NULL),
(11, 4, 6, 12, 6, 15, 'DELIVERY', 'COMPLETED', 'CODE011', 1, '2026-03-26 13:00:00'),
(12, 8, 7, 13, 7, 10, 'DELIVERY', 'CANCELLED', 'CODE012', 0, NULL),
(13, 11, 8, NULL, 8, 5, 'PICKUP', 'COMPLETED', 'CODE013', 1, '2026-03-26 15:00:00'),
(14, 14, 9, 14, 9, 20, 'DELIVERY', 'COMPLETED', 'CODE014', 1, '2026-03-26 11:00:00'),
(15, 15, 10, 15, 10, 5, 'DELIVERY', 'IN_PROGRESS', 'CODE015', 0, NULL),
(16, 17, 6, NULL, 6, 10, 'PICKUP', 'PENDING', 'CODE016', 0, NULL),
(17, 19, 7, 11, 7, 5, 'DELIVERY', 'PENDING', 'CODE017', 0, NULL),
(18, 20, 8, 12, 8, 2, 'DELIVERY', 'PENDING', 'CODE018', 0, NULL),
(19, 1, 9, NULL, 9, 10, 'PICKUP', 'COMPLETED', 'CODE019', 1, '2026-03-26 18:30:00'),
(20, 8, 10, 13, 10, 15, 'DELIVERY', 'IN_PROGRESS', 'CODE020', 0, NULL);

-- 9. REVIEWS (20 Baris. Hanya dari claim yang COMPLETED. partner_id adalah provider/relawan)
INSERT INTO `reviews` (`id`, `claim_id`, `user_id`, `partner_id`, `food_id`, `rating`, `comment`, `review_media`) VALUES
(1, 1, 6, 1, 1, 5, 'Nasinya masih sangat enak dan hangat!', '["img1.jpg"]'),
(2, 2, 7, 3, 3, 4, 'Alhamdulillah warga senang, tapi agak berminyak.', '["img2.jpg"]'),
(3, 3, 8, 4, 4, 5, 'Ayam bakarnya juara, terima kasih!', '[]'),
(4, 5, 10, 1, 16, 5, 'Sup iganya empuk untuk lansia.', '["img3.jpg"]'),
(5, 8, 8, 3, 8, 4, 'Soto ayamnya segar.', '[]'),
(6, 11, 6, 4, 4, 5, 'Lagi-lagi ayam bakar dari Ibu Sari mantap.', '["img4.jpg"]'),
(7, 13, 8, 1, 11, 5, 'Ayam geprek pedas nampol.', '[]'),
(8, 14, 9, 4, 14, 5, 'Nasi kuning pas untuk anak panti.', '["img5.jpg"]'),
(9, 19, 9, 1, 1, 4, 'Nasi goreng sedikit keras tapi masih oke.', '[]'),
(10, 4, 9, 13, 7, 3, 'Relawannya agak nyasar tadi, jadi lama.', '[]'),
(11, 6, 6, 2, 2, 5, 'Roti tawarnya langsung kami makan pakai selai.', '["img6.jpg"]'),
(12, 7, 7, 5, 5, 5, 'Apelnya segar banget untuk anak-anak.', '[]'),
(13, 9, 9, 3, 13, 5, 'Salad buahnya premium banget.', '["img7.jpg"]'),
(14, 10, 10, 3, 18, 4, 'Pasta bolognese enak, makasih hotel mawar.', '[]'),
(15, 12, 7, 3, 8, 1, 'Batal karena relawan ban bocor, gak jadi nyoba soto.', '[]'),
(16, 15, 10, 5, 15, 5, 'Susu segar langsung dibagikan ke nenek-nenek.', '["img8.jpg"]'),
(17, 16, 6, 2, 17, 5, 'Muffin coklat nyoklat banget.', '[]'),
(18, 17, 7, 4, 19, 5, 'Kue tampahnya cantik dan manis.', '["img9.jpg"]'),
(19, 18, 8, 5, 20, 5, 'Daging ayam langsung dimasak rica-rica.', '[]'),
(20, 20, 10, 3, 8, 5, 'Soto ayam buat makan siang panti, kuahnya banyak.', '["img10.jpg"]');

-- 10. REPORTS (20 Baris, terkait masalah claim atau komplain)
INSERT INTO `reports` (`id`, `reporter_id`, `claim_id`, `category`, `description`, `evidence_photo`, `status`, `admin_notes`) VALUES
(1, 9, 10, 'DELAY', 'Pengiriman lama sekali, sudah 2 jam', 'ev1.jpg', 'RESOLVED', 'Relawan sudah ditegur'),
(2, 7, 12, 'CANCELLED', 'Relawan membatalkan sepihak tanpa info', 'ev2.jpg', 'RESOLVED', 'Telah dikonfirmasi ban relawan bocor'),
(3, 6, 1, 'FOOD_QUALITY', 'Ada satu box nasi yang baunya agak asam', 'ev3.jpg', 'IN_PROGRESS', 'Sedang dicek ke donatur'),
(4, 8, 3, 'APP_ERROR', 'Aplikasi sempat error saat scan QR', NULL, 'RESOLVED', 'Bug diperbaiki di versi 1.1'),
(5, 10, 5, 'MISTAKE', 'Jumlah makanan kurang 1 porsi', 'ev4.jpg', 'RESOLVED', 'Donatur sudah minta maaf, salah hitung'),
(6, 11, 1, 'BEHAVIOR', 'Penerima tidak ada di tempat saat sampai', 'ev5.jpg', 'REJECTED', 'Penerima sedang ke toilet'),
(7, 12, 2, 'LOCATION', 'Titik map di aplikasi tidak akurat', 'ev6.jpg', 'NEW', NULL),
(8, 13, 4, 'LOCATION', 'Gang terlalu sempit untuk motor', 'ev7.jpg', 'NEW', NULL),
(9, 14, 7, 'FOOD_SPILL', 'Sayur tumpah karena jalan berlubang', 'ev8.jpg', 'IN_PROGRESS', 'Menunggu respon donatur untuk packaging'),
(10, 15, 8, 'DELAY', 'Resto lambat menyiapkan barang', 'ev9.jpg', 'NEW', NULL),
(11, 1, 1, 'BEHAVIOR', 'Relawan tidak ramah', NULL, 'NEW', NULL),
(12, 2, 6, 'NO_SHOW', 'Penerima tidak datang ambil makanan (pickup)', NULL, 'IN_PROGRESS', 'Menghubungi penerima'),
(13, 3, 2, 'BEHAVIOR', 'Relawan tidak pakai atribut lengkap', 'ev10.jpg', 'RESOLVED', 'Sudah diberi peringatan ke relawan'),
(14, 4, 11, 'APP_ERROR', 'Tombol complete tidak bisa ditekan', NULL, 'RESOLVED', 'Diperbaiki tim IT'),
(15, 5, 7, 'PACKAGING', 'Penerima komplain packaging kurang aman', 'ev11.jpg', 'NEW', NULL),
(16, 6, 11, 'FOOD_QUALITY', 'Ayam bakar sedikit gosong', 'ev12.jpg', 'REJECTED', 'Bukan tidak layak makan, hanya variasi bakaran'),
(17, 7, 17, 'DELAY', 'Status masih pending terus', NULL, 'NEW', NULL),
(18, 8, 18, 'MISTAKE', 'Pesanan tertukar dengan orang lain', 'ev13.jpg', 'IN_PROGRESS', 'Mencari relawan yang menukar'),
(19, 9, 19, 'NO_SHOW', 'Sudah dipesan pickup tapi batal mendadak', NULL, 'NEW', NULL),
(20, 10, 20, 'APP_ERROR', 'Notifikasi tidak masuk', NULL, 'RESOLVED', 'Masalah jaringan user');

-- 11. POINT_HISTORIES (20 Baris, melacak pergerakan poin user)
INSERT INTO `point_histories` (`id`, `user_id`, `amount`, `activity_type`, `reference_id`) VALUES
(1, 1, 50, 'DONATION_COMPLETED', 1),
(2, 3, 100, 'DONATION_COMPLETED', 3),
(3, 4, 25, 'DONATION_COMPLETED', 4),
(4, 11, 20, 'DELIVERY_COMPLETED', 1),
(5, 12, 30, 'DELIVERY_COMPLETED', 2),
(6, 6, 5, 'CLAIM_COMPLETED', 1),
(7, 7, 5, 'CLAIM_COMPLETED', 2),
(8, 8, 5, 'CLAIM_COMPLETED', 3),
(9, 1, 50, 'DONATION_COMPLETED', 16),
(10, 10, 5, 'CLAIM_COMPLETED', 5),
(11, 3, 50, 'DONATION_COMPLETED', 8),
(12, 15, 20, 'DELIVERY_COMPLETED', 8),
(13, 8, 5, 'CLAIM_COMPLETED', 8),
(14, 4, 25, 'DONATION_COMPLETED', 4),
(15, 12, 20, 'DELIVERY_COMPLETED', 11),
(16, 6, 5, 'CLAIM_COMPLETED', 11),
(17, 1, 25, 'DONATION_COMPLETED', 11),
(18, 8, 5, 'CLAIM_COMPLETED', 13),
(19, 4, 50, 'DONATION_COMPLETED', 14),
(20, 14, 20, 'DELIVERY_COMPLETED', 14);

-- 12. FAQS (20 Baris)
INSERT INTO `faqs` (`id`, `category`, `question`, `answer`) VALUES
(1, 'General', 'Apa itu FoodAI Rescue?', 'Aplikasi platform donasi makanan berlebih untuk mencegah food waste.'),
(2, 'General', 'Siapa saja yang bisa bergabung?', 'Siapa saja, baik sebagai Donatur, Penerima, maupun Relawan pengantar.'),
(3, 'General', 'Apakah aplikasi ini berbayar?', 'Tidak, aplikasi ini 100% gratis untuk tujuan sosial.'),
(4, 'Donatur', 'Makanan apa yang bisa didonasikan?', 'Makanan layak konsumsi, belum basi, dan sisa berlebih (bukan sisa gigitan).'),
(5, 'Donatur', 'Bagaimana AI memverifikasi makanan?', 'AI menganalisis foto makanan dan bahan yang Anda input untuk kelayakan.'),
(6, 'Donatur', 'Siapa yang menanggung ongkir?', 'Relawan mengantarkan secara gratis atas dasar sukarela.'),
(7, 'Donatur', 'Apakah saya bisa atur jam ambil?', 'Bisa, Anda bisa mengatur jam distribusi di form donasi.'),
(8, 'Penerima', 'Bagaimana cara meminta makanan?', 'Anda bisa memilih makanan yang tersedia di feed atau posting di Food Requests.'),
(9, 'Penerima', 'Apakah ada batas klaim per hari?', 'Ada, sistem membatasi agar distribusi merata ke semua penerima.'),
(10, 'Penerima', 'Apakah harus dijemput sendiri?', 'Bisa dijemput (Pickup) atau diantar Relawan (Delivery) tergantung opsi donatur.'),
(11, 'Penerima', 'Bagaimana jika makanan basi?', 'Segera lapor via fitur Report agar admin dan donatur bisa menindaklanjuti.'),
(12, 'Relawan', 'Apa syarat jadi relawan?', 'Memiliki kendaraan, smartphone, dan niat baik untuk membantu sesama.'),
(13, 'Relawan', 'Apakah relawan digaji?', 'Tidak, ini adalah kegiatan sosial, namun Anda akan mendapat poin dan badge.'),
(14, 'Relawan', 'Poin bisa ditukar apa?', 'Poin menentukan rank badge Anda dan bisa ditukar merchandise di event tertentu.'),
(15, 'Relawan', 'Bagaimana jika ban bocor di jalan?', 'Batalkan pesanan di aplikasi dan berikan alasan agar dilempar ke relawan lain.'),
(16, 'Sistem', 'Apa fungsi skor Halal?', 'AI mendeteksi kemungkinan bahan non-halal dari input komposisi untuk keamanan penerima muslim.'),
(17, 'Sistem', 'Bagaimana cara scan QR Code?', 'Gunakan kamera di dalam aplikasi saat bertemu donatur/penerima.'),
(18, 'Sistem', 'Dampak sosial dihitung dari mana?', 'Dari jenis makanan dan berat porsi yang berhasil diselamatkan.'),
(19, 'Akun', 'Cara ganti password?', 'Masuk ke profil > Pengaturan > Ganti Password.'),
(20, 'Akun', 'Bisa punya 2 role sekaligus?', 'Saat ini 1 email 1 role. Silakan daftar dengan email berbeda jika ingin role lain.');

SET FOREIGN_KEY_CHECKS = 1;