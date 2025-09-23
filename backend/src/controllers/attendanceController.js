import { Attendance } from "../models/Attendance.js";
import { Op } from "sequelize";

export class AttendanceController {
  // Get all attendance data (for admin)
  static async getAllAttendance(req, res) {
    try {
      const { filter } = req.query;
      let whereClause = {};

      if (filter === "today") {
        const today = new Date().toISOString().slice(0, 10);
        whereClause.date = today;
      } else if (filter === "week") {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        whereClause.date = {
          [Op.gte]: startOfWeek.toISOString().slice(0, 10),
        };
      } else if (filter === "month") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        whereClause.date = {
          [Op.gte]: startOfMonth.toISOString().slice(0, 10),
        };
      }
      // 'all' filter doesn't add any where clause

      const attendanceList = await Attendance.findAll({
        where: whereClause,
        order: [
          ["date", "DESC"],
          ["checkIn", "DESC"],
        ],
      });

      res.json(attendanceList);
    } catch (error) {
      console.error("Error fetching attendance list:", error);
      res.status(500).json({ message: "Error fetching attendance data" });
    }
  }

  // Get today's attendance for a user
  static async getTodayAttendance(req, res) {
    try {
      const email = String(req.query.email || "").toLowerCase();
      if (!email) return res.status(400).json({ message: "email required" });

      const today = new Date().toISOString().slice(0, 10);
      const row = await Attendance.findOne({ where: { email, date: today } });
      res.json(row || null);
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Error fetching today's attendance" });
    }
  }

  // Check-in
  static async checkIn(req, res) {
    try {
      const { email, name, latitude, longitude, address } = req.body;
      if (!email) return res.status(400).json({ message: "email required" });

      const today = new Date().toISOString().slice(0, 10);
      let row = await Attendance.findOne({ where: { email, date: today } });

      if (row?.checkIn)
        return res.status(400).json({ message: "Already checked in" });

      if (!row) {
        row = await Attendance.create({
          email: email.toLowerCase(),
          name,
          date: today,
          checkIn: new Date(),
          status: "present",
          checkInLatitude: latitude || null,
          checkInLongitude: longitude || null,
          checkInAddress: address || null,
        });
      } else {
        row.checkIn = new Date();
        row.checkInLatitude = latitude || null;
        row.checkInLongitude = longitude || null;
        row.checkInAddress = address || null;
        await row.save();
      }

      res.json(row);
    } catch (error) {
      console.error("Error during check-in:", error);
      res.status(500).json({ message: "Error during check-in" });
    }
  }

  // Check-out
  static async checkOut(req, res) {
    try {
      const { email, latitude, longitude, address } = req.body;
      if (!email) return res.status(400).json({ message: "email required" });

      const today = new Date().toISOString().slice(0, 10);
      const row = await Attendance.findOne({
        where: { email: email.toLowerCase(), date: today },
      });

      if (!row?.checkIn)
        return res.status(400).json({ message: "Check-in first" });
      if (row.checkOut)
        return res.status(400).json({ message: "Already checked out" });

      row.checkOut = new Date();
      row.checkOutLatitude = latitude || null;
      row.checkOutLongitude = longitude || null;
      row.checkOutAddress = address || null;
      await row.save();

      res.json(row);
    } catch (error) {
      console.error("Error during check-out:", error);
      res.status(500).json({ message: "Error during check-out" });
    }
  }
}
