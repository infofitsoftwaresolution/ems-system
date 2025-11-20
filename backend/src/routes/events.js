import { Router } from "express";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

const router = Router();

// Cache for table columns to avoid querying on every request
let tableColumnsCache = null;
let columnsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get actual table columns with their nullability
async function getTableColumns(forceRefresh = false) {
  const now = Date.now();
  // Return cached columns if still valid and not forcing refresh
  if (
    !forceRefresh &&
    tableColumnsCache &&
    now - columnsCacheTime < CACHE_TTL
  ) {
    return tableColumnsCache;
  }

  try {
    const dialect = sequelize.getDialect();
    let columns = [];
    let requiredColumns = [];

    if (dialect === "sqlite") {
      // SQLite uses PRAGMA table_info
      console.log("Using SQLite column detection...");
      const [results] = await sequelize.query(`PRAGMA table_info(events)`, {
        type: QueryTypes.SELECT,
      });

      if (Array.isArray(results) && results.length > 0) {
        columns = results.map((r) => r.name);
        requiredColumns = results
          .filter((r) => r.notnull === 1 && r.pk === 0) // NOT NULL and not primary key
          .map((r) => r.name);
        console.log("SQLite detected columns:", columns);
        console.log("SQLite required columns:", requiredColumns);
      }
    } else {
      // PostgreSQL/MySQL use information_schema
      const [results] = await sequelize.query(
        `SELECT column_name, is_nullable 
         FROM information_schema.columns 
         WHERE table_schema = ${
           dialect === "postgres" ? "'public'" : "DATABASE()"
         } AND table_name = 'events' 
         ORDER BY ordinal_position`,
        { type: QueryTypes.SELECT }
      );

      if (Array.isArray(results) && results.length > 0) {
        columns = results.map((r) => r.column_name);
        requiredColumns = results
          .filter((r) => r.is_nullable === "NO")
          .map((r) => r.column_name);
        console.log("Detected columns:", columns);
        console.log("Required (NOT NULL) columns:", requiredColumns);
      }
    }

    // If we didn't get results, try fallback: raw query to detect columns
    if (columns.length === 0) {
      console.log("No columns from schema query, trying raw query fallback...");
      try {
        const [rawResults] = await sequelize.query(
          `SELECT * FROM events LIMIT 1`,
          { type: QueryTypes.SELECT }
        );
        if (rawResults && Array.isArray(rawResults) && rawResults.length > 0) {
          columns = Object.keys(rawResults[0]);
          console.log("Detected columns from raw query:", columns);
          requiredColumns = ["id", "title"];
        } else if (rawResults && typeof rawResults === "object") {
          columns = Object.keys(rawResults);
          console.log(
            "Detected columns from raw query (single object):",
            columns
          );
          requiredColumns = ["id", "title"];
        }
      } catch (rawError) {
        console.error("Raw query fallback also failed:", rawError);
      }
    }

    // If still no columns, return defaults but log warning
    if (columns.length === 0) {
      console.warn("WARNING: Could not detect any columns, using defaults");
      columns = [
        "id",
        "title",
        "description",
        "date",
        "startTime",
        "endTime",
        "createdAt",
        "updatedAt",
      ];
      requiredColumns = ["id", "title", "date"];
    }

    // Store both columns and required columns in cache
    tableColumnsCache = {
      columns: columns,
      required: requiredColumns,
    };
    columnsCacheTime = now;
    return tableColumnsCache;
  } catch (error) {
    console.error("Error getting table columns:", error);
    console.error("Error details:", error.message, error.stack);
    // Return default columns with date as required (based on the error we're seeing)
    return {
      columns: [
        "id",
        "title",
        "description",
        "date",
        "startTime",
        "endTime",
        "createdAt",
        "updatedAt",
      ],
      required: ["id", "title", "date"],
    };
  }
}

