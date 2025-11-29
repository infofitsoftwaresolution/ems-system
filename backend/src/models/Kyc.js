import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Kyc extends Model {}

Kyc.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.STRING, allowNull: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    address: { type: DataTypes.TEXT },
    documentType: { type: DataTypes.ENUM('aadhaar', 'pan', 'passport', 'driver_license'), allowNull: false },
    documentNumber: { type: DataTypes.STRING, allowNull: false },
    documents: { type: DataTypes.TEXT }, // JSON string containing all document information
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'partially_rejected'), defaultValue: 'pending' },
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reviewedAt: { type: DataTypes.DATE },
    reviewedBy: { type: DataTypes.STRING },
    remarks: { type: DataTypes.TEXT },
    // Document-level status fields
    salary_slip_month_1_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    salary_slip_month_2_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    salary_slip_month_3_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    bank_proof_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    aadhaar_front_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    aadhaar_back_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    employee_photo_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    pan_card_status: { type: DataTypes.STRING, defaultValue: 'pending' },
    education_documents_status: { type: DataTypes.TEXT }, // JSON array for multiple documents
    // Document-level remark fields
    salary_slip_month_1_remark: { type: DataTypes.TEXT },
    salary_slip_month_2_remark: { type: DataTypes.TEXT },
    salary_slip_month_3_remark: { type: DataTypes.TEXT },
    bank_proof_remark: { type: DataTypes.TEXT },
    aadhaar_front_remark: { type: DataTypes.TEXT },
    aadhaar_back_remark: { type: DataTypes.TEXT },
    employee_photo_remark: { type: DataTypes.TEXT },
    pan_card_remark: { type: DataTypes.TEXT },
    education_documents_remark: { type: DataTypes.TEXT }, // JSON array for multiple documents
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, modelName: 'Kyc', tableName: 'kyc_requests', timestamps: true }
);

// Define associations
export function setupKycAssociations(Employee) {
  Kyc.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee', constraints: false });
  Employee.hasMany(Kyc, { foreignKey: 'employeeId', as: 'kycRequests', constraints: false });
}


