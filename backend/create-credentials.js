import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "./src/sequelize.js";
import { User } from "./src/models/User.js";

async function createCredentials() {
  try {
    // Test database connection first
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    // Sync database first to ensure tables exist
    try {
      await sequelize.sync({ force: false });
      console.log("✅ Database synced successfully");
    } catch (syncError) {
      if (syncError.message.includes('SQLITE_BUSY') || syncError.message.includes('locked')) {
        console.error("❌ Database is locked. Please stop the backend server first!");
        process.exit(1);
      }
      throw syncError;
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("CREATING NEW CREDENTIALS");
    console.log("=".repeat(60) + "\n");

    // Admin User credentials
    const adminEmail = "admin@rsamriddhi.com";
    const adminPassword = "Admin@2024";
    const adminName = "System Administrator";
    
    // HR User credentials (using manager role)
    const hrEmail = "hr@rsamriddhi.com";
    const hrPassword = "HR@2024";
    const hrName = "HR Manager";
    
    // Check if admin user already exists
    let existingAdmin = await User.findOne({ where: { email: adminEmail } });
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    if (existingAdmin) {
      // Update existing admin user
      await existingAdmin.update({
        name: adminName,
        role: "admin",
        passwordHash: adminHash,
        mustChangePassword: false,
        active: true
      });
      console.log("✅ Admin user already exists - credentials updated");
    } else {
      // Create new admin user
      const adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        role: "admin",
        passwordHash: adminHash,
        mustChangePassword: false,
        active: true
      });
      console.log("✅ Admin user created successfully");
      console.log("   User ID:", adminUser.id);
    }
    
    // Check if HR user already exists
    let existingHR = await User.findOne({ where: { email: hrEmail } });
    const hrHash = await bcrypt.hash(hrPassword, 10);
    
    if (existingHR) {
      // Update existing HR user
      await existingHR.update({
        name: hrName,
        role: "manager",
        passwordHash: hrHash,
        mustChangePassword: false,
        active: true
      });
      console.log("✅ HR user already exists - credentials updated");
    } else {
      // Create new HR user
      const hrUser = await User.create({
        name: hrName,
        email: hrEmail,
        role: "manager",
        passwordHash: hrHash,
        mustChangePassword: false,
        active: true
      });
      console.log("✅ HR user created successfully");
      console.log("   User ID:", hrUser.id);
    }
    
    // Verify the users were created/updated
    const createdAdmin = await User.findOne({ where: { email: adminEmail } });
    const createdHR = await User.findOne({ where: { email: hrEmail } });
    
    console.log("\n" + "=".repeat(60));
    console.log("CREDENTIALS SUMMARY");
    console.log("=".repeat(60));
    console.log("\n📧 ADMIN CREDENTIALS:");
    console.log("   Email:", adminEmail);
    console.log("   Password:", adminPassword);
    console.log("   Role: admin");
    console.log("   Status:", createdAdmin?.active ? "✅ Active" : "❌ Inactive");
    
    console.log("\n📧 HR CREDENTIALS:");
    console.log("   Email:", hrEmail);
    console.log("   Password:", hrPassword);
    console.log("   Role: manager (HR)");
    console.log("   Status:", createdHR?.active ? "✅ Active" : "❌ Inactive");
    
    if (createdAdmin && createdHR) {
      console.log("\n✅ All credentials created/updated successfully!");
    } else {
      console.log("\n❌ Some credentials failed to create/update");
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("Seed complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating credentials:", error);
    process.exit(1);
  }
}

createCredentials().catch((e) => {
  console.error(e);
  process.exit(1);
});

