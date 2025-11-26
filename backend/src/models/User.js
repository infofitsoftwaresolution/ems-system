import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'manager', 'hr', 'employee'), allowNull: false, defaultValue: 'employee' },
    mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    avatar: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    language: { type: DataTypes.STRING, defaultValue: 'english' },
    timezone: { type: DataTypes.STRING, defaultValue: 'america-los_angeles' },
    notificationSettings: { type: DataTypes.TEXT, allowNull: true }, // JSON string
    securitySettings: { type: DataTypes.TEXT, allowNull: true }, // JSON string
    twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
    twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    twoFactorBackupCodes: { type: DataTypes.TEXT, allowNull: true } // JSON array of backup codes
  },
  { sequelize, modelName: 'User', tableName: 'users' }
);


