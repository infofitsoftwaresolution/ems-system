import { sequelize } from '../sequelize.js';
import { QueryTypes } from 'sequelize';

export async function fixMessagesTable() {
  try {
    const dialect = sequelize.getDialect();
    console.log(`🔄 Running messages table migration for ${dialect}...`);
    
    if (dialect === 'postgres') {
      // Check if table exists
      const [tableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'messages'
        );
      `, { type: QueryTypes.SELECT });

      if (!tableExists.exists) {
        console.log('ℹ️  Messages table does not exist. It will be created by Sequelize sync.');
        return;
      }

      console.log('✓ Messages table exists');

      // Check existing columns - PostgreSQL stores quoted identifiers in lowercase in information_schema
      // but we need to check the actual column names
      const columns = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages'
        ORDER BY ordinal_position;
      `, { type: QueryTypes.SELECT });

      console.log('Existing columns in messages table:', columns.map(c => c.column_name));

      // Get actual column names - PostgreSQL lowercases unquoted names in information_schema
      // But quoted names (camelCase) are stored as-is
      const columnNames = columns.map(c => c.column_name.toLowerCase());
      
      // Also check for camelCase columns by querying the table directly
      let actualColumns = [];
      try {
        const [result] = await sequelize.query(`
          SELECT * FROM messages LIMIT 1;
        `, { type: QueryTypes.SELECT });
        if (result && result.length > 0) {
          actualColumns = Object.keys(result[0]);
          console.log('Actual column names from table:', actualColumns);
        }
      } catch (e) {
        // Table might be empty, that's okay
        console.log('Could not query table for column names (might be empty)');
      }
      // Get actual column names from the table query (handles quoted identifiers)
      const actualColumnNames = actualColumns.length > 0 
        ? actualColumns.map(c => c.toLowerCase())
        : columnNames;

      console.log('📋 Actual column names detected:', actualColumnNames);

      const requiredColumns = {
        'sender_email': { type: 'VARCHAR(255)', nullable: false, default: null },
        'sender_name': { type: 'VARCHAR(255)', nullable: false, default: null },
        'recipient_email': { type: 'VARCHAR(255)', nullable: true, default: null },
        'recipient_name': { type: 'VARCHAR(255)', nullable: true, default: null },
        'channel_id': { type: 'VARCHAR(255)', nullable: true, default: null },
        'channel_name': { type: 'VARCHAR(255)', nullable: true, default: null },
        'content': { type: 'TEXT', nullable: false, default: null },
        'read': { type: 'BOOLEAN', nullable: true, default: 'false' },
        'read_at': { type: 'TIMESTAMP', nullable: true, default: null },
        'attachments': { type: 'TEXT', nullable: true, default: null }
      };

      // Add missing columns
      for (const [colName, colDef] of Object.entries(requiredColumns)) {
        const hasColumn = actualColumnNames.includes(colName.toLowerCase());
        
        if (!hasColumn) {
          // Check if there's a camelCase version
          const camelCaseName = colName.split('_').map((word, i) => 
            i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
          ).join('');
          
          const hasCamelCase = actualColumns.some(c => 
            c === camelCaseName || c.toLowerCase() === camelCaseName.toLowerCase()
          );

          if (hasCamelCase) {
            // Rename camelCase to snake_case
            console.log(`🔄 Renaming column "${camelCaseName}" to ${colName}`);
            try {
              await sequelize.query(`
                ALTER TABLE messages 
                RENAME COLUMN "${camelCaseName}" TO ${colName};
              `);
              console.log(`✅ Renamed ${camelCaseName} to ${colName}`);
            } catch (renameError) {
              console.error(`❌ Failed to rename ${camelCaseName} to ${colName}:`, renameError.message);
              // Try without quotes
              try {
                await sequelize.query(`
                  ALTER TABLE messages 
                  RENAME COLUMN ${camelCaseName} TO ${colName};
                `);
                console.log(`✅ Renamed ${camelCaseName} to ${colName} (without quotes)`);
              } catch (renameError2) {
                console.error(`❌ Failed to rename (second attempt):`, renameError2.message);
              }
            }
          } else {
            // Add missing column
            console.log(`➕ Adding missing column ${colName}`);
            const nullable = colDef.nullable ? '' : ' NOT NULL';
            const defaultValue = colDef.default ? ` DEFAULT ${colDef.default}` : '';
            try {
              await sequelize.query(`
                ALTER TABLE messages 
                ADD COLUMN ${colName} ${colDef.type}${nullable}${defaultValue};
              `);
              console.log(`✅ Added column ${colName}`);
            } catch (addError) {
              // Check if column already exists (might be case sensitivity issue)
              if (addError.message.includes('already exists') || addError.message.includes('duplicate')) {
                console.log(`⚠️  Column ${colName} might already exist (case sensitivity?)`);
              } else {
                console.error(`❌ Failed to add column ${colName}:`, addError.message);
              }
            }
          }
        } else {
          console.log(`✓ Column ${colName} already exists`);
        }
      }

      // Handle content column - if user_message exists but content doesn't, rename it
      if (actualColumnNames.includes('user_message') && !actualColumnNames.includes('content')) {
        console.log('🔄 Renaming user_message to content...');
        try {
          await sequelize.query(`
            ALTER TABLE messages 
            RENAME COLUMN user_message TO content;
          `);
          console.log('✅ Renamed user_message to content');
        } catch (renameError) {
          console.error('❌ Failed to rename user_message to content:', renameError.message);
          // If rename fails, try to add content column and copy data
          try {
            console.log('➕ Adding content column and copying data from user_message...');
            await sequelize.query(`
              ALTER TABLE messages 
              ADD COLUMN content TEXT;
            `);
            await sequelize.query(`
              UPDATE messages 
              SET content = user_message 
              WHERE content IS NULL;
            `);
            await sequelize.query(`
              ALTER TABLE messages 
              ALTER COLUMN content SET NOT NULL;
            `);
            console.log('✅ Added content column and copied data');
          } catch (addError) {
            console.error('❌ Failed to add content column:', addError.message);
          }
        }
      } else if (!actualColumnNames.includes('content') && !actualColumnNames.includes('user_message')) {
        // Neither exists, add content
        console.log('➕ Adding content column...');
        try {
          await sequelize.query(`
            ALTER TABLE messages 
            ADD COLUMN content TEXT NOT NULL DEFAULT '';
          `);
          console.log('✅ Added content column');
        } catch (addError) {
          console.error('❌ Failed to add content column:', addError.message);
        }
      }

      // Ensure id, created_at, updated_at exist
      if (!columnNames.includes('id')) {
        await sequelize.query(`
          ALTER TABLE messages 
          ADD COLUMN id SERIAL PRIMARY KEY;
        `);
      }

      if (!columnNames.includes('created_at') && !columnNames.includes('createdAt')) {
        await sequelize.query(`
          ALTER TABLE messages 
          ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
      } else if (columnNames.includes('createdAt') && !columnNames.includes('created_at')) {
        await sequelize.query(`
          ALTER TABLE messages 
          RENAME COLUMN "createdAt" TO created_at;
        `);
      }

      if (!columnNames.includes('updated_at') && !columnNames.includes('updatedAt')) {
        await sequelize.query(`
          ALTER TABLE messages 
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
      } else if (columnNames.includes('updatedAt') && !columnNames.includes('updated_at')) {
        await sequelize.query(`
          ALTER TABLE messages 
          RENAME COLUMN "updatedAt" TO updated_at;
        `);
      }

      console.log('✅ Messages table structure fixed');
    } else {
      // For SQLite, columns should match model exactly (camelCase)
      console.log('Using SQLite - columns should be camelCase');
    }
  } catch (error) {
    console.error('Error fixing messages table:', error);
    // Don't throw - let Sequelize handle table creation
  }
}

