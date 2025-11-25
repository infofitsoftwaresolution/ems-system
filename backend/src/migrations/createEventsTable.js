import { DataTypes } from "sequelize";

export async function createEventsTable(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // Check if events table already exists
    const tableExists = await queryInterface.tableExists("events");
    const isPostgreSQL = queryInterface.sequelize.getDialect() === "postgres";

    if (tableExists) {
      console.log("⚠️ Events table already exists. Checking structure...");

      // Get current table structure
      const tableDescription = await queryInterface.describeTable("events");
      const existingColumns = Object.keys(tableDescription);

      // Required columns
      const requiredColumns = {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        start_date_time: { type: DataTypes.DATE, allowNull: false },
        end_date_time: { type: DataTypes.DATE, allowNull: false },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        visibility_type: {
          type: isPostgreSQL
            ? DataTypes.ENUM("ALL", "SPECIFIC")
            : DataTypes.STRING,
          allowNull: false,
          defaultValue: "ALL",
        },
        assigned_users: { type: DataTypes.TEXT, allowNull: true },
        notification_sent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      };

      // Check for missing columns and add them
      let hasChanges = false;
      for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
        if (!existingColumns.includes(columnName)) {
          console.log(`➕ Adding missing column: ${columnName}`);
          try {
            // For primary key, skip (should already exist)
            if (columnName === "id") continue;

            // Prepare column definition for addColumn
            const addColumnDef = {
              type: columnDef.type,
              allowNull: columnDef.allowNull !== false,
            };

            // Add defaultValue if specified
            if (columnDef.defaultValue !== undefined) {
              if (columnDef.defaultValue === DataTypes.NOW) {
                if (isPostgreSQL) {
                  addColumnDef.defaultValue =
                    queryInterface.sequelize.literal("CURRENT_TIMESTAMP");
                } else {
                  addColumnDef.defaultValue =
                    queryInterface.sequelize.literal("datetime('now')");
                }
              } else {
                addColumnDef.defaultValue = columnDef.defaultValue;
              }
            }

            await queryInterface.addColumn("events", columnName, addColumnDef, {
              transaction,
            });
            hasChanges = true;
            console.log(`✅ Added column: ${columnName}`);
          } catch (addError) {
            console.error(
              `❌ Error adding column ${columnName}:`,
              addError.message
            );
            // Continue with other columns
          }
        }
      }

      // Check if table structure is completely wrong (missing critical columns)
      const criticalColumns = [
        "start_date_time",
        "end_date_time",
        "created_by",
        "title",
      ];
      const hasCriticalColumns = criticalColumns.every((col) =>
        existingColumns.includes(col)
      );

      if (!hasCriticalColumns) {
        console.log(
          "⚠️ Events table exists but is missing critical columns. Dropping and recreating..."
        );
        await transaction.rollback();
        // Start new transaction for drop and recreate
        const recreateTransaction =
          await queryInterface.sequelize.transaction();
        try {
          await queryInterface.dropTable("events", {
            transaction: recreateTransaction,
          });
          await recreateTransaction.commit();
          // Table will be created below
        } catch (dropError) {
          await recreateTransaction.rollback();
          console.error("❌ Error dropping events table:", dropError);
          throw dropError;
        }
      } else if (hasChanges) {
        console.log("✅ Events table structure updated successfully.");
        await transaction.commit();
        return;
      } else {
        console.log("✅ Events table structure is correct. No changes needed.");
        await transaction.commit();
        return;
      }
    }

    await queryInterface.createTable(
      "events",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        start_date_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        end_date_time: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        created_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        visibility_type: {
          type: isPostgreSQL
            ? DataTypes.ENUM("ALL", "SPECIFIC")
            : DataTypes.STRING,
          allowNull: false,
          defaultValue: "ALL",
        },
        assigned_users: {
          type: DataTypes.TEXT, // Store as JSON string for SQLite compatibility
          allowNull: true,
        },
        notification_sent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      { transaction }
    );

    // Add indexes for better query performance
    await queryInterface.addIndex("events", ["start_date_time"], {
      name: "idx_events_start_date_time",
      transaction,
    });
    await queryInterface.addIndex("events", ["end_date_time"], {
      name: "idx_events_end_date_time",
      transaction,
    });
    await queryInterface.addIndex("events", ["created_by"], {
      name: "idx_events_created_by",
      transaction,
    });
    await queryInterface.addIndex("events", ["visibility_type"], {
      name: "idx_events_visibility_type",
      transaction,
    });

    await transaction.commit();
    console.log("✅ Events table created successfully.");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating events table:", error);
    throw error;
  }
}

export async function dropEventsTable(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.dropTable("events", { transaction });
    await transaction.commit();
    console.log("✅ Events table dropped successfully.");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error dropping events table:", error);
    throw error;
  }
}
