import "dotenv/config";
import { sequelize } from "./sequelize.js";
import { Kyc } from "./models/Kyc.js";
import { Employee } from "./models/Employee.js";

async function seedKyc() {
  try {
    // Force sync the database to recreate all tables with correct schema
    console.log("Force syncing database to recreate tables...");
    await sequelize.sync({ force: true });

    // First, let's create some employees
    console.log("Creating sample employees...");
    await Employee.bulkCreate([
      {
        name: "John Doe",
        email: "john.doe@company.com",
        department: "Engineering",
        position: "Software Engineer",
        role: "employee",
        hireDate: "2023-01-15",
        salary: 75000,
        status: "active",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@company.com",
        department: "Product",
        position: "Product Manager",
        role: "manager",
        hireDate: "2022-08-20",
        salary: 85000,
        status: "active",
      },
      {
        name: "Mike Johnson",
        email: "mike.johnson@company.com",
        department: "Sales",
        position: "Sales Representative",
        role: "employee",
        hireDate: "2023-03-10",
        salary: 65000,
        status: "active",
      },
    ]);

    // Get the employees
    const employees = await Employee.findAll();
    console.log(`Created ${employees.length} employees`);

    // Create sample KYC records
    const kycData = [
      {
        employeeId: 1,
        fullName: "John Doe",
        dob: "1990-05-15",
        address: "123 Main Street, Bangalore, Karnataka 560001",
        documentType: "aadhaar",
        documentNumber: "1234-5678-9012",
        documents: JSON.stringify([
          {
            type: "Aadhaar Card Front",
            path: "/uploads/kyc/1754841024942_pan_cad.jpg",
            originalName: "aadhaar_front.jpg",
          },
          {
            type: "Aadhaar Card Back",
            path: "/uploads/kyc/1754841189780_pan_cad.jpg",
            originalName: "aadhaar_back.jpg",
          },
          {
            type: "Selfie",
            path: "/uploads/kyc/1754841313203_pan_cad.jpg",
            originalName: "selfie.png",
          },
        ]),
        status: "pending",
        submittedAt: new Date("2024-01-10T10:30:00Z"),
      },
      {
        employeeId: 2,
        fullName: "Jane Smith",
        dob: "1988-12-20",
        address: "456 Park Avenue, Mumbai, Maharashtra 400001",
        documentType: "pan",
        documentNumber: "ABCDE1234F",
        documents: JSON.stringify([
          {
            type: "PAN Card",
            path: "/uploads/kyc/1754841487888_deepimg-1753705877773__1_.png",
            originalName: "pan_card.jpg",
          },
          {
            type: "Selfie",
            path: "/uploads/kyc/1754843883120_deepimg-1753705958826.png",
            originalName: "selfie.png",
          },
        ]),
        status: "approved",
        submittedAt: new Date("2024-01-05T14:20:00Z"),
        reviewedAt: new Date("2024-01-06T09:15:00Z"),
        reviewedBy: "Admin User",
        remarks: "Documents verified successfully",
      },
      {
        employeeId: 3,
        fullName: "Mike Johnson",
        dob: "1992-08-08",
        address: "789 Oak Street, Delhi, Delhi 110001",
        documentType: "passport",
        documentNumber: "A12345678",
        documents: JSON.stringify([
          {
            type: "Passport",
            path: "/uploads/kyc/test-document.txt",
            originalName: "passport.jpg",
          },
          {
            type: "Selfie",
            path: "/uploads/kyc/test-document.txt",
            originalName: "selfie.png",
          },
        ]),
        status: "rejected",
        submittedAt: new Date("2024-01-08T16:45:00Z"),
        reviewedAt: new Date("2024-01-09T11:30:00Z"),
        reviewedBy: "Admin User",
        remarks:
          "Document quality is poor. Please resubmit with clearer images.",
      },
    ];

    console.log("Creating KYC records...");
    await Kyc.bulkCreate(kycData);

    console.log("KYC seed data created successfully!");
    console.log(`Created ${kycData.length} KYC records`);

    // Show the created records
    const createdKyc = await Kyc.findAll();

    console.log("\nCreated KYC Records:");
    createdKyc.forEach((kyc) => {
      console.log(
        `- ${kyc.fullName} (${kyc.status}) - ${kyc.documentType.toUpperCase()}`
      );
    });
  } catch (error) {
    console.error("Error seeding KYC data:", error);
    console.error("Error details:", error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedKyc();
