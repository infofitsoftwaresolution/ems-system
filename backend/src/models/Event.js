import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelize.js";

export class Event extends Model {}

Event.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    type: {
      type: DataTypes.STRING,
      defaultValue: "meeting",
      validate: {
        isIn: [["meeting", "training", "holiday", "review"]],
      },
    },
    start: { type: DataTypes.DATE, allowNull: false },
    end: { type: DataTypes.DATE, allowNull: false },
    allDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "allday", // Map model field allDay (camelCase) to database column allday (lowercase)
    },
    attendees: { type: DataTypes.TEXT }, // JSON string of attendee IDs
    createdByEmail: { type: DataTypes.STRING },
    // Keep legacy fields for backward compatibility
    date: { type: DataTypes.DATEONLY },
    startTime: { type: DataTypes.STRING },
    endTime: { type: DataTypes.STRING },
    priority: {
      type: DataTypes.STRING,
      defaultValue: "normal",
      validate: {
        isIn: [["low", "normal", "high"]],
      },
    },
    duration: { type: DataTypes.INTEGER },
    recurring: { type: DataTypes.STRING },
    reminder: { type: DataTypes.STRING },
  },
  { sequelize, modelName: "Event", tableName: "events" }
);
