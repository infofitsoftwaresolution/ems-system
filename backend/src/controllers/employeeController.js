import { Employee } from "../models/Employee.js";
import { User } from "../models/User.js";
import { Kyc } from "../models/Kyc.js";
import { Attendance } from "../models/Attendance.js";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { sendNewEmployeeEmail } from "../services/emailService.js";

export class EmployeeController {
  // Generate unique employee ID
  static generateUniqueEmployeeId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `EMP${year}${random}`;
  }

  // Generate temporary password
  static generateTempPassword() {
    return Math.random().toString(36).slice(-8);
  }

  // Get all employees
  static async getAllEmployees(req, res) {
    try {
      const employees = await Employee.findAll({ order: [["id", "ASC"]] });
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Error fetching employees" });
    }
  }

  // Get employee by ID
  static async getEmployeeById(req, res) {
    try {
      const emp = await Employee.findByPk(req.params.id);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      res.json(emp);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Error fetching employee" });
    }
  }

  // Create new employee
  static async createEmployee(req, res) {
    try {
      // Generate unique employee ID and temporary password
      const uniqueEmployeeId = EmployeeController.generateUniqueEmployeeId();
      const tempPassword = EmployeeController.generateTempPassword();

      // Convert name to uppercase before storing
      const employeeData = {
        ...req.body,
        name: req.body.name ? req.body.name.toUpperCase() : req.body.name,
        employeeId: uniqueEmployeeId,
        kycStatus: "pending",
      };

      // Create employee with unique ID
      const emp = await Employee.create(employeeData);

      // Ensure user account exists
      const existing = await User.findOne({ where: { email: emp.email } });
      if (!existing) {
        const hash = await bcrypt.hash(tempPassword, 10);
        await User.create({
          email: emp.email,
          name: emp.name, // This will be the uppercase name from employeeData
          role: emp.role?.toLowerCase().includes("admin")
            ? "admin"
            : emp.role?.toLowerCase().includes("manager")
            ? "manager"
            : "employee",
          passwordHash: hash,
          mustChangePassword: true,
          active: true,
        });
      } else {
        // Update existing user with new password if needed
        const hash = await bcrypt.hash(tempPassword, 10);
        await existing.update({
          name: emp.name, // Update with uppercase name
          passwordHash: hash,
          mustChangePassword: true,
          active: true,
        });
      }

      // Send welcome email with temporary credentials
      const emailData = {
        fullName: emp.name,
        email: emp.email,
        tempEmployeeId: uniqueEmployeeId,
        tempPassword: tempPassword,
      };

      await sendNewEmployeeEmail(emailData);

      res.status(201).json({
        ...emp.toJSON(),
        tempPassword: tempPassword, // Include temp password in response for admin reference
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      res
        .status(500)
        .json({ message: "Error creating employee", error: error.message });
    }
  }

  // Update employee
  static async updateEmployee(req, res) {
    try {
      const emp = await Employee.findByPk(req.params.id);
      if (!emp) return res.status(404).json({ message: "Employee not found" });

      // Convert name to uppercase if provided
      const updateData = {
        ...req.body,
        name: req.body.name ? req.body.name.toUpperCase() : req.body.name,
      };

      // Update employee data
      await emp.update(updateData);

      // Also update the corresponding user account
      const user = await User.findOne({ where: { email: emp.email } });
      if (user) {
        await user.update({
          name: updateData.name || user.name,
          role: updateData.role || user.role,
          email: updateData.email || user.email,
        });
      }

      res.json(emp);
    } catch (error) {
      console.error("Error updating employee:", error);
      res
        .status(500)
        .json({ message: "Error updating employee", error: error.message });
    }
  }

  // Delete employee
  static async deleteEmployee(req, res) {
    try {
      const emp = await Employee.findByPk(req.params.id);
      if (!emp) return res.status(404).json({ message: "Employee not found" });

      // Delete associated KYC records and files
      const kycRecords = await Kyc.findAll({
        where: {
          [Op.or]: [{ employeeId: emp.employeeId }, { fullName: emp.name }],
        },
      });

      for (const kycRecord of kycRecords) {
        // Delete associated files
        if (kycRecord.documents && kycRecord.documents.length > 0) {
          for (const doc of kycRecord.documents) {
            if (doc.path) {
              const filePath = path.join(process.cwd(), doc.path);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted KYC file: ${filePath}`);
              }
            }
          }
        }

        // Delete the KYC record
        await kycRecord.destroy();
        console.log(`Deleted KYC record for employee: ${emp.name}`);
      }

      // Delete associated attendance records
      const attendanceRecords = await Attendance.findAll({
        where: {
          email: emp.email.toLowerCase(),
        },
      });

      for (const attendanceRecord of attendanceRecords) {
        await attendanceRecord.destroy();
        console.log(
          `Deleted attendance record for employee: ${emp.name} on ${attendanceRecord.date}`
        );
      }

      // Delete the corresponding user account
      const user = await User.findOne({ where: { email: emp.email } });
      if (user) {
        await user.destroy();
        console.log(`Deleted user account for: ${emp.email}`);
      }

      // Finally delete the employee record
      await emp.destroy();
      console.log(`Deleted employee record: ${emp.name}`);

      res.json({
        success: true,
        message:
          "Employee, user account, and all associated records (KYC, attendance) deleted successfully",
        deletedKycRecords: kycRecords.length,
        deletedAttendanceRecords: attendanceRecords.length,
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res
        .status(500)
        .json({ message: "Error deleting employee", error: error.message });
    }
  }
}
