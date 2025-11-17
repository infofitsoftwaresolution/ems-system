import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "./backend/src/sequelize.js";
import { User } from "./backend/src/models/User.js";
import { Employee } from "./backend/src/models/Employee.js";

async function checkAndFixCredentials() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    const adminEmail = "s24346379@gmail.com";
    const adminPassword = "rsamriddhi@6287";

    // Check admin user
    let admin = await User.findOne({ where: { email: adminEmail } });

    if (!admin) {
      console.log("\n❌ Admin user not found. Creating...");
      const adminHash = await bcrypt.hash(adminPassword, 10);
      admin = await User.create({
        name: "Rural Samriddhi Admin",
        email: adminEmail,
        role: "admin",
        passwordHash: adminHash,
        mustChangePassword: false,
        active: true,
      });
      console.log("✅ Admin user created!");
    } else {
      console.log("\n📧 Admin User Found:");
      console.log("   Email:", admin.email);
      console.log("   Role:", admin.role);
      console.log("   Active:", admin.active);

      // Test password
      const passwordMatch = await bcrypt.compare(
        adminPassword,
        admin.passwordHash
      );
      if (!passwordMatch) {
        console.log("\n⚠️  Password doesn't match! Updating password...");
        const adminHash = await bcrypt.hash(adminPassword, 10);
        await admin.update({
          passwordHash: adminHash,
          mustChangePassword: false,
          active: true,
        });
        console.log("✅ Password updated!");
      } else {
        console.log("✅ Password is correct!");
      }

      // Ensure user is active
      if (!admin.active) {
        console.log("\n⚠️  User is inactive! Activating...");
        await admin.update({ active: true });
        console.log("✅ User activated!");
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("LOGIN CREDENTIALS:");
    console.log("=".repeat(50));
    console.log("Email: s24346379@gmail.com");
    console.log("Password: rsamriddhi@6287");
    console.log("=".repeat(50));

    // Verify login works
    const verifyUser = await User.findOne({
      where: { email: adminEmail, active: true },
    });
    if (verifyUser) {
      const verifyPassword = await bcrypt.compare(
        adminPassword,
        verifyUser.passwordHash
      );
      if (verifyPassword) {
        console.log("\n✅ Login credentials verified and working!");
      } else {
        console.log("\n❌ Password verification failed!");
      }
    }

    // Check all users
    const allUsers = await User.findAll({ where: { active: true } });
    console.log(`\n👥 Total active users: ${allUsers.length}`);
    allUsers.forEach((user) => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (
      error.message.includes("SQLITE_BUSY") ||
      error.message.includes("locked")
    ) {
      console.error(
        "\n⚠️  Database is locked! Please stop the backend server first."
      );
      console.error("   Run: Stop the server (Ctrl+C) then try again");
    }
    process.exit(1);
  }
}

checkAndFixCredentials();
