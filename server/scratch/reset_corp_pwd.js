
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'foodairescue'
    });

    const newPassword = 'Chikal23';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.execute(
        "UPDATE users SET password = ?, status = 'ACTIVE' WHERE email = 'donaturkorporat1@gmail.com'",
        [hashedPassword]
    );

    console.log("Password for donaturkorporat1@gmail.com has been reset to Chikal23 and status set to ACTIVE.");
    await db.end();
}

resetPassword().catch(console.error);
