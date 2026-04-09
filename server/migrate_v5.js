const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    console.log('Starting migration v5...');
    
    // Create a connection without database selected to create it if it doesn't exist
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log(`Ensuring database ${process.env.DB_NAME} exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);

        // 1. Add subscription columns to users
        console.log('Adding columns to users table...');
        try {
            await connection.query("ALTER TABLE users ADD COLUMN ai_subscription_status ENUM('FREE', 'SUBSCRIBER') DEFAULT 'FREE'");
            console.log('Added ai_subscription_status column.');
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME' || e.errno === 1060) console.log('ai_subscription_status already exists.');
            else throw e;
        }

        try {
            await connection.query("ALTER TABLE users ADD COLUMN ai_subscription_expires_at TIMESTAMP NULL");
            console.log('Added ai_subscription_expires_at column.');
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME' || e.errno === 1060) console.log('ai_subscription_expires_at already exists.');
            else throw e;
        }

        // 2. Create user_ai_keys table
        console.log('Creating user_ai_keys table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_ai_keys (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                api_key TEXT NOT NULL,
                label VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('user_ai_keys table created or already exists.');

        // 3. Add index to corporate_ai_generations
        console.log('Adding index to corporate_ai_generations...');
        try {
            await connection.query("CREATE INDEX idx_donor_id ON corporate_ai_generations(donor_id)");
            console.log('Index idx_donor_id created.');
        } catch (e) {
             console.log('Index might already exist or table missing. Skipping index error.');
        }

        console.log('Migration v5 completed successfully.');
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        await connection.end();
        process.exit(1);
    }
}

migrate();
