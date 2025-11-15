import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Message extends Model {}

Message.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    senderEmail: { type: DataTypes.STRING, allowNull: false },
    senderName: { type: DataTypes.STRING, allowNull: false },
    recipientEmail: { type: DataTypes.STRING, allowNull: true }, // null for channel messages
    recipientName: { type: DataTypes.STRING, allowNull: true },
    channelId: { type: DataTypes.STRING, allowNull: true }, // null for direct messages
    channelName: { type: DataTypes.STRING, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    readAt: { type: DataTypes.DATE, allowNull: true },
    attachments: { type: DataTypes.TEXT, allowNull: true }, // JSON string for attachments
  },
  { sequelize, modelName: 'Message', tableName: 'messages' }
);

