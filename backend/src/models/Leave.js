import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export class Leave extends Model {}

Leave.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING },
    type: {
      type: DataTypes.ENUM("casual", "sick", "earned", "unpaid", "other"),
      allowNull: false,
      defaultValue: "casual",
    },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    reason: { type: DataTypes.TEXT },
    attachmentUrl: { type: DataTypes.STRING },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    appliedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reviewedAt: { type: DataTypes.DATE },
    reviewedBy: { type: DataTypes.STRING },
    remarks: { type: DataTypes.TEXT },
  },
  { sequelize, modelName: "Leave", tableName: "leaves", timestamps: false }
);
