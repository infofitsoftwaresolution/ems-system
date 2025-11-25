import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize.js";
import { User } from "./User.js";

export class Event extends Model {}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "events",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Define associations
export function setupEventAssociations(UserModel) {
  Event.belongsTo(UserModel, { foreignKey: "created_by", as: "creator" });
}
