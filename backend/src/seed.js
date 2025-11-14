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
    
    if (existingAdmin) {
      console.log("Admin user already exists, skipping seed");
      console.log("Database is already set up with data");
      process.exit(0);
    }
    
    // Production Admin User
    const adminHash = await bcrypt.hash("rsamriddhi@6287", 10);
    const adminUser = await User.create({
      name: "Rural Samridhi Admin",
      email: "s24346379@gmail.com",
      role: "admin",
      passwordHash: adminHash,
      mustChangePassword: false,
      active: true
    });

    console.log("Production admin user created successfully");
    console.log("User ID:", adminUser.id);
    console.log("Email: s24346379@gmail.com");
    console.log("Password: rsamriddhi@6287");
    console.log("Role:", adminUser.role);
    console.log("Active:", adminUser.active);
    
    // Verify the user was created
    const createdUser = await User.findOne({ where: { email: "s24346379@gmail.com" } });
    if (createdUser) {
      console.log("✅ User verification successful");
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
