// Standalone script to fix messages table structure
import { sequelize } from './src/sequelize.js';
import { QueryTypes } from 'sequelize';
import { fixMessagesTable } from './src/migrations/fixMessagesTable.js';

async function main() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🔄 Running messages table migration...');
    await fixMessagesTable();
    
    console.log('✅ Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();


