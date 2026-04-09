
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigrations() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'foodairescue',
        multipleStatements: true
    };

    const connection = await mysql.createConnection(config);

    try {
        console.log('--- STARTING MASTER MIGRATION ---');

        // 1. Admin & System Logs Migration (Permissions)
        console.log('\n[1/3] Running Admin & Logs Migration...');
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
        const [userCols] = await connection.query('SHOW COLUMNS FROM users LIKE "permissions"');
        if (userCols.length === 0) {
            await connection.query('ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT "[]"');
            console.log('Added "permissions" column to users table.');
        }

        // 2. Claims Courier Migration
        console.log('\n[2/3] Running Claims Courier Migration...');
        const [claimCols] = await connection.query('SHOW COLUMNS FROM claims');
        const claimColNames = claimCols.map(c => c.Field);
        if (!claimColNames.includes('courier_name')) {
            await connection.query('ALTER TABLE claims ADD COLUMN courier_name VARCHAR(255) DEFAULT NULL');
            console.log('Added "courier_name" to claims.');
        }
        if (!claimColNames.includes('courier_status')) {
            await connection.query('ALTER TABLE claims ADD COLUMN courier_status VARCHAR(50) DEFAULT NULL');
            console.log('Added "courier_status" to claims.');
        }

        // 3. User Roles Migration (The Safe Update)
        console.log('\n[3/3] Running Role Update (6-Roles Update)...');
        const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations/001_update_roles.sql'), 'utf8');
        // Execute the multi-statement migration
        await connection.query(migrationSql);
        console.log('Role Update migration applied successfully.');

        console.log('\n--- MASTER MIGRATION COMPLETED SUCCESSFULLY ---');

    } catch (error) {
        console.error('\n!!! MIGRATION FAILED !!!');
        console.error(error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigrations();
