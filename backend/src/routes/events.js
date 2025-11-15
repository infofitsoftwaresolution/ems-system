import { Router } from "express";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

const router = Router();

// Cache for table columns to avoid querying on every request
let tableColumnsCache = null;
let columnsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get actual table columns
async function getTableColumns() {
  const now = Date.now();
  // Return cached columns if still valid
  if (tableColumnsCache && (now - columnsCacheTime) < CACHE_TTL) {
    return tableColumnsCache;
  }

  try {
    const [results] = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'events' 
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );
    
    // Handle both array and object formats
    let columns = [];
    if (Array.isArray(results) && results.length > 0) {
      columns = results.map((r) => r.column_name);
    } else {
      // Fallback: Try raw query to detect columns
      const [rawResults] = await sequelize.query(
        `SELECT * FROM events LIMIT 1`,
        { type: QueryTypes.SELECT }
      );
      if (rawResults && rawResults.length > 0) {
        columns = Object.keys(rawResults[0]);
      }
    }
    
    tableColumnsCache = columns;
    columnsCacheTime = now;
    return tableColumnsCache;
  } catch (error) {
    console.error("Error getting table columns:", error);
    console.error("Error details:", error.message, error.stack);
    // Return default columns if query fails
    return ['id', 'title', 'description', 'createdAt', 'updatedAt'];
  }
}

// Helper function to transform event data to frontend format
function transformEventData(eventData, columns) {
  const hasStart = columns.includes('start');
  const hasEnd = columns.includes('end');
  const hasDate = columns.includes('date');
  const hasStartTime = columns.includes('startTime');
  const hasEndTime = columns.includes('endTime');
  const hasAllDay = columns.includes('allDay');
  const hasAttendees = columns.includes('attendees');

  let attendees = [];
  try {
    if (eventData.attendees) {
      attendees =
        typeof eventData.attendees === "string"
          ? JSON.parse(eventData.attendees)
          : eventData.attendees;
    }
  } catch (e) {
    console.error("Error parsing attendees:", e);
    attendees = [];
  }

  // Handle date/time conversion
  let startDate;
  let endDate;

  if (hasStart && eventData.start) {
    startDate = new Date(eventData.start);
  } else if (hasDate && hasStartTime && eventData.date && eventData.startTime) {
    startDate = new Date(`${eventData.date}T${eventData.startTime}`);
  } else if (hasDate && eventData.date) {
    startDate = new Date(eventData.date);
  } else {
    startDate = new Date();
  }

  if (hasEnd && eventData.end) {
    endDate = new Date(eventData.end);
  } else if (hasDate && hasEndTime && eventData.date && eventData.endTime) {
    endDate = new Date(`${eventData.date}T${eventData.endTime}`);
  } else if (hasDate && eventData.date) {
    endDate = new Date(eventData.date);
  } else {
    endDate = new Date(startDate.getTime() + 3600000); // Default 1 hour later
  }

  return {
    id: `e${eventData.id}`,
    title: eventData.title,
    description: eventData.description || "",
    type: "meeting", // Default type since column doesn't exist
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    allDay: eventData.allDay || false,
    attendees: Array.isArray(attendees) ? attendees : [],
  };
}

// Get all events
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { type, start, end } = req.query;

    // Get actual table columns
    const columns = await getTableColumns();
    const hasStart = columns.includes('start');
    const hasEnd = columns.includes('end');
    const hasDate = columns.includes('date');
    const hasStartTime = columns.includes('startTime');
    const hasEndTime = columns.includes('endTime');
    const hasAllDay = columns.includes('allDay');
    const hasAttendees = columns.includes('attendees');
    const hasCreatedByEmail = columns.includes('createdByEmail');

    // Build attributes list based on what exists
    const attributes = ['id', 'title', 'description'];
    if (hasStart) attributes.push('start');
    if (hasEnd) attributes.push('end');
    if (hasDate) attributes.push('date');
    if (hasStartTime) attributes.push('startTime');
    if (hasEndTime) attributes.push('endTime');
    if (hasAllDay) attributes.push('allDay');
    if (hasAttendees) attributes.push('attendees');
    if (hasCreatedByEmail) attributes.push('createdByEmail');
    attributes.push('createdAt', 'updatedAt');

    // Build where clause
    let whereClause = {};
    if (start && end) {
      if (hasStart) {
        whereClause.start = {
          [Op.between]: [new Date(start), new Date(end)],
        };
      } else if (hasDate) {
        whereClause.date = {
          [Op.between]: [new Date(start), new Date(end)],
        };
      }
    }

    // Determine order by column
    const orderColumn = hasStart ? 'start' : hasDate ? 'date' : 'createdAt';

    const events = await Event.findAll({
      where: whereClause,
      attributes: attributes,
      order: [[orderColumn, "ASC"]],
    });

    // Transform events to match frontend format
    const transformedEvents = events.map((event) => {
      return transformEventData(event.toJSON(), columns);
    });

    res.json(transformedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching events",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Get event by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));
    
    // Get actual table columns
    const columns = await getTableColumns();
    const hasStart = columns.includes('start');
    const hasEnd = columns.includes('end');
    const hasDate = columns.includes('date');
    const hasStartTime = columns.includes('startTime');
    const hasEndTime = columns.includes('endTime');
    const hasAllDay = columns.includes('allDay');
    const hasAttendees = columns.includes('attendees');
    const hasCreatedByEmail = columns.includes('createdByEmail');

    // Build attributes list based on what exists
    const attributes = ['id', 'title', 'description'];
    if (hasStart) attributes.push('start');
    if (hasEnd) attributes.push('end');
    if (hasDate) attributes.push('date');
    if (hasStartTime) attributes.push('startTime');
    if (hasEndTime) attributes.push('endTime');
    if (hasAllDay) attributes.push('allDay');
    if (hasAttendees) attributes.push('attendees');
    if (hasCreatedByEmail) attributes.push('createdByEmail');
    attributes.push('createdAt', 'updatedAt');

    const event = await Event.findByPk(eventId, {
      attributes: attributes
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(transformEventData(event.toJSON(), columns));
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      message: "Error fetching event",
      error: error.message,
    });
  }
});

