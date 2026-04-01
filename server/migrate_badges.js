const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrateBadges() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('--- MIGRATING BADGES ---');

    try {
        // 1. Create user_badges if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_badges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                badge_id INT NOT NULL,
                awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
            )
        `);

        // 2. Data to Insert (Mapped from constants.ts)
        const badgesData = [
            // Provider (DONATUR)
            [101, 'Zero Waste Hero', 'DONATUR', 1000, '🌍', 'Menyelamatkan lebih dari 100kg makanan.', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600'],
            [102, 'Community Star', 'DONATUR', 500, '⭐', 'Mendapatkan rata-rata rating 4.8+.', 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=600'],
            
            // Volunteer (RELAWAN)
            [201, 'Speed Runner', 'RELAWAN', 800, '⚡', 'Menyelesaikan 10 misi urgent tepat waktu.', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=600'],
            [202, 'Long Haul', 'RELAWAN', 1500, '🚛', 'Total jarak tempuh lebih dari 500km.', 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=600'],
            
            // Receiver (PENERIMA)
            [301, 'Verified Account', 'PENERIMA', 100, '🛡️', 'Data diri lengkap dan terverifikasi.', 'https://images.unsplash.com/photo-1614030634955-ae5e90f9b9eb?auto=format&fit=crop&q=80&w=600'],
            [302, 'Food Saver', 'PENERIMA', 300, '🍱', 'Konsisten mengklaim dan mengulas makanan.', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600'],
            
            // All roles (NULL role)
            [401, 'Early Adopter', null, 50, '🚀', 'Bergabung di fase beta aplikasi.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600']
        ];

        // 3. Clear and Insert Badges
        await connection.query('DELETE FROM badges');
        for (const b of badgesData) {
            await connection.query(
                'INSERT INTO badges (id, name, role, min_points, icon, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
                b
            );
            console.log(`Inserted badge: ${b[1]}`);
        }

        console.log('--- MIGRATION SUCCESSFUL ---');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrateBadges();
