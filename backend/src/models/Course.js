import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Course extends Model {}

Course.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' },
    description: { type: DataTypes.TEXT },
    createdByEmail: { type: DataTypes.STRING }
  },
  { sequelize, modelName: 'Course', tableName: 'courses' }
);


