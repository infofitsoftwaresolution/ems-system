import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class NotificationSetting extends Model {}

NotificationSetting.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    emailEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    smsEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    inAppEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    templates: { type: DataTypes.JSONB, defaultValue: {} }
  },
  { sequelize, modelName: 'NotificationSetting', tableName: 'notification_settings' }
);


