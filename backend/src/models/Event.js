import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export class Event extends Model {}

Event.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    startTime: { type: DataTypes.STRING },
    endTime: { type: DataTypes.STRING },
    priority: { type: DataTypes.ENUM('low', 'normal', 'high'), defaultValue: 'normal' },
    duration: { type: DataTypes.INTEGER }, // minutes
    recurring: { type: DataTypes.STRING }, // e.g., 'none','daily','weekly','monthly'
    reminder: { type: DataTypes.STRING }, // e.g., 'none','10m','1h','1d'
    description: { type: DataTypes.TEXT },
    createdByEmail: { type: DataTypes.STRING }
  },
  { sequelize, modelName: 'Event', tableName: 'events' }
);


