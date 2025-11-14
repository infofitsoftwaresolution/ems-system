import { sequelize } from '../sequelize.js';
import { DataTypes } from 'sequelize';

/**
 * Migration to add profile fields to users table
 * Adds: avatar, phone, bio, language, timezone, notificationSettings, securitySettings
 */
export async function addUserProfileFields() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Check if columns exist and add them if they don't
    const tableDescription = await queryInterface.describeTable('users');
    
    const columnsToAdd = [
      { name: 'avatar', type: DataTypes.STRING, allowNull: true },
      { name: 'phone', type: DataTypes.STRING, allowNull: true },
      { name: 'bio', type: DataTypes.TEXT, allowNull: true },
      { name: 'language', type: DataTypes.STRING, defaultValue: 'english' },
      { name: 'timezone', type: DataTypes.STRING, defaultValue: 'america-los_angeles' },
      { name: 'notificationSettings', type: DataTypes.TEXT, allowNull: true },
      { name: 'securitySettings', type: DataTypes.TEXT, allowNull: true }
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

