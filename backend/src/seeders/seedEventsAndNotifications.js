import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { Employee } from "../models/Employee.js";
import { Op } from "sequelize";

/**
 * Seed script to create sample events and notifications
 * Run this after migrations to populate the database with test data
 */
export async function seedEventsAndNotifications() {
  try {
    console.log("🌱 Seeding events and notifications...");

    // Find admin/HR users to create events
    const adminUsers = await User.findAll({
      where: {
        role: { [Op.in]: ["admin", "hr"] },
      },
      limit: 2,
    });

    if (adminUsers.length === 0) {
      console.log("⚠️ No admin/HR users found. Skipping event seeding.");
      return;
    }

    const creator = adminUsers[0];

    // Get all employees for ALL visibility events
    const allEmployees = await User.findAll({
      where: { role: "employee" },
      attributes: ["id", "email"],
      limit: 10,
    });

    // Create sample events
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(9, 0, 0, 0);

    // Event 1: All-hands meeting (ALL visibility)
    const event1 = await Event.create({
      title: "Monthly All-Hands Meeting",
      description: "Company-wide meeting to discuss quarterly goals and updates",
      start_date_time: tomorrow,
      end_date_time: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      created_by: creator.id,
      visibility_type: "ALL",
      assigned_users: null,
      notification_sent: false,
    });

    // Event 2: Team Training (SPECIFIC visibility)
    const specificEmployees = allEmployees.slice(0, 3); // First 3 employees
    const event2 = await Event.create({
      title: "Team Training Session",
      description: "Mandatory training on new company policies",
      start_date_time: nextWeek,
      end_date_time: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      created_by: creator.id,
      visibility_type: "SPECIFIC",
      assigned_users: specificEmployees.map((emp) => emp.id),
      notification_sent: false,
    });

    // Event 3: Department Meeting (ALL visibility)
    const event3 = await Event.create({
      title: "Department Review Meeting",
      description: "Quarterly department performance review",
      start_date_time: nextMonth,
      end_date_time: new Date(nextMonth.getTime() + 1.5 * 60 * 60 * 1000), // 1.5 hours later
      created_by: creator.id,
      visibility_type: "ALL",
      assigned_users: null,
      notification_sent: false,
    });

    console.log("✅ Created 3 sample events");

    // Generate notifications for Event 1 (ALL visibility)
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
            eventId: event1.id,
            title: "New Event Assigned",
            message: `New Event Assigned: ${event1.title} on ${formatDateTime(event1.start_date_time)}`,
            type: "info",
            link: `/calendar?event=${event1.id}`,
            metadata: JSON.stringify({
              eventId: event1.id,
              eventTitle: event1.title,
              startDate: event1.start_date_time,
              endDate: event1.end_date_time,
            }),
            isRead: false,
          })
        )
      );

      // Generate notifications for Event 2 (SPECIFIC visibility)
      const notifications2 = await Promise.all(
        specificEmployees.map((employee) =>
          Notification.create({
            userId: employee.id,
            userEmail: employee.email,
            eventId: event2.id,
            title: "New Event Assigned",
            message: `New Event Assigned: ${event2.title} on ${formatDateTime(event2.start_date_time)}`,
            type: "info",
            link: `/calendar?event=${event2.id}`,
            metadata: JSON.stringify({
              eventId: event2.id,
              eventTitle: event2.title,
              startDate: event2.start_date_time,
              endDate: event2.end_date_time,
            }),
            isRead: false,
          })
        )
      );

      // Generate notifications for Event 3 (ALL visibility)
      const notifications3 = await Promise.all(
        allEmployees.map((employee) =>
          Notification.create({
            userId: employee.id,
            userEmail: employee.email,
            eventId: event3.id,
            title: "New Event Assigned",
            message: `New Event Assigned: ${event3.title} on ${formatDateTime(event3.start_date_time)}`,
            type: "info",
            link: `/calendar?event=${event3.id}`,
            metadata: JSON.stringify({
              eventId: event3.id,
              eventTitle: event3.title,
              startDate: event3.start_date_time,
              endDate: event3.end_date_time,
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
        `✅ Created ${notifications1.length + notifications2.length + notifications3.length} sample notifications`
      );

      // Mark events as notification sent
      await event1.update({ notification_sent: true });
      await event2.update({ notification_sent: true });
      await event3.update({ notification_sent: true });
    }

    console.log("✅ Events and notifications seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding events and notifications:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("../sequelize.js").then(async ({ sequelize }) => {
    try {
      await sequelize.authenticate();
      await seedEventsAndNotifications();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });
}

