import { DataTypes } from "sequelize";

/**
 * Migration to add event_id field to notifications table
 * This links notifications to events for the Calendar Event + Notification module
 */
export async function addEventIdToNotifications(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("notifications");
    
    if (!tableExists) {
      console.log("⚠️ Notifications table does not exist. Skipping migration.");
      await transaction.commit();
      return;
    }

    // Check if event_id column already exists
    const tableDescription = await queryInterface.describeTable("notifications");
    const existingColumns = Object.keys(tableDescription);

    if (existingColumns.includes("event_id")) {
      console.log("✅ event_id column already exists in notifications table");
      await transaction.commit();
      return;
    }

    // Add event_id column
    await queryInterface.addColumn(
      "notifications",
      "event_id",
      {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable because not all notifications are event-related
        references: {
          model: "events",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL", // If event is deleted, keep notification but remove reference
      },
      { transaction }
    );

    // Add index for better query performance
    await queryInterface.addIndex(
      "notifications",
      ["event_id"],
      {
        name: "idx_notifications_event_id",
        transaction,
      }
    );

    await transaction.commit();
    console.log("✅ Added event_id column to notifications table");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error adding event_id to notifications table:", error);
    throw error;
  }
}

export async function removeEventIdFromNotifications(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const tableExists = await queryInterface.tableExists("notifications");
    
    if (!tableExists) {
      console.log("⚠️ Notifications table does not exist. Skipping rollback.");
      await transaction.commit();
      return;
    }

    // Check if event_id column exists
    const tableDescription = await queryInterface.describeTable("notifications");
    const existingColumns = Object.keys(tableDescription);

    if (!existingColumns.includes("event_id")) {
      console.log("⚠️ event_id column does not exist. Nothing to remove.");
      await transaction.commit();
      return;
    }

    // Remove index first
    try {
      await queryInterface.removeIndex("notifications", "idx_notifications_event_id", {
        transaction,
      });
    } catch (indexError) {
      console.log("⚠️ Index may not exist, continuing...");
    }

    // Remove column
    await queryInterface.removeColumn("notifications", "event_id", { transaction });

    await transaction.commit();
    console.log("✅ Removed event_id column from notifications table");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error removing event_id from notifications table:", error);
    throw error;
  }
}

