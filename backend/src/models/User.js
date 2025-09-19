import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'manager', 'employee'), allowNull: false, defaultValue: 'employee' },
    mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
  },
  { sequelize, modelName: 'User', tableName: 'users' }
);


