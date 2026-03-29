
const pool = require('./db');

async function migrate() {
    console.log("Checking for missing columns in 'claims' table...");
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM claims");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('courier_name')) {
            console.log("Adding 'courier_name' column...");
            await pool.query("ALTER TABLE claims ADD COLUMN courier_name VARCHAR(255) DEFAULT NULL");
        }

        if (!columnNames.includes('courier_status')) {
            console.log("Adding 'courier_status' column...");
            await pool.query("ALTER TABLE claims ADD COLUMN courier_status VARCHAR(50) DEFAULT NULL");
        }

        console.log("Migration finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
