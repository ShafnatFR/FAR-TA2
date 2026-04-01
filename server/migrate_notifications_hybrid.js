
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'foodairescue'
    });

    try {
        console.log('--- Migrasi Tabel Notifikasi Hybrid ---');
        
        // 1. Perbaiki/Buat tabel notifications (Personal)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                linked_id VARCHAR(50),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (user_id),
                INDEX (created_at)
            )
        `);
        console.log('✅ Tabel notifications (personal) siap.');

        // 2. Buat tabel broadcast_reads
        await connection.query(`
            CREATE TABLE IF NOT EXISTS broadcast_reads (
                user_id INT NOT NULL,
                broadcast_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, broadcast_id),
                FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabel broadcast_reads (tracking) siap.');

        // 3. Tambahkan kolom status ke tabel broadcasts jika belum ada (opsional, untuk filter)
        // Sudah ada di migrasi sebelumnya (draft/sent)

    } catch (error) {
        console.error('❌ Migrasi gagal:', error);
    } finally {
        await connection.end();
    }
}

migrate();
