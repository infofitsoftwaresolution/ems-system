import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Setup upload directory
const uploadDir = path.resolve(process.cwd(), "uploads");
const documentsDir = path.join(uploadDir, "documents");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(documentsDir)) fs.mkdirSync(documentsDir, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, documentsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]/gi, "_");
    const timestamp = Date.now();
    cb(null, `${timestamp}_${base}${ext}`);
  },
});

// Allowed file types
const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

// File filter
const fileFilter = (req, file, cb) => {
  const normalizedMimeType = file.mimetype?.toLowerCase();
  const ext = path.extname(file.originalname || "").toLowerCase();

  if (
    allowedMimeTypes.some((allowed) => allowed.toLowerCase() === normalizedMimeType) ||
    allowedExtensions.includes(ext)
  ) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Invalid file type: ${file.mimetype || "unknown"}. Allowed types: PDF, JPG, JPEG, PNG, WebP`
    )
  );
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * POST /api/documents/upload
 * Upload a single document file
 */
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const fileUrl = `/uploads/documents/${path.basename(req.file.path)}`;
      
      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          path: req.file.path,
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading file",
        error: error.message,
      });
    }
  }
);

/**
 * POST /api/documents/upload-multiple
 * Upload multiple document files
 */
router.post(
  "/upload-multiple",
  authenticateToken,
  upload.array("files", 10), // Max 10 files
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadedFiles = req.files.map((file) => ({
        url: `/uploads/documents/${path.basename(file.path)}`,
        path: file.path,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        data: uploadedFiles,
      });
    } catch (error) {
      console.error("Multiple document upload error:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading files",
        error: error.message,
      });
    }
  }
);

export default router;

