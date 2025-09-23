import { Router } from "express";
import { AuthController } from "../controllers/authController.js";

const router = Router();

// User login
router.post("/login", AuthController.login);

// Update user password
router.post("/update-password", AuthController.updatePassword);

// List all users (for debugging)
router.get("/users", AuthController.getAllUsers);

// Create test user with temporary password
router.post("/create-test-user", AuthController.createTestUser);

// Set specific password for a user
router.post("/set-password", AuthController.setPassword);

// Create user account for Shubham Singh (for testing)
router.post("/create-shubham-user", AuthController.createShubhamUser);

export default router;
