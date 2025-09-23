import { Router } from "express";
import { UserController } from "../controllers/userController.js";

const router = Router();

// Delete user by email
router.delete("/:email", UserController.deleteUser);

// Get user by email
router.get("/:email", UserController.getUserByEmail);

// Update user
router.put("/:email", UserController.updateUser);

export default router;
