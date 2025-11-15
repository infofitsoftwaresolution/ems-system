import { Sequelize } from 'sequelize';

// Use PostgreSQL if POSTGRES_HOST is set, otherwise use SQLite for development
const usePostgreSQL = !!process.env.POSTGRES_HOST || process.env.DB_DIALECT === 'postgres';

export const sequelize = usePostgreSQL
  ? new Sequelize(
      process.env.POSTGRES_DB || process.env.DB_NAME || 'rsamriddhi',
      process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
      process.env.POSTGRES_PASSWORD || process.env.DB_PASS || 'root',
      {
        host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
        port: Number(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
        dialect: 'postgres',
        logging: process.env.DB_LOGGING === 'true' ? console.log : false,
        dialectOptions: {
          ssl: process.env.POSTGRES_SSL === 'true' || process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3
      }
    });