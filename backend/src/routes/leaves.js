import { Router } from "express";
import { LeaveController } from "../controllers/leaveController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Apply for leave
router.post("/", authenticateToken, LeaveController.applyLeave);

// List leaves (optionally by email)
router.get("/", authenticateToken, LeaveController.getLeaves);

// Review leave
router.post("/:id/review", authenticateToken, LeaveController.reviewLeave);

export default router;
