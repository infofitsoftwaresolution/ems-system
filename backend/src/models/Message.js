import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Message extends Model {}

Message.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    senderEmail: { 
      type: DataTypes.STRING, 
      allowNull: false,
      field: 'sender_email' // Map to snake_case column in PostgreSQL
    },
    senderName: { 
      type: DataTypes.STRING, 
      allowNull: false,
      field: 'sender_name'
    },
    recipientEmail: { 
      type: DataTypes.STRING, 
      allowNull: true,
      field: 'recipient_email' // null for channel messages
    },
    recipientName: { 
      type: DataTypes.STRING, 
      allowNull: true,
      field: 'recipient_name'
    },
    channelId: { 
      type: DataTypes.STRING, 
      allowNull: true,
      field: 'channel_id' // null for direct messages
    },
    channelName: { 
      type: DataTypes.STRING, 
      allowNull: true,
      field: 'channel_name'
    },
    content: { type: DataTypes.TEXT, allowNull: false },
    aiResponse: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
      field: 'ai_response' // Map to ai_response column
    },
    read: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
      field: 'read' // Explicitly map to 'read' column (quoted in SQL)
    },
    readAt: { 
      type: DataTypes.DATE, 
      allowNull: true,
      field: 'read_at'
    },
    attachments: { type: DataTypes.TEXT, allowNull: true }, // JSON string for attachments
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  },
  { 
    sequelize, 
    modelName: 'Message', 
    tableName: 'messages',
    underscored: false, // We're explicitly mapping fields, so don't auto-convert
    timestamps: true
  }
);

