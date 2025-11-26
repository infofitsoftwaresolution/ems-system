import { DataTypes } from "sequelize";

/**
 * Migration to add can_access_system field to employees table
 * This field, along with is_active, controls whether emails can be sent to an employee
 */
export async function addCanAccessSystemField(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("employees");
    
    if (!tableExists) {
      console.log("⚠️ Employees table does not exist. Skipping migration.");
      await transaction.commit();
      return;
    }

    const tableDescription = await queryInterface.describeTable("employees");
    const existingColumns = Object.keys(tableDescription);

    // Add can_access_system column
    if (!existingColumns.includes("can_access_system")) {
      await queryInterface.addColumn(
        "employees",
        "can_access_system",
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true, // Default to true for existing employees
        },
        { transaction }
      );
      console.log("✅ Added can_access_system column to employees table");
    }

    await transaction.commit();
    console.log("✅ can_access_system field migration completed");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error adding can_access_system field:", error);
    throw error;
  }
}

export async function removeCanAccessSystemField(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("employees");
    
    if (!tableExists) {
      console.log("⚠️ Employees table does not exist. Skipping rollback.");
      await transaction.commit();
      return;
    }

    const tableDescription = await queryInterface.describeTable("employees");
    const existingColumns = Object.keys(tableDescription);

    if (existingColumns.includes("can_access_system")) {
      await queryInterface.removeColumn("employees", "can_access_system", {
        transaction,
      });
      console.log("✅ Removed can_access_system column from employees table");
    }

    await transaction.commit();
    console.log("✅ can_access_system field rollback completed");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error removing can_access_system field:", error);
    throw error;
  }
}

