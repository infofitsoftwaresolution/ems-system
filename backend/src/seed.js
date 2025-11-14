import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "./sequelize.js";
import { User } from "./models/User.js";
import { Employee } from "./models/Employee.js";

async function seed() {
  try {
    // Sync database first to ensure tables exist
    await sequelize.sync({ force: false });
    console.log("Database synced successfully");
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: "s24346379@gmail.com" } });
    
    // Production Admin User credentials
    const adminEmail = "s24346379@gmail.com";
    const adminPassword = "rsamriddhi@6287";
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    if (existingAdmin) {
      // Update existing admin user with correct password
      await existingAdmin.update({
        name: "Rural Samridhi Admin",
        role: "admin",
        passwordHash: adminHash,
        mustChangePassword: false,
        active: true
      });
      console.log("Admin user already exists - password updated");
      console.log("Email:", adminEmail);
      console.log("Password:", adminPassword);
    } else {
      // Create new admin user
      const adminUser = await User.create({
        name: "Rural Samridhi Admin",
        email: adminEmail,
        role: "admin",
        passwordHash: adminHash,
        mustChangePassword: false,
        active: true
      });
      console.log("Production admin user created successfully");
      console.log("User ID:", adminUser.id);
    }

    console.log("Email: s24346379@gmail.com");
    console.log("Password: rsamriddhi@6287");
    console.log("Role: admin");
    
    // Verify the user was created/updated
    const createdUser = await User.findOne({ where: { email: adminEmail } });
    if (createdUser) {
      console.log("✅ User verification successful");
      console.log("User ID:", createdUser.id);
      console.log("Active:", createdUser.active);
    } else {
      console.log("❌ User verification failed");
    }
    
    console.log("Seed complete");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
