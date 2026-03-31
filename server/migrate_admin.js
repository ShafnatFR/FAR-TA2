
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'foodairescue'
    });

    try {
        console.log('Migrating system_logs table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                actor_id INT,
                actor_name VARCHAR(255),
                action VARCHAR(255),
                details TEXT,
                severity ENUM('info', 'warning', 'critical') DEFAULT 'info'
            )
        `);

        console.log('Adding permissions column to users table...');
        const [columns] = await connection.query('SHOW COLUMNS FROM users LIKE "permissions"');
        if (columns.length === 0) {
            await connection.query('ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT "[]"');
        }

        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
