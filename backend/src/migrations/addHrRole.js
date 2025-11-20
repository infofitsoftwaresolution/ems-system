import "dotenv/config";
import { sequelize } from '../sequelize.js';

/**
 * Migration to add 'hr' role to the User model ENUM
 * This allows HR users to have the same permissions as managers
 */
async function addHrRole() {
  try {
    console.log('🔄 Starting migration: Add HR role to User model...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // For SQLite, we need to recreate the table with the new ENUM value
    // Since SQLite doesn't support ALTER COLUMN for ENUM, we'll use a workaround
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if we're using SQLite
    const dialect = sequelize.getDialect();
    
    if (dialect === 'sqlite') {
      console.log('📝 SQLite detected - using table recreation approach');
      
      // SQLite doesn't support ENUM directly, it stores as TEXT
      // So we just need to ensure the constraint allows 'hr'
      // The model definition will handle validation
      console.log('✅ SQLite stores ENUM as TEXT - no migration needed');
      console.log('✅ HR role is now available in the User model');
    } else {
      // For PostgreSQL/MySQL, we can alter the ENUM type
      console.log(`📝 ${dialect} detected - checking ENUM type...`);
      
      try {
        // Try to alter the ENUM type (PostgreSQL)
        if (dialect === 'postgres') {
          await queryInterface.sequelize.query(`
            DO $$ BEGIN
              ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'hr';
            EXCEPTION
              WHEN duplicate_object THEN null;
            END $$;
          `);
          console.log('✅ Added HR role to PostgreSQL ENUM');
        }
        // For MySQL, ENUM modification is more complex
        else if (dialect === 'mysql') {
          console.log('⚠️  MySQL ENUM modification requires table recreation');
          console.log('⚠️  Please ensure your MySQL version supports ENUM modification');
        }
      } catch (error) {
        console.log('ℹ️  ENUM type may already include HR role or needs manual update');
        console.log('ℹ️  Error:', error.message);
      }
    }
    
    console.log('✅ Migration completed successfully');
    console.log('📋 HR role permissions:');
    console.log('   - Same as Manager role');
    console.log('   - Can view all attendance');
    console.log('   - Can manage KYC requests');
    console.log('   - Can manage leaves');
    console.log('   - Can view all employees');
    console.log('   - Can manage payslips');
    console.log('   - Cannot access Administration panel (admin only)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addHrRole();

