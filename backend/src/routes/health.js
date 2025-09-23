import { Router } from "express";
import { HealthController } from "../controllers/healthController.js";

const router = Router();

// Health check endpoint
router.get("/", HealthController.healthCheck);

export default router;
