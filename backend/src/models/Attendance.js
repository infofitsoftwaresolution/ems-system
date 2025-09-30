import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Attendance extends Model {}

Attendance.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    checkIn: { type: DataTypes.DATE },
    checkOut: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('present', 'absent', 'half-day'), defaultValue: 'present' },
    notes: { type: DataTypes.TEXT },
    // Location tracking fields
    checkInLatitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    checkInLongitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    checkInAddress: { type: DataTypes.TEXT, allowNull: true },
    checkOutLatitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    checkOutLongitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    checkOutAddress: { type: DataTypes.TEXT, allowNull: true }
  },
  { sequelize, modelName: 'Attendance', tableName: 'attendance' }
);

// Note: Association will be defined in sequelize.js or when needed


