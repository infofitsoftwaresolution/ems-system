import { Router } from "express";
import { Attendance } from "../models/Attendance.js";
import { Employee } from "../models/Employee.js";
import { User } from "../models/User.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { Op } from "sequelize";
import { isLateCheckIn } from "../utils/checkInLate.js";

const router = Router();

// Get all attendance data (for admin, manager, and HR only)
router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "manager", "hr"]),
  async (req, res) => {
    // Wrap everything in a try-catch to ensure we always return a valid response
    try {
      console.log("📊 Fetching attendance data with filter:", req.query.filter);
      console.log("📊 Request user:", req.user);

      // Check if models are available
      if (!Attendance || typeof Attendance.findAll !== "function") {
        console.error("❌ Attendance model not available");
        return res.json([]);
      }

      const { filter, search, date } = req.query;
      let whereClause = {};

      // Handle specific date filter (takes priority over range filter)
      if (date) {
        const dateStr = date.slice(0, 10); // Ensure YYYY-MM-DD format
        whereClause.date = dateStr;
      } else if (filter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().slice(0, 10);
        whereClause.date = todayStr;
      } else if (filter === "week") {
        const now = new Date();
        const startOfWeek = new Date(now);
        // Get Monday of current week (0 = Sunday, 1 = Monday, etc.)
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
        whereClause.date = {
          [Op.gte]: startOfWeekStr,
        };
      } else if (filter === "month") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
        whereClause.date = {
          [Op.gte]: startOfMonthStr,
        };
      }
      // 'all' filter doesn't add any where clause - returns all records

      // Add limit to prevent loading too many records at once
      const limit = parseInt(req.query.limit) || 1000;

      // Build query options - simplify to avoid issues
      let queryOptions = {
        order: [
          ["date", "DESC"],
          ["checkIn", "DESC"],
        ],
        limit: limit,
      };

      // Only add where clause if it's not empty
      if (Object.keys(whereClause).length > 0) {
        queryOptions.where = whereClause;
      }

      console.log("📋 Query options:", JSON.stringify(queryOptions, null, 2));

      let attendanceList = [];
      try {
        console.log("🔍 Executing Attendance.findAll...");
        console.log("🔍 Where clause:", whereClause);
        console.log("🔍 Filter:", filter);

        // Build the query options - specify attributes to avoid missing column errors
        // Only select columns that exist in the database
        const findAllOptions = {
          attributes: [
            "id",
            "email",
            "name",
            "date",
            "checkIn",
            "checkOut",
            "status",
            "notes",
            "checkInLatitude",
            "checkInLongitude",
            "checkInAddress",
            "checkOutLatitude",
            "checkOutLongitude",
            "checkOutAddress",
            "checkInPhoto",
            "checkOutPhoto", // Photo fields
            "isLate",
            "checkoutType", // Late status and checkout type
            "createdAt",
            "updatedAt",
          ],
          order: [
            ["date", "DESC"],
            ["checkIn", "DESC"],
          ],
          limit: limit,
          raw: false, // Return Sequelize instances, not plain objects
        };

        // Only add where clause if it's not empty
        if (Object.keys(whereClause).length > 0) {
          findAllOptions.where = whereClause;
        }

        console.log(
          "🔍 FindAll options:",
          JSON.stringify(findAllOptions, null, 2)
        );

        // Execute the query
        attendanceList = await Attendance.findAll(findAllOptions);

        console.log(
          `✅ Found ${
            attendanceList ? attendanceList.length : 0
          } attendance records`
        );
        console.log(
          "✅ Attendance list type:",
          Array.isArray(attendanceList) ? "Array" : typeof attendanceList
        );
      } catch (attendanceError) {
        console.error("❌ Error fetching attendance records:", attendanceError);
        console.error("Attendance error name:", attendanceError.name);
        console.error("Attendance error message:", attendanceError.message);
        console.error("Attendance error stack:", attendanceError.stack);
        if (attendanceError.original) {
          console.error(
            "Original error message:",
            attendanceError.original.message
          );
          console.error("Original error code:", attendanceError.original.code);
          console.error(
            "Original error detail:",
            attendanceError.original.detail
          );
        }
        if (attendanceError.errors) {
          console.error("Validation errors:", attendanceError.errors);
        }
        // Return empty array instead of throwing - allow the request to complete
        attendanceList = [];
      }

      // Handle empty attendance list
      if (!attendanceList || attendanceList.length === 0) {
        console.log("📭 No attendance records found, returning empty array");
        return res.json([]);
      }

      // Note: Search will be applied after employee data is joined
      // to include employeeId in the search

      // Join employee info by email to include employeeId
      const emails = [
        ...new Set(
          attendanceList
            .map((r) => {
              try {
                return r.email;
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean)
        ),
      ];

      console.log(
        `👥 Found ${emails.length} unique emails in attendance records`
      );

      let emailToEmployee = new Map();

      if (emails.length > 0) {
        try {
          // Check if Employee model is available
          if (!Employee || typeof Employee.findAll !== "function") {
            console.warn(
              "⚠️ Employee model not available, skipping employee data enrichment"
            );
          } else {
            console.log("🔍 Fetching employee data...");
            const employees = await Employee.findAll({
              where: {
                email: {
                  [Op.in]: emails,
                },
              },
              attributes: [
                "email",
                "employeeId",
                "name",
                "hireDate",
                "is_active",
                "status",
                "updatedAt",
                "mobile_number",
              ],
            });

            console.log(`✅ Found ${employees?.length || 0} employees`);

            if (employees && Array.isArray(employees)) {
              emailToEmployee = new Map(
                employees
                  .filter((e) => e && e.email) // Filter out any null/undefined employees
                  .map((e) => {
                    // Get employee data (handle both Sequelize instance and plain object)
                    const empData = e.toJSON ? e.toJSON() : e;

                    // Try multiple ways to access hireDate (camelCase, snake_case, dataValues)
                    const hireDate =
                      empData.hireDate ||
                      empData.hire_date ||
                      (e.dataValues && e.dataValues.hireDate) ||
                      (e.dataValues && e.dataValues.hire_date) ||
                      null;

                    // Debug: Log hireDate to see what we're getting
                    if (hireDate) {
                      console.log(
                        `📅 Employee ${empData.email} hireDate:`,
                        hireDate
                      );
                    } else {
                      console.log(
                        `⚠️ No hireDate found for ${empData.email}. Available keys:`,
                        Object.keys(empData)
                      );
                    }

                    // Calculate leaveDate: if employee is inactive or status is "Not Working",
                    // use updatedAt as an approximation of when they left
                    let leaveDate = null;
                    if (
                      empData.is_active === false ||
                      empData.status === "Not Working"
                    ) {
                      // Use updatedAt as the leave date if available
                      const updatedAt =
                        empData.updatedAt ||
                        empData.updated_at ||
                        (e.dataValues && e.dataValues.updatedAt) ||
                        (e.dataValues && e.dataValues.updated_at) ||
                        null;
                      if (updatedAt) {
                        leaveDate = updatedAt;
                      }
                    }

                    // Try multiple ways to access mobile_number
                    const mobileNumber =
                      empData.mobile_number ||
                      empData.mobileNumber ||
                      (e.dataValues && e.dataValues.mobile_number) ||
                      (e.dataValues && e.dataValues.mobileNumber) ||
                      null;

                    return [
                      String(empData.email).toLowerCase(),
                      {
                        employeeId: empData.employeeId || null,
                        name: empData.name || null,
                        hireDate: hireDate,
                        is_active:
                          empData.is_active !== undefined
                            ? empData.is_active
                            : true,
                        status: empData.status || null,
                        leaveDate: leaveDate,
                        mobileNumber: mobileNumber,
                      },
                    ];
                  })
              );
            }
          }
        } catch (empError) {
          console.error("❌ Error fetching employee data:", empError);
          console.error("Employee error details:", empError.message);
          if (empError.stack) {
            console.error("Employee error stack:", empError.stack);
          }
          // Continue without employee data - attendance records will still be returned
          emailToEmployee = new Map();
        }
      }

      console.log("🔄 Enriching attendance data...");
      const enriched = attendanceList.map((row, index) => {
        try {
          let json;
          try {
            json = row.toJSON ? row.toJSON() : row;
          } catch (jsonError) {
            console.error(`Error converting row ${index} to JSON:`, jsonError);
            json = row; // Use row as-is if toJSON fails
          }

          // Normalize email for lookup
          const emailKey = json.email ? String(json.email).toLowerCase() : null;
          if (emailKey) {
            const emp = emailToEmployee.get(emailKey);
            if (emp) {
              json.employeeId = emp.employeeId || null;
              // Optionally backfill name if missing
              if (!json.name && emp.name) json.name = emp.name;
              // Add hireDate (Date of Joining) - fetch from employee data
              json.hireDate = emp.hireDate || null;
              // Add leaveDate (Date of Leaving) - calculated from employee status/updatedAt
              json.leaveDate = emp.leaveDate || null;
              // Add mobileNumber - fetch from employee data
              json.mobileNumber = emp.mobileNumber || null;

              // Debug: Log if hireDate is being set
              if (emp.hireDate) {
                console.log(`✅ Set hireDate for ${emailKey}:`, emp.hireDate);
              } else {
                console.log(`⚠️ No hireDate found for ${emailKey}`);
              }
            } else {
              // If employee not found in map, set dates to null
              console.log(
                `⚠️ Employee not found in map for email: ${emailKey}`
              );
              json.hireDate = json.hireDate || null;
              json.leaveDate = json.leaveDate || null;
            }
          } else {
            // If no email key, set dates to null
            json.hireDate = json.hireDate || null;
            json.leaveDate = json.leaveDate || null;
          }

          // Calculate isLate consistently using fixed timezone cutoff (Asia/Kolkata, 11:00 AM)
          if (json.checkIn) {
            try {
              const calculatedLate = isLateCheckIn(json.checkIn);
              json.isLate = calculatedLate;

              // Update the record in database for future queries (async, don't await)
              if (row && typeof row.save === "function") {
                row.isLate = calculatedLate;
                row
                  .save()
                  .catch((err) => console.error("Error updating isLate:", err));
              }
            } catch (dateError) {
              console.error("Error calculating isLate:", dateError);
              json.isLate = false;
            }
          }

          // Ensure isLate is a boolean (default to false if null/undefined)
          json.isLate = json.isLate === true;

          // Calculate working hours: checkout_datetime - checkin_datetime
          // Only calculate if both checkIn and checkOut exist
          if (json.checkIn && json.checkOut) {
            try {
              const checkInTime = new Date(json.checkIn);
              const checkOutTime = new Date(json.checkOut);
              if (
                !isNaN(checkInTime.getTime()) &&
                !isNaN(checkOutTime.getTime())
              ) {
                const workingHoursMs = checkOutTime - checkInTime;
                const hours = Math.floor(workingHoursMs / (1000 * 60 * 60));
                const minutes = Math.floor(
                  (workingHoursMs % (1000 * 60 * 60)) / (1000 * 60)
                );
                const seconds = Math.floor(
                  (workingHoursMs % (1000 * 60)) / 1000
                );
                // Format as HH:MM:SS
                json.workingHours = `${String(hours).padStart(2, "0")}:${String(
                  minutes
                ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
              } else {
                json.workingHours = null;
              }
            } catch (dateError) {
              console.error("Error calculating working hours:", dateError);
              json.workingHours = null;
            }
          } else {
            // If only checkIn exists (incomplete record), set workingHours to null
            json.workingHours = json.checkIn && !json.checkOut ? null : null;
          }

          return json;
        } catch (rowError) {
          console.error(`Error processing attendance row ${index}:`, rowError);
          // Return basic row data if processing fails
          try {
            return row.toJSON ? row.toJSON() : row;
          } catch {
            return { error: "Failed to process row" };
          }
        }
      });

      // Apply search filter if provided (search by name, email, or employeeId)
      let filteredResults = enriched;
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        filteredResults = enriched.filter((record) => {
          const name = (record.name || "").toLowerCase();
          const email = (record.email || "").toLowerCase();
          const employeeId = (record.employeeId || "").toLowerCase();
          return (
            name.includes(searchTerm) ||
            email.includes(searchTerm) ||
            employeeId.includes(searchTerm)
          );
        });
      }

      console.log(
        `✅ Returning ${filteredResults.length} filtered attendance records (from ${enriched.length} total)`
      );
      res.json(filteredResults);
    } catch (error) {
      console.error("========================================");
      console.error("ERROR FETCHING ATTENDANCE LIST");
      console.error("========================================");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      if (error.original) {
        console.error("Original error:", error.original);
        console.error("Original error message:", error.original.message);
        console.error("Original error code:", error.original.code);
      }
      if (error.errors) {
        console.error("Validation errors:", error.errors);
      }
      console.error(
        "Full error object:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );
      console.error("========================================");

      // Always return a valid JSON response, even on error
      // Return empty array instead of error to prevent frontend crashes
      try {
        console.error("⚠️ Returning empty array due to error (instead of 500)");
        // Return empty array instead of error status to allow frontend to handle gracefully
        if (!res.headersSent) {
          return res.json([]);
        }
      } catch (responseError) {
        // If even sending the response fails, log it
        console.error("❌ Failed to send response:", responseError);
        if (!res.headersSent) {
          try {
            res.status(500).json({ message: "Error fetching attendance data" });
          } catch {
            res.end();
          }
        }
      }
    }
  }
);

// Test endpoint to check database connection and data count
router.get(
  "/test",
  authenticateToken,
  requireRole(["admin", "manager", "hr"]),
  async (req, res) => {
    try {
      console.log("🧪 Testing attendance database connection...");

      // Test 1: Check if model is available
      const modelAvailable =
        Attendance && typeof Attendance.findAll === "function";
      console.log("✅ Model available:", modelAvailable);

      // Test 2: Try a simple count query
      let totalCount = 0;
      try {
        totalCount = await Attendance.count();
        console.log("✅ Total attendance records:", totalCount);
      } catch (countError) {
        console.error("❌ Count query failed:", countError.message);
      }

      // Test 3: Try to fetch one record
      let sampleRecord = null;
      try {
        sampleRecord = await Attendance.findOne({ limit: 1 });
        console.log("✅ Sample record found:", !!sampleRecord);
      } catch (findError) {
        console.error("❌ FindOne query failed:", findError.message);
      }

      res.json({
        modelAvailable,
        totalCount,
        hasSampleRecord: !!sampleRecord,
        sampleRecord: sampleRecord ? sampleRecord.toJSON() : null,
        message: "Database connection test completed",
      });
    } catch (error) {
      console.error("❌ Test endpoint error:", error);
      res.status(500).json({
        error: error.message,
        stack: error.stack,
      });
    }
  }
);

// Get today's attendance for a user
router.get("/today", authenticateToken, async (req, res) => {
  const email = String(req.query.email || "").toLowerCase();
  if (!email) return res.status(400).json({ message: "email required" });
  const today = new Date().toISOString().slice(0, 10);
  const row = await Attendance.findOne({ where: { email, date: today } });
  res.json(row || null);
});

// Get employee's own attendance history (for employees)
router.get("/my", authenticateToken, async (req, res) => {
  try {
    // Get user ID from token and fetch user to get email
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Unable to determine user ID from token" });
    }

    // Fetch user to get email
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const email = String(user.email).toLowerCase();
    const { filter } = req.query;
    let whereClause = { email };

    // Apply date filters
    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);
      whereClause.date = todayStr;
    } else if (filter === "week") {
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);
      whereClause.date = {
        [Op.gte]: startOfWeekStr,
      };
    } else if (filter === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
      whereClause.date = {
        [Op.gte]: startOfMonthStr,
      };
    }
    // 'all' filter doesn't add date restriction - returns all records for the user

    const limit = parseInt(req.query.limit) || 1000;

    const attendanceList = await Attendance.findAll({
      attributes: [
        "id",
        "email",
        "name",
        "date",
        "checkIn",
        "checkOut",
        "status",
        "notes",
        "checkInLatitude",
        "checkInLongitude",
        "checkInAddress",
        "checkOutLatitude",
        "checkOutLongitude",
        "checkOutAddress",
        "checkInPhoto",
        "checkOutPhoto",
        "isLate",
        "checkoutType",
        "createdAt",
        "updatedAt",
      ],
      where: whereClause,
      order: [
        ["date", "DESC"],
        ["checkIn", "DESC"],
      ],
      limit: limit,
      raw: false,
    });

    // Convert to JSON format and calculate working hours
    const formattedList = attendanceList.map((att) => {
      const attData = att.toJSON ? att.toJSON() : att;

      // Calculate working hours: checkout_datetime - checkin_datetime
      // Only calculate if both checkIn and checkOut exist
      let workingHours = null;
      if (attData.checkIn && attData.checkOut) {
        try {
          const checkInTime = new Date(attData.checkIn);
          const checkOutTime = new Date(attData.checkOut);
          if (!isNaN(checkInTime.getTime()) && !isNaN(checkOutTime.getTime())) {
            const workingHoursMs = checkOutTime - checkInTime;
            const hours = Math.floor(workingHoursMs / (1000 * 60 * 60));
            const minutes = Math.floor(
              (workingHoursMs % (1000 * 60 * 60)) / (1000 * 60)
            );
            const seconds = Math.floor((workingHoursMs % (1000 * 60)) / 1000);
            // Format as HH:MM:SS
            workingHours = `${String(hours).padStart(2, "0")}:${String(
              minutes
            ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          }
        } catch (dateError) {
          console.error("Error calculating working hours:", dateError);
          workingHours = null;
        }
      }
      // If only checkIn exists (incomplete record), workingHours remains null

      return {
        id: attData.id,
        email: attData.email,
        name: attData.name,
        date: attData.date,
        checkIn: attData.checkIn,
        checkOut: attData.checkOut,
        status: attData.status,
        notes: attData.notes,
        checkInLatitude: attData.checkInLatitude,
        checkInLongitude: attData.checkInLongitude,
        checkInAddress: attData.checkInAddress,
        checkOutLatitude: attData.checkOutLatitude,
        checkOutLongitude: attData.checkOutLongitude,
        checkOutAddress: attData.checkOutAddress,
        checkInPhoto: attData.checkInPhoto,
        checkOutPhoto: attData.checkOutPhoto,
        isLate: attData.isLate,
        checkoutType: attData.checkoutType,
        workingHours: workingHours, // Calculated working hours or null
        createdAt: attData.createdAt,
        updatedAt: attData.updatedAt,
      };
    });

    res.json(formattedList);
  } catch (error) {
    console.error("Error fetching employee attendance:", error);
    res.status(500).json({
      message: "Error fetching attendance",
      error: error.message,
    });
  }
});

// Check-in
router.post("/checkin", authenticateToken, async (req, res) => {
  const { email, name, latitude, longitude, address, photoBase64 } = req.body;
  if (!email) return res.status(400).json({ message: "email required" });

  console.log("Check-in request:", {
    email,
    name,
    latitude,
    longitude,
    address,
    hasPhoto: !!photoBase64,
  });

  const today = new Date().toISOString().slice(0, 10);

  // Check if already checked in today
  const existingRecord = await Attendance.findOne({
    where: {
      email: email.toLowerCase(),
      date: today,
      checkIn: { [Op.ne]: null },
    },
  });

  if (existingRecord) {
    return res.status(400).json({ message: "Already checked in today" });
  }

  // Check if check-in is late (after 11:00 AM Asia/Kolkata)
  // Backend uses server time; cutoff is evaluated in fixed timezone to avoid client tampering.
  const checkInTime = new Date();
  const isLate = isLateCheckIn(checkInTime);

  // Create attendance record immediately with check-in data
  // checkout fields remain null, working_hours is null, status = "checked_in"
  const row = await Attendance.create({
    email: email.toLowerCase(),
    name,
    date: today,
    checkIn: checkInTime,
    status: "checked_in", // Status is "Checked In" until checkout
    isLate: isLate,
    checkInLatitude: latitude || null,
    checkInLongitude: longitude || null,
    checkInAddress: address || null,
    checkInPhoto: photoBase64 || null,
    // Checkout fields remain null
    checkOut: null,
    checkOutLatitude: null,
    checkOutLongitude: null,
    checkOutAddress: null,
    checkOutPhoto: null,
    checkoutType: null,
  });

  console.log("✅ Created new attendance record (checked in):", {
    id: row.id,
    email: row.email,
    date: row.date,
    checkInTime: row.checkIn,
    checkInAddress: row.checkInAddress,
    isLate: row.isLate,
    status: row.status,
    hasPhoto: !!row.checkInPhoto,
  });

  res.json(row);
});

// Check-out
router.post("/checkout", authenticateToken, async (req, res) => {
  const { email, latitude, longitude, address, checkoutType, photoBase64 } =
    req.body;
  if (!email) return res.status(400).json({ message: "email required" });

  console.log("Check-out request:", {
    email,
    latitude,
    longitude,
    address,
    checkoutType,
    hasPhoto: !!photoBase64,
  });

  const today = new Date().toISOString().slice(0, 10);
  const row = await Attendance.findOne({
    where: {
      email: email.toLowerCase(),
      date: today,
      checkIn: { [Op.ne]: null },
    },
  });

  if (!row) {
    return res.status(400).json({ message: "Check-in first" });
  }

  if (row.checkOut) {
    return res.status(400).json({ message: "Already checked out" });
  }

  // Set checkout time
  const checkOutTime = new Date();
  row.checkOut = checkOutTime;
  row.checkoutType = checkoutType || "manual";
  row.checkOutLatitude = latitude || null;
  row.checkOutLongitude = longitude || null;
  row.checkOutAddress = address || null;
  row.checkOutPhoto = photoBase64 || null;

  // Calculate working hours: checkout_datetime - checkin_datetime
  if (row.checkIn) {
    const checkInTime = new Date(row.checkIn);
    const workingHoursMs = checkOutTime - checkInTime;
    const workingHours = Math.floor(workingHoursMs / (1000 * 60 * 60)); // Hours
    const workingMinutes = Math.floor(
      (workingHoursMs % (1000 * 60 * 60)) / (1000 * 60)
    ); // Minutes
    // Store as string in format "HH:MM" or we can add a field for this
    // For now, we'll calculate it on the fly in GET routes
  }

  // Update status to "Present" after checkout
  row.status = "present";

  await row.save();

  console.log("✅ Updated attendance record with check-out:", {
    id: row.id,
    email: row.email,
    checkInTime: row.checkIn,
    checkOutTime: row.checkOut,
    checkOutAddress: row.checkOutAddress,
    checkoutType: row.checkoutType,
    status: row.status,
    hasPhoto: !!row.checkOutPhoto,
  });

  res.json(row);
});

// Auto-checkout at midnight (11:59 PM) - called by cron job
router.post("/auto-checkout-midnight", async (req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Find all attendance records that are checked in but not checked out
    const uncheckedOutRecords = await Attendance.findAll({
      where: {
        date: todayStr,
        checkIn: { [Op.ne]: null },
        checkOut: null,
      },
    });

    console.log(
      `Found ${uncheckedOutRecords.length} records to auto-checkout at midnight`
    );

    // Set checkout time to 11:59 PM of the current day
    const checkoutTime = new Date(today);
    checkoutTime.setHours(23, 59, 0, 0);

    // Auto-checkout all records
    for (const record of uncheckedOutRecords) {
      record.checkOut = checkoutTime;
      record.checkoutType = "auto-midnight";
      record.checkOutAddress = "Auto-checkout (midnight reset)";

      // Calculate working hours: checkout_datetime - checkin_datetime
      if (record.checkIn) {
        const checkInTime = new Date(record.checkIn);
        const workingHoursMs = checkoutTime - checkInTime;
        // Working hours will be calculated on the fly in GET routes
      }

      // Update status to "Present" after checkout
      record.status = "present";

      await record.save();
      console.log(
        `Auto-checked out: ${record.email} at ${checkoutTime.toISOString()}`
      );
    }

    res.json({
      message: `Auto-checked out ${uncheckedOutRecords.length} employees`,
      count: uncheckedOutRecords.length,
    });
  } catch (error) {
    console.error("Error in auto-checkout:", error);
    res.status(500).json({ message: "Error performing auto-checkout" });
  }
});

export default router;
