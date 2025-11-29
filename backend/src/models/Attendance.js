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
    status: { type: DataTypes.ENUM('checked_in', 'present', 'absent', 'half-day'), defaultValue: 'checked_in' },
    notes: { type: DataTypes.TEXT },
    isLate: { type: DataTypes.BOOLEAN, defaultValue: false },
    checkoutType: { type: DataTypes.STRING, allowNull: true }, // 'manual', 'auto-midnight'
    // Location tracking fields
    checkInLatitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    checkInLongitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    checkInAddress: { type: DataTypes.TEXT, allowNull: true },
    checkOutLatitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    checkOutLongitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    checkOutAddress: { type: DataTypes.TEXT, allowNull: true },
    // Photo fields for check-in and check-out
    checkInPhoto: { type: DataTypes.TEXT, allowNull: true }, // Base64 encoded image
    checkOutPhoto: { type: DataTypes.TEXT, allowNull: true } // Base64 encoded image
  },
  { sequelize, modelName: 'Attendance', tableName: 'attendance' }
);

// Note: Association will be defined in sequelize.js or when needed


