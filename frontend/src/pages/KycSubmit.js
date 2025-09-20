import React, { useState, useEffect } from "react";
import { apiClient, kycService } from "../services/api";
import toast from "react-hot-toast";
import "./KycSubmit.css";

const KycSubmit = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [form, setForm] = useState({
    employeeId: user.id ? `EMP${user.id}` : "",
    fullName: "SHIVAM", // Default name that matches employee record
    phoneNumber: "+91 9876543210", // Default phone number
    dob: "",
    address: "",
    documentType: "aadhaar",
    documentNumber: "",
    docFrontUrl: "",
    docBackUrl: "",
    selfieUrl: "",
    docFrontFile: null,
    docBackFile: null,
    selfieFile: null,
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [existingKyc, setExistingKyc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [previewUrls, setPreviewUrls] = useState({
    docFront: null,
    docBack: null,
    selfie: null,
  });
  const [submittedDocuments, setSubmittedDocuments] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // If document type changes, also clear document number validation
    if (name === "documentType" && validationErrors.documentNumber) {
      setValidationErrors((prev) => ({ ...prev, documentNumber: "" }));
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = {};

    // Full Name validation
    if (!form.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(form.fullName.trim())) {
      errors.fullName = "Full name can only contain letters and spaces";
    }

    // Date of Birth validation
    if (!form.dob) {
      errors.dob = "Date of birth is required";
    } else {
      const dob = new Date(form.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        errors.dob = "You must be at least 18 years old";
      } else if (age > 100) {
        errors.dob = "Please enter a valid date of birth";
      } else if (dob > today) {
        errors.dob = "Date of birth cannot be in the future";
      }
    }

    // Phone number validation
    if (!form.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (
      !/^[+]?[1-9][\d]{0,15}$/.test(form.phoneNumber.replace(/\s/g, ""))
    ) {
      errors.phoneNumber = "Please enter a valid phone number";
    }

    // Address validation
    if (!form.address.trim()) {
      errors.address = "Address is required";
    } else if (form.address.trim().length < 10) {
      errors.address = "Address must be at least 10 characters";
    }

    // Document Number validation based on document type
    if (!form.documentNumber.trim()) {
      errors.documentNumber = "Document number is required";
    } else {
      const docNumber = form.documentNumber.trim().toUpperCase();

      switch (form.documentType) {
        case "aadhaar":
          if (!/^\d{12}$/.test(docNumber)) {
            errors.documentNumber = "Aadhaar number must be 12 digits";
          }
          break;
        case "pan":
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(docNumber)) {
            errors.documentNumber = "PAN must be in format: ABCDE1234F";
          }
          break;
        case "passport":
          if (!/^[A-Z]{1}[0-9]{7}$/.test(docNumber)) {
            errors.documentNumber =
              "Passport number must be 1 letter followed by 7 digits";
          }
          break;
        case "driver_license":
          if (docNumber.length < 8 || docNumber.length > 20) {
            errors.documentNumber =
              "Driver license number must be 8-20 characters";
          }
          break;
        default:
          if (docNumber.length < 5) {
            errors.documentNumber =
              "Document number must be at least 5 characters";
          }
      }
    }

    // File validation
    if (!form.docFrontFile) {
      errors.docFrontFile = "Front document is required";
    } else {
      const file = form.docFrontFile;
      const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        errors.docFrontFile =
          "File type not supported. Use PDF, JPG, PNG, DOC, or DOCX";
      } else if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        errors.docFrontFile = "File size must be less than 5MB";
      }
    }

    if (!form.selfieFile) {
      errors.selfieFile = "Selfie is required";
    } else {
      const file = form.selfieFile;
      const allowedTypes = [".jpg", ".jpeg", ".png"];
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        errors.selfieFile = "Only JPG and PNG files are allowed for selfie";
      } else if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        errors.selfieFile = "Selfie file size must be less than 2MB";
      }
    }

    // Optional back document validation
    if (form.docBackFile) {
      const file = form.docBackFile;
      const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        errors.docBackFile =
          "File type not supported. Use PDF, JPG, PNG, DOC, or DOCX";
      } else if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        errors.docBackFile = "File size must be less than 5MB";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check for existing KYC submission and get employee ID
  useEffect(() => {
    const checkExistingKyc = async () => {
      console.log("KYC Form - Current user:", user);

      // Check if user is properly logged in
      if (!user || !user.email) {
        setError("Please log in first to access KYC verification.");
        setIsLoading(false);
        return;
      }

      try {
        // First, get all employee data from backend and find by email
        const token = localStorage.getItem("token");
        const employeeResponse = await fetch(`/api/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();
          console.log("Employee data fetched:", employeeData);

          // Find employee by email (case insensitive)
          const employee = employeeData.find(
            (emp) =>
              emp.email && emp.email.toLowerCase() === user.email.toLowerCase()
          );

          if (employee) {
            const employeeId = employee.employeeId || employee.id;
            console.log(
              "Setting employeeId:",
              employeeId,
              "for employee:",
              employee.name
            );
            if (
              employeeId &&
              employeeId !== "undefined" &&
              employeeId !== "null"
            ) {
              setForm((prev) => ({
                ...prev,
                employeeId: employeeId.toString(),
                fullName: employee.name || prev.fullName, // Use employee name from database
              }));
              setError(""); // Clear any previous errors
            } else {
              console.error("Invalid employeeId:", employeeId);
              setError("Unable to get employee ID. Please contact HR.");
            }
          } else {
            console.error("No employee found for email:", user.email);
            // For demo purposes, create a temporary employee ID
            const tempEmployeeId = `TEMP_${
              user.email.split("@")[0]
            }_${Date.now()}`;
            console.log("Using temporary employee ID:", tempEmployeeId);
            setForm((prev) => ({ ...prev, employeeId: tempEmployeeId }));
            setError(
              "Employee record not found. Using temporary ID. Please contact HR to create your employee record."
            );
          }
        } else {
          console.error(
            "Failed to fetch employee data:",
            employeeResponse.status
          );
          // Fallback: create a temporary employee ID
          const tempEmployeeId = `TEMP_${
            user.email.split("@")[0]
          }_${Date.now()}`;
          console.log(
            "API failed, using temporary employee ID:",
            tempEmployeeId
          );
          setForm((prev) => ({ ...prev, employeeId: tempEmployeeId }));
          setError(
            "Failed to fetch employee data. Using temporary ID. Please contact HR."
          );
        }

        // Check existing KYC status
        const kycStatus = await kycService.checkStatus(user.email);
        console.log("Existing KYC check:", kycStatus);

        // Only treat as existing KYC if it's not a "No KYC request found" response
        if (
          (kycStatus.status === "pending" ||
            kycStatus.status === "approved" ||
            kycStatus.status === "rejected") &&
          kycStatus.message !== "No KYC request found"
        ) {
          setExistingKyc(kycStatus);
        }
      } catch (error) {
        console.error("Error checking existing KYC:", error);
      }
      setIsLoading(false);
    };

    checkExistingKyc();
  }, [user]);

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const viewDocument = (file) => {
    try {
      if (file && file.type.startsWith("image/")) {
        // For image files, create a preview URL
        const previewUrl = URL.createObjectURL(file);
        const newWindow = window.open(previewUrl, "_blank");

        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(previewUrl);
        }, 1000);

        if (
          !newWindow ||
          newWindow.closed ||
          typeof newWindow.closed === "undefined"
        ) {
          toast.error("Popup blocked! Please allow popups to view documents.");
        }
      } else {
        toast.error(
          "This file type cannot be previewed. Please download to view."
        );
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Error viewing document: " + error.message);
    }
  };

  const handleFile = (e) => {
    const { name, files } = e.target;
    const file = files && files[0] ? files[0] : null;

    // Check if a file already exists for this field
    const currentFile = form[name];
    if (currentFile && file) {
      // Show confirmation toast for file replacement
      const documentType =
        name === "docFrontFile"
          ? "Front Document"
          : name === "docBackFile"
          ? "Back Document"
          : name === "selfieFile"
          ? "Selfie"
          : "Document";

      toast.success(`${documentType} replaced successfully!`);
    }

    setForm((prev) => ({
      ...prev,
      [name]: file,
    }));

    // Clear validation error for this field when user selects a file
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Create preview URL for image files
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      const previewKey =
        name === "docFrontFile"
          ? "docFront"
          : name === "docBackFile"
          ? "docBack"
          : name === "selfieFile"
          ? "selfie"
          : null;

      if (previewKey) {
        // Clean up previous URL to prevent memory leaks
        if (previewUrls[previewKey]) {
          URL.revokeObjectURL(previewUrls[previewKey]);
        }

        setPreviewUrls((prev) => ({
          ...prev,
          [previewKey]: previewUrl,
        }));
      }
    } else if (file === null) {
      // Clear preview when file is removed
      const previewKey =
        name === "docFrontFile"
          ? "docFront"
          : name === "docBackFile"
          ? "docBack"
          : name === "selfieFile"
          ? "selfie"
          : null;

      if (previewKey && previewUrls[previewKey]) {
        URL.revokeObjectURL(previewUrls[previewKey]);
        setPreviewUrls((prev) => ({
          ...prev,
          [previewKey]: null,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    // Validate form before submission
    if (!validateForm()) {
      setStatus("idle");
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Submitting KYC...");

    try {
      const fd = new FormData();

      // Validate employeeId before submission
      if (
        !form.employeeId ||
        form.employeeId === "undefined" ||
        form.employeeId === "null" ||
        form.employeeId === "0"
      ) {
        throw new Error(
          "Invalid employee ID. Please refresh the page and try again."
        );
      }

      console.log("Submitting KYC with employeeId:", form.employeeId);
      fd.append("employeeId", String(form.employeeId));
      fd.append("fullName", form.fullName);
      fd.append("phoneNumber", form.phoneNumber);
      fd.append("dob", form.dob);
      fd.append("address", form.address);
      fd.append("documentType", form.documentType);
      fd.append("documentNumber", form.documentNumber);
      if (form.docFrontFile) fd.append("docFront", form.docFrontFile);
      if (form.docBackFile) fd.append("docBack", form.docBackFile);
      if (form.selfieFile) fd.append("selfie", form.selfieFile);

      // Try direct fetch first, then fallback to apiClient
      try {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch("/api/kyc", {
          method: "POST",
          headers,
          body: fd,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        await response.json();
        setStatus("success");
        // Store submitted documents for display
        setSubmittedDocuments({
          docFront: form.docFrontFile,
          docBack: form.docBackFile,
          selfie: form.selfieFile,
          formData: form,
        });
        toast.dismiss(loadingToast);
        toast.success("KYC submitted successfully! Pending review.");
      } catch (fetchError) {
        // Fallback to apiClient
        await apiClient.post("/kyc", fd);
        setStatus("success");
        // Store submitted documents for display
        setSubmittedDocuments({
          docFront: form.docFrontFile,
          docBack: form.docBackFile,
          selfie: form.selfieFile,
          formData: form,
        });
        toast.dismiss(loadingToast);
        toast.success("KYC submitted successfully! Pending review.");
      }
    } catch (err) {
      console.error("KYC submission error:", err);
      setError(err.message || "Submission failed. Please try again.");
      setStatus("error");
      toast.dismiss(loadingToast);
      toast.error(err.message || "Submission failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="kyc-submit-container">
        <div className="kyc-card">
          <h2>KYC Verification</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user || !user.email) {
    return (
      <div className="kyc-submit-container">
        <div className="kyc-card">
          <h2>KYC Verification</h2>
          <div className="error-message">
            Please log in first to access KYC verification.
          </div>
          <button
            onClick={() => (window.location.href = "/login")}
            className="btn-primary"
            style={{ marginTop: "20px" }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show existing KYC status if already submitted
  if (existingKyc) {
    return (
      <div className="kyc-submit-container">
        <div className="kyc-card">
          <h2>KYC Verification</h2>
          {existingKyc.status === "approved" && (
            <div className="success-message">
              <h3>✅ KYC Approved</h3>
              <p>
                Your KYC has been approved. You now have access to all features
                including attendance.
              </p>
            </div>
          )}
          {existingKyc.status === "pending" && (
            <div className="info-message">
              <h3>⏳ KYC Pending Review</h3>
              <p>
                Your KYC submission is currently under review. You will be
                notified once it's approved.
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {existingKyc.submittedAt
                  ? new Date(existingKyc.submittedAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          )}
          {existingKyc.status === "rejected" && (
            <div className="error-message">
              <h3>❌ KYC Rejected</h3>
              <p>
                Your KYC submission was rejected. Please contact HR for more
                information.
              </p>
              {existingKyc.remarks && (
                <p>
                  <strong>Reason:</strong> {existingKyc.remarks}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="kyc-submit-container">
      <div className="kyc-card">
        <h2>KYC Verification</h2>
        <p>
          Provide your details for verification. Fields marked with * are
          required.
        </p>
        {error && <div className="error-message">{error}</div>}
        {status === "success" && submittedDocuments && (
          <div className="kyc-submitted-card">
            <div className="success-message">
              <h3>✅ KYC Submitted Successfully!</h3>
              <p>
                Your KYC has been submitted and is pending review. Below are the
                documents you submitted:
              </p>
            </div>

            <div className="submitted-documents">
              <h4>Submitted Documents:</h4>
              <div className="document-grid">
                {submittedDocuments.docFront && (
                  <div className="document-card">
                    <h5>Front Document</h5>
                    <div className="document-preview">
                      {submittedDocuments.docFront.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(submittedDocuments.docFront)}
                          alt="Front document"
                          className="submitted-doc-image"
                        />
                      ) : (
                        <div className="file-icon">📄</div>
                      )}
                    </div>
                    <p className="file-name">
                      {submittedDocuments.docFront.name}
                    </p>
                    <button
                      className="view-doc-btn"
                      onClick={() => viewDocument(submittedDocuments.docFront)}>
                      👁️ View Document
                    </button>
                  </div>
                )}

                {submittedDocuments.docBack && (
                  <div className="document-card">
                    <h5>Back Document</h5>
                    <div className="document-preview">
                      {submittedDocuments.docBack.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(submittedDocuments.docBack)}
                          alt="Back document"
                          className="submitted-doc-image"
                        />
                      ) : (
                        <div className="file-icon">📄</div>
                      )}
                    </div>
                    <p className="file-name">
                      {submittedDocuments.docBack.name}
                    </p>
                    <button
                      className="view-doc-btn"
                      onClick={() => viewDocument(submittedDocuments.docBack)}>
                      👁️ View Document
                    </button>
                  </div>
                )}

                {submittedDocuments.selfie && (
                  <div className="document-card">
                    <h5>Selfie</h5>
                    <div className="document-preview">
                      <img
                        src={URL.createObjectURL(submittedDocuments.selfie)}
                        alt="Selfie"
                        className="submitted-doc-image selfie-image"
                      />
                    </div>
                    <p className="file-name">
                      {submittedDocuments.selfie.name}
                    </p>
                    <button
                      className="view-doc-btn"
                      onClick={() => viewDocument(submittedDocuments.selfie)}>
                      👁️ View Selfie
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="submission-details">
              <h4>Submission Details:</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <strong>Employee ID:</strong>{" "}
                  {submittedDocuments.formData.employeeId}
                </div>
                <div className="detail-item">
                  <strong>Full Name:</strong>{" "}
                  {submittedDocuments.formData.fullName}
                </div>
                <div className="detail-item">
                  <strong>Phone Number:</strong>{" "}
                  {submittedDocuments.formData.phoneNumber}
                </div>
                <div className="detail-item">
                  <strong>Document Type:</strong>{" "}
                  {submittedDocuments.formData.documentType}
                </div>
                <div className="detail-item">
                  <strong>Document Number:</strong>{" "}
                  {submittedDocuments.formData.documentNumber}
                </div>
                <div className="detail-item">
                  <strong>Date of Birth:</strong>{" "}
                  {submittedDocuments.formData.dob}
                </div>
                <div className="detail-item">
                  <strong>Address:</strong>{" "}
                  {submittedDocuments.formData.address}
                </div>
              </div>
            </div>
          </div>
        )}
        {Object.keys(validationErrors).length > 0 && (
          <div className="error-message">
            Please fill in all required fields before submitting.
          </div>
        )}

        <form onSubmit={handleSubmit} className="kyc-form">
          <div className="form-row">
            <div className="form-group">
              <label>Employee ID (Auto-filled)</label>
              <input
                name="employeeId"
                value={form.employeeId}
                readOnly
                className="readonly-input"
                placeholder="Employee ID will be auto-filled"
                required
              />
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className={validationErrors.fullName ? "error" : ""}
              />
              {validationErrors.fullName && (
                <span className="error-text">{validationErrors.fullName}</span>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                required
                className={validationErrors.dob ? "error" : ""}
              />
              {validationErrors.dob && (
                <span className="error-text">{validationErrors.dob}</span>
              )}
            </div>
            <div className="form-group">
              <label>Email (for verification)</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{ background: "#f5f5f5" }}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={validationErrors.phoneNumber ? "error" : ""}
              />
              {validationErrors.phoneNumber && (
                <span className="error-text">
                  {validationErrors.phoneNumber}
                </span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              required
              className={validationErrors.address ? "error" : ""}
            />
            {validationErrors.address && (
              <span className="error-text">{validationErrors.address}</span>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Document Type</label>
              <select
                name="documentType"
                value={form.documentType}
                onChange={handleChange}>
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN</option>
                <option value="passport">Passport</option>
                <option value="driver_license">Driver License</option>
              </select>
            </div>
            <div className="form-group">
              <label>Document Number *</label>
              <input
                name="documentNumber"
                value={form.documentNumber}
                onChange={handleChange}
                required
                className={validationErrors.documentNumber ? "error" : ""}
                placeholder={
                  form.documentType === "aadhaar"
                    ? "123456789012"
                    : form.documentType === "pan"
                    ? "ABCDE1234F"
                    : form.documentType === "passport"
                    ? "A1234567"
                    : "Enter document number"
                }
              />
              {validationErrors.documentNumber && (
                <span className="error-text">
                  {validationErrors.documentNumber}
                </span>
              )}
              <small className="format-hint">
                {form.documentType === "aadhaar" && "Format: 12 digits"}
                {form.documentType === "pan" && "Format: ABCDE1234F"}
                {form.documentType === "passport" &&
                  "Format: 1 letter + 7 digits"}
                {form.documentType === "driver_license" &&
                  "Format: 8-20 characters"}
              </small>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Front Document (pdf,jpg,png,doc,docx) *</label>
              {form.docFrontFile ? (
                <div className="file-uploaded">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{form.docFrontFile.name}</span>
                    <span className="file-size">
                      ({(form.docFrontFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="file-actions">
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, docFrontFile: null }));
                        if (previewUrls.docFront) {
                          URL.revokeObjectURL(previewUrls.docFront);
                          setPreviewUrls((prev) => ({
                            ...prev,
                            docFront: null,
                          }));
                        }
                        toast.success("Front document removed");
                      }}>
                      🗑️ Remove
                    </button>
                    <label className="replace-file-btn">
                      🔄 Replace
                      <input
                        type="file"
                        name="docFrontFile"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFile}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <input
                  type="file"
                  name="docFrontFile"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFile}
                  required
                  className={validationErrors.docFrontFile ? "error" : ""}
                />
              )}
              {validationErrors.docFrontFile && (
                <span className="error-text">
                  {validationErrors.docFrontFile}
                </span>
              )}
              {previewUrls.docFront && (
                <div className="image-preview">
                  <img
                    src={previewUrls.docFront}
                    alt="Front document preview"
                    className="preview-image"
                  />
                  <p className="preview-label">Front Document Preview</p>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Back Document (optional)</label>
              {form.docBackFile ? (
                <div className="file-uploaded">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{form.docBackFile.name}</span>
                    <span className="file-size">
                      ({(form.docBackFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <div className="file-actions">
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, docBackFile: null }));
                        if (previewUrls.docBack) {
                          URL.revokeObjectURL(previewUrls.docBack);
                          setPreviewUrls((prev) => ({
                            ...prev,
                            docBack: null,
                          }));
                        }
                        toast.success("Back document removed");
                      }}>
                      🗑️ Remove
                    </button>
                    <label className="replace-file-btn">
                      🔄 Replace
                      <input
                        type="file"
                        name="docBackFile"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFile}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <input
                  type="file"
                  name="docBackFile"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFile}
                  className={validationErrors.docBackFile ? "error" : ""}
                />
              )}
              {validationErrors.docBackFile && (
                <span className="error-text">
                  {validationErrors.docBackFile}
                </span>
              )}
              {previewUrls.docBack && (
                <div className="image-preview">
                  <img
                    src={previewUrls.docBack}
                    alt="Back document preview"
                    className="preview-image"
                  />
                  <p className="preview-label">Back Document Preview</p>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Selfie (jpg/png) *</label>
            {form.selfieFile ? (
              <div className="file-uploaded">
                <div className="file-info">
                  <span className="file-icon">📸</span>
                  <span className="file-name">{form.selfieFile.name}</span>
                  <span className="file-size">
                    ({(form.selfieFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <div className="file-actions">
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, selfieFile: null }));
                      if (previewUrls.selfie) {
                        URL.revokeObjectURL(previewUrls.selfie);
                        setPreviewUrls((prev) => ({ ...prev, selfie: null }));
                      }
                      toast.success("Selfie removed");
                    }}>
                    🗑️ Remove
                  </button>
                  <label className="replace-file-btn">
                    🔄 Replace
                    <input
                      type="file"
                      name="selfieFile"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFile}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <input
                type="file"
                name="selfieFile"
                accept=".jpg,.jpeg,.png"
                onChange={handleFile}
                required
                className={validationErrors.selfieFile ? "error" : ""}
              />
            )}
            {validationErrors.selfieFile && (
              <span className="error-text">{validationErrors.selfieFile}</span>
            )}
            {previewUrls.selfie && (
              <div className="image-preview">
                <img
                  src={previewUrls.selfie}
                  alt="Selfie preview"
                  className="preview-image selfie-preview"
                />
                <p className="preview-label">Selfie Preview</p>
              </div>
            )}
          </div>
          <div className="actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={status === "submitting"}>
              {status === "submitting" ? "Submitting..." : "Submit KYC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KycSubmit;
