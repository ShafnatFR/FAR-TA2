const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function addSuperAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const email = 'superadmin@foodairescue.com';
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);
        
        // Check if exists
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            console.log('Superadmin already exists. Updating password...');
            await connection.query('UPDATE users SET password = ?, role = "SUPER_ADMIN", status = "ACTIVE" WHERE email = ?', [hash, email]);
        } else {
            console.log('Creating new Superadmin...');
            await connection.query(
                'INSERT INTO users (name, email, password, role, status, points) VALUES (?, ?, ?, ?, ?, ?)',
                ['Master Admin', email, hash, 'SUPER_ADMIN', 'ACTIVE', 0]
            );
        }
        console.log('Superadmin account ready!');
        console.log('Email:', email);
        console.log('Password:', password);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

addSuperAdmin();
