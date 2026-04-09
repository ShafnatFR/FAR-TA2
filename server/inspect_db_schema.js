
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function inspect() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'foodairescue'
    });

    try {
        console.log('--- INSPECTING USERS TABLE ---');
        const [userCols] = await connection.query('SHOW COLUMNS FROM users');
        console.log(JSON.stringify(userCols, null, 2));

        console.log('\n--- INSPECTING BADGES TABLE ---');
        const [badgeCols] = await connection.query('SHOW COLUMNS FROM badges');
        console.log(JSON.stringify(badgeCols, null, 2));

        console.log('\n--- INSPECTING CLAIMS TABLE ---');
        const [claimCols] = await connection.query('SHOW COLUMNS FROM claims');
        console.log(JSON.stringify(claimCols, null, 2));

        console.log('\n--- CHECKING EXISTING TABLES ---');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(JSON.stringify(tables, null, 2));

    } catch (error) {
        console.error('Inspection failed:', error);
    } finally {
        await connection.end();
    }
}

inspect();
