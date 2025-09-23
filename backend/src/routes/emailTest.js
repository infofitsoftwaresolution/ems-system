import { Router } from "express";
import { EmailController } from "../controllers/emailController.js";

const router = Router();

// Test email endpoint
router.post("/test", EmailController.testEmail);

// Email configuration status
router.get("/config", EmailController.getEmailConfig);

export default router;
