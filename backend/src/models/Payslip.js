import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export class Payslip extends Model {}

Payslip.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    employeeName: { type: DataTypes.STRING, allowNull: false },
    employeeEmail: { type: DataTypes.STRING, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false }, // 1-12
    year: { type: DataTypes.INTEGER, allowNull: false },
    basicSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    allowances: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    deductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    netSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    workingDays: { type: DataTypes.INTEGER, allowNull: false },
    totalDays: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "generated", "paid"),
      defaultValue: "pending",
    },
    generatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: "Payslip", tableName: "payslips" }
);
