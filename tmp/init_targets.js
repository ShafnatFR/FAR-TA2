
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function init() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'foodairescue'
    });

    console.log('Connecting to database...');

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_targets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                metric_key VARCHAR(50) NOT NULL UNIQUE,
                target_value DECIMAL(12,2) NOT NULL,
                label VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('Table admin_targets created or already exists.');

        const [rows] = await connection.query('SELECT COUNT(*) as count FROM admin_targets');
        if (rows[0].count === 0) {
            await connection.query(`
                INSERT INTO admin_targets (metric_key, target_value, label) VALUES 
                ('waste_kg', 50000.00, 'Target Penyelamatan Pangan'),
                ('co2_kg', 112500.00, 'Target Pengurangan CO2'),
                ('beneficiaries', 1000.00, 'Target Jangkauan Penerima')
            `);
            console.log('Initial targets inserted.');
        } else {
            console.log('Targets already exist, skipping insertion.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

init();