// Create new event
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, type, start, end, allDay, attendees } =
      req.body;
    
    // Get user email from database using user ID from token
    let userEmail = req.body.createdByEmail;
    if (!userEmail) {
      const userId = req.user?.sub || req.user?.id;
      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          userEmail = user.email;
        }
      }
    }
    
    // If still no userEmail, try to get from req.user.email directly
    if (!userEmail && req.user?.email) {
      userEmail = req.user.email;
    }
    
    // If still no userEmail, return error
    if (!userEmail) {
      return res.status(400).json({
        message: "Unable to determine user email. Please ensure you are logged in.",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "Event title is required",
      });
    }

    if (!start || !end) {
      return res.status(400).json({
        message: "Event start and end times are required",
      });
    }

    // Get actual table columns to determine which fields to use
    const columns = await getTableColumns();
    const hasStart = columns.includes('start');
    const hasEnd = columns.includes('end');
    const hasDate = columns.includes('date');
    const hasStartTime = columns.includes('startTime');
    const hasEndTime = columns.includes('endTime');
    const hasAllDay = columns.includes('allDay');
    const hasAttendees = columns.includes('attendees');
    const hasCreatedByEmail = columns.includes('createdByEmail');

    // Create event data based on what columns exist
    const eventDataToCreate = {
      title: title.trim(),
      description: description?.trim() || null,
    };

    // Handle date/time fields
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (hasStart) {
      eventDataToCreate.start = startDate;
    }
    if (hasEnd) {
      eventDataToCreate.end = endDate;
    }
    if (hasDate) {
      eventDataToCreate.date = startDate.toISOString().split('T')[0];
    }
    if (hasStartTime) {
      eventDataToCreate.startTime = startDate.toTimeString().split(' ')[0];
    }
    if (hasEndTime) {
      eventDataToCreate.endTime = endDate.toTimeString().split(' ')[0];
    }
    if (hasAllDay) {
      eventDataToCreate.allDay = allDay || false;
    }
    if (hasAttendees) {
      eventDataToCreate.attendees = attendees && attendees.length > 0 ? JSON.stringify(attendees) : null;
    }
    if (hasCreatedByEmail && userEmail) {
      eventDataToCreate.createdByEmail = userEmail;
    }
    
    const event = await Event.create(eventDataToCreate);

    res.status(201).json(transformEventData(event.toJSON(), columns));
  } catch (error) {
    console.error("Error creating event:", error);
    console.error("Error stack:", error.stack);
    console.error("Request user object:", req.user);
    console.error("UserEmail used:", userEmail);
    res.status(500).json({
      message: "Error creating event",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Update event
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));
    const { title, description, type, start, end, allDay, attendees } =
      req.body;

    // Get actual table columns
    const columns = await getTableColumns();
    const hasStart = columns.includes('start');
    const hasEnd = columns.includes('end');
    const hasDate = columns.includes('date');
    const hasStartTime = columns.includes('startTime');
    const hasEndTime = columns.includes('endTime');
    const hasAllDay = columns.includes('allDay');
    const hasAttendees = columns.includes('attendees');

    // Build attributes list
    const attributes = ['id', 'title', 'description'];
    if (hasStart) attributes.push('start');
    if (hasEnd) attributes.push('end');
    if (hasDate) attributes.push('date');
    if (hasStartTime) attributes.push('startTime');
    if (hasEndTime) attributes.push('endTime');
    if (hasAllDay) attributes.push('allDay');
    if (hasAttendees) attributes.push('attendees');
    if (columns.includes('createdByEmail')) attributes.push('createdByEmail');
    attributes.push('createdAt', 'updatedAt');

    const event = await Event.findByPk(eventId, {
      attributes: attributes
    });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Update event data based on what columns exist
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    
    // Handle date/time fields
    if (start !== undefined) {
      const startDate = new Date(start);
      if (hasStart) updateData.start = startDate;
      if (hasDate) updateData.date = startDate.toISOString().split('T')[0];
      if (hasStartTime) updateData.startTime = startDate.toTimeString().split(' ')[0];
    }
    if (end !== undefined) {
      const endDate = new Date(end);
      if (hasEnd) updateData.end = endDate;
      if (hasEndTime) updateData.endTime = endDate.toTimeString().split(' ')[0];
    }
    if (hasAllDay && allDay !== undefined) {
      updateData.allDay = allDay;
    }
    if (hasAttendees && attendees !== undefined) {
      updateData.attendees = attendees && attendees.length > 0 ? JSON.stringify(attendees) : null;
    }
    
    await event.update(updateData);

    res.json(transformEventData(event.toJSON(), columns));
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      message: "Error updating event",
      error: error.message,
    });
  }
});

// Delete event
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));
    
    // For delete, we only need the ID
    const event = await Event.findByPk(eventId, {
      attributes: ['id']
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.destroy();

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      message: "Error deleting event",
      error: error.message,
    });
  }
});

export default router;