// Helper function to transform event data to frontend format
function transformEventData(eventData, columns) {
  const hasStart = columns.includes("start");
  const hasEnd = columns.includes("end");
  const hasDate = columns.includes("date");
  const hasStartTime = columns.includes("startTime");
  const hasEndTime = columns.includes("endTime");
  // Database has 'allday' column, but Sequelize model uses 'allDay' field
  const hasAllDay = columns.includes("allday");
  const hasAttendees = columns.includes("attendees");

  let attendees = [];
  try {
    if (eventData.attendees) {
      attendees =
        typeof eventData.attendees === "string"
          ? JSON.parse(eventData.attendees)
          : eventData.attendees;
    }
  } catch (e) {
    console.error("Error parsing attendees:", e);
    attendees = [];
  }

  // Handle date/time conversion - Sequelize returns Date objects in UTC
  let startDate;
  let endDate;

  if (hasStart && eventData.start) {
    // eventData.start is already a Date object from Sequelize (in UTC)
    startDate =
      eventData.start instanceof Date
        ? eventData.start
        : new Date(eventData.start);
  } else if (hasDate && hasStartTime && eventData.date && eventData.startTime) {
    startDate = new Date(`${eventData.date}T${eventData.startTime}Z`); // Z indicates UTC
  } else if (hasDate && eventData.date) {
    startDate = new Date(`${eventData.date}T00:00:00Z`); // UTC midnight
  } else {
    startDate = new Date();
  }

  if (hasEnd && eventData.end) {
    // eventData.end is already a Date object from Sequelize (in UTC)
    endDate =
      eventData.end instanceof Date ? eventData.end : new Date(eventData.end);
  } else if (hasDate && hasEndTime && eventData.date && eventData.endTime) {
    endDate = new Date(`${eventData.date}T${eventData.endTime}Z`); // Z indicates UTC
  } else if (hasDate && eventData.date) {
    endDate = new Date(`${eventData.date}T00:00:00Z`); // UTC midnight
  } else {
    endDate = new Date(startDate.getTime() + 3600000); // Default 1 hour later
  }

  // Return ISO strings - frontend will handle timezone conversion for display
  return {
    id: `e${eventData.id}`,
    title: eventData.title,
    description: eventData.description || "",
    type: eventData.type || "meeting",
    start: startDate.toISOString(), // Always return UTC ISO string
    end: endDate.toISOString(), // Always return UTC ISO string
    // Sequelize model uses 'allDay' field (maps to 'allday' column in database)
    allDay: eventData.allDay !== undefined ? eventData.allDay : false,
    attendees: Array.isArray(attendees) ? attendees : [],
  };
}

