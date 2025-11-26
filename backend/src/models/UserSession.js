import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class UserSession extends Model {}

UserSession.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
    deviceInfo: { type: DataTypes.TEXT, allowNull: true }, // JSON string: { browser, os, device, ip }
    userAgent: { type: DataTypes.TEXT, allowNull: true },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    lastActivity: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  },
  { sequelize, modelName: 'UserSession', tableName: 'user_sessions', timestamps: true }
);

