import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize.js";

export class Employee extends Model {}

Employee.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    // New required fields
    emp_id: { 
      type: DataTypes.STRING, 
      unique: true,
      allowNull: true, // Allow null initially for auto-generation
      field: 'emp_id' // Explicit field name for database
    },
    mobile_number: { 
      type: DataTypes.STRING,
      allowNull: true,
      field: 'mobile_number'
    },
    location: { 
      type: DataTypes.STRING,
      allowNull: true,
      field: 'location'
    },
    designation: { 
      type: DataTypes.STRING,
      allowNull: true,
      field: 'designation'
    },
    status: { 
      type: DataTypes.ENUM('Working', 'Not Working'),
      defaultValue: 'Working',
      allowNull: false,
      field: 'status'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active'
    },
    can_access_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'can_access_system'
    },
    // Legacy fields (kept for backward compatibility)
    employeeId: { type: DataTypes.STRING, unique: true, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    position: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.STRING, allowNull: true },
    hireDate: { type: DataTypes.DATEONLY, allowNull: true },
    salary: { type: DataTypes.DECIMAL, allowNull: true },
    kycStatus: { type: DataTypes.STRING, defaultValue: "pending", allowNull: true },
  },
  { sequelize, modelName: "Employee", tableName: "employees" }
);
