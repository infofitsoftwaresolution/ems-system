import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { Op } from "sequelize";
import { Kyc } from "../models/Kyc.js";
import { Employee } from "../models/Employee.js";
import { User } from "../models/User.js";
import { sendKycApprovedEmail } from "../services/emailService.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

// Generate permanent employee ID in RST format (RST1001, RST1002, etc.)
const generatePermanentEmployeeId = async () => {
  try {
    // Find the highest emp_id that matches RST#### pattern
    const employees = await Employee.findAll({
      where: {
        emp_id: {
          [Op.like]: "RST%",
        },
      },
      order: [["emp_id", "DESC"]],
      limit: 1,
    });

    if (employees.length === 0) {
      // No employees with RST prefix, start from RST1001
      return "RST1001";
    }

    const lastEmpId = employees[0].emp_id;
    // Extract the number part (e.g., "RST1003" -> 1003)
    const match = lastEmpId.match(/RST(\d+)/);

    if (match) {
      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      return `RST${nextNumber}`;
    } else {
      // If pattern doesn't match, start from RST1001
      return "RST1001";
    }
  } catch (error) {
    console.error("Error generating permanent employee ID:", error);
    // Fallback: generate based on current count
    const count = await Employee.count();
    return `RST${1001 + count}`;
  }
};

