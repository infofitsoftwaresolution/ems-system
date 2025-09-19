import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class SiteSetting extends Model {}

SiteSetting.init(
  {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: { type: DataTypes.JSONB }
  },
  { sequelize, modelName: 'SiteSetting', tableName: 'site_settings' }
);


