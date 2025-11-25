import "dotenv/config";
import { sequelize } from "./sequelize.js";
import { Employee } from "./models/Employee.js";

/**
 * Seed employees table with sample data
 * Based on the provided employee list
 */
async function seedEmployees() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync database to ensure table exists
    await sequelize.sync({ force: false });
    console.log("✅ Database synced successfully");

    // Sample employee data from the image
    const employees = [
      {
        emp_id: "RST1001",
        name: "Anuj Kumar",
        email: "anujsingh375@gmail.com",
        mobile_number: "9910955040",
        location: "Noida",
        designation: "Director",
        status: "Working"
      },
      {
        emp_id: "RST1002",
        name: "Raj Kumar",
        email: "rajsfx1993@gmail.com",
        mobile_number: "9599173995",
        location: "Noida",
        designation: "Director",
        status: "Working"
      },
      {
        emp_id: "RST1003",
        name: "Irshad",
        email: "irshadidrishi1996@gmail.com",
        mobile_number: "9711732018",
        location: "Noida",
        designation: "Area Manager",
        status: "Working"
      },
      {
        emp_id: "RST1004",
        name: "Vishvajeet Maurya",
        email: "vishvajeetmaurya@gmail.com",
        mobile_number: "8005256199",
        location: "Noida",
        designation: "OM",
        status: "Not Working"
      },
      {
        emp_id: "RST1005",
        name: "Vinay Yadav",
        email: "vinayyadav25796@gmail.com",
        mobile_number: "7827409585",
        location: "Noida",
        designation: "Area Manager",
        status: "Working"
      },
      {
        emp_id: "RST1006",
        name: "Harish Pal",
        email: "harishpal9297@gmail.com",
        mobile_number: "8447777070",
        location: "Noida",
        designation: "Team Leader",
        status: "Working"
      },
      {
        emp_id: "RST1007",
        name: "Chaterpal Singh",
        email: "chaterpal.royalgroup@gmail.com",
        mobile_number: "9717638400",
        location: "Noida",
        designation: "Team Leader",
        status: "Not Working"
      },
      {
        emp_id: "RST1008",
        name: "Atul Kumar",
        email: "atulkumar.royalgroup@gmail.com",
        mobile_number: "8527000022",
        location: "Noida",
        designation: "Team Leader",
        status: "Not Working"
      }
    ];

    console.log("🔄 Seeding employees...");

    let createdCount = 0;
    let skippedCount = 0;

    for (const employeeData of employees) {
      try {
        // Check if employee already exists (by email or emp_id)
        const existing = await Employee.findOne({
          where: {
            [sequelize.Sequelize.Op.or]: [
              { email: employeeData.email },
              { emp_id: employeeData.emp_id }
            ]
          }
        });

        if (existing) {
          console.log(`⏭️  Skipping ${employeeData.name} - already exists`);
          skippedCount++;
          continue;
        }

        // Create employee
        await Employee.create({
          ...employeeData,
          // Legacy fields for backward compatibility
          employeeId: employeeData.emp_id,
          department: employeeData.location,
          position: employeeData.designation,
          kycStatus: "pending"
        });

        console.log(`✅ Created employee: ${employeeData.name} (${employeeData.emp_id})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating employee ${employeeData.name}:`, error.message);
      }
    }

    console.log("==========================================");
    console.log(`✅ Employee seeding completed!`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${employees.length}`);
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Error seeding employees:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedEmployees()
    .then(() => {
      console.log("✅ Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

export { seedEmployees };

