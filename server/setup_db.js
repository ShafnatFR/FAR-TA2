const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setup() {
    console.log('Initializing database from foodairescue.sql...');
    
    // 1. Connect without DB selected
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true // Allow multi-statement execution
    });

    try {
        // 2. Create DB
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);
        console.log(`Database ${process.env.DB_NAME} ready.`);

        // 3. Read SQL file
        const sqlPath = path.join(__dirname, 'foodairescue.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // 4. Clean SQL (remove comments and empty lines)
        const cleanSql = sql
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && line.trim() !== '')
            .join(' ');
        
        // 5. Execute SQL
        console.log('Executing base schema...');
        // Note: multipleStatements: true allows this to work for simple dumps
        await connection.query(cleanSql);
        
        console.log('Base schema initialized successfully.');
        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('Initialization failed:', err);
        await connection.end();
        process.exit(1);
    }
}

setup();
