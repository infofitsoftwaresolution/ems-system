import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { Employee } from "../models/Employee.js";
import { Op } from "sequelize";

/**
 * Seed script to create sample tasks and notifications
 * Run this after migrations to populate the database with test data
 */
export async function seedTasksAndNotifications() {
  try {
    console.log("🌱 Seeding tasks and notifications...");

    // Find admin/HR users to create tasks
    const adminUsers = await User.findAll({
      where: {
        role: { [Op.in]: ["admin", "hr"] },
      },
      limit: 2,
    });

    if (adminUsers.length === 0) {
      console.log("⚠️ No admin/HR users found. Skipping task seeding.");
      return;
    }

    const creator = adminUsers[0];

    // Get all employees for ALL visibility tasks
    const allEmployees = await User.findAll({
      where: { role: "employee" },
      attributes: ["id", "email"],
      limit: 10,
    });

    // Create sample tasks
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0); // 5 PM tomorrow

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(17, 0, 0, 0);

    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(17, 0, 0, 0);

    // Task 1: Complete training (ALL visibility)
    const task1 = await Task.create({
      title: "Complete Safety Training Module",
      description: "Mandatory safety training for all employees. Must be completed before end of week.",
      status: "todo",
      priority: "high",
      created_by: creator.id,
      visibility_type: "ALL",
      assigned_users: null,
      notification_sent: false,
      dueDate: nextWeek,
    });

    // Task 2: Submit report (SPECIFIC visibility)
    const specificEmployees = allEmployees.slice(0, 3); // First 3 employees
    const task2 = await Task.create({
      title: "Submit Monthly Report",
      description: "Submit your monthly performance report to HR",
      status: "todo",
      priority: "medium",
      created_by: creator.id,
      visibility_type: "SPECIFIC",
      assigned_users: specificEmployees.map((emp) => emp.id),
      notification_sent: false,
      dueDate: tomorrow,
    });

    // Task 3: Review documents (ALL visibility)
    const task3 = await Task.create({
      title: "Review Company Policy Updates",
      description: "Review and acknowledge the updated company policies",
      status: "todo",
      priority: "medium",
      created_by: creator.id,
      visibility_type: "ALL",
      assigned_users: null,
      notification_sent: false,
      dueDate: nextMonth,
    });

    console.log("✅ Created 3 sample tasks");

    // Generate notifications for Task 1 (ALL visibility)
    if (allEmployees.length > 0) {
      const formatDateTime = (date) => {
        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const notifications1 = await Promise.all(
        allEmployees.map((employee) =>
          Notification.create({
            userId: employee.id,
            userEmail: employee.email,
            taskId: task1.id,
            title: "New Task Assigned",
            message: `New Task Assigned: ${task1.title} (Due: ${formatDateTime(task1.dueDate)})`,
            type: "info",
            link: `/tasks?task=${task1.id}`,
            metadata: JSON.stringify({
              taskId: task1.id,
              taskTitle: task1.title,
              dueDate: task1.dueDate,
              priority: task1.priority,
            }),
            isRead: false,
          })
        )
      );

      // Generate notifications for Task 2 (SPECIFIC visibility)
      const notifications2 = await Promise.all(
        specificEmployees.map((employee) =>
          Notification.create({
            userId: employee.id,
            userEmail: employee.email,
            taskId: task2.id,
            title: "New Task Assigned",
            message: `New Task Assigned: ${task2.title} (Due: ${formatDateTime(task2.dueDate)})`,
            type: "info",
            link: `/tasks?task=${task2.id}`,
            metadata: JSON.stringify({
              taskId: task2.id,
              taskTitle: task2.title,
              dueDate: task2.dueDate,
              priority: task2.priority,
            }),
            isRead: false,
          })
        )
      );

      // Generate notifications for Task 3 (ALL visibility)
      const notifications3 = await Promise.all(
        allEmployees.map((employee) =>
          Notification.create({
            userId: employee.id,
            userEmail: employee.email,
            taskId: task3.id,
            title: "New Task Assigned",
            message: `New Task Assigned: ${task3.title} (Due: ${formatDateTime(task3.dueDate)})`,
            type: "info",
            link: `/tasks?task=${task3.id}`,
            metadata: JSON.stringify({
              taskId: task3.id,
              taskTitle: task3.title,
              dueDate: task3.dueDate,
              priority: task3.priority,
            }),
            isRead: false,
          })
        )
      );

      // Mark some notifications as read for variety
      if (notifications1.length > 0) {
        await notifications1[0].update({ isRead: true });
      }
      if (notifications2.length > 1) {
        await notifications2[1].update({ isRead: true });
      }

      console.log(
        `✅ Created ${notifications1.length + notifications2.length + notifications3.length} sample task notifications`
      );

      // Mark tasks as notification sent
      await task1.update({ notification_sent: true });
      await task2.update({ notification_sent: true });
      await task3.update({ notification_sent: true });
    }

    console.log("✅ Tasks and notifications seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding tasks and notifications:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("../sequelize.js").then(async ({ sequelize }) => {
    try {
      await sequelize.authenticate();
      await seedTasksAndNotifications();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });
}

