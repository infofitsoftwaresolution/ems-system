import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { sequelize } from "./sequelize.js";
// import models so sequelize can sync tables
import "./models/User.js";
import { Employee } from "./models/Employee.js";
import "./models/Event.js";
import "./models/Course.js";
import "./models/SiteSetting.js";
import "./models/AccessLog.js";
import "./models/NotificationSetting.js";
import { setupKycAssociations } from "./models/Kyc.js";
import "./models/Attendance.js";
import "./models/Leave.js";
import "./models/Payslip.js";
import "./models/Task.js";
import "./models/Message.js";
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

const app = express();

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
      },
    },
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
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

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

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();
    // Setup model associations
    setupKycAssociations(Employee);

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
    app.listen(PORT, () =>
      console.log(`Server listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