const uploadDir = path.resolve(process.cwd(), "uploads");
const kycDir = path.join(uploadDir, "kyc");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(kycDir)) fs.mkdirSync(kycDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, kycDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const allow = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, cb) => {
  // Log file info for debugging
  console.log("File upload attempt:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // Normalize mimetype for comparison (lowercase)
  const normalizedMimeType = file.mimetype?.toLowerCase();

  // Check if mimetype is in allowed list
  if (allow.some((allowed) => allowed.toLowerCase() === normalizedMimeType)) {
    return cb(null, true);
  }

  // Also check file extension as fallback
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

  if (allowedExtensions.includes(ext)) {
    console.log("File accepted by extension:", ext);
    return cb(null, true);
  }

  console.error("File rejected:", {
    mimetype: file.mimetype,
    extension: ext,
    fieldname: file.fieldname,
    originalname: file.originalname,
  });

  cb(
    new Error(
      `Invalid file type: ${
        file.mimetype || "unknown"
      }. Allowed types: PDF, JPG, JPEG, PNG, WebP`
    )
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}); // 10MB

const router = Router();

// Submit KYC (no authentication required for submission)
router.post(
  "/",
  upload.fields([
    { name: "docFront", maxCount: 1 },
    { name: "docBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "aadharCard", maxCount: 1 },
    { name: "additionalDocs", maxCount: 5 }, // Allow multiple additional documents
    // New KYC document fields
    { name: "employeePhoto", maxCount: 1 },
    { name: "aadhaar_front", maxCount: 1 },
    { name: "aadhaar_back", maxCount: 1 },
    { name: "salary_slip_month_1", maxCount: 1 },
    { name: "salary_slip_month_2", maxCount: 1 },
    { name: "salary_slip_month_3", maxCount: 1 },
    { name: "bank_proof", maxCount: 1 },
    { name: "education_documents", maxCount: 10 }, // Allow multiple education documents
  ]),
  async (req, res) => {
    try {
      const body = req.body;
      const files = req.files || {};

      console.log("KYC submission received:");
      console.log("Body:", body);
      console.log("Files:", Object.keys(files));

      // Check if employee already has a KYC submission (by employeeId or fullName)
      let existingKyc = null;

      console.log(
        "KYC submission - body.employeeId:",
        body.employeeId,
        "type:",
        typeof body.employeeId
      );

      if (
        body.employeeId &&
        body.employeeId !== "0" &&
        body.employeeId !== "undefined" &&
        body.employeeId !== "null"
      ) {
        // employeeId is stored as VARCHAR, so always use string comparison
        // Convert to string to ensure type consistency
        const employeeIdStr = String(body.employeeId);
        existingKyc = await Kyc.findOne({
          where: { employeeId: employeeIdStr },
          order: [["createdAt", "DESC"]],
        });
      }

      // If no KYC found by employeeId, check by fullName
      if (!existingKyc && body.fullName) {
        existingKyc = await Kyc.findOne({
          where: { fullName: body.fullName },
          order: [["createdAt", "DESC"]],
        });
      }

      // If KYC exists, check status - only allow resubmission if rejected
      if (existingKyc) {
        const currentStatus =
          existingKyc.status?.toLowerCase() || existingKyc.status;
        console.log(
          "Existing KYC found - Status:",
          currentStatus,
          "Type:",
          typeof currentStatus
        );
        console.log(
          "Existing KYC full object:",
          JSON.stringify(existingKyc.toJSON(), null, 2)
        );

        if (currentStatus === "rejected") {
          // Allow resubmission for rejected KYC - will create a new submission
          console.log(
            "✅ KYC was rejected, allowing resubmission for:",
            body.fullName
          );
          // Continue to create new submission
        } else if (currentStatus === "pending") {
          console.log("❌ KYC is pending, blocking resubmission");
          return res.status(400).json({
            message:
              "KYC is already pending review. Please wait for admin approval.",
            status: existingKyc.status,
            submittedAt: existingKyc.submittedAt,
          });
        } else if (currentStatus === "approved") {
          console.log("❌ KYC is approved, blocking resubmission");
          return res.status(400).json({
            message: "KYC has already been approved. No resubmission needed.",
            status: existingKyc.status,
            submittedAt: existingKyc.submittedAt,
          });
        } else {
          // Unknown status - allow resubmission to be safe
          console.log(
            "⚠️ Unknown KYC status:",
            currentStatus,
            "- allowing resubmission"
          );
        }
      }

      // Create documents array with all uploaded files
      const documents = [];

      console.log(
        "📁 Processing uploaded files. Available file fields:",
        Object.keys(files)
      );

      // Legacy document fields
      if (files.docFront && files.docFront[0]) {
        documents.push({
          type: "Document Front",
          path: `/uploads/kyc/${path.basename(files.docFront[0].path)}`,
          originalName: files.docFront[0].originalname,
        });
        console.log("✅ Added Document Front:", files.docFront[0].originalname);
      }

      if (files.docBack && files.docBack[0]) {
        documents.push({
          type: "Document Back",
          path: `/uploads/kyc/${path.basename(files.docBack[0].path)}`,
          originalName: files.docBack[0].originalname,
        });
        console.log("✅ Added Document Back:", files.docBack[0].originalname);
      }

      if (files.selfie && files.selfie[0]) {
        documents.push({
          type: "Selfie",
          path: `/uploads/kyc/${path.basename(files.selfie[0].path)}`,
          originalName: files.selfie[0].originalname,
        });
        console.log("✅ Added Selfie:", files.selfie[0].originalname);
      }

      if (files.panCard && files.panCard[0]) {
        documents.push({
          type: "PAN Card",
          path: `/uploads/kyc/${path.basename(files.panCard[0].path)}`,
          originalName: files.panCard[0].originalname,
        });
        console.log("✅ Added PAN Card:", files.panCard[0].originalname);
      }

      if (files.aadharCard && files.aadharCard[0]) {
        documents.push({
          type: "Aadhar Card",
          path: `/uploads/kyc/${path.basename(files.aadharCard[0].path)}`,
          originalName: files.aadharCard[0].originalname,
        });
        console.log("✅ Added Aadhar Card:", files.aadharCard[0].originalname);
      }

      // New KYC document fields
      if (files.employeePhoto && files.employeePhoto[0]) {
        documents.push({
          type: "Employee Photo",
          path: `/uploads/kyc/${path.basename(files.employeePhoto[0].path)}`,
          originalName: files.employeePhoto[0].originalname,
        });
        console.log(
          "✅ Added Employee Photo:",
          files.employeePhoto[0].originalname
        );
      }

      if (files.aadhaar_front && files.aadhaar_front[0]) {
        documents.push({
          type: "Aadhaar Card - Front",
          path: `/uploads/kyc/${path.basename(files.aadhaar_front[0].path)}`,
          originalName: files.aadhaar_front[0].originalname,
        });
        console.log(
          "✅ Added Aadhaar Front:",
          files.aadhaar_front[0].originalname
        );
      }

      if (files.aadhaar_back && files.aadhaar_back[0]) {
        documents.push({
          type: "Aadhaar Card - Back",
          path: `/uploads/kyc/${path.basename(files.aadhaar_back[0].path)}`,
          originalName: files.aadhaar_back[0].originalname,
        });
        console.log(
          "✅ Added Aadhaar Back:",
          files.aadhaar_back[0].originalname
        );
      }

      if (files.salary_slip_month_1 && files.salary_slip_month_1[0]) {
        documents.push({
          type: "Salary Slip - Month 1",
          path: `/uploads/kyc/${path.basename(
            files.salary_slip_month_1[0].path
          )}`,
          originalName: files.salary_slip_month_1[0].originalname,
        });
        console.log(
          "✅ Added Salary Slip Month 1:",
          files.salary_slip_month_1[0].originalname
        );
      }

      if (files.salary_slip_month_2 && files.salary_slip_month_2[0]) {
        documents.push({
          type: "Salary Slip - Month 2",
          path: `/uploads/kyc/${path.basename(
            files.salary_slip_month_2[0].path
          )}`,
          originalName: files.salary_slip_month_2[0].originalname,
        });
        console.log(
          "✅ Added Salary Slip Month 2:",
          files.salary_slip_month_2[0].originalname
        );
      }

      if (files.salary_slip_month_3 && files.salary_slip_month_3[0]) {
        documents.push({
          type: "Salary Slip - Month 3",
          path: `/uploads/kyc/${path.basename(
            files.salary_slip_month_3[0].path
          )}`,
          originalName: files.salary_slip_month_3[0].originalname,
        });
        console.log(
          "✅ Added Salary Slip Month 3:",
          files.salary_slip_month_3[0].originalname
        );
      }

      if (files.bank_proof && files.bank_proof[0]) {
        documents.push({
          type: "Bank Proof (Cancelled Cheque/Passbook)",
          path: `/uploads/kyc/${path.basename(files.bank_proof[0].path)}`,
          originalName: files.bank_proof[0].originalname,
        });
        console.log("✅ Added Bank Proof:", files.bank_proof[0].originalname);
      }

      // Handle education documents (multiple files)
      if (
        files.education_documents &&
        Array.isArray(files.education_documents)
      ) {
        files.education_documents.forEach((file, index) => {
          documents.push({
            type: `Education Document ${index + 1}`,
            path: `/uploads/kyc/${path.basename(file.path)}`,
            originalName: file.originalname,
          });
          console.log(
            `✅ Added Education Document ${index + 1}:`,
            file.originalname
          );
        });
      }

      // Handle additional documents (legacy support)
      if (files.additionalDocs && Array.isArray(files.additionalDocs)) {
        files.additionalDocs.forEach((file, index) => {
          documents.push({
            type: `Additional Document ${index + 1}`,
            path: `/uploads/kyc/${path.basename(file.path)}`,
            originalName: file.originalname,
          });
          console.log(
            `✅ Added Additional Document ${index + 1}:`,
            file.originalname
          );
        });
      }

      console.log(
        `📦 Total documents processed: ${documents.length}`,
        documents.map((d) => d.type)
      );

      // Validate and correct employeeId before creating payload
      let finalEmployeeId = body.employeeId;

      if (
        !body.employeeId ||
        body.employeeId === "undefined" ||
        body.employeeId === "null" ||
        body.employeeId === "0"
      ) {
        // Try to find employee by fullName and get the correct employeeId
        let employee = await Employee.findOne({
          where: { name: body.fullName },
        });

        if (employee) {
          finalEmployeeId = employee.employeeId;
          console.log(
            `🔄 Auto-corrected employeeId for ${body.fullName}: ${body.employeeId} → ${finalEmployeeId}`
          );
        } else {
          // If employee doesn't exist, try to find by email
          employee = await Employee.findOne({
            where: { email: body.email },
          });

          if (employee) {
            finalEmployeeId = employee.employeeId;
            console.log(
              `🔄 Found employee by email for ${body.fullName}: ${finalEmployeeId}`
            );
          } else {
            // If still not found, use the user ID as employee ID (for users not in employee table)
            finalEmployeeId = body.employeeId || "USER_" + Date.now();
            console.log(
              `🔄 Using fallback employeeId for ${body.fullName}: ${finalEmployeeId}`
            );
          }
        }
      } else {
        // Verify the provided employeeId matches the employee name
        const employee = await Employee.findOne({
          where: { employeeId: body.employeeId },
        });

        if (
          !employee ||
          employee.name.toLowerCase() !== body.fullName.toLowerCase()
        ) {
          // Try to find employee by name and correct the employeeId
          const correctEmployee = await Employee.findOne({
            where: { name: body.fullName },
          });

          if (correctEmployee) {
            finalEmployeeId = correctEmployee.employeeId;
            console.log(
              `🔄 Auto-corrected employeeId mismatch for ${body.fullName}: ${body.employeeId} → ${finalEmployeeId}`
            );
          } else {
            return res.status(400).json({
              message: "Employee ID does not match employee name",
              error: "Employee ID and name mismatch",
            });
          }
        }
      }

      // Create comprehensive documents object with all KYC data
      const kycData = {
        documents: documents, // Array of uploaded document files
        personalInfo: {
          panNumber: body.panNumber || "",
          aadharNumber: body.aadharNumber || "",
          phoneNumber: body.phoneNumber || "",
        },
        emergencyContact: {
          name: body.emergencyContactName || "",
          phone: body.emergencyContactPhone || "",
          relation: body.emergencyContactRelation || "",
          address: body.emergencyContactAddress || "",
        },
        bankAccount: {
          bankName: body.bankName || "",
          bankBranch: body.bankBranch || "",
          accountNumber: body.accountNumber || "",
          ifscCode: body.ifscCode || "",
        },
      };

      const payload = {
        employeeId: finalEmployeeId,
        fullName: body.fullName,
        dob: body.dob,
        address: body.address,
        documentType: body.documentType,
        documentNumber: body.documentNumber,
        documents: JSON.stringify(kycData), // Store comprehensive KYC data as JSON string
        status: "pending",
        submittedAt: new Date(),
      };

      console.log("Creating KYC with corrected payload:", payload);

      const created = await Kyc.create(payload);
      res.status(201).json(created);
    } catch (error) {
      console.error("KYC submission error:", error);
      res
        .status(500)
        .json({ message: "Error submitting KYC", error: error.message });
    }
  }
);

// List all KYC requests (admin/manager) or check own status (employee)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // If email query parameter is provided, check KYC status for that email
    if (req.query.email) {
      const email = req.query.email.toLowerCase();

      // Get user email from User table (token contains user ID in 'sub')
      const isAdminOrManagerOrHR =
        req.user?.role === "admin" ||
        req.user?.role === "manager" ||
        req.user?.role === "hr";

      // If not admin/manager/hr, verify they're checking their own email
      if (!isAdminOrManagerOrHR) {
        if (!req.user?.sub) {
          console.log("❌ No user ID in token");
          return res.status(403).json({
            message: "Insufficient permissions. Authentication required.",
          });
        }

        console.log(
          "🔍 Checking permission - User ID from token:",
          req.user.sub,
          "Role:",
          req.user.role
        );
        const user = await User.findByPk(req.user.sub);

        if (!user) {
          console.log("❌ User not found for ID:", req.user.sub);
          return res
            .status(403)
            .json({ message: "Insufficient permissions. User not found." });
        }

        const userEmail = user.email?.toLowerCase();
        console.log(
          "📧 Checking permission - User email from DB:",
          userEmail,
          "Requested email:",
          email
        );

        // Check if the requested email matches the logged-in user's email
        if (!userEmail || userEmail !== email) {
          console.log(
            "❌ Permission denied - email mismatch. User:",
            userEmail,
            "Requested:",
            email
          );
          return res.status(403).json({
            message:
              "Insufficient permissions. You can only check your own KYC status.",
          });
        }

        console.log("✅ Permission granted - user checking own KYC status");
      } else {
        console.log("✅ Admin/Manager/HR access - allowing KYC status check");
      }

      // First, try to find employee by email
      const employee = await Employee.findOne({ where: { email } });

      let kycRequest = null;

      if (employee) {
        console.log(
          `Looking for KYC for employee: ${employee.name} (${employee.employeeId})`
        );

        // Find KYC request for this employee by employeeId (string field)
        kycRequest = await Kyc.findOne({
          where: {
            employeeId: employee.employeeId,
          },
          order: [["createdAt", "DESC"]],
        });

        // If not found by employeeId, try by name (fallback)
        if (!kycRequest) {
          console.log(
            `KYC not found by employeeId, trying by name: ${employee.name}`
          );
          kycRequest = await Kyc.findOne({
            where: {
              fullName: employee.name,
            },
            order: [["createdAt", "DESC"]],
          });
        }

        // If still not found, try by numeric ID (for backward compatibility)
        if (!kycRequest) {
          console.log(
            `KYC not found by name, trying by numeric ID: ${employee.id}`
          );
          kycRequest = await Kyc.findOne({
            where: {
              employeeId: employee.id.toString(),
            },
            order: [["createdAt", "DESC"]],
          });
        }
      }

      // If no KYC found by employeeId, try to find by fullName (for users not in employee table)
      if (!kycRequest) {
        // Extract name from email (e.g., "prabhat@company.com" -> "prabhat")
        const nameFromEmail = email.split("@")[0];

        kycRequest = await Kyc.findOne({
          where: {
            fullName: nameFromEmail,
          },
          order: [["createdAt", "DESC"]],
        });
      }

      if (!kycRequest) {
        console.log("❌ No KYC request found for email:", email);
        return res.json({
          status: "not_submitted",
          message: "No KYC request found",
        });
      }

      console.log("✅ KYC request found:", {
        id: kycRequest.id,
        status: kycRequest.status,
        fullName: kycRequest.fullName,
        employeeId: kycRequest.employeeId,
      });

      // Return KYC data including document numbers
      const kycData = {
        status: kycRequest.status,
        message: `KYC status: ${kycRequest.status}`,
        kycId: kycRequest.id,
        submittedAt: kycRequest.submittedAt,
        reviewedAt: kycRequest.reviewedAt,
        remarks: kycRequest.remarks,
        panNumber: kycRequest.panNumber || null,
        aadharNumber:
          kycRequest.documentNumber || kycRequest.aadharNumber || null,
        address: kycRequest.address || null,
        phoneNumber: kycRequest.phoneNumber || null,
        dob: kycRequest.dob || null,
      };

      return res.json(kycData);
    }

    // Otherwise, return all KYC requests (for admin/manager/hr only)
    // Check if user has admin/manager/hr role
    if (
      req.user?.role !== "admin" &&
      req.user?.role !== "manager" &&
      req.user?.role !== "hr"
    ) {
      return res.status(403).json({
        message:
          "Insufficient permissions. Admin, manager, or HR role required to list all KYC requests.",
      });
    }

    const list = await Kyc.findAll({
      order: [["id", "DESC"]],
      attributes: [
        "id",
        "employeeId",
        "fullName",
        "dob",
        "address",
        "documentType",
        "documentNumber",
        "documents",
        "status",
        "submittedAt",
        "reviewedAt",
        "reviewedBy",
        "remarks",
        "createdAt",
        "updatedAt",
      ],
    });

    // Parse documents JSON for each request and update employee ID with current RST format
    const formattedList = await Promise.all(
      list.map(async (item) => {
        const data = item.toJSON();

        // Try to find employee by employeeId (from KYC record) or by name
        let employee = null;

        // First, try to find by employeeId (match with emp_id or employeeId in Employee table)
        if (data.employeeId) {
          employee = await Employee.findOne({
            where: {
              [Op.or]: [
                { emp_id: data.employeeId },
                { employeeId: data.employeeId },
              ],
            },
            attributes: ["id", "emp_id", "employeeId", "email", "name"],
          });
        }

        // If not found by ID, try to find by name
        if (!employee && data.fullName) {
          employee = await Employee.findOne({
            where: {
              name: {
                [Op.iLike]: data.fullName,
              },
            },
            attributes: ["id", "emp_id", "employeeId", "email", "name"],
          });
        }

        // If employee found, use their current emp_id (RST format)
        if (employee && (employee.emp_id || employee.employeeId)) {
          // Prefer emp_id (RST format) over employeeId
          const newEmployeeId = employee.emp_id || employee.employeeId;
          if (newEmployeeId !== data.employeeId) {
            console.log(
              `✅ Updated employee ID for ${data.fullName}: ${data.employeeId} → ${newEmployeeId}`
            );
          }
          data.employeeId = newEmployeeId;
        }

        try {
          if (data.documents) {
            const parsed = JSON.parse(data.documents);
            console.log(`📋 Parsing documents for ${data.fullName}:`, {
              isArray: Array.isArray(parsed),
              hasDocuments: parsed.documents && Array.isArray(parsed.documents),
              documentCount: parsed.documents
                ? parsed.documents.length
                : Array.isArray(parsed)
                ? parsed.length
                : 0,
              documentTypes: parsed.documents
                ? parsed.documents.map((d) => d.type)
                : Array.isArray(parsed)
                ? parsed.map((d) => d.type)
                : [],
            });

            // Handle both formats: direct array or nested object with documents property
            if (Array.isArray(parsed)) {
              data.documents = parsed;
              console.log(
                `✅ Using direct array format for ${data.fullName}, ${parsed.length} documents`
              );
            } else if (parsed.documents && Array.isArray(parsed.documents)) {
              // Extract documents array from nested structure
              data.documents = parsed.documents;
              // Also preserve other data if needed
              if (parsed.personalInfo) data.personalInfo = parsed.personalInfo;
              if (parsed.emergencyContact)
                data.emergencyContact = parsed.emergencyContact;
              if (parsed.bankAccount) data.bankAccount = parsed.bankAccount;
              console.log(
                `✅ Extracted documents array from nested structure for ${data.fullName}, ${parsed.documents.length} documents`
              );
            } else {
              console.warn(
                `⚠️ Unexpected documents format for ${data.fullName}:`,
                typeof parsed
              );
              data.documents = [];
            }
          } else {
            console.warn(`⚠️ No documents field for ${data.fullName}`);
            data.documents = [];
          }
        } catch (e) {
          console.error(
            `❌ Error parsing documents JSON for ${data.fullName}:`,
            e
          );
          console.error(
            "Raw documents string:",
            data.documents?.substring(0, 200)
          );
          data.documents = [];
        }
        return data;
      })
    );

    res.json(formattedList);
  } catch (error) {
    console.error("Error fetching KYC list:", error);
    res.status(500).json({ message: "Error fetching KYC requests" });
  }
});

