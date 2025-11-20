import "dotenv/config";
import { sequelize } from '../sequelize.js';

/**
 * Migration to add all missing columns to events table
 * Adds: type, start, end, allDay, attendees, createdByEmail
 */
async function addMissingEventColumns() {
  try {
    console.log('🔄 Starting migration: Add missing columns to events table...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const dialect = sequelize.getDialect();
    console.log(`📝 Database dialect: ${dialect}`);

    // Get existing columns
    let existingColumns = [];
    if (dialect === 'sqlite') {
      const columns = await sequelize.query(
        `PRAGMA table_info(events)`,
        { type: sequelize.QueryTypes.SELECT }
      );
      existingColumns = Array.isArray(columns) && columns.length > 0
        ? columns.map(col => col.name)
        : (Array.isArray(columns[0]) ? columns[0].map(col => col.name) : []);
    } else if (dialect === 'postgres') {
      const columns = await sequelize.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name = 'events'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      existingColumns = Array.isArray(columns) && columns.length > 0
        ? columns.map(col => col.column_name)
        : (Array.isArray(columns[0]) ? columns[0].map(col => col.column_name) : []);
    }

    console.log('Existing columns:', existingColumns);

    // Columns to add
    const columnsToAdd = [
      { name: 'type', sqlite: 'TEXT DEFAULT "meeting"', postgres: 'VARCHAR(50) DEFAULT \'meeting\'' },
      { name: 'start', sqlite: 'DATETIME', postgres: 'TIMESTAMP' },
      { name: 'end', sqlite: 'DATETIME', postgres: 'TIMESTAMP' },
      { name: 'allDay', sqlite: 'BOOLEAN DEFAULT 0', postgres: 'BOOLEAN DEFAULT false' },
      { name: 'attendees', sqlite: 'TEXT', postgres: 'TEXT' },
      { name: 'createdByEmail', sqlite: 'TEXT', postgres: 'VARCHAR(255)' }
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        try {
          if (dialect === 'sqlite') {
            // SQLite doesn't support IF NOT EXISTS in ALTER TABLE
            await sequelize.query(
              `ALTER TABLE events ADD COLUMN ${col.name === 'end' ? '"end"' : col.name} ${col.sqlite}`
            );
            console.log(`✅ Added ${col.name} column to SQLite table`);
          } else if (dialect === 'postgres') {
            // PostgreSQL: quote 'end' as it's a reserved keyword
            const colName = col.name === 'end' ? '"end"' : col.name;
            await sequelize.query(
              `ALTER TABLE events ADD COLUMN IF NOT EXISTS ${colName} ${col.postgres}`
            );
            console.log(`✅ Added ${col.name} column to PostgreSQL table`);
          }
        } catch (error) {
          if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
            console.log(`⚠️  Column ${col.name} already exists, skipping...`);
          } else {
            console.error(`❌ Error adding ${col.name} column:`, error.message);
          }
        }
      } else {
        console.log(`✅ Column ${col.name} already exists`);
      }
    }

    // Update existing rows: populate start/end from date + time if they exist
    if (existingColumns.includes('date') && existingColumns.includes('startTime')) {
      try {
        if (dialect === 'sqlite') {
          await sequelize.query(`
            UPDATE events 
            SET start = datetime(date || ' ' || COALESCE(startTime, '00:00:00'))
            WHERE start IS NULL
          `);
        } else if (dialect === 'postgres') {
          await sequelize.query(`
            UPDATE events 
            SET start = (date || ' ' || COALESCE("startTime", '00:00:00'))::timestamp
            WHERE start IS NULL
          `);
        }
        console.log('✅ Updated existing events with start dates');
      } catch (error) {
        console.error('⚠️  Error updating start dates:', error.message);
      }
    }

    if (existingColumns.includes('date') && existingColumns.includes('endTime')) {
      try {
        if (dialect === 'sqlite') {
          await sequelize.query(`
            UPDATE events 
            SET "end" = datetime(date || ' ' || COALESCE(endTime, '23:59:59'))
            WHERE "end" IS NULL
          `);
        } else if (dialect === 'postgres') {
          await sequelize.query(`
            UPDATE events 
            SET "end" = (date || ' ' || COALESCE("endTime", '23:59:59'))::timestamp
            WHERE "end" IS NULL
          `);
        }
        console.log('✅ Updated existing events with end dates');
      } catch (error) {
        console.error('⚠️  Error updating end dates:', error.message);
      }
    }

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

addMissingEventColumns();

