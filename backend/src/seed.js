import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize } from "./sequelize.js";
import { User } from "./models/User.js";
import { Employee } from "./models/Employee.js";

async function seed() {
  await sequelize.sync({ force: true });
  const adminHash = await bcrypt.hash("admin123", 10);
  await User.create({
    name: "Admin User",
    email: "admin@company.com",
    role: "admin",
    passwordHash: adminHash,
    mustChangePassword: false,
  });

  const managerHash = await bcrypt.hash("manager123", 10);
  await User.create({
    name: "Manager User",
    email: "manager@company.com",
    role: "manager",
    passwordHash: managerHash,
    mustChangePassword: true,
  });

  const employeeHash = await bcrypt.hash("employee123", 10);
  await User.create({
    name: "Employee User",
    email: "employee@company.com",
    role: "employee",
    passwordHash: employeeHash,
    mustChangePassword: true,
  });

  // Generate employee IDs
  const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `EMP${year}${random}`;
  };

  await Employee.bulkCreate([
    {
      name: "John Doe",
      email: "john.doe@company.com",
      employeeId: generateEmployeeId(),
      department: "Engineering",
      position: "Software Engineer",
      role: "employee",
      hireDate: "2023-01-15",
      salary: 1200000,
      status: "active",
    },
    {
      name: "Jane Smith",
      email: "jane.smith@company.com",
      employeeId: generateEmployeeId(),
      department: "Product",
      position: "Product Manager",
      role: "manager",
      hireDate: "2022-08-20",
      salary: 1500000,
      status: "active",
    },
  ]);

  console.log("Seed complete");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