// Get rejected documents for employee - MUST be before /:id route
router.get(
  "/rejected-documents",
  authenticateToken,
  async (req, res) => {
    try {
      console.log("📋 GET /rejected-documents - Request received");
      console.log("📋 User from token:", req.user);
      
      // Get user email from User table using the user ID from token
      const userId = req.user?.sub || req.user?.id;
      if (!userId) {
        console.error("❌ No user ID in token:", req.user);
        return res.status(401).json({ message: "User ID not found in token" });
      }

      console.log("📋 Looking up user with ID:", userId);
      const user = await User.findByPk(userId);
      if (!user) {
        console.error("❌ User not found for ID:", userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log("📋 User found:", user.email, "Role:", user.role);
      const employee = await Employee.findOne({
        where: { email: user.email },
      });

      if (!employee) {
        console.warn("⚠️ Employee not found for email:", user.email);
        // Return empty array instead of error - user might not be in employee table yet
        return res.json({ rejectedDocuments: [] });
      }

      console.log("📋 Employee found:", employee.name, "Employee ID:", employee.emp_id || employee.employeeId);

      // Try to find KYC by employeeId (emp_id) first, then by employeeId field
      let kyc = await Kyc.findOne({
        where: { employeeId: employee.emp_id || employee.employeeId },
        order: [['createdAt', 'DESC']],
      });

      // If not found, try by employee name as fallback
      if (!kyc && employee.name) {
        kyc = await Kyc.findOne({
          where: { fullName: employee.name },
          order: [['createdAt', 'DESC']],
        });
      }

      if (!kyc) {
        console.log("📋 No KYC found for employee");
        return res.json({ rejectedDocuments: [] });
      }

      console.log("📋 KYC found:", kyc.id, "Status:", kyc.status);

      const rejectedDocuments = [];

      const documentTypes = [
        { key: 'salary_slip_month_1', name: 'Salary Slip - Month 1' },
        { key: 'salary_slip_month_2', name: 'Salary Slip - Month 2' },
        { key: 'salary_slip_month_3', name: 'Salary Slip - Month 3' },
        { key: 'bank_proof', name: 'Bank Proof' },
        { key: 'aadhaar_front', name: 'Aadhaar Card - Front' },
        { key: 'aadhaar_back', name: 'Aadhaar Card - Back' },
        { key: 'employee_photo', name: 'Employee Photo' },
        { key: 'pan_card', name: 'PAN Card' },
      ];

      documentTypes.forEach(({ key, name }) => {
        const statusField = `${key}_status`;
        const remarkField = `${key}_remark`;
        if (kyc[statusField] === 'rejected') {
          rejectedDocuments.push({
            documentType: key,
            documentName: name,
            remark: kyc[remarkField],
            status: 'rejected',
          });
        }
      });

      if (kyc.education_documents_status) {
        try {
          const statuses = JSON.parse(kyc.education_documents_status);
          const remarks = kyc.education_documents_remark
            ? JSON.parse(kyc.education_documents_remark)
            : [];

          if (Array.isArray(statuses)) {
            statuses.forEach((status, index) => {
              if (status === 'rejected') {
                rejectedDocuments.push({
                  documentType: 'education',
                  documentIndex: index,
                  documentName: `Education Document ${index + 1}`,
                  remark: remarks[index] || null,
                  status: 'rejected',
                });
              }
            });
          }
        } catch (e) {
          console.error('Error parsing education documents:', e);
        }
      }

      console.log("📋 Returning", rejectedDocuments.length, "rejected documents");
      res.json({ rejectedDocuments });
    } catch (error) {
      console.error("Error fetching rejected documents:", error);
      res.status(500).json({
        message: "Error fetching rejected documents",
        error: error.message,
      });
    }
  }
);

// Get by id (admin/manager/hr)
router.get(
  "/:id",
  authenticateToken,
  requireRole(["admin", "manager", "hr"]),
  async (req, res) => {
    try {
      const item = await Kyc.findByPk(req.params.id);
      if (!item) return res.status(404).json({ message: "Not found" });

      const data = item.toJSON();
      try {
        if (data.documents) {
          const parsed = JSON.parse(data.documents);
          console.log(
            `📋 Parsing documents for KYC ID ${data.id} (${data.fullName}):`,
            {
              isArray: Array.isArray(parsed),
              hasDocuments: parsed.documents && Array.isArray(parsed.documents),
              documentCount: parsed.documents
                ? parsed.documents.length
                : Array.isArray(parsed)
                ? parsed.length
                : 0,
              documentTypes: parsed.documents
                ? parsed.documents.map((d) => d.type)
                : Array.isArray(parsed)
                ? parsed.map((d) => d.type)
                : [],
            }
          );

          // Handle both formats: direct array or nested object with documents property
          if (Array.isArray(parsed)) {
            data.documents = parsed;
            console.log(
              `✅ Using direct array format, ${parsed.length} documents`
            );
          } else if (parsed.documents && Array.isArray(parsed.documents)) {
            // Extract documents array from nested structure
            data.documents = parsed.documents;
            // Also preserve other data if needed
            if (parsed.personalInfo) data.personalInfo = parsed.personalInfo;
            if (parsed.emergencyContact)
              data.emergencyContact = parsed.emergencyContact;
            if (parsed.bankAccount) data.bankAccount = parsed.bankAccount;
            console.log(
              `✅ Extracted documents array from nested structure, ${parsed.documents.length} documents`
            );
          } else {
            console.warn(`⚠️ Unexpected documents format:`, typeof parsed);
            data.documents = [];
          }
        } else {
          console.warn(`⚠️ No documents field for KYC ID ${data.id}`);
          data.documents = [];
        }
      } catch (e) {
        console.error(
          `❌ Error parsing documents JSON for KYC ID ${data.id}:`,
          e
        );
        console.error(
          "Raw documents string:",
          data.documents?.substring(0, 200)
        );
        data.documents = [];
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching KYC by ID:", error);
      res.status(500).json({ message: "Error fetching KYC request" });
    }
  }
);

// Review (approve/reject) - requires admin/manager/hr role
router.post(
  "/:id/review",
  authenticateToken,
  requireRole(["admin", "manager", "hr"]),
  async (req, res) => {
    try {
      console.log("=== KYC REVIEW REQUEST ===");
      console.log("ID:", req.params.id);
      console.log("Body:", req.body);

      const { status, reviewedBy, remarks } = req.body;
      const item = await Kyc.findByPk(req.params.id);

      if (!item) {
        console.log("KYC item not found for ID:", req.params.id);
        return res.status(404).json({ message: "Not found" });
      }

      console.log("Found KYC item:", item.toJSON());
      console.log("Current status:", item.status);
      console.log("New status:", status);

      item.status = status;
      item.reviewedBy = reviewedBy || "admin";
      item.reviewedAt = new Date();
      item.remarks = remarks || "";

      console.log("Saving KYC item...");
      await item.save();
      console.log("KYC item saved successfully!");
      console.log("Updated item:", item.toJSON());

      // If KYC is approved, update employee status and send email
      if (status === "approved") {
        try {
          console.log("Processing approval...");
          console.log("Looking for employee with KYC fullName:", item.fullName);
          console.log("KYC item email:", item.email);

          // Find the employee by multiple criteria
          let employee = await Employee.findOne({
            where: {
              name: item.fullName,
            },
          });
          console.log("Employee found by exact name match:", !!employee);

          // If not found by exact name, try by email (if we have it)
          if (!employee && item.email) {
            console.log("Trying to find employee by email:", item.email);
            employee = await Employee.findOne({
              where: {
                email: item.email,
              },
            });
            console.log("Employee found by email match:", !!employee);
          }

          // If still not found, try case-insensitive name match
          if (!employee) {
            console.log(
              "Trying case-insensitive name match for:",
              item.fullName
            );
            employee = await Employee.findOne({
              where: {
                name: {
                  [Op.iLike]: item.fullName,
                },
              },
            });
            console.log(
              "Employee found by case-insensitive name match:",
              !!employee
            );
          }

          if (employee) {
            console.log("Found employee:", employee.toJSON());

            // Use existing emp_id if it's in RST format, otherwise generate a new one
            let permanentEmployeeId = employee.emp_id || employee.employeeId;

            // If employee doesn't have an RST format ID, generate one
            if (
              !permanentEmployeeId ||
              !permanentEmployeeId.match(/^RST\d+$/)
            ) {
              permanentEmployeeId = await generatePermanentEmployeeId();

              // Update employee with permanent ID and approved KYC status
              await employee.update({
                emp_id: permanentEmployeeId,
                employeeId: permanentEmployeeId, // Also update employeeId field for backward compatibility
                kycStatus: "approved",
              });
            } else {
              // Employee already has RST format ID, just update KYC status
              await employee.update({
                kycStatus: "approved",
              });
            }

            // Check if employee is active AND can access system before sending email
            // The sendEmail function will also validate this, but we check here to avoid unnecessary processing
            if (!employee.is_active || !employee.can_access_system) {
              const reason = !employee.is_active
                ? "inactive"
                : "cannot access system";
              console.log(
                `⏭️ Skipping KYC approval email for employee ${employee.email}: ${reason}`
              );
            } else {
              // Get user's current password (they set it during first login)
              const user = await User.findOne({
                where: { email: employee.email },
              });

              // Double-check user is active
              if (user && user.active) {
                const userPassword = user ? "Your set password" : "temp123"; // We can't retrieve hashed password

                // Send approval email - sendEmail will validate again
                const emailData = {
                  fullName: employee.name,
                  email: employee.email,
                  permanentEmployeeId: permanentEmployeeId,
                  employeeId: permanentEmployeeId, // Also include as employeeId for consistency
                  password: userPassword,
                };

                const emailResult = await sendKycApprovedEmail(emailData);
                if (emailResult.success) {
                  console.log(
                    `✅ KYC approval email sent to active employee: ${employee.email}`
                  );
                } else if (emailResult.blocked) {
                  console.log(
                    `🚫 KYC approval email blocked for ${employee.email}: ${emailResult.reason}`
                  );
                }
              } else {
                console.log(
                  `⏭️ Skipping KYC approval email for inactive user: ${employee.email}`
                );
              }
            }

            // Update KYC record's employeeId to match the employee's current RST format ID
            await item.update({
              employeeId: permanentEmployeeId,
            });

            console.log(
              `KYC approved for employee ${employee.name}. Employee ID: ${permanentEmployeeId}`
            );
          } else {
            console.log("No employee found with name:", item.fullName);
            // Try to find by email if name doesn't match
            const user = await User.findOne({
              where: { email: item.fullName },
            });
            if (user) {
              console.log("Found user by email, updating KYC status...");
              // Update user to indicate KYC is approved
              await user.update({ kycApproved: true });
            }
          }
        } catch (emailError) {
          console.error("Error sending KYC approval email:", emailError);
          // Don't fail the review if email fails
        }
      }

      console.log("=== KYC REVIEW COMPLETE ===");
      res.json(item);
    } catch (error) {
      console.error("Error reviewing KYC:", error);
      res.status(500).json({ message: "Error reviewing KYC request" });
    }
  }
);

// Helper function to calculate overall KYC status based on document statuses
const calculateOverallKycStatus = (kyc) => {
  const documentStatusFields = [
    'salary_slip_month_1_status',
    'salary_slip_month_2_status',
    'salary_slip_month_3_status',
    'bank_proof_status',
    'aadhaar_front_status',
    'aadhaar_back_status',
    'employee_photo_status',
    'pan_card_status',
  ];

  const statuses = documentStatusFields
    .map(field => kyc[field])
    .filter(status => status && status !== 'pending');

  // Check education documents status (JSON array)
  let educationStatuses = [];
  if (kyc.education_documents_status) {
    try {
      educationStatuses = JSON.parse(kyc.education_documents_status);
      if (!Array.isArray(educationStatuses)) {
        educationStatuses = [educationStatuses];
      }
    } catch (e) {
      if (kyc.education_documents_status !== 'pending') {
        statuses.push(kyc.education_documents_status);
      }
    }
  }

  statuses.push(...educationStatuses.filter(s => s && s !== 'pending'));

  if (statuses.length === 0) {
    return 'pending';
  }

  const hasRejected = statuses.some(s => s === 'rejected');
  const hasResubmitted = statuses.some(s => s === 'resubmitted');
  const allApproved = statuses.every(s => s === 'approved');

  if (hasRejected) {
    return 'partially_rejected';
  }
  if (hasResubmitted) {
    return 'pending';
  }
  if (allApproved) {
    return 'approved';
  }

  return 'pending';
};

// Review specific document (approve/reject with remarks)
router.post(
  "/:id/document/:documentType/review",
  authenticateToken,
  requireRole(["admin", "manager", "hr"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { documentType } = req.params;
      const { action, remark } = req.body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
      }

      if (action === 'reject' && !remark?.trim()) {
        return res.status(400).json({ message: "Remark is mandatory when rejecting a document" });
      }

      const kyc = await Kyc.findByPk(id);
      if (!kyc) {
        return res.status(404).json({ message: "KYC record not found" });
      }

      const documentFieldMap = {
        'salary_slip_month_1': { status: 'salary_slip_month_1_status', remark: 'salary_slip_month_1_remark' },
        'salary_slip_month_2': { status: 'salary_slip_month_2_status', remark: 'salary_slip_month_2_remark' },
        'salary_slip_month_3': { status: 'salary_slip_month_3_status', remark: 'salary_slip_month_3_remark' },
        'bank_proof': { status: 'bank_proof_status', remark: 'bank_proof_remark' },
        'aadhaar_front': { status: 'aadhaar_front_status', remark: 'aadhaar_front_remark' },
        'aadhaar_back': { status: 'aadhaar_back_status', remark: 'aadhaar_back_remark' },
        'employee_photo': { status: 'employee_photo_status', remark: 'employee_photo_remark' },
        'pan_card': { status: 'pan_card_status', remark: 'pan_card_remark' },
      };

      const fields = documentFieldMap[documentType];
      if (!fields) {
        return res.status(400).json({ message: `Invalid document type: ${documentType}` });
      }

      kyc[fields.status] = action === 'approve' ? 'approved' : 'rejected';
      kyc[fields.remark] = action === 'reject' ? (remark || '') : null;

      kyc.status = calculateOverallKycStatus(kyc);
      kyc.reviewedAt = new Date();
      kyc.reviewedBy = req.user?.email || req.user?.name || 'admin';

      await kyc.save();

      // Create notification for employee if document is rejected
      if (action === 'reject') {
        try {
          const { Notification } = await import("../models/Notification.js");
          
          // Find employee by employeeId (emp_id) from KYC record
          let employee = null;
          if (kyc.employeeId) {
            employee = await Employee.findOne({
              where: {
                [Op.or]: [
                  { emp_id: kyc.employeeId },
                  { employeeId: kyc.employeeId },
                ],
              },
            });
          }
          
          // If not found by employeeId, try by email
          if (!employee && kyc.email) {
            employee = await Employee.findOne({
              where: { email: kyc.email },
            });
          }

          if (employee) {
            // Find User to get userId for notification
            const user = await User.findOne({
              where: { email: employee.email },
            });

            if (user) {
              const documentName = documentType
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              await Notification.create({
                userId: user.id,
                userEmail: employee.email,
                type: 'error', // Use 'error' type for rejections
                title: 'KYC Document Rejected',
                message: `Your ${documentName} was rejected. Remark: ${remark}. Please re-upload.`,
                link: '/profile',
                isRead: false,
              });

              const io = req.app.get('io');
              if (io) {
                io.to(`user_${user.id}`).emit('new-notification', {
                  userId: user.id,
                  notification: {
                    type: 'error',
                    title: 'KYC Document Rejected',
                    message: `Your ${documentName} was rejected. Remark: ${remark}. Please re-upload.`,
                  },
                });
              }
              
              console.log(`✅ Notification created for employee: ${employee.email}`);
            } else {
              console.warn(`⚠️ User not found for employee: ${employee.email}`);
            }
          } else {
            console.warn(`⚠️ Employee not found for KYC: employeeId=${kyc.employeeId}, email=${kyc.email}`);
          }
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }

      res.json({
        message: `Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        kyc: kyc.toJSON(),
      });
    } catch (error) {
      console.error("Error reviewing document:", error);
      res.status(500).json({
        message: "Error reviewing document",
        error: error.message,
      });
    }
  }
);

// Review education document (array-based)
router.post(
  "/:id/document/education/:index/review",
  authenticateToken,
  requireRole(["admin", "manager", "hr"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const index = parseInt(req.params.index);
      const { action, remark } = req.body;

      if (isNaN(index) || index < 0) {
        return res.status(400).json({ message: "Invalid education document index" });
      }

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
      }

      if (action === 'reject' && !remark?.trim()) {
        return res.status(400).json({ message: "Remark is mandatory when rejecting a document" });
      }

      const kyc = await Kyc.findByPk(id);
      if (!kyc) {
        return res.status(404).json({ message: "KYC record not found" });
      }

      let statuses = [];
      let remarks = [];

      if (kyc.education_documents_status) {
        try {
          statuses = JSON.parse(kyc.education_documents_status);
          if (!Array.isArray(statuses)) {
            statuses = [statuses];
          }
        } catch (e) {
          statuses = [];
        }
      }

      if (kyc.education_documents_remark) {
        try {
          remarks = JSON.parse(kyc.education_documents_remark);
          if (!Array.isArray(remarks)) {
            remarks = [remarks];
          }
        } catch (e) {
          remarks = [];
        }
      }

      while (statuses.length <= index) {
        statuses.push('pending');
      }
      while (remarks.length <= index) {
        remarks.push(null);
      }

      statuses[index] = action === 'approve' ? 'approved' : 'rejected';
      remarks[index] = action === 'reject' ? (remark || '') : null;

      kyc.education_documents_status = JSON.stringify(statuses);
      kyc.education_documents_remark = JSON.stringify(remarks);

      kyc.status = calculateOverallKycStatus(kyc);
      kyc.reviewedAt = new Date();
      kyc.reviewedBy = req.user?.email || req.user?.name || 'admin';

      await kyc.save();

      if (action === 'reject') {
        try {
          const { Notification } = await import("../models/Notification.js");
          
          // Find employee by employeeId (emp_id) from KYC record
          let employee = null;
          if (kyc.employeeId) {
            employee = await Employee.findOne({
              where: {
                [Op.or]: [
                  { emp_id: kyc.employeeId },
                  { employeeId: kyc.employeeId },
                ],
              },
            });
          }
          
          // If not found by employeeId, try by email
          if (!employee && kyc.email) {
            employee = await Employee.findOne({
              where: { email: kyc.email },
            });
          }

          if (employee) {
            // Find User to get userId for notification
            const user = await User.findOne({
              where: { email: employee.email },
            });

            if (user) {
              await Notification.create({
                userId: user.id,
                userEmail: employee.email,
                type: 'error',
                title: 'KYC Document Rejected',
                message: `Your Education Document ${index + 1} was rejected. Remark: ${remark}. Please re-upload.`,
                link: '/profile',
                isRead: false,
              });

              const io = req.app.get('io');
              if (io) {
                io.to(`user_${user.id}`).emit('new-notification', {
                  userId: user.id,
                  notification: {
                    type: 'error',
                    title: 'KYC Document Rejected',
                    message: `Your Education Document ${index + 1} was rejected. Remark: ${remark}. Please re-upload.`,
                  },
                });
              }
              
              console.log(`✅ Notification created for employee: ${employee.email}`);
            }
          }
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }

      res.json({
        message: `Education document ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        kyc: kyc.toJSON(),
      });
    } catch (error) {
      console.error("Error reviewing education document:", error);
      res.status(500).json({
        message: "Error reviewing education document",
        error: error.message,
      });
    }
  }
);

// Re-upload rejected document (employee)
router.post(
  "/:id/document/:documentType/reupload",
  authenticateToken,
  upload.fields([{ name: 'file', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { documentType } = req.params;
      
      console.log("📤 Re-upload request:", { id, documentType, body: req.body, files: req.files });

      const kyc = await Kyc.findByPk(id);
      if (!kyc) {
        console.error("❌ KYC not found for ID:", id);
        return res.status(404).json({ message: "KYC record not found" });
      }

      // Check permissions - get user email from User table
      if (req.user?.role !== 'admin' && req.user?.role !== 'hr' && req.user?.role !== 'manager') {
        const userId = req.user?.sub || req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User ID not found in token" });
        }
        
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const employee = await Employee.findOne({
          where: { email: user.email },
        });
        if (!employee || (kyc.employeeId !== employee.emp_id && kyc.employeeId !== employee.employeeId)) {
          return res.status(403).json({ message: "You don't have permission to re-upload this document" });
        }
      }

      // Handle education documents separately
      if (documentType === 'education_documents') {
        // Get documentIndex from body (multer parses form fields)
        const documentIndex = req.body.documentIndex ? parseInt(req.body.documentIndex, 10) : null;
        
        console.log("📚 Education document re-upload:", { documentIndex, body: req.body });
        
        if (documentIndex === null || isNaN(documentIndex) || documentIndex < 0) {
          console.error("❌ Invalid document index:", documentIndex);
          return res.status(400).json({ message: "Document index is required for education documents" });
        }

        // Check if education document at this index is rejected
        let educationStatuses = [];
        if (kyc.education_documents_status) {
          try {
            educationStatuses = JSON.parse(kyc.education_documents_status);
            if (!Array.isArray(educationStatuses)) {
              educationStatuses = [educationStatuses];
            }
          } catch (e) {
            educationStatuses = [];
          }
        }

        if (documentIndex >= educationStatuses.length || educationStatuses[documentIndex] !== 'rejected') {
          return res.status(400).json({ message: "This education document is not rejected or index is invalid" });
        }

        if (!req.files || !req.files.file || !req.files.file[0]) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const uploadedFile = req.files.file[0];
        const newFilePath = `/uploads/kyc/${path.basename(uploadedFile.path)}`;

        // Parse documents JSON
        let documents = {};
        if (kyc.documents) {
          try {
            documents = JSON.parse(kyc.documents);
            if (!documents.education_documents || !Array.isArray(documents.education_documents)) {
              documents.education_documents = [];
            }
          } catch (e) {
            documents = { education_documents: [] };
          }
        } else {
          documents = { education_documents: [] };
        }

        // Update the specific education document
        if (documentIndex < documents.education_documents.length) {
          const oldPath = path.join(process.cwd(), documents.education_documents[documentIndex].path);
          if (fs.existsSync(oldPath)) {
            try {
              fs.unlinkSync(oldPath);
            } catch (e) {
              console.warn("Could not delete old file:", e);
            }
          }
          documents.education_documents[documentIndex] = {
            type: 'Educational Certificate',
            path: newFilePath,
            originalName: uploadedFile.originalname,
          };
        } else {
          // Add new document if index is out of bounds
          documents.education_documents.push({
            type: 'Educational Certificate',
            path: newFilePath,
            originalName: uploadedFile.originalname,
          });
        }

        // Update status to resubmitted
        educationStatuses[documentIndex] = 'resubmitted';
        kyc.education_documents_status = JSON.stringify(educationStatuses);
        kyc.education_documents_remark = JSON.stringify(
          (() => {
            let remarks = [];
            if (kyc.education_documents_remark) {
              try {
                remarks = JSON.parse(kyc.education_documents_remark);
                if (!Array.isArray(remarks)) {
                  remarks = [remarks];
                }
              } catch (e) {
                remarks = [];
              }
            }
            while (remarks.length <= documentIndex) {
              remarks.push(null);
            }
            remarks[documentIndex] = null; // Clear remark on resubmission
            return remarks;
          })()
        );

        kyc.documents = JSON.stringify(documents);
        kyc.status = calculateOverallKycStatus(kyc);
        await kyc.save();

        return res.json({
          message: "Education document re-uploaded successfully. Status changed to pending review.",
          kyc: kyc.toJSON(),
        });
      }

      // Handle regular documents
      const documentFieldMap = {
        'salary_slip_month_1': { status: 'salary_slip_month_1_status', remark: 'salary_slip_month_1_remark' },
        'salary_slip_month_2': { status: 'salary_slip_month_2_status', remark: 'salary_slip_month_2_remark' },
        'salary_slip_month_3': { status: 'salary_slip_month_3_status', remark: 'salary_slip_month_3_remark' },
        'bank_proof': { status: 'bank_proof_status', remark: 'bank_proof_remark' },
        'aadhaar_front': { status: 'aadhaar_front_status', remark: 'aadhaar_front_remark' },
        'aadhaar_back': { status: 'aadhaar_back_status', remark: 'aadhaar_back_remark' },
        'employee_photo': { status: 'employee_photo_status', remark: 'employee_photo_remark' },
        'pan_card': { status: 'pan_card_status', remark: 'pan_card_remark' },
      };

      const fields = documentFieldMap[documentType];
      if (!fields) {
        return res.status(400).json({ message: `Invalid document type: ${documentType}` });
      }

      if (kyc[fields.status] !== 'rejected') {
        return res.status(400).json({ message: "This document is not rejected. Cannot re-upload." });
      }

      if (!req.files || !req.files.file || !req.files.file[0]) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const uploadedFile = req.files.file[0];
      const newFilePath = `/uploads/kyc/${path.basename(uploadedFile.path)}`;

      // Parse documents - handle both old format (array) and new format (object)
      let documents = [];
      let documentsObj = {};
      if (kyc.documents) {
        try {
          const parsed = JSON.parse(kyc.documents);
          if (Array.isArray(parsed)) {
            documents = parsed;
          } else if (parsed.documents && Array.isArray(parsed.documents)) {
            documents = parsed.documents;
            documentsObj = parsed;
          } else if (parsed.education_documents) {
            documentsObj = parsed;
            documents = [];
          } else {
            documents = [];
          }
        } catch (e) {
          console.error("Error parsing documents:", e);
          documents = [];
        }
      }

      const docTypeMap = {
        'salary_slip_month_1': 'Salary Slip - Month 1',
        'salary_slip_month_2': 'Salary Slip - Month 2',
        'salary_slip_month_3': 'Salary Slip - Month 3',
        'bank_proof': 'Bank Proof (Cancelled Cheque/Passbook)',
        'aadhaar_front': 'Aadhaar Card - Front',
        'aadhaar_back': 'Aadhaar Card - Back',
        'employee_photo': 'Employee Photo',
        'pan_card': 'PAN Card',
      };

      const docTypeName = docTypeMap[documentType];
      
      // Find document in array or object structure
      let docIndex = -1;
      if (Array.isArray(documents)) {
        docIndex = documents.findIndex(d => d.type === docTypeName);
      } else if (documentsObj && documentsObj.documents && Array.isArray(documentsObj.documents)) {
        docIndex = documentsObj.documents.findIndex(d => d.type === docTypeName);
        documents = documentsObj.documents;
      }

      if (docIndex >= 0) {
        const oldPath = path.join(process.cwd(), documents[docIndex].path);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.warn("Could not delete old file:", e);
          }
        }
        documents[docIndex] = {
          type: docTypeName,
          path: newFilePath,
          originalName: uploadedFile.originalname,
        };
      } else {
        documents.push({
          type: docTypeName,
          path: newFilePath,
          originalName: uploadedFile.originalname,
        });
      }

      // Save documents in proper structure
      if (documentsObj && Object.keys(documentsObj).length > 0) {
        documentsObj.documents = documents;
        kyc.documents = JSON.stringify(documentsObj);
      } else {
        kyc.documents = JSON.stringify(documents);
      }
      kyc[fields.status] = 'resubmitted';
      kyc[fields.remark] = null;
      kyc.status = calculateOverallKycStatus(kyc);

      await kyc.save();

      res.json({
        message: "Document re-uploaded successfully. Status changed to pending review.",
        kyc: kyc.toJSON(),
      });
    } catch (error) {
      console.error("Error re-uploading document:", error);
      res.status(500).json({
        message: "Error re-uploading document",
        error: error.message,
      });
    }
  }
);

// Get file by path (secure file serving)
router.get("/file/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(kycDir, filename);

  // Security check - ensure file exists and is within uploads directory
  if (!fs.existsSync(filePath) || !filePath.startsWith(kycDir)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.sendFile(filePath);
});

// Delete KYC record (admin/manager/hr)
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin", "manager", "hr"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Find the KYC record
      const kycRecord = await Kyc.findByPk(id);
      if (!kycRecord) {
        return res.status(404).json({ message: "KYC record not found" });
      }

      // Delete associated files
      if (kycRecord.documents && kycRecord.documents.length > 0) {
        for (const doc of kycRecord.documents) {
          if (doc.path) {
            const filePath = path.join(process.cwd(), doc.path);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        }
      }

      // Delete the KYC record
      await kycRecord.destroy();

      res.json({ message: "KYC record deleted successfully" });
    } catch (error) {
      console.error("Error deleting KYC record:", error);
      res
        .status(500)
        .json({ message: "Error deleting KYC record", error: error.message });
    }
  }
);

export default router;
