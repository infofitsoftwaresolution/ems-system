import { Router } from "express";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";
import { Op } from "sequelize";

const router = Router();

// Get all events
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { type, start, end } = req.query;

    let whereClause = {};

    if (type && type !== "all") {
      whereClause.type = type;
    }

    if (start && end) {
      whereClause.start = {
        [Op.between]: [new Date(start), new Date(end)],
      };
    }

    const events = await Event.findAll({
      where: whereClause,
      attributes: ['id', 'title', 'description', 'type', 'start', 'end', 'allDay', 'attendees', 'createdByEmail', 'date', 'startTime', 'endTime', 'priority', 'duration', 'recurring', 'reminder', 'createdAt', 'updatedAt'],
      order: [["start", "ASC"]],
    });

    // Transform events to match frontend format
    const transformedEvents = events.map((event) => {
      const eventData = event.toJSON();
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

      return {
        id: `e${eventData.id}`,
        title: eventData.title,
        description: eventData.description || "",
        type: eventData.type || "meeting",
        start: eventData.start
          ? new Date(eventData.start).toISOString()
          : new Date().toISOString(),
        end: eventData.end
          ? new Date(eventData.end).toISOString()
          : new Date().toISOString(),
        allDay: eventData.allDay || false,
        attendees: Array.isArray(attendees) ? attendees : [],
      };
    });

    res.json(transformedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      message: "Error fetching events",
      error: error.message,
    });
  }
});

// Get event by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventData = event.toJSON();
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

    res.json({
      id: `e${eventData.id}`,
      title: eventData.title,
      description: eventData.description || "",
      type: eventData.type || "meeting",
      start: eventData.start
        ? new Date(eventData.start).toISOString()
        : new Date().toISOString(),
      end: eventData.end
        ? new Date(eventData.end).toISOString()
        : new Date().toISOString(),
      allDay: eventData.allDay || false,
      attendees: Array.isArray(attendees) ? attendees : [],
    });
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

    const event = await Event.create({
      title: title.trim(),
      description: description?.trim() || null,
      type: type || "meeting",
      start: new Date(start),
      end: new Date(end),
      allDay: allDay || false,
      attendees:
        attendees && attendees.length > 0 ? JSON.stringify(attendees) : null,
      createdByEmail: userEmail,
    });

    const eventData = event.toJSON();
    let parsedAttendees = [];
    try {
      if (eventData.attendees) {
        parsedAttendees =
          typeof eventData.attendees === "string"
            ? JSON.parse(eventData.attendees)
            : eventData.attendees;
      }
    } catch (e) {
      console.error("Error parsing attendees:", e);
      parsedAttendees = [];
    }

    res.status(201).json({
      id: `e${eventData.id}`,
      title: eventData.title,
      description: eventData.description || "",
      type: eventData.type || "meeting",
      start: new Date(eventData.start).toISOString(),
      end: new Date(eventData.end).toISOString(),
      allDay: eventData.allDay || false,
      attendees: Array.isArray(parsedAttendees) ? parsedAttendees : [],
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      message: "Error creating event",
      error: error.message,
    });
  }
});

// Update event
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id.replace("e", ""));
    const { title, description, type, start, end, allDay, attendees } =
      req.body;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.update({
      title: title !== undefined ? title.trim() : event.title,
      description:
        description !== undefined
          ? description?.trim() || null
          : event.description,
      type: type !== undefined ? type : event.type,
      start: start !== undefined ? new Date(start) : event.start,
      end: end !== undefined ? new Date(end) : event.end,
      allDay: allDay !== undefined ? allDay : event.allDay,
      attendees:
        attendees !== undefined
          ? attendees && attendees.length > 0
            ? JSON.stringify(attendees)
            : null
          : event.attendees,
    });

    const eventData = event.toJSON();
    let parsedAttendees = [];
    try {
      if (eventData.attendees) {
        parsedAttendees =
          typeof eventData.attendees === "string"
            ? JSON.parse(eventData.attendees)
            : eventData.attendees;
      }
    } catch (e) {
      console.error("Error parsing attendees:", e);
      parsedAttendees = [];
    }

    res.json({
      id: `e${eventData.id}`,
      title: eventData.title,
      description: eventData.description || "",
      type: eventData.type || "meeting",
      start: new Date(eventData.start).toISOString(),
      end: new Date(eventData.end).toISOString(),
      allDay: eventData.allDay || false,
      attendees: Array.isArray(parsedAttendees) ? parsedAttendees : [],
    });
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
    const event = await Event.findByPk(eventId);

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
