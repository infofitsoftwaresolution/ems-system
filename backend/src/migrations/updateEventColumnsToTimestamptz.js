import { sequelize } from '../sequelize.js';

/**
 * Migration to update Event table columns to TIMESTAMP WITH TIME ZONE (timestamptz)
 * This ensures proper timezone handling for start and end columns
 */
export async function updateEventColumnsToTimestamptz() {
  const queryInterface = sequelize.getQueryInterface();
  const dialect = sequelize.getDialect();

  try {
    if (dialect === 'postgres') {
      console.log('Updating Event table columns to TIMESTAMPTZ for PostgreSQL...');

      // Check if columns exist and update them
      const tableDescription = await queryInterface.describeTable('events');
      
      // Update start column to TIMESTAMPTZ if it exists
      if (tableDescription.start) {
        console.log('Updating start column to TIMESTAMPTZ...');
        await sequelize.query(`
          ALTER TABLE events 
          ALTER COLUMN start TYPE TIMESTAMP WITH TIME ZONE 
          USING start AT TIME ZONE 'UTC';
        `);
        console.log('✓ Updated start column to TIMESTAMPTZ');
      }

      // Update end column to TIMESTAMPTZ if it exists (note: "end" is a reserved keyword)
      if (tableDescription.end) {
        console.log('Updating end column to TIMESTAMPTZ...');
        await sequelize.query(`
          ALTER TABLE events 
          ALTER COLUMN "end" TYPE TIMESTAMP WITH TIME ZONE 
          USING "end" AT TIME ZONE 'UTC';
        `);
        console.log('✓ Updated end column to TIMESTAMPTZ');
      }

      console.log('✅ Migration completed successfully - Event columns now use TIMESTAMPTZ');
    } else {
      console.log('⚠️  SQLite does not support TIMESTAMPTZ - skipping migration');
      console.log('   SQLite stores dates as TEXT/INTEGER and handles timezone in application layer');
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - columns might already be updated or migration might not be needed
    if (error.message && error.message.includes('does not exist')) {
      console.log('   Columns might not exist yet - this is okay');
    } else {
      throw error;
    }
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateEventColumnsToTimestamptz()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

