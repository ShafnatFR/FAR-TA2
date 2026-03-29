const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function check() {
  console.log('Connecting to:', process.env.DB_NAME);
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    console.log('Server connection successful!');
    
    const [dbs] = await connection.query('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
    if (dbs.length === 0) {
      console.log('Database DOES NOT exist! Creating it...');
      await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    } else {
      console.log('Database exists.');
    }
    
    await connection.query(`USE ${process.env.DB_NAME}`);
    const [rows] = await connection.query('SHOW TABLES LIKE "users"');
    if (rows.length > 0) {
      console.log('Table "users" exists.');
    } else {
      console.log('Table "users" DOES NOT exist. You should import foodairescue.sql');
    }
    
    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
