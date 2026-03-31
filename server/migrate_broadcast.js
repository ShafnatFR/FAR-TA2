
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
        console.log('--- Migrasi Tabel Broadcasts ---');
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS broadcasts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                target VARCHAR(50) DEFAULT 'all',
                type VARCHAR(20) DEFAULT 'info',
                status VARCHAR(20) DEFAULT 'sent',
                author_id INT,
                read_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabel broadcasts berhasil dibuat/diverifikasi.');

        // Insert initial data if empty
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM broadcasts');
        if (rows[0].count === 0) {
            const initialBroadcasts = [
                ['Update Sistem v1.3.0', 'Kami telah memperbarui sistem poin dan menambahkan fitur AI Quality Audit baru. Terima kasih atas dukungan Anda!', 'all', 'success'],
                ['Maintenance Server Berhasil', 'Pemeliharaan sistem rutin telah selesai dilakukan. Aplikasi kini lebih stabil.', 'all', 'info'],
                ['Misi Baru: Area Gedebage', 'Ada 5 donasi besar membutuhkan pengantaran segera di area Gedebage. Cek menu logistik!', 'volunteer', 'warning']
            ];
            
            for (const b of initialBroadcasts) {
                await connection.query(
                    'INSERT INTO broadcasts (title, content, target, type) VALUES (?, ?, ?, ?)',
                    b
                );
            }
            console.log('✅ Data awal broadcast berhasil dimasukkan.');
        }

    } catch (error) {
        console.error('❌ Migrasi gagal:', error);
    } finally {
        await connection.end();
    }
}

migrate();
