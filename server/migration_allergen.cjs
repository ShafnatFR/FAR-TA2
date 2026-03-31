const db = require('./db');

async function migrate() {
  try {
    console.log('--- STARTING DATABASE MIGRATION (ALLERGENS) ---');
    
    // Check if column exists first
    const [columns] = await db.query("SHOW COLUMNS FROM ai_verifications LIKE 'allergens'");
    
    if (columns.length === 0) {
      console.log('Adding "allergens" column to "ai_verifications" table...');
      await db.query(`
        ALTER TABLE ai_verifications 
        ADD COLUMN allergens longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL 
        CHECK (json_valid(allergens))
      `);
      console.log('✅ Column "allergens" added successfully.');
    } else {
      console.log('Column "allergens" already exists.');
    }

    console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