// Get all events
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { type, start, end } = req.query;

    // Get actual table columns
    const columnsResult = await getTableColumns();
    const columns = Array.isArray(columnsResult)
      ? columnsResult
      : columnsResult.columns || [];
    const hasStart = columns.includes("start");
    const hasEnd = columns.includes("end");
    const hasDate = columns.includes("date");
    const hasStartTime = columns.includes("startTime");
    const hasEndTime = columns.includes("endTime");
    const hasAllDay = columns.includes("allday");
    const hasAttendees = columns.includes("attendees");
    const hasCreatedByEmail = columns.includes("createdByEmail");
    const hasType = columns.includes("type");

    // Build attributes list based on what exists
    const attributes = ["id", "title", "description"];
    if (hasStart) attributes.push("start");
    if (hasEnd) attributes.push("end");
    if (hasDate) attributes.push("date");
    if (hasStartTime) attributes.push("startTime");
    if (hasEndTime) attributes.push("endTime");
    if (hasType) attributes.push("type");
    if (hasAllDay) attributes.push("allDay"); // Use model field name, Sequelize maps to 'allday' column
    if (hasAttendees) attributes.push("attendees");
    if (hasCreatedByEmail) attributes.push("createdByEmail");
    attributes.push("createdAt", "updatedAt");

    // Build where clause
    let whereClause = {};
    if (start && end) {
      if (hasStart) {
        whereClause.start = {
          [Op.between]: [new Date(start), new Date(end)],
        };
      } else if (hasDate) {
        whereClause.date = {
          [Op.between]: [new Date(start), new Date(end)],
        };
      }
    }

    // Determine order by column
    const orderColumn = hasStart ? "start" : hasDate ? "date" : "createdAt";

    const events = await Event.findAll({
      where: whereClause,
      attributes: attributes,
      order: [[orderColumn, "ASC"]],
    });

    // Transform events to match frontend format
    const transformedEvents = events.map((event) => {
      return transformEventData(event.toJSON(), columns);
    });

    res.json(transformedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching events",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get event by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));

    // Get actual table columns
    const columnsResult = await getTableColumns();
    const columns = Array.isArray(columnsResult)
      ? columnsResult
      : columnsResult.columns || [];
    const hasStart = columns.includes("start");
    const hasEnd = columns.includes("end");
    const hasDate = columns.includes("date");
    const hasStartTime = columns.includes("startTime");
    const hasEndTime = columns.includes("endTime");
    const hasAllDay = columns.includes("allday");
    const hasAttendees = columns.includes("attendees");
    const hasCreatedByEmail = columns.includes("createdByEmail");
    const hasType = columns.includes("type");

    // Build attributes list based on what exists
    const attributes = ["id", "title", "description"];
    if (hasStart) attributes.push("start");
    if (hasEnd) attributes.push("end");
    if (hasDate) attributes.push("date");
    if (hasStartTime) attributes.push("startTime");
    if (hasEndTime) attributes.push("endTime");
    if (hasType) attributes.push("type");
    if (hasAllDay) attributes.push("allDay"); // Use model field name, Sequelize maps to 'allday' column
    if (hasAttendees) attributes.push("attendees");
    if (hasCreatedByEmail) attributes.push("createdByEmail");
    attributes.push("createdAt", "updatedAt");

    const event = await Event.findByPk(eventId, {
      attributes: attributes,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(transformEventData(event.toJSON(), columns));
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      message: "Error fetching event",
      error: error.message,
    });
  }
});

