import { Sequelize } from 'sequelize';

// Use SQLite for development, PostgreSQL for production
const isDevelopment = process.env.NODE_ENV !== 'production';

export const sequelize = isDevelopment 
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false,
    })
  : new Sequelize(
      process.env.POSTGRES_DB || 'ems',
      process.env.POSTGRES_USER || 'postgres',
      process.env.POSTGRES_PASSWORD || 'root',
      {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: Number(process.env.POSTGRES_PORT || 5432),
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );