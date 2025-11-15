import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Payslip extends Model {}

Payslip.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    employeeName: { type: DataTypes.STRING, allowNull: false },
    employeeEmail: { type: DataTypes.STRING, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false }, // 1-12
    year: { type: DataTypes.INTEGER, allowNull: false },
    // Earnings
    basicSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    hra: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // House Rent Allowance
    da: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Dearness Allowance
    transportAllowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    medicalAllowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    specialAllowance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    earnedSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    grossSalary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    // Deductions
    pf: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Provident Fund
    esi: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Employee State Insurance
    tds: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Tax Deducted at Source
    professionalTax: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    leaveDeduction: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    otherDeductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalDeductions: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    // Net Salary
    netSalary: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    // Attendance
    workingDays: { type: DataTypes.INTEGER, allowNull: false },
    totalDays: { type: DataTypes.INTEGER, allowNull: false },
    leaveDays: { type: DataTypes.INTEGER, defaultValue: 0 },
    // Status
    status: { type: DataTypes.ENUM('pending', 'generated', 'paid'), defaultValue: 'pending' },
    generatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    paidAt: { type: DataTypes.DATE, allowNull: true }
  },
  { sequelize, modelName: 'Payslip', tableName: 'payslips' }
);
