import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export class Kyc extends Model {}

Kyc.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.STRING, allowNull: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    address: { type: DataTypes.TEXT },
    documentType: {
      type: DataTypes.ENUM("aadhaar", "pan", "passport", "driver_license"),
      allowNull: false,
    },
    documentNumber: { type: DataTypes.STRING, allowNull: false },
    documents: { type: DataTypes.TEXT }, // JSON string containing all document information
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reviewedAt: { type: DataTypes.DATE },
    reviewedBy: { type: DataTypes.STRING },
    remarks: { type: DataTypes.TEXT },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: "Kyc", tableName: "kyc_requests", timestamps: true }
);

// Define associations
export function setupKycAssociations(Employee) {
  Kyc.belongsTo(Employee, {
    foreignKey: "employeeId",
    as: "employee",
    constraints: false,
  });
  Employee.hasMany(Kyc, {
    foreignKey: "employeeId",
    as: "kycRequests",
    constraints: false,
  });
}
