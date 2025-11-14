import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Task extends Model {}

Task.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { 
      type: DataTypes.ENUM('todo', 'in-progress', 'review', 'completed'), 
      defaultValue: 'todo' 
    },
    priority: { 
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), 
      defaultValue: 'medium' 
    },
    assigneeId: { type: DataTypes.STRING, allowNull: true }, // Employee ID (STRING)
    assigneeEmail: { type: DataTypes.STRING, allowNull: true },
    assigneeName: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true }, // Email of creator
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true }
  },
  { sequelize, modelName: 'Task', tableName: 'tasks' }
);

