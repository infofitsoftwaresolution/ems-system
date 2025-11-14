import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "./sequelize.js";
import { User } from "./models/User.js";

async function verifyUser() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established");

    const email = "s24346379@gmail.com";
    const password = "rsamriddhi@6287";
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log("❌ User not found!");
      process.exit(1);
    }
    
    console.log("✅ User found:");
    console.log("  ID:", user.id);
    console.log("  Name:", user.name);
    console.log("  Email:", user.email);
    console.log("  Role:", user.role);
    console.log("  Active:", user.active);
    console.log("  Password Hash:", user.passwordHash ? "Exists" : "Missing");
    
    // Test password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("\nPassword verification:");
    console.log("  Password to test:", password);
    console.log("  Password matches:", passwordMatch ? "✅ YES" : "❌ NO");
    
    if (!passwordMatch) {
      console.log("\n⚠️ Password doesn't match! Updating password...");
      const newHash = await bcrypt.hash(password, 10);
      await user.update({ passwordHash: newHash });
      console.log("✅ Password updated successfully");
      
      // Verify again
      const verifyMatch = await bcrypt.compare(password, newHash);
      console.log("  Verification after update:", verifyMatch ? "✅ YES" : "❌ NO");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

verifyUser();

