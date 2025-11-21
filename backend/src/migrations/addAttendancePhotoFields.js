import { sequelize } from '../sequelize.js';
import { DataTypes } from 'sequelize';

/**
 * Migration to add checkInPhoto and checkOutPhoto columns to attendance table
 */
export async function addAttendancePhotoFields() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Running migration: addAttendancePhotoFields');
    
    // Check if columns exist
    const tableDescription = await queryInterface.describeTable('attendance');
    
    // Add checkInPhoto column if it doesn't exist
    if (!tableDescription.checkInPhoto) {
      console.log('➕ Adding checkInPhoto column to attendance table...');
      await queryInterface.addColumn('attendance', 'checkInPhoto', {
        type: DataTypes.TEXT,
        allowNull: true
      });
      console.log('✅ Added checkInPhoto column');
    } else {
      console.log('ℹ️  checkInPhoto column already exists');
    }
    
    // Add checkOutPhoto column if it doesn't exist
    if (!tableDescription.checkOutPhoto) {
      console.log('➕ Adding checkOutPhoto column to attendance table...');
      await queryInterface.addColumn('attendance', 'checkOutPhoto', {
        type: DataTypes.TEXT,
        allowNull: true
      });
      console.log('✅ Added checkOutPhoto column');
    } else {
      console.log('ℹ️  checkOutPhoto column already exists');
    }
    
    console.log('✅ Migration completed: addAttendancePhotoFields');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - allow server to continue
    // The columns might already exist or there might be a permission issue
  }
}

