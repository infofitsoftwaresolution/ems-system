import { Router } from "express";
import { EmployeeController } from "../controllers/employeeController.js";

const router = Router();

// Get all employees
router.get("/", EmployeeController.getAllEmployees);

// Get employee by ID
router.get("/:id", EmployeeController.getEmployeeById);

// Create new employee
router.post("/", EmployeeController.createEmployee);

// Update employee
router.put("/:id", EmployeeController.updateEmployee);

// Delete employee
router.delete("/:id", EmployeeController.deleteEmployee);

export default router;
