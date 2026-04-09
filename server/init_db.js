const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function init() {
    console.log('Initializing/Migrating database to Phase 5...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);
        
        // Check if users table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
        if (tables.length === 0) {
            console.log('Database empty. Applying base schema from foodairescue.sql...');
            const sql = fs.readFileSync(path.join(__dirname, 'foodairescue.sql'), 'utf8');
            await connection.query(sql);
            console.log('Base schema applied.');
        } else {
            console.log('Database already has schema. Proceeding to migration only.');
        }
        
        // Phase 5 Migration Logic
        console.log('Applying Phase 5 Migration...');
        
        const alterStatements = [
            "ALTER TABLE users ADD COLUMN ai_subscription_status ENUM('FREE', 'SUBSCRIBER') DEFAULT 'FREE'",
            "ALTER TABLE users ADD COLUMN ai_subscription_expires_at TIMESTAMP NULL"
        ];

        for (const sql of alterStatements) {
            try {
                await connection.query(sql);
                console.log(`Executed: ${sql}`);
            } catch (e) {
                if (e.errno === 1060) console.log('Column already exists.');
                else console.warn('Warning:', e.message);
            }
        }

        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_ai_keys (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                api_key TEXT NOT NULL,
                label VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        try {
            await connection.query("CREATE INDEX idx_donor_id ON corporate_ai_generations(donor_id)");
            console.log('Index idx_donor_id created.');
        } catch (e) {
            console.log('Index might already exist or table missing.');
        }

        console.log('Database Phase 5 Ready.');
        await connection.end();
    } catch (err) {
        console.error('Migration failed:', err);
        await connection.end();
        process.exit(1);
    }
}

init();
