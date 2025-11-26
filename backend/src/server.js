import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cron from "node-cron";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { sequelize } from "./sequelize.js";
import { Attendance } from "./models/Attendance.js";
import { Op } from "sequelize";
// import models so sequelize can sync tables
import { User } from "./models/User.js";
import { Employee } from "./models/Employee.js";
import "./models/UserSession.js";
import "./models/Event.js";
import "./models/Course.js";
import "./models/SiteSetting.js";
import "./models/AccessLog.js";
import "./models/NotificationSetting.js";
import { setupKycAssociations } from "./models/Kyc.js";
import { setupEventAssociations } from "./models/Event.js";
import "./models/Attendance.js";
import "./models/Leave.js";
import "./models/Payslip.js";
import "./models/Task.js";
import "./models/Message.js";
import "./models/Notification.js";
import authRouter from "./routes/auth.js";
import employeesRouter from "./routes/employees.js";
import usersRouter from "./routes/users.js";
import kycRouter from "./routes/kyc.js";
import attendanceRouter from "./routes/attendance.js";
import leavesRouter from "./routes/leaves.js";
import payslipRouter from "./routes/payslip.js";
import healthRouter from "./routes/health.js";
import coursesRouter from "./routes/courses.js";
import tasksRouter from "./routes/tasks.js";
import eventsRouter from "./routes/events.js";
import messagesRouter from "./routes/messages.js";
import notificationsRouter from "./routes/notifications.js";
import sessionsRouter from "./routes/sessions.js";
import twoFactorRouter from "./routes/twoFactor.js";
import analyticsRouter from "./routes/analytics.js";
import { updateSessionActivity } from "./middleware/sessionActivity.js";

const app = express();
const server = createServer(app);

// Initialize Socket.IO with proper CORS configuration
// Socket.IO must be initialized before Express middleware to avoid conflicts
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io available to routes
app.set("io", io);

// Export getIO function for use in routes
export function getIO() {
  return io;
}

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("==========================================");
  console.log("✅ Client connected", socket.id);
  console.log("Socket transport:", socket.conn.transport.name);
  console.log("Socket handshake:", {
    address: socket.handshake.address,
    headers: socket.handshake.headers,
    query: socket.handshake.query,
  });
  console.log("==========================================");

  // Send a test message to confirm connection
  socket.emit("test", { message: "Connection successful" });

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", socket.id, "Reason:", reason);
  });

  socket.on("error", (error) => {
    console.error("Socket.io error:", error);
  });
});

// Handle Socket.IO connection errors with detailed logging
io.engine.on("connection_error", (err) => {
  console.error("==========================================");
  console.error("Socket.IO connection error:", err);
  console.error("Error details:", {
    req: err.req?.headers,
    code: err.code,
    message: err.message,
    context: err.context,
    description: err.description,
  });
  console.error("==========================================");
});

// Log when Socket.IO server is ready
io.engine.on("initial_headers", (headers, req) => {
  console.log("Socket.IO request received:", req.url);
});

// Configure Helmet to allow Socket.IO connections
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "http://13.233.73.43:80",
          "http://13.233.73.43:3001",
          "http://13.233.73.43.nip.io",
        ],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          "https:",
          "http://localhost:*",
          "http://13.233.73.43:*",
          "https://app.rsamriddhi.com",
        ],
      },
    },
    // Disable crossOriginEmbedderPolicy for Socket.IO compatibility
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4173",
      "http://13.233.73.43:80",
      "http://13.233.73.43:3001",
      "http://13.233.73.43",
      "http://13.233.73.43.nip.io",
    ],
    credentials: true,
  })
);
// Increase JSON body size limit to handle base64 images (10MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Update session activity for authenticated requests
app.use(updateSessionActivity);

// Serve static files from uploads directory
// Use UPLOAD_PATH environment variable if set, otherwise use relative path
const uploadPath =
  process.env.UPLOAD_PATH || path.join(process.cwd(), "uploads");
