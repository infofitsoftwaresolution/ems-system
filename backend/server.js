import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { sequelize } from "./src/config/sequelize.js";
// import models so sequelize can sync tables
import "./src/models/User.js";
import { Employee } from "./src/models/Employee.js";
import "./src/models/Event.js";
import "./src/models/Course.js";
import "./src/models/SiteSetting.js";
import "./src/models/AccessLog.js";
import "./src/models/NotificationSetting.js";
import { setupKycAssociations } from "./src/models/Kyc.js";
import "./src/models/Attendance.js";
import "./src/models/Leave.js";
import "./src/models/Payslip.js";
import authRouter from "./src/routes/auth.js";
import employeesRouter from "./src/routes/employees.js";
import usersRouter from "./src/routes/users.js";
import kycRouter from "./src/routes/kyc.js";
import attendanceRouter from "./src/routes/attendance.js";
import leavesRouter from "./src/routes/leaves.js";
import payslipRouter from "./src/routes/payslip.js";
import emailTestRouter from "./src/routes/emailTest.js";
import healthRouter from "./src/routes/health.js";

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
          "http://localhost:3000",
          "http://localhost:3001",
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
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
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
