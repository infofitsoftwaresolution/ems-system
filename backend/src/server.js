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
import authRouter from "./routes/auth.js";
import employeesRouter from "./routes/employees.js";
import usersRouter from "./routes/users.js";
import kycRouter from "./routes/kyc.js";
import attendanceRouter from "./routes/attendance.js";
import leavesRouter from "./routes/leaves.js";
import payslipRouter from "./routes/payslip.js";
import emailTestRouter from "./routes/emailTest.js";
import healthRouter from "./routes/health.js";

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
app.use("/api/email", emailTestRouter);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await sequelize.authenticate();
    // Setup model associations
    setupKycAssociations(Employee);
    await sequelize.sync();
    app.listen(PORT, () =>
      console.log(`Server listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
