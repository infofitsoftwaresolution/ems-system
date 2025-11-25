// Quick verification script to check if changes are applied
// Run: node verify-changes.js

import { sequelize } from './backend/src/sequelize.js';
import { Employee } from './backend/src/models/Employee.js';

async function verifyChanges() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check if is_active column exists
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'employees' AND column_name = 'is_active'
    `).catch(async () => {
      // SQLite fallback
      const tableInfo = await sequelize.getQueryInterface().describeTable('employees');
      return tableInfo.is_active ? [{ column_name: 'is_active', data_type: 'BOOLEAN' }] : [];
    });

    if (results && results.length > 0) {
      console.log('✅ is_active column exists in employees table');
      console.log('   Column info:', results[0]);
    } else {
      console.log('❌ is_active column NOT found');
      console.log('   Please restart the backend server to run the migration');
    }

    // Check employee count
    const activeCount = await Employee.count({ where: { is_active: true } });
    const totalCount = await Employee.count();
    
    console.log(`\n📊 Employee Statistics:`);
    console.log(`   Active employees: ${activeCount}`);
    console.log(`   Total employees: ${totalCount}`);
    console.log(`   Soft-deleted: ${totalCount - activeCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyChanges();

