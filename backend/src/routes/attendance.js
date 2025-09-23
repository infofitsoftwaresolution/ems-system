import { Router } from "express";
import { AttendanceController } from "../controllers/attendanceController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Get all attendance data (for admin)
router.get("/", authenticateToken, AttendanceController.getAllAttendance);

// Get today's attendance for a user
router.get(
  "/today",
  authenticateToken,
  AttendanceController.getTodayAttendance
);

// Check-in
router.post("/checkin", authenticateToken, AttendanceController.checkIn);

// Check-out
router.post("/checkout", authenticateToken, AttendanceController.checkOut);

export default router;
