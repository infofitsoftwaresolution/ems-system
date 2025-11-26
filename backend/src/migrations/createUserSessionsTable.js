import { sequelize } from '../sequelize.js';
import { DataTypes } from 'sequelize';

/**
 * Migration to create user_sessions table for tracking active user sessions
 */
export async function createUserSessionsTable() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Check if table exists
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.includes('user_sessions');
    
    if (tableExists) {
      console.log('user_sessions table already exists');
      return;
    }
    
    await queryInterface.createTable('user_sessions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      deviceInfo: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastActivity: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    
    // Create index on userId for faster queries
    await queryInterface.addIndex('user_sessions', ['userId'], {
      name: 'user_sessions_userId_idx'
    });
    
    // Create index on token for faster lookups
    await queryInterface.addIndex('user_sessions', ['token'], {
      name: 'user_sessions_token_idx',
      unique: true
    });
    
    // Create index on isActive for filtering active sessions
    await queryInterface.addIndex('user_sessions', ['isActive'], {
      name: 'user_sessions_isActive_idx'
    });
    
    console.log('✓ Created user_sessions table');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

