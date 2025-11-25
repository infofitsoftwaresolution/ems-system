import { Event } from "./models/Event.js";
import { User } from "./models/User.js";
import { Op } from "sequelize";

export async function seedEvents() {
  try {
    // Check if events already exist
    const existingEvents = await Event.count();
    if (existingEvents > 0) {
      console.log("⚠️ Events already exist. Skipping seed.");
      return;
    }

    // Get admin/HR users to use as creators
    const adminUsers = await User.findAll({
      where: { role: { [Op.in]: ["admin", "hr"] } },
      limit: 2,
    });

    if (adminUsers.length === 0) {
      console.log("⚠️ No admin/HR users found. Cannot seed events.");
      return;
    }

    const creatorId = adminUsers[0].id;

    // Create sample events
    const now = new Date();
    const events = [
      {
        title: "Company All-Hands Meeting",
        description: "Monthly company-wide meeting to discuss updates and announcements",
        start_date_time: new Date(now.getFullYear(), now.getMonth(), 15, 10, 0),
        end_date_time: new Date(now.getFullYear(), now.getMonth(), 15, 11, 30),
        created_by: creatorId,
        visibility_type: "ALL",
        assigned_users: null,
        notification_sent: false,
      },
      {
        title: "Team Building Activity",
        description: "Outdoor team building event for all employees",
        start_date_time: new Date(now.getFullYear(), now.getMonth(), 20, 14, 0),
        end_date_time: new Date(now.getFullYear(), now.getMonth(), 20, 17, 0),
        created_by: creatorId,
        visibility_type: "ALL",
        assigned_users: null,
        notification_sent: false,
      },
      {
        title: "HR Training Session",
        description: "Training session for HR team members",
        start_date_time: new Date(now.getFullYear(), now.getMonth(), 18, 9, 0),
        end_date_time: new Date(now.getFullYear(), now.getMonth(), 18, 12, 0),
        created_by: creatorId,
        visibility_type: "SPECIFIC",
        assigned_users: JSON.stringify([1, 2]), // Example employee IDs
        notification_sent: false,
      },
      {
        title: "Project Review Meeting",
        description: "Quarterly project review and planning session",
        start_date_time: new Date(now.getFullYear(), now.getMonth(), 25, 15, 0),
        end_date_time: new Date(now.getFullYear(), now.getMonth(), 25, 16, 30),
        created_by: creatorId,
        visibility_type: "ALL",
        assigned_users: null,
        notification_sent: false,
      },
      {
        title: "Holiday - Independence Day",
        description: "Company holiday - office closed",
        start_date_time: new Date(now.getFullYear(), 7, 15, 0, 0), // August 15
        end_date_time: new Date(now.getFullYear(), 7, 15, 23, 59),
        created_by: creatorId,
        visibility_type: "ALL",
        assigned_users: null,
        notification_sent: false,
      },
    ];

    await Event.bulkCreate(events);
    console.log(`✅ Seeded ${events.length} calendar events`);
  } catch (error) {
    console.error("❌ Error seeding events:", error);
    throw error;
  }
}

