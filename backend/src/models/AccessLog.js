import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class AccessLog extends Model {}

AccessLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING },
    action: { type: DataTypes.STRING }, // e.g., 'login','failed_login','view_report'
    ip: { type: DataTypes.STRING },
    userAgent: { type: DataTypes.STRING }
  },
  { sequelize, modelName: 'AccessLog', tableName: 'access_logs', timestamps: true }
);


