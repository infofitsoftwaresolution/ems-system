import { sequelize } from '../sequelize.js';
import { DataTypes } from 'sequelize';

/**
 * Migration to add isLate and checkoutType columns to attendance table
 */
export async function addAttendanceFields() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Running migration: addAttendanceFields');
    
    // Check if isLate column exists
    const tableDescription = await queryInterface.describeTable('attendance');
    
    // Add isLate column if it doesn't exist
    if (!tableDescription.isLate) {
      console.log('➕ Adding isLate column to attendance table...');
      await queryInterface.addColumn('attendance', 'isLate', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      });
      console.log('✅ Added isLate column');
    } else {
      console.log('ℹ️  isLate column already exists');
    }
    
    // Add checkoutType column if it doesn't exist
    if (!tableDescription.checkoutType) {
      console.log('➕ Adding checkoutType column to attendance table...');
      await queryInterface.addColumn('attendance', 'checkoutType', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log('✅ Added checkoutType column');
    } else {
      console.log('ℹ️  checkoutType column already exists');
    }
    
    console.log('✅ Migration completed: addAttendanceFields');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - allow server to continue
    // The columns might already exist or there might be a permission issue
  }
}

