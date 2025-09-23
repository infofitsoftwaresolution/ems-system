import { Router } from "express";
import { KycController } from "../controllers/kycController.js";

const router = Router();

// Setup multer for file uploads
const upload = KycController.setupMulter();

// Submit KYC (no authentication required for submission)
router.post(
  "/",
  upload.fields([
    { name: "docFront", maxCount: 1 },
    { name: "docBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "additionalDocs", maxCount: 5 }, // Allow multiple additional documents
  ]),
  KycController.submitKyc
);

// List all KYC requests (admin/manager)
router.get("/", KycController.getAllKycRequests);

// Get KYC by ID
router.get("/:id", KycController.getKycById);

// Review (approve/reject) - requires authentication
router.post("/:id/review", KycController.reviewKyc);

// Get file by path (secure file serving)
router.get("/file/:filename", KycController.getKycFile);

// Delete KYC record (admin only)
router.delete("/:id", KycController.deleteKyc);

export default router;
