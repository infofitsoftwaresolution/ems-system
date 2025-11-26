import { DataTypes } from "sequelize";

/**
 * Migration to add task_id field to notifications table
 * This links notifications to tasks for the Task + Notification module
 */
export async function addTaskIdToNotifications(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("notifications");
    
    if (!tableExists) {
      console.log("⚠️ Notifications table does not exist. Skipping migration.");
      await transaction.commit();
      return;
    }

    // Check if task_id column already exists
    const tableDescription = await queryInterface.describeTable("notifications");
    const existingColumns = Object.keys(tableDescription);

    if (existingColumns.includes("task_id")) {
      console.log("✅ task_id column already exists in notifications table");
      await transaction.commit();
      return;
    }

    // Add task_id column
    await queryInterface.addColumn(
      "notifications",
      "task_id",
      {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable because not all notifications are task-related
        references: {
          model: "tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL", // If task is deleted, keep notification but remove reference
      },
      { transaction }
    );

    // Add index for better query performance
    await queryInterface.addIndex(
      "notifications",
      ["task_id"],
      {
        name: "idx_notifications_task_id",
        transaction,
      }
    );

    await transaction.commit();
    console.log("✅ Added task_id column to notifications table");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error adding task_id to notifications table:", error);
    throw error;
  }
}

export async function removeTaskIdFromNotifications(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("notifications");
    
    if (!tableExists) {
      console.log("⚠️ Notifications table does not exist. Skipping rollback.");
      await transaction.commit();
      return;
    }

    // Check if task_id column exists
    const tableDescription = await queryInterface.describeTable("notifications");
    const existingColumns = Object.keys(tableDescription);

    if (!existingColumns.includes("task_id")) {
      console.log("⚠️ task_id column does not exist. Nothing to remove.");
      await transaction.commit();
      return;
    }

    // Remove index first
    try {
      await queryInterface.removeIndex("notifications", "idx_notifications_task_id", {
        transaction,
      });
    } catch (indexError) {
      console.log("⚠️ Index may not exist, continuing...");
    }

    // Remove column
    await queryInterface.removeColumn("notifications", "task_id", { transaction });

    await transaction.commit();
    console.log("✅ Removed task_id column from notifications table");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error removing task_id from notifications table:", error);
    throw error;
  }
}

