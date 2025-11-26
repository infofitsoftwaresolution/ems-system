import { DataTypes } from "sequelize";

/**
 * Migration to add visibility_type, assigned_users, created_by, and notification_sent fields to tasks table
 * This enables tasks to be assigned to ALL employees or SPECIFIC employees, similar to events
 */
export async function addTaskVisibilityFields(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("tasks");
    
    if (!tableExists) {
      console.log("⚠️ Tasks table does not exist. Skipping migration.");
      await transaction.commit();
      return;
    }

    const tableDescription = await queryInterface.describeTable("tasks");
    const existingColumns = Object.keys(tableDescription);
    const isPostgreSQL = queryInterface.sequelize.getDialect() === "postgres";

    // Add visibility_type column
    if (!existingColumns.includes("visibility_type")) {
      await queryInterface.addColumn(
        "tasks",
        "visibility_type",
        {
          type: isPostgreSQL
            ? DataTypes.ENUM("ALL", "SPECIFIC")
            : DataTypes.STRING,
          allowNull: false,
          defaultValue: "ALL",
        },
        { transaction }
      );
      console.log("✅ Added visibility_type column to tasks table");
    }

    // Add assigned_users column (JSON array of employee IDs)
    if (!existingColumns.includes("assigned_users")) {
      await queryInterface.addColumn(
        "tasks",
        "assigned_users",
        {
          type: DataTypes.TEXT, // Store as JSON string for SQLite compatibility
          allowNull: true,
        },
        { transaction }
      );
      console.log("✅ Added assigned_users column to tasks table");
    }

    // Add created_by column (user ID, FK to users table)
    if (!existingColumns.includes("created_by")) {
      await queryInterface.addColumn(
        "tasks",
        "created_by",
        {
          type: DataTypes.INTEGER,
          allowNull: true, // Allow null initially for existing records
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        { transaction }
      );
      console.log("✅ Added created_by column to tasks table");
    }

    // Add notification_sent column
    if (!existingColumns.includes("notification_sent")) {
      await queryInterface.addColumn(
        "tasks",
        "notification_sent",
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction }
      );
      console.log("✅ Added notification_sent column to tasks table");
    }

    // Add indexes for better query performance
    if (!existingColumns.includes("visibility_type")) {
      await queryInterface.addIndex(
        "tasks",
        ["visibility_type"],
        {
          name: "idx_tasks_visibility_type",
          transaction,
        }
      );
    }

    if (!existingColumns.includes("created_by")) {
      await queryInterface.addIndex(
        "tasks",
        ["created_by"],
        {
          name: "idx_tasks_created_by",
          transaction,
        }
      );
    }

    await queryInterface.addIndex(
      "tasks",
      ["dueDate"],
      {
        name: "idx_tasks_due_date",
        transaction,
      }
    );

    await transaction.commit();
    console.log("✅ Task visibility fields migration completed");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error adding task visibility fields:", error);
    throw error;
  }
}

export async function removeTaskVisibilityFields(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("tasks");
    
    if (!tableExists) {
      console.log("⚠️ Tasks table does not exist. Skipping rollback.");
      await transaction.commit();
      return;
    }

    const tableDescription = await queryInterface.describeTable("tasks");
    const existingColumns = Object.keys(tableDescription);

    // Remove indexes first
    try {
      await queryInterface.removeIndex("tasks", "idx_tasks_visibility_type", {
        transaction,
      });
    } catch (e) {}
    try {
      await queryInterface.removeIndex("tasks", "idx_tasks_created_by", {
        transaction,
      });
    } catch (e) {}
    try {
      await queryInterface.removeIndex("tasks", "idx_tasks_due_date", {
        transaction,
      });
    } catch (e) {}

    // Remove columns
    if (existingColumns.includes("notification_sent")) {
      await queryInterface.removeColumn("tasks", "notification_sent", { transaction });
    }
    if (existingColumns.includes("created_by")) {
      await queryInterface.removeColumn("tasks", "created_by", { transaction });
    }
    if (existingColumns.includes("assigned_users")) {
      await queryInterface.removeColumn("tasks", "assigned_users", { transaction });
    }
    if (existingColumns.includes("visibility_type")) {
      await queryInterface.removeColumn("tasks", "visibility_type", { transaction });
    }

    await transaction.commit();
    console.log("✅ Removed task visibility fields");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error removing task visibility fields:", error);
    throw error;
  }
}

