import { Leave } from "../models/Leave.js";

export class LeaveController {
  // Apply for leave
  static async applyLeave(req, res) {
    try {
      const body = req.body;
      if (!body?.email || !body?.startDate || !body?.endDate) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const created = await Leave.create({
        email: body.email.toLowerCase(),
        name: body.name,
        type: body.type || "casual",
        startDate: body.startDate,
        endDate: body.endDate,
        reason: body.reason || "",
        attachmentUrl: body.attachmentUrl || "",
      });

      res.status(201).json(created);
    } catch (error) {
      console.error("Error applying for leave:", error);
      res.status(500).json({ message: "Error applying for leave" });
    }
  }

  // List leaves (optionally by email)
  static async getLeaves(req, res) {
    try {
      const email = req.query.email
        ? String(req.query.email).toLowerCase()
        : null;
      const where = email ? { email } : undefined;
      const rows = await Leave.findAll({ where, order: [["id", "DESC"]] });
      res.json(rows);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      res.status(500).json({ message: "Error fetching leaves" });
    }
  }

  // Review leave
  static async reviewLeave(req, res) {
    try {
      const { status, reviewedBy, remarks } = req.body;
      const row = await Leave.findByPk(req.params.id);

      if (!row) return res.status(404).json({ message: "Not found" });

      row.status = status;
      row.reviewedBy = reviewedBy;
      row.reviewedAt = new Date();
      row.remarks = remarks;
      await row.save();

      res.json(row);
    } catch (error) {
      console.error("Error reviewing leave:", error);
      res.status(500).json({ message: "Error reviewing leave" });
    }
  }
}
