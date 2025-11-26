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
    assigneeId: { type: DataTypes.STRING, allowNull: true }, // Employee ID (STRING) - legacy field
    assigneeEmail: { type: DataTypes.STRING, allowNull: true },
    assigneeName: { type: DataTypes.STRING, allowNull: true },
    createdBy: { type: DataTypes.STRING, allowNull: true }, // Email of creator - legacy field
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    visibility_type: {
      type: DataTypes.STRING, // Use STRING for SQLite compatibility, ENUM for PostgreSQL
      allowNull: false,
      defaultValue: "ALL",
      validate: {
        isIn: [["ALL", "SPECIFIC"]],
      },
    },
    assigned_users: {
      type: DataTypes.TEXT, // Store as JSON string for SQLite compatibility
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("assigned_users");
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue("assigned_users", JSON.stringify(value));
      },
    },
    notification_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true }
  },
  { sequelize, modelName: 'Task', tableName: 'tasks' }
);