console.log("📁 Serving static files from:", uploadPath);
// CORS middleware for static files (uploads)
app.use("/uploads", (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://13.233.73.43:80",
    "http://13.233.73.43:3001",
    "http://13.233.73.43",
    "http://13.233.73.43.nip.io",
    "https://app.rsamriddhi.com",
  ];
  
  // For images with crossOrigin="anonymous", we need to set specific origin or *
  // But we cannot use * with credentials, so we'll use specific origin when available
  if (process.env.NODE_ENV !== "production") {
    // Development: allow the requesting origin or all origins
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  } else {
    // Production: check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Type, Last-Modified, ETag"
  );
  // Don't set credentials for anonymous cross-origin requests (images)
  // res.setHeader("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  
  next();
});

// Serve static files from uploads directory
app.use(
  "/uploads",
  express.static(uploadPath, {
    setHeaders: (res, filePath) => {
      // Set cache headers for images
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || 
          filePath.endsWith('.png') || filePath.endsWith('.gif') || 
          filePath.endsWith('.webp')) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

app.use("/api/health", healthRouter);

app.use("/api/auth", authRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/users", usersRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leaves", leavesRouter);
app.use("/api/payslip", payslipRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/two-factor", twoFactorRouter);
app.use("/api/analytics", analyticsRouter);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Retry database connection with exponential backoff
    let dbConnected = false;
    let dbAttempts = 0;
    const maxDbAttempts = 5;

    while (!dbConnected && dbAttempts < maxDbAttempts) {
      try {
        dbAttempts++;
        console.log(
          `Attempting database connection (attempt ${dbAttempts}/${maxDbAttempts})...`
        );
        await sequelize.authenticate();
        dbConnected = true;
        console.log("✅ Database connection established successfully");
      } catch (dbError) {
        console.error(
          `❌ Database connection attempt ${dbAttempts} failed:`,
          dbError.message
        );
        if (dbAttempts < maxDbAttempts) {
          const waitTime = Math.min(dbAttempts * 2, 10); // 2s, 4s, 6s, 8s, 10s
          console.log(`Waiting ${waitTime} seconds before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        } else {
          console.error(
            "❌ Failed to connect to database after",
            maxDbAttempts,
            "attempts"
          );
          console.error("Please check:");
          console.error("1. Database credentials in environment variables");
          console.error("2. Database server is running and accessible");
          console.error("3. Network connectivity to database");
          throw new Error(`Database connection failed: ${dbError.message}`);
        }
      }
    }
    // Setup model associations
    setupKycAssociations(Employee);
    setupEventAssociations(User);

    // Run migration to add missing user profile fields
    try {
      const { addUserProfileFields } = await import(
        "./migrations/addUserProfileFields.js"
      );
      await addUserProfileFields();
    } catch (migrationError) {
      console.error("Migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Run migration to update Event columns to TIMESTAMPTZ for proper timezone handling
    try {
      const { updateEventColumnsToTimestamptz } = await import(
        "./migrations/updateEventColumnsToTimestamptz.js"
      );
      await updateEventColumnsToTimestamptz();
    } catch (migrationError) {
      console.error("Event timezone migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Run migration to add missing attendance fields (isLate, checkoutType)
    try {
      const { addAttendanceFields } = await import(
        "./migrations/addAttendanceFields.js"
      );
      await addAttendanceFields();
    } catch (migrationError) {
      console.error(
        "Attendance fields migration error:",
        migrationError.message
      );
      // Continue even if migration fails - might already be applied
    }

    // Run migration to add attendance photo fields (checkInPhoto, checkOutPhoto)
    try {
      const { addAttendancePhotoFields } = await import(
        "./migrations/addAttendancePhotoFields.js"
      );
      await addAttendancePhotoFields();
    } catch (migrationError) {
      console.error(
        "Attendance photo fields migration error:",
        migrationError.message
      );
      // Continue even if migration fails - might already be applied
    }

    // Run migration to update employees table structure (emp_id, mobile_number, location, designation, status)
    try {
      const { updateEmployeesTableStructure } = await import(
        "./migrations/updateEmployeesTableStructure.js"
      );
      await updateEmployeesTableStructure();
    } catch (migrationError) {
      console.error(
        "Employees table structure migration error:",
        migrationError.message
      );
      // Continue even if migration fails - might already be applied
    }

    // Run migration to create events table
    try {
      const { createEventsTable } = await import(
        "./migrations/createEventsTable.js"
      );
      await createEventsTable(
        sequelize.getQueryInterface(),
        sequelize.constructor
      );
      console.log("✅ Events table migration completed");
    } catch (migrationError) {
      console.error("Events table migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Run migration to add event_id to notifications table
    try {
      const { addEventIdToNotifications } = await import(
        "./migrations/addEventIdToNotifications.js"
      );
      await addEventIdToNotifications(
        sequelize.getQueryInterface(),
        sequelize.constructor
      );
      console.log("✅ Event ID migration for notifications completed");
    } catch (migrationError) {
      console.error("Event ID migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Run migration to add visibility fields to tasks table
    try {
      const { addTaskVisibilityFields } = await import(
        "./migrations/addTaskVisibilityFields.js"
      );
      await addTaskVisibilityFields(
        sequelize.getQueryInterface(),
        sequelize.constructor
      );
      console.log("✅ Task visibility fields migration completed");
    } catch (migrationError) {
      console.error("Task visibility fields migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Run migration to add task_id to notifications table
    try {
      const { addTaskIdToNotifications } = await import(
        "./migrations/addTaskIdToNotifications.js"
      );
      await addTaskIdToNotifications(
        sequelize.getQueryInterface(),
        sequelize.constructor
      );
      console.log("✅ Task ID migration for notifications completed");
    } catch (migrationError) {
      console.error("Task ID migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Run migration to create user_sessions table
    try {
      const { createUserSessionsTable } = await import(
        "./migrations/createUserSessionsTable.js"
      );
      await createUserSessionsTable();
      console.log("✅ User sessions table migration completed");
    } catch (migrationError) {
      console.error("User sessions migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Run migration to add two-factor authentication fields
    try {
      const { addTwoFactorAuthFields } = await import(
        "./migrations/addTwoFactorAuthFields.js"
      );
      await addTwoFactorAuthFields();
      console.log("✅ Two-factor authentication fields migration completed");
    } catch (migrationError) {
      console.error("2FA fields migration error:", migrationError.message);
      // Continue even if migration fails - might already be applied
    }

    // Seed events and notifications if in development
    if (process.env.NODE_ENV !== "production") {
      try {
        const { seedEventsAndNotifications } = await import(
          "./seeders/seedEventsAndNotifications.js"
        );
        await seedEventsAndNotifications();
      } catch (seedError) {
        console.error("Events and notifications seed error:", seedError.message);
        // Continue even if seed fails
      }

      // Seed tasks and notifications if in development
      try {
        const { seedTasksAndNotifications } = await import(
          "./seeders/seedTasksAndNotifications.js"
        );
        await seedTasksAndNotifications();
      } catch (seedError) {
        console.error("Tasks and notifications seed error:", seedError.message);
        // Continue even if seed fails
      }
    }

    // Sync database schema - use force: false to avoid migration issues with SQLite
    // SQLite's alter: true is problematic, so we'll use alter: false by default
    // If schema changes are needed, use migrations or delete database.sqlite and restart
    let syncAttempts = 0;
    const maxSyncAttempts = 3;
    let syncSuccess = false;

    while (syncAttempts < maxSyncAttempts && !syncSuccess) {
      try {
        syncAttempts++;

        // For SQLite, avoid using alter: true as it causes constraint issues
        // Always use alter: false for SQLite
        console.log(
          `Syncing database (attempt ${syncAttempts}/${maxSyncAttempts})...`
        );
        await sequelize.sync({ force: false, alter: false });

        syncSuccess = true;
        console.log("Database sync successful");
      } catch (syncError) {
        console.error(
          `Database sync error (attempt ${syncAttempts}/${maxSyncAttempts}):`,
          syncError.message
        );

        // If it's a SQLITE_BUSY error, wait and retry
        if (
          syncError.message.includes("SQLITE_BUSY") ||
          syncError.code === "SQLITE_BUSY" ||
          syncError.parent?.code === "SQLITE_BUSY"
        ) {
          if (syncAttempts >= maxSyncAttempts) {
            console.error(
              "Database is locked. Please close any other applications using the database and try again."
            );
            throw new Error(
              "Database is locked. Please ensure no other processes are using the database file."
            );
          }
          // Wait before retrying
          const waitTime = syncAttempts * 2; // 2s, 4s, 6s...
          console.log(
            `Database locked. Waiting ${waitTime} seconds before retry...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
          // Continue to retry
        } else if (
          syncError.message.includes("SQLITE_CONSTRAINT") ||
          syncError.code === "SQLITE_CONSTRAINT" ||
          syncError.name === "SequelizeUniqueConstraintError"
        ) {
          // Constraint errors usually mean the schema is already correct or there's a data issue
          // Try to clean up any backup tables that might exist
          console.log(
            "Constraint error detected. Attempting to clean up backup tables..."
          );
          try {
            await sequelize.query("DROP TABLE IF EXISTS employees_backup;");
            await sequelize.query("DROP TABLE IF EXISTS users_backup;");
            await sequelize.query("DROP TABLE IF EXISTS payslips_backup;");
            console.log("Backup tables cleaned up. Retrying sync...");
            // Retry once more
            if (syncAttempts < maxSyncAttempts) {
              continue;
            }
          } catch (cleanupError) {
            console.error(
              "Error cleaning up backup tables:",
              cleanupError.message
            );
          }

          // If cleanup didn't help, just continue - the schema might already be correct
          console.log("Assuming schema is already correct and continuing...");
          syncSuccess = true;
        } else {
          // Other errors - throw immediately
          throw syncError;
        }
      }
    }
    server.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
      console.log(`✅ Socket.io listening on port ${PORT}`);
      console.log(`✅ Socket.io endpoint: http://localhost:${PORT}/socket.io/`);
      console.log(`✅ Socket.io CORS: enabled for all origins`);
      console.log(`✅ Socket.io transports: polling, websocket`);

      // Test Socket.IO server
      console.log(`✅ Socket.IO server ready. Waiting for connections...`);

      // Schedule auto-checkout at 11:59 PM every day
      // Cron format: minute hour day month dayOfWeek
      // 59 23 * * * = 11:59 PM every day
      try {
        cron.schedule(
          "59 23 * * *",
          async () => {
            try {
              console.log("🕐 Running scheduled auto-checkout at 11:59 PM...");
              const today = new Date();
              const todayStr = today.toISOString().slice(0, 10);

              // Find all attendance records that are checked in but not checked out
              const uncheckedOutRecords = await Attendance.findAll({
                where: {
                  date: todayStr,
                  checkIn: { [Op.ne]: null },
                  checkOut: null,
                },
              });

              console.log(
                `Found ${uncheckedOutRecords.length} records to auto-checkout at midnight`
              );

              // Set checkout time to 11:59 PM of the current day
              const checkoutTime = new Date(today);
              checkoutTime.setHours(23, 59, 0, 0);

              // Auto-checkout all records
              for (const record of uncheckedOutRecords) {
                record.checkOut = checkoutTime;
                record.checkoutType = "auto-midnight";
                record.checkOutAddress = "Auto-checkout (midnight reset)";
                await record.save();
                console.log(
                  `✅ Auto-checked out: ${
                    record.email
                  } at ${checkoutTime.toISOString()}`
                );
              }

              console.log(
                `✅ Auto-checkout completed for ${uncheckedOutRecords.length} employees`
              );
            } catch (error) {
              console.error("❌ Error in scheduled auto-checkout:", error);
            }
          },
          {
            timezone: "Asia/Kolkata", // Adjust timezone as needed
          }
        );

        console.log("⏰ Auto-checkout cron job scheduled for 11:59 PM daily");
      } catch (cronError) {
        console.error("⚠️  Warning: Failed to initialize cron job:", cronError);
        console.log("⚠️  Server will continue without auto-checkout cron job");
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
