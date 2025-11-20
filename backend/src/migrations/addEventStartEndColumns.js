import "dotenv/config";
import { sequelize } from '../sequelize.js';

/**
 * Migration to add start and end columns to events table if they don't exist
 */
async function addEventStartEndColumns() {
  try {
    console.log('🔄 Starting migration: Add start/end columns to events table...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const dialect = sequelize.getDialect();
    console.log(`📝 Database dialect: ${dialect}`);

    if (dialect === 'sqlite') {
      // For SQLite, check if columns exist and add them if needed
      const columns = await sequelize.query(
        `PRAGMA table_info(events)`,
        { type: sequelize.QueryTypes.SELECT }
      );

      const columnNames = Array.isArray(columns) && columns.length > 0 
        ? columns.map(col => col.name)
        : (Array.isArray(columns[0]) ? columns[0].map(col => col.name) : []);
      console.log('Existing columns:', columnNames);

      if (!columnNames.includes('start')) {
        console.log('Adding start column...');
        await sequelize.query(
          `ALTER TABLE events ADD COLUMN start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
        );
        console.log('✅ Added start column');
      } else {
        console.log('✅ start column already exists');
      }

      if (!columnNames.includes('end')) {
        console.log('Adding end column...');
        await sequelize.query(
          `ALTER TABLE events ADD COLUMN end DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
        );
        console.log('✅ Added end column');
      } else {
        console.log('✅ end column already exists');
      }

      // Update existing rows to have start/end based on date and time fields
      if (columnNames.includes('date') && columnNames.includes('startTime')) {
        console.log('Updating existing events with start/end from date and startTime...');
        await sequelize.query(`
          UPDATE events 
          SET start = datetime(date || ' ' || COALESCE(startTime, '00:00:00'))
          WHERE start IS NULL OR start = ''
        `);
      }

      if (columnNames.includes('date') && columnNames.includes('endTime')) {
        console.log('Updating existing events with end from date and endTime...');
        await sequelize.query(`
          UPDATE events 
          SET end = datetime(date || ' ' || COALESCE(endTime, '23:59:59'))
          WHERE end IS NULL OR end = ''
        `);
      }
    } else if (dialect === 'postgres') {
      // For PostgreSQL, check if columns exist and add them if needed
      const columns = await sequelize.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'events'`,
        { type: sequelize.QueryTypes.SELECT }
      );

      const columnNames = Array.isArray(columns) && columns.length > 0
        ? columns.map(col => col.column_name)
        : (Array.isArray(columns[0]) ? columns[0].map(col => col.column_name) : []);
      console.log('Existing columns:', columnNames);

      if (!columnNames.includes('start')) {
        console.log('Adding start column...');
        try {
          await sequelize.query(
            `ALTER TABLE events ADD COLUMN start TIMESTAMP`
          );
          console.log('✅ Added start column');
          
          // Update existing rows if date and startTime exist
          if (columnNames.includes('date') && columnNames.includes('startTime')) {
            console.log('Updating existing events with start from date and startTime...');
            await sequelize.query(`
              UPDATE events 
              SET start = (date || ' ' || COALESCE("startTime", '00:00:00'))::timestamp
              WHERE start IS NULL
            `);
          }
        } catch (error) {
          console.error('Error adding start column:', error.message);
        }
      } else {
        console.log('✅ start column already exists');
      }

      if (!columnNames.includes('end')) {
        console.log('Adding end column...');
        try {
          await sequelize.query(
            `ALTER TABLE events ADD COLUMN end TIMESTAMP`
          );
          console.log('✅ Added end column');
          
          // Update existing rows if date and endTime exist
          if (columnNames.includes('date') && columnNames.includes('endTime')) {
            console.log('Updating existing events with end from date and endTime...');
            await sequelize.query(`
              UPDATE events 
              SET end = (date || ' ' || COALESCE("endTime", '23:59:59'))::timestamp
              WHERE end IS NULL
            `);
          }
        } catch (error) {
          console.error('Error adding end column:', error.message);
        }
      } else {
        console.log('✅ end column already exists');
      }
    } else {
      // For MySQL
      console.log('⚠️  MySQL migration not implemented yet');
      console.log('⚠️  Please manually add start and end columns if needed');
    }

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addEventStartEndColumns();

