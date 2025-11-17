import "dotenv/config";
import { sequelize } from "./src/sequelize.js";
import { User } from "./src/models/User.js";

async function fixAdminName() {
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
    console.log("FIXING ADMIN NAME SPELLING");
    console.log("=".repeat(60) + "\n");

    // Find all users with the old spelling
    const usersToFix = await User.findAll({
      where: {
        name: "Rural Samridhi Admin"
      }
    });

    if (usersToFix.length === 0) {
      console.log("✅ No users found with the old spelling 'Rural Samridhi Admin'");
      console.log("   All admin names are already correct!");
    } else {
      console.log(`Found ${usersToFix.length} user(s) with old spelling. Updating...`);
      
      for (const user of usersToFix) {
        await user.update({
          name: "Rural Samriddhi Admin"
        });
        console.log(`✅ Updated user: ${user.email} (ID: ${user.id})`);
      }
      
      console.log(`\n✅ Successfully updated ${usersToFix.length} user(s)!`);
    }
    
    // Also check for any other variations
    const allUsers = await User.findAll();
    let fixedCount = 0;
    
    for (const user of allUsers) {
      if (user.name && user.name.includes("Samridhi") && !user.name.includes("Samriddhi")) {
        const newName = user.name.replace(/Samridhi/g, "Samriddhi");
        await user.update({ name: newName });
        console.log(`✅ Updated user name: "${user.name}" → "${newName}" (${user.email})`);
        fixedCount++;
      }
    }
    
    if (fixedCount > 0) {
      console.log(`\n✅ Fixed ${fixedCount} additional user(s) with incorrect spelling!`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("Fix complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing admin name:", error);
    process.exit(1);
  }
}

fixAdminName().catch((e) => {
  console.error(e);
  process.exit(1);
});