// Create new event
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, type, start, end, allDay, attendees } =
      req.body;

    // Get user email from database using user ID from token
    let userEmail = req.body.createdByEmail;
    if (!userEmail) {
      const userId = req.user?.sub || req.user?.id;
      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          userEmail = user.email;
        }
      }
    }

    // If still no userEmail, try to get from req.user.email directly
    if (!userEmail && req.user?.email) {
      userEmail = req.user.email;
    }

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Event title is required",
      });
    }

    if (title.trim().length < 2) {
      return res.status(400).json({
        message: "Event title must be at least 2 characters long",
      });
    }

    if (!start || !end) {
      return res.status(400).json({
        message: "Event start and end times are required",
      });
    }

    // Handle date/time fields with validation
    // Frontend sends ISO strings (e.g., "2025-11-20T14:00:00.000Z" or "2025-11-20T14:00:00+05:30")
    // Parse them and ensure they're stored as UTC Date objects
    console.log("Received start:", start, "type:", typeof start);
    console.log("Received end:", end, "type:", typeof end);

    // Parse ISO string - JavaScript Date automatically handles timezone conversion
    // If frontend sends "2025-11-20T00:00:00+05:30", it will be converted to UTC
    const startDate = new Date(start);
    const endDate = new Date(end);

    console.log(
      "Parsed startDate:",
      startDate,
      "isValid:",
      !isNaN(startDate.getTime())
    );
    console.log(
      "Parsed endDate:",
      endDate,
      "isValid:",
      !isNaN(endDate.getTime())
    );

    // Validate dates
    if (isNaN(startDate.getTime())) {
      console.error("Invalid start date:", start);
      return res.status(400).json({
        message: `Invalid start date format: ${start}`,
      });
    }

    if (isNaN(endDate.getTime())) {
      console.error("Invalid end date:", end);
      return res.status(400).json({
        message: `Invalid end date format: ${end}`,
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    // Validate type if provided
    const validTypes = ["meeting", "training", "holiday", "review"];
    const eventType = type || "meeting";
    if (!validTypes.includes(eventType)) {
      return res.status(400).json({
        message: `Invalid event type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Use Sequelize model directly - it has start and end columns defined
    // Ensure dates are valid Date objects
    if (!startDate || isNaN(startDate.getTime())) {
      return res.status(400).json({
        message: "Invalid start date",
      });
    }
    if (!endDate || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: "Invalid end date",
      });
    }

    const eventDataToCreate = {
      title: title.trim(),
      description: description?.trim() || null,
      start: startDate, // Must be a valid Date object
      end: endDate, // Must be a valid Date object
      type: eventType,
    };

    console.log(
      "Event data to create - start:",
      eventDataToCreate.start,
      "end:",
      eventDataToCreate.end
    );
    console.log("Start is Date?", eventDataToCreate.start instanceof Date);
    console.log("End is Date?", eventDataToCreate.end instanceof Date);

    // Set optional fields - use model field name 'allDay' (Sequelize maps to 'allday' DB column)
    if (allDay !== undefined) {
      eventDataToCreate.allDay = Boolean(allDay);
    }
    if (attendees && attendees.length > 0) {
      eventDataToCreate.attendees = JSON.stringify(attendees);
    }
    if (userEmail) {
      eventDataToCreate.createdByEmail = userEmail;
    }

    // Always include start and end - the model requires them
    // Also set legacy fields for backward compatibility
    eventDataToCreate.date = startDate.toISOString().split("T")[0];
    eventDataToCreate.startTime = startDate.toTimeString().split(" ")[0];
    eventDataToCreate.endTime = endDate.toTimeString().split(" ")[0];

    console.log(
      "Creating event with data:",
      JSON.stringify(
        {
          ...eventDataToCreate,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        null,
        2
      )
    );
    console.log("Start date object:", startDate);
    console.log("End date object:", endDate);
    console.log(
      "Start is valid Date?",
      startDate instanceof Date && !isNaN(startDate.getTime())
    );
    console.log(
      "End is valid Date?",
      endDate instanceof Date && !isNaN(endDate.getTime())
    );

    // Ensure Event table exists (sync if needed)
    try {
      await Event.sync({ alter: false });
    } catch (syncError) {
      console.warn("Event table sync warning:", syncError.message);
      // Continue anyway - table might already exist
    }

    // Check what columns exist in the database
    const columnsResult = await getTableColumns();
    const columns = Array.isArray(columnsResult)
      ? columnsResult
      : columnsResult.columns || [];
    const hasStart = columns.includes("start");
    const hasEnd = columns.includes("end");

    let event;
    try {
      // Double-check dates are valid before creating
      if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        throw new Error("Start date is not a valid Date object");
      }
      if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        throw new Error("End date is not a valid Date object");
      }

      // If database doesn't have start/end columns, try to add them first
      let finalHasStart = hasStart;
      let finalHasEnd = hasEnd;

      if (!hasStart || !hasEnd) {
        console.log(
          "Database missing start/end columns, attempting to add them..."
        );
        const dialect = sequelize.getDialect();

        try {
          if (dialect === "sqlite") {
            // SQLite: Add columns if they don't exist (SQLite doesn't support IF NOT EXISTS in ALTER TABLE)
            try {
              if (!hasStart) {
                await sequelize.query(
                  `ALTER TABLE events ADD COLUMN start DATETIME`
                );
                console.log("✅ Added start column to SQLite table");
                finalHasStart = true;
              }
            } catch (e) {
              if (
                !e.message.includes("duplicate column") &&
                !e.message.includes("already exists")
              ) {
                throw e;
              }
              console.log("start column already exists");
              finalHasStart = true;
            }
            try {
              if (!hasEnd) {
                await sequelize.query(
                  `ALTER TABLE events ADD COLUMN end DATETIME`
                );
                console.log("✅ Added end column to SQLite table");
                finalHasEnd = true;
              }
            } catch (e) {
              if (
                !e.message.includes("duplicate column") &&
                !e.message.includes("already exists")
              ) {
                throw e;
              }
              console.log("end column already exists");
              finalHasEnd = true;
            }
          } else if (dialect === "postgres") {
            // PostgreSQL: Add columns if they don't exist
            // Note: "end" is a reserved keyword in PostgreSQL, so we must quote it
            if (!hasStart) {
              await sequelize.query(
                `ALTER TABLE events ADD COLUMN IF NOT EXISTS start TIMESTAMP`
              );
              console.log("✅ Added start column to PostgreSQL table");
              finalHasStart = true;
            }
            if (!hasEnd) {
              await sequelize.query(
                `ALTER TABLE events ADD COLUMN IF NOT EXISTS "end" TIMESTAMP`
              );
              console.log("✅ Added end column to PostgreSQL table");
              finalHasEnd = true;
            }
          }
        } catch (alterError) {
          console.error("Error adding columns:", alterError.message);
          // Continue anyway - might already exist
        }
      }

      // If columns still don't exist after trying to add them, use raw SQL
      if (!finalHasStart || !finalHasEnd) {
        console.log(
          "Using raw SQL with legacy columns since start/end columns are missing..."
        );
        console.log("Available columns:", columns);
        const dialect = sequelize.getDialect();
        const dateStr = startDate.toISOString().split("T")[0];
        const startTimeStr = startDate.toTimeString().split(" ")[0];
        const endTimeStr = endDate.toTimeString().split(" ")[0];

        try {
          // Build INSERT query using only columns that actually exist
          const insertCols = [];
          const insertVals = [];
          let paramIndex = 1;

          // Always include title (required)
          insertCols.push("title");
          insertVals.push(eventDataToCreate.title);

          // Add other columns only if they exist
          if (columns.includes("description")) {
            insertCols.push("description");
            insertVals.push(eventDataToCreate.description || null);
          }
          if (columns.includes("date")) {
            insertCols.push("date");
            insertVals.push(dateStr);
          }
          if (columns.includes("startTime")) {
            insertCols.push('"startTime"');
            insertVals.push(startTimeStr);
          }
          if (columns.includes("endTime")) {
            insertCols.push('"endTime"');
            insertVals.push(endTimeStr);
          }
          // Add allday column if it exists (use lowercase for raw SQL)
          if (
            columns.includes("allday") &&
            eventDataToCreate.allDay !== undefined
          ) {
            insertCols.push("allday");
            insertVals.push(Boolean(eventDataToCreate.allDay));
          }
          // Note: type, attendees, createdByEmail might not be in the database
          // So we skip them in raw SQL fallback

          // Add timestamps if they exist
          const hasCreatedAt = columns.includes("createdAt");
          const hasUpdatedAt = columns.includes("updatedAt");

          if (dialect === "sqlite") {
            // SQLite
            const placeholders = insertCols.map(() => "?");
            if (hasCreatedAt) {
              insertCols.push('"createdAt"');
              placeholders.push("datetime('now')");
            }
            if (hasUpdatedAt) {
              insertCols.push('"updatedAt"');
              placeholders.push("datetime('now')");
            }

            const query = `INSERT INTO events (${insertCols.join(
              ", "
            )}) VALUES (${placeholders.join(", ")})`;
            console.log("SQLite INSERT query:", query);
            console.log("SQLite values:", insertVals);

            const [result] = await sequelize.query(query, {
              replacements: insertVals,
              type: QueryTypes.INSERT,
            });
            const eventId = Array.isArray(result) ? result[0] : result;
            event = await Event.findByPk(eventId);
          } else {
            // PostgreSQL
            const placeholders = insertCols.map((_, i) => `$${i + 1}`);
            if (hasCreatedAt) {
              insertCols.push('"createdAt"');
              placeholders.push("NOW()");
            }
            if (hasUpdatedAt) {
              insertCols.push('"updatedAt"');
              placeholders.push("NOW()");
            }

            const query = `INSERT INTO events (${insertCols.join(
              ", "
            )}) VALUES (${placeholders.join(", ")}) RETURNING *`;
            console.log("PostgreSQL INSERT query:", query);
            console.log("PostgreSQL values:", insertVals);

            const [result] = await sequelize.query(query, {
              bind: insertVals,
              type: QueryTypes.SELECT,
            });
            const eventId =
              Array.isArray(result) && result.length > 0
                ? result[0].id
                : result?.id;
            event = await Event.findByPk(eventId);
          }
        } catch (rawSqlError) {
          console.error("Raw SQL insert failed:", rawSqlError.message);
          console.error("Raw SQL error stack:", rawSqlError.stack);
          // Re-throw to be caught by outer catch
          throw rawSqlError;
        }
      } else {
        // Database has start/end columns, use Sequelize create
        // Build clean event data using only fields that exist in the database
        const eventDataForSequelize = {
          title: eventDataToCreate.title,
          description: eventDataToCreate.description,
          start: eventDataToCreate.start,
          end: eventDataToCreate.end,
        };

        // Add optional fields only if they exist in the database
        if (columns.includes("type") && eventDataToCreate.type) {
          eventDataForSequelize.type = eventDataToCreate.type;
        }
        if (
          columns.includes("allday") &&
          eventDataToCreate.allDay !== undefined
        ) {
          eventDataForSequelize.allDay = eventDataToCreate.allDay;
        }
        if (columns.includes("attendees") && eventDataToCreate.attendees) {
          eventDataForSequelize.attendees = eventDataToCreate.attendees;
        }
        if (
          columns.includes("createdByEmail") &&
          eventDataToCreate.createdByEmail
        ) {
          eventDataForSequelize.createdByEmail =
            eventDataToCreate.createdByEmail;
        }
        // Legacy fields for backward compatibility
        if (columns.includes("date")) {
          eventDataForSequelize.date = eventDataToCreate.date;
        }
        if (columns.includes("startTime")) {
          eventDataForSequelize.startTime = eventDataToCreate.startTime;
        }
        if (columns.includes("endTime")) {
          eventDataForSequelize.endTime = eventDataToCreate.endTime;
        }

        console.log("Using Sequelize create with start/end columns");
        console.log(
          "Event data for Sequelize:",
          JSON.stringify(eventDataForSequelize, null, 2)
        );

        // Use Sequelize create - it will automatically map allDay → allday via field mapping
        // Sequelize handles the field mapping defined in the model (allDay field → allday column)
        event = await Event.create(eventDataForSequelize);
      }
    } catch (createError) {
      console.error("Sequelize create error:", createError);
      console.error("Error name:", createError.name);
      console.error("Error message:", createError.message);
      console.error("Error stack:", createError.stack);
      console.error(
        "Event data that failed:",
        JSON.stringify(eventDataToCreate, null, 2)
      );

      // Handle Sequelize validation errors
      if (createError.name === "SequelizeValidationError") {
        const errors = createError.errors
          .map((err) => `${err.path}: ${err.message}`)
          .join(", ");
        console.error("Validation errors:", createError.errors);
        return res.status(400).json({
          message: `Validation error: ${errors}`,
          errors: createError.errors,
        });
      }
      // Handle database column errors
      if (
        createError.message &&
        (createError.message.includes("no such column") ||
          createError.message.includes("SQLITE_ERROR") ||
          createError.message.includes("column") ||
          createError.message.includes("does not exist"))
      ) {
        console.error("Database column error details:", {
          message: createError.message,
          name: createError.name,
          stack: createError.stack,
          detectedColumns: columns,
          hasStart,
          hasEnd,
        });
        return res.status(500).json({
          message: `Database schema mismatch: ${
            createError.message
          }. Available columns: ${columns.join(", ")}`,
          error: createError.message,
          availableColumns: columns,
          details:
            process.env.NODE_ENV === "development"
              ? createError.stack
              : undefined,
        });
      }
      // Handle other Sequelize errors
      if (createError.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          message: "An event with these details already exists",
        });
      }
      // Re-throw if it's not a known error
      throw createError;
    }

    // Get columns for transform (use cached or fetch fresh)
    const transformColumnsResult = await getTableColumns();
    const transformColumns = Array.isArray(transformColumnsResult)
      ? transformColumnsResult
      : transformColumnsResult.columns || [];
    res.status(201).json(transformEventData(event.toJSON(), transformColumns));
  } catch (error) {
    console.error("Error creating event:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("Request user object:", req.user);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    // If it's a database error, provide more details
    if (
      error.name === "SequelizeDatabaseError" ||
      error.message.includes("column") ||
      error.message.includes("does not exist")
    ) {
      return res.status(500).json({
        message: `Database error: ${error.message}`,
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }

    res.status(500).json({
      message: "Error creating event",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Update event
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));
    const { title, description, type, start, end, allDay, attendees } =
      req.body;

    // Get actual table columns
    const columnsResult = await getTableColumns();
    const columns = Array.isArray(columnsResult)
      ? columnsResult
      : columnsResult.columns || [];
    const hasStart = columns.includes("start");
    const hasEnd = columns.includes("end");
    const hasDate = columns.includes("date");
    const hasStartTime = columns.includes("startTime");
    const hasEndTime = columns.includes("endTime");
    const hasAllDay = columns.includes("allday");
    const hasAttendees = columns.includes("attendees");
    const hasType = columns.includes("type");

    // Build attributes list
    const attributes = ["id", "title", "description"];
    if (hasStart) attributes.push("start");
    if (hasEnd) attributes.push("end");
    if (hasDate) attributes.push("date");
    if (hasStartTime) attributes.push("startTime");
    if (hasEndTime) attributes.push("endTime");
    if (hasType) attributes.push("type");
    if (hasAllDay) attributes.push("allDay"); // Use model field name, Sequelize maps to 'allday' column
    if (hasAttendees) attributes.push("attendees");
    if (columns.includes("createdByEmail")) attributes.push("createdByEmail");
    attributes.push("createdAt", "updatedAt");

    const event = await Event.findByPk(eventId, {
      attributes: attributes,
    });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Update event data based on what columns exist
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;

    // Handle type
    if (type !== undefined && hasType) {
      updateData.type = type;
    }

    // Handle date/time fields
    if (start !== undefined) {
      const startDate = new Date(start);
      if (hasStart) updateData.start = startDate;
      if (hasDate) updateData.date = startDate.toISOString().split("T")[0];
      if (hasStartTime)
        updateData.startTime = startDate.toTimeString().split(" ")[0];
    }
    if (end !== undefined) {
      const endDate = new Date(end);
      if (hasEnd) updateData.end = endDate;
      if (hasEndTime) updateData.endTime = endDate.toTimeString().split(" ")[0];
    }
    if (hasAllDay && allDay !== undefined) {
      // Use model field name 'allDay' (Sequelize maps to 'allday' DB column)
      updateData.allDay = Boolean(allDay);
    }
    if (hasAttendees && attendees !== undefined) {
      updateData.attendees =
        attendees && attendees.length > 0 ? JSON.stringify(attendees) : null;
    }

    await event.update(updateData);

    const columnsForTransform = Array.isArray(columnsResult)
      ? columnsResult
      : columnsResult.columns || [];
    res.json(transformEventData(event.toJSON(), columnsForTransform));
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      message: "Error updating event",
      error: error.message,
    });
  }
});

// Delete event
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));

    // For delete, we only need the ID
    const event = await Event.findByPk(eventId, {
      attributes: ["id"],
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.destroy();

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      message: "Error deleting event",
      error: error.message,
    });
  }
});

export default router;
