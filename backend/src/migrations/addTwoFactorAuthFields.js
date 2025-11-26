import { sequelize } from '../sequelize.js';
import { DataTypes } from 'sequelize';

/**
 * Migration to add two-factor authentication fields to users table
 * Adds: twoFactorSecret, twoFactorEnabled, twoFactorBackupCodes
 */
export async function addTwoFactorAuthFields() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    const tableDescription = await queryInterface.describeTable('users');
    
    const columnsToAdd = [
      { name: 'twoFactorSecret', type: DataTypes.STRING, allowNull: true },
      { name: 'twoFactorEnabled', type: DataTypes.BOOLEAN, defaultValue: false },
      { name: 'twoFactorBackupCodes', type: DataTypes.TEXT, allowNull: true } // JSON array of backup codes
    ];

    for (const column of columnsToAdd) {
      if (!tableDescription[column.name]) {
        console.log(`Adding column: ${column.name}`);
        await queryInterface.addColumn('users', column.name, {
          type: column.type,
          allowNull: column.allowNull !== undefined ? column.allowNull : true,
          defaultValue: column.defaultValue
        });
        console.log(`✓ Added column: ${column.name}`);
      } else {
        console.log(`Column ${column.name} already exists`);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

