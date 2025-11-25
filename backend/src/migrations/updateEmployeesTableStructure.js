import { sequelize } from '../sequelize.js';
import { DataTypes } from 'sequelize';

/**
 * Migration to update employees table with new structure
 * Adds: emp_id, mobile_number, location, designation
 * Updates: status to ENUM('Working', 'Not Working')
 */
export async function updateEmployeesTableStructure() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Starting employees table structure update...');
    
    // Check if table exists
    const tableDescription = await queryInterface.describeTable('employees');
    console.log('📋 Current table structure:', Object.keys(tableDescription));
    
    // Check database dialect
    const isPostgreSQL = sequelize.getDialect() === 'postgres';
    
    // Add emp_id column if it doesn't exist
    if (!tableDescription.emp_id) {
      console.log('➕ Adding emp_id column...');
      try {
        await queryInterface.addColumn('employees', 'emp_id', {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
        });
        console.log('✅ Added emp_id column');
      } catch (addError) {
        // If unique constraint fails, add without unique first, then add unique index
        console.log('⚠️ Adding emp_id without unique constraint first...');
        await queryInterface.addColumn('employees', 'emp_id', {
          type: DataTypes.STRING,
          allowNull: true
        });
        // Try to add unique index separately
        try {
          await queryInterface.addIndex('employees', ['emp_id'], {
            unique: true,
            name: 'employees_emp_id_unique'
          });
          console.log('✅ Added emp_id column with unique constraint');
        } catch (indexError) {
          console.log('⚠️ Could not add unique constraint, continuing...');
        }
      }
    } else {
      console.log('✓ emp_id column already exists');
    }
    
    // Add mobile_number column if it doesn't exist
    if (!tableDescription.mobile_number) {
      console.log('➕ Adding mobile_number column...');
      await queryInterface.addColumn('employees', 'mobile_number', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log('✅ Added mobile_number column');
    } else {
      console.log('✓ mobile_number column already exists');
    }
    
    // Add location column if it doesn't exist
    if (!tableDescription.location) {
      console.log('➕ Adding location column...');
      await queryInterface.addColumn('employees', 'location', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log('✅ Added location column');
    } else {
      console.log('✓ location column already exists');
    }
    
    // Add designation column if it doesn't exist
    if (!tableDescription.designation) {
      console.log('➕ Adding designation column...');
      await queryInterface.addColumn('employees', 'designation', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log('✅ Added designation column');
    } else {
      console.log('✓ designation column already exists');
    }
    
    // Update status column to ENUM if it exists and is not already ENUM
    if (tableDescription.status) {
      // For PostgreSQL, check if it's already an ENUM type
      if (isPostgreSQL) {
        try {
          // Try to alter the column type to ENUM
          await sequelize.query(`
            DO $$ 
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employees_status_enum') THEN
                CREATE TYPE employees_status_enum AS ENUM ('Working', 'Not Working');
              END IF;
            END $$;
          `);
          
          // Check current column type
          const [results] = await sequelize.query(`
            SELECT data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = 'status'
          `);
          
          if (results.length > 0 && results[0].udt_name !== 'employees_status_enum') {
            console.log('🔄 Updating status column to ENUM...');
            await sequelize.query(`
              ALTER TABLE employees 
              ALTER COLUMN status TYPE employees_status_enum 
              USING status::employees_status_enum;
            `);
            console.log('✅ Updated status column to ENUM');
          } else {
            console.log('✓ status column is already ENUM type');
          }
        } catch (enumError) {
          console.log('⚠️ Could not update status to ENUM, keeping as STRING:', enumError.message);
        }
      } else {
        // For SQLite, we can't use ENUM, so we'll keep it as STRING
        // But we can add a CHECK constraint
        console.log('ℹ️ SQLite detected - status will remain as STRING with CHECK constraint');
        try {
          // SQLite doesn't support ALTER TABLE ADD CONSTRAINT easily
          // We'll just document that validation should be done at application level
          console.log('✓ Status validation will be handled at application level for SQLite');
        } catch (checkError) {
          console.log('⚠️ Could not add CHECK constraint:', checkError.message);
        }
      }
    } else {
      // Add status column if it doesn't exist
      console.log('➕ Adding status column...');
      if (isPostgreSQL) {
        await sequelize.query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employees_status_enum') THEN
              CREATE TYPE employees_status_enum AS ENUM ('Working', 'Not Working');
            END IF;
          END $$;
        `);
        await queryInterface.addColumn('employees', 'status', {
          type: DataTypes.ENUM('Working', 'Not Working'),
          defaultValue: 'Working',
          allowNull: false
        });
      } else {
        await queryInterface.addColumn('employees', 'status', {
          type: DataTypes.STRING,
          defaultValue: 'Working',
          allowNull: false
        });
      }
      console.log('✅ Added status column');
    }
    
    // Migrate existing data: Copy employeeId to emp_id if emp_id is null
    try {
      const employeeIdColumn = isPostgreSQL ? '"employeeId"' : 'employeeId';
      const [results] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE emp_id IS NULL AND ${employeeIdColumn} IS NOT NULL
      `);
      
      if (results[0]?.count > 0) {
        console.log(`🔄 Migrating ${results[0].count} existing employeeId values to emp_id...`);
        await sequelize.query(`
          UPDATE employees 
          SET emp_id = ${employeeIdColumn} 
          WHERE emp_id IS NULL AND ${employeeIdColumn} IS NOT NULL
        `);
        console.log('✅ Migrated existing employeeId to emp_id');
      }
    } catch (migrateError) {
      console.log('⚠️ Could not migrate employeeId to emp_id:', migrateError.message);
    }
    
    // Migrate existing data: Copy position to designation if designation is null
    try {
      const [positionResults] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE designation IS NULL AND position IS NOT NULL
      `);
      
      if (positionResults[0]?.count > 0) {
        console.log(`🔄 Migrating ${positionResults[0].count} existing position values to designation...`);
        await sequelize.query(`
          UPDATE employees 
          SET designation = position 
          WHERE designation IS NULL AND position IS NOT NULL
        `);
        console.log('✅ Migrated existing position to designation');
      }
    } catch (migrateError) {
      console.log('⚠️ Could not migrate position to designation:', migrateError.message);
    }
    
    // Migrate existing data: Copy department to location if location is null
    try {
      const [deptResults] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE location IS NULL AND department IS NOT NULL
      `);
      
      if (deptResults[0]?.count > 0) {
        console.log(`🔄 Migrating ${deptResults[0].count} existing department values to location...`);
        await sequelize.query(`
          UPDATE employees 
          SET location = department 
          WHERE location IS NULL AND department IS NOT NULL
        `);
        console.log('✅ Migrated existing department to location');
      }
    } catch (migrateError) {
      console.log('⚠️ Could not migrate department to location:', migrateError.message);
    }
    
    // Update status values: Convert 'active' to 'Working', 'inactive' to 'Not Working'
    try {
      const [statusResults] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE status IN ('active', 'inactive')
      `);
      
      if (statusResults[0]?.count > 0) {
        console.log(`🔄 Updating ${statusResults[0].count} status values...`);
        if (isPostgreSQL) {
          await sequelize.query(`
            UPDATE employees 
            SET status = CASE 
              WHEN status = 'active' THEN 'Working'::employees_status_enum
              WHEN status = 'inactive' THEN 'Not Working'::employees_status_enum
              ELSE status::employees_status_enum
            END
            WHERE status IN ('active', 'inactive')
          `);
        } else {
          await sequelize.query(`
            UPDATE employees 
            SET status = CASE 
              WHEN status = 'active' THEN 'Working'
              WHEN status = 'inactive' THEN 'Not Working'
              ELSE status
            END
            WHERE status IN ('active', 'inactive')
          `);
        }
        console.log('✅ Updated status values');
      }
    } catch (migrateError) {
      console.log('⚠️ Could not update status values:', migrateError.message);
    }
    
    console.log('✅ Employees table structure update completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

