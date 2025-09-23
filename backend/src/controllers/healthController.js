import { sequelize } from "../config/sequelize.js";

export class HealthController {
  // Health check endpoint
  static async healthCheck(req, res) {
    try {
      // Test database connection
      await sequelize.authenticate();

      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        uptime: process.uptime(),
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      });
    }
  }
}
