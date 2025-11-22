// Quick test script to verify messages endpoint works
import { sequelize } from './src/sequelize.js';
import { QueryTypes } from 'sequelize';

async function testEndpoint() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const dialect = sequelize.getDialect();
    console.log(`Database dialect: ${dialect}`);

    // Check if messages table exists
    if (dialect === 'postgres') {
      const [tableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'messages'
        );
      `, { type: QueryTypes.SELECT });

      if (!tableExists.exists) {
        console.log('❌ Messages table does not exist');
        return;
      }

      // Check columns
      const columns = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages'
        ORDER BY ordinal_position;
      `, { type: QueryTypes.SELECT });

      console.log('📋 Messages table columns:');
      columns.forEach(col => console.log(`  - ${col.column_name}`));

      // Check if we have snake_case or camelCase
      const columnNames = columns.map(c => c.column_name);
      const hasSnakeCase = columnNames.includes('sender_email');
      const hasCamelCase = columnNames.includes('senderEmail') || columnNames.includes('"senderEmail"');

      if (hasSnakeCase) {
        console.log('✅ Table uses snake_case columns (correct for PostgreSQL)');
      } else if (hasCamelCase) {
        console.log('⚠️  Table uses camelCase columns - migration needed');
      } else {
        console.log('❌ Cannot determine column naming convention');
      }
    }

    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testEndpoint();


