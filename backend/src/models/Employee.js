import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize.js";

export class Employee extends Model {}

Employee.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    employeeId: { type: DataTypes.STRING, unique: true },
    department: { type: DataTypes.STRING },
    position: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING },
    position: { type: DataTypes.STRING },
    hireDate: { type: DataTypes.DATEONLY },
    salary: { type: DataTypes.DECIMAL },
    status: { type: DataTypes.STRING, defaultValue: "active" },
    kycStatus: { type: DataTypes.STRING, defaultValue: "pending" },
  },
  { sequelize, modelName: "Employee", tableName: "employees" }
);
