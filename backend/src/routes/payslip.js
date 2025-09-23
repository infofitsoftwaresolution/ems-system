import { Router } from "express";
import { PayslipController } from "../controllers/payslipController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Test endpoint to check if payslip table exists
router.get("/test", PayslipController.testPayslipTable);

// Get payslips for an employee
router.get(
  "/employee/:email",
  authenticateToken,
  PayslipController.getEmployeePayslips
);

// Get all payslips (for admin)
router.get("/", authenticateToken, PayslipController.getAllPayslips);

// Generate payslip for an employee
router.post("/generate", authenticateToken, PayslipController.generatePayslip);

// Download payslip as PDF
router.get(
  "/download/:id",
  authenticateToken,
  PayslipController.downloadPayslip
);

export default router;
