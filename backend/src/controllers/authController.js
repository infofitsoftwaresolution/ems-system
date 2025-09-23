import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export class AuthController {
  // User login
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email, active: true } });

      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_SECRET || "dev-secret",
        { expiresIn: "2h" }
      );

      res.json({
        token,
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
        requirePasswordSetup: user.mustChangePassword,
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Error during login" });
    }
  }

  // Update user password
  static async updatePassword(req, res) {
    try {
      const { email, newPassword } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) return res.status(404).json({ message: "User not found" });

      const hash = await bcrypt.hash(newPassword, 10);
      user.passwordHash = hash;
      user.mustChangePassword = false;
      await user.save();

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Error updating password" });
    }
  }

  // List all users (for debugging)
  static async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: [
          "id",
          "name",
          "email",
          "role",
          "active",
          "mustChangePassword",
        ],
      });
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res
        .status(500)
        .json({ message: "Error fetching users", error: error.message });
    }
  }

  // Create test user with temporary password
  static async createTestUser(req, res) {
    try {
      const { email, name, role = "employee" } = req.body;
      const tempPassword = "temp123";

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        // Update existing user with new password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await existingUser.update({
          passwordHash: hashedPassword,
          mustChangePassword: true,
          active: true,
          name: name || existingUser.name,
        });

        return res.json({
          success: true,
          message: "User account updated successfully",
          credentials: {
            email: email,
            password: tempPassword,
          },
        });
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const user = await User.create({
        name: name || "Test User",
        email: email,
        passwordHash: hashedPassword,
        role: role,
        mustChangePassword: true,
        active: true,
      });

      res.json({
        success: true,
        message: "Test user account created successfully",
        credentials: {
          email: email,
          password: tempPassword,
        },
      });
    } catch (error) {
      console.error("Error creating test user:", error);
      res
        .status(500)
        .json({ message: "Error creating user", error: error.message });
    }
  }

  // Set specific password for a user
  static async setPassword(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Find the user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the password
      const hashedPassword = await bcrypt.hash(password, 10);
      await user.update({
        passwordHash: hashedPassword,
        mustChangePassword: true,
        active: true,
      });

      res.json({
        success: true,
        message: "Password updated successfully",
        credentials: {
          email: email,
          password: password,
        },
      });
    } catch (error) {
      console.error("Error setting password:", error);
      res
        .status(500)
        .json({ message: "Error updating password", error: error.message });
    }
  }

  // Create user account for Shubham Singh (for testing)
  static async createShubhamUser(req, res) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: "shubhamsinghrajput6087@gmail.com" },
      });
      if (existingUser) {
        // Update existing user with new password
        const hashedPassword = await bcrypt.hash("temp123", 10);
        await existingUser.update({
          passwordHash: hashedPassword,
          mustChangePassword: true,
          active: true,
        });

        return res.json({
          success: true,
          message: "Shubham Singh user account updated successfully",
          credentials: {
            email: "shubhamsinghrajput6087@gmail.com",
            password: "temp123",
          },
        });
      }

      // Create new user
      const hashedPassword = await bcrypt.hash("temp123", 10);

      const user = await User.create({
        name: "Shubham Singh",
        email: "shubhamsinghrajput6087@gmail.com",
        passwordHash: hashedPassword,
        role: "employee",
        mustChangePassword: true,
        active: true,
      });

      res.json({
        success: true,
        message: "Shubham Singh user account created successfully",
        credentials: {
          email: "shubhamsinghrajput6087@gmail.com",
          password: "temp123",
        },
      });
    } catch (error) {
      console.error("Error creating Shubham user:", error);
      res
        .status(500)
        .json({ message: "Error creating user", error: error.message });
    }
  }
}
