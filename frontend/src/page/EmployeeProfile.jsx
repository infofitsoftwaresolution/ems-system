import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Upload,
  X,
  FileImage,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useKycScroll } from "@/hooks/use-kyc-scroll";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function EmployeeProfile() {
  const { user } = useAuth();
  const { scrollToKycForm } = useKycScroll();
  const [kycStatus, setKycStatus] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycFormData, setKycFormData] = useState({
    panNumber: "",
    aadharNumber: "",
    address: "",
    phoneNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    dob: "",
    documentType: "aadhaar",
  });
  const [panCardFile, setPanCardFile] = useState(null);
  const [aadharCardFile, setAadharCardFile] = useState(null);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Validation functions
  const validatePAN = (pan) => {
    if (!pan) return "PAN Number is required";
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      return "PAN must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)";
    }
    return "";
  };

  const validateAadhar = (aadhar) => {
    if (!aadhar) return "Aadhar Number is required";
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(aadhar.replace(/\s/g, ""))) {
      return "Aadhar must be exactly 12 digits";
    }
    return "";
  };

  const validateDOB = (dob) => {
    if (!dob) return "Date of Birth is required";
    const selectedDate = new Date(dob);
    const today = new Date();
    const minAge = new Date();
    minAge.setFullYear(today.getFullYear() - 100); // Max age 100 years

    if (selectedDate > today) {
      return "Date of Birth cannot be in the future";
    }
    if (selectedDate < minAge) {
      return "Please enter a valid date of birth";
    }
    const age = today.getFullYear() - selectedDate.getFullYear();
    if (age < 18) {
      return "You must be at least 18 years old";
    }
    return "";
  };

  const validateAddress = (address) => {
    if (!address) return "Address is required";
    if (address.trim().length < 10) {
      return "Address must be at least 10 characters long";
    }
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone) return ""; // Optional field
    const phoneRegex = /^[0-9]{10}$/;
    const cleanedPhone = phone.replace(/\s|-/g, "");
    if (!phoneRegex.test(cleanedPhone)) {
      return "Phone number must be exactly 10 digits";
    }
    return "";
  };

  const validateEmergencyContact = (contact) => {
    if (!contact) return ""; // Optional field
    if (contact.trim().length < 2) {
      return "Emergency contact name must be at least 2 characters";
    }
    return "";
  };

  const validateFile = (file, fieldName) => {
    if (!file) return `${fieldName} is required`;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a valid image file (JPEG, PNG, or WebP)";
    }
    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }
    return "";
  };

  // Handle field validation on change
  const handleFieldChange = (field, value) => {
    setKycFormData({ ...kycFormData, [field]: value });

    // Clear error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  // Handle field validation on blur
  const handleFieldBlur = (field, value) => {
    let error = "";

    switch (field) {
      case "panNumber":
        error = validatePAN(value);
        break;
      case "aadharNumber":
        error = validateAadhar(value);
        break;
      case "dob":
        error = validateDOB(value);
        break;
      case "address":
        error = validateAddress(value);
        break;
      case "phoneNumber":
        error = validatePhone(value);
        break;
      case "emergencyContact":
        error = validateEmergencyContact(value);
        break;
      case "emergencyPhone":
        error = validatePhone(value);
        break;
      default:
        break;
    }

    setValidationErrors({ ...validationErrors, [field]: error });
  };

  // Handle file upload with validation
  const handleFileUpload = (file, fieldName) => {
    if (!file) {
      // User cancelled file selection
      if (fieldName === "panCard") {
        setPanCardFile(null);
      } else if (fieldName === "aadharCard") {
        setAadharCardFile(null);
      }
      setValidationErrors({ ...validationErrors, [fieldName]: "" });
      return;
    }

    const error = validateFile(file, fieldName);
    setValidationErrors({ ...validationErrors, [fieldName]: error });

    if (!error && fieldName === "panCard") {
      setPanCardFile(file);
    } else if (!error && fieldName === "aadharCard") {
      setAadharCardFile(file);
    }
  };

  // Validate all fields before submission
  const validateAllFields = () => {
    const errors = {};

    errors.panNumber = validatePAN(kycFormData.panNumber);
    errors.aadharNumber = validateAadhar(kycFormData.aadharNumber);
    errors.dob = validateDOB(kycFormData.dob);
    errors.address = validateAddress(kycFormData.address);
    errors.phoneNumber = validatePhone(kycFormData.phoneNumber);
    errors.emergencyContact = validateEmergencyContact(
      kycFormData.emergencyContact
    );
    errors.emergencyPhone = validatePhone(kycFormData.emergencyPhone);
    errors.panCard = validateFile(panCardFile, "PAN Card");
    errors.aadharCard = validateFile(aadharCardFile, "Aadhar Card");

    setValidationErrors(errors);

    // Check if there are any errors
    return !Object.values(errors).some((error) => error !== "");
  };

  // Load KYC status (only for non-admin users)
  useEffect(() => {
    const loadKycStatus = async () => {
      try {
        setLoading(true);
        // Only load KYC status for non-admin users
        if (user?.email && user?.role !== "admin") {
          const kycInfo = await apiService.getKycStatus(user.email);
          console.log("KYC Info received:", kycInfo);
          console.log("KYC Status:", kycInfo.status);
          console.log("KYC Data:", kycInfo.data);

          // Handle different possible status values
          if (!kycInfo || !kycInfo.status) {
            setKycStatus("not_submitted");
          } else {
            // IMPORTANT: Only use the status from KYC request, not from Employee model
            // The status must be explicitly 'approved' from the KYC review process
            let frontendStatus = kycInfo.status;

            // Handle edge cases
            if (
              kycInfo.status === "pending" &&
              kycInfo.message === "No KYC request found"
            ) {
              frontendStatus = "not_submitted";
            }

            // Ensure we're using the actual KYC request status, not a default
            // Only 'approved' status means it's been reviewed and approved by admin
            if (
              frontendStatus !== "approved" &&
              frontendStatus !== "rejected" &&
              frontendStatus !== "pending" &&
              frontendStatus !== "not_submitted"
            ) {
              console.warn(
                "Unexpected KYC status:",
                frontendStatus,
                "Defaulting to not_submitted"
              );
              frontendStatus = "not_submitted";
            }

            setKycStatus(frontendStatus);
            setKycData(kycInfo.data || kycInfo);
          }
        } else if (user?.role === "admin") {
          // Admin users don't need KYC
          setKycStatus("not_required");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading KYC status:", err);
        setKycStatus("not_submitted");
      } finally {
        setLoading(false);
      }
    };
    loadKycStatus();
  }, [user]);

  const handleKycSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    if (!validateAllFields()) {
      toast.error("Please fix all validation errors before submitting");
      return;
    }

    setSubmittingKyc(true);
    try {
      console.log("Starting KYC submission...");
      console.log("Form data:", kycFormData);
      console.log("Files:", { panCardFile, aadharCardFile });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("panNumber", kycFormData.panNumber);
      formData.append("aadharNumber", kycFormData.aadharNumber);
      formData.append("address", kycFormData.address);
      formData.append("phoneNumber", kycFormData.phoneNumber);
      formData.append("emergencyContact", kycFormData.emergencyContact);
      formData.append("emergencyPhone", kycFormData.emergencyPhone);
      formData.append("panCard", panCardFile);
      formData.append("aadharCard", aadharCardFile);

      // Add required fields for backend
      formData.append("dob", kycFormData.dob);
      formData.append("documentType", kycFormData.documentType);
      formData.append("documentNumber", kycFormData.aadharNumber);

      // Add required user information
      if (user) {
        console.log("User object:", user);
        formData.append("fullName", user.name || "");
        formData.append("employeeId", user.id || "");
        formData.append("email", user.email || "");
        console.log("Sending user data:", {
          fullName: user.name || "",
          employeeId: user.id || "",
          email: user.email || "",
        });
      }

      // Debug FormData contents
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Submit KYC data
      const apiUrl =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? "/api" : "http://localhost:3001/api");
      console.log("Submitting to:", `${apiUrl}/kyc`);
      const response = await fetch(`${apiUrl}/kyc`, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("KYC submission error response:", errorData);
        throw new Error(errorData.message || "Failed to submit KYC");
      }

      toast.success("KYC information submitted successfully!");
      setShowKycForm(false);

      // Reset form
      setKycFormData({
        panNumber: "",
        aadharNumber: "",
        address: "",
        phoneNumber: "",
        emergencyContact: "",
        emergencyPhone: "",
        dob: "",
        documentType: "aadhaar",
      });
      setPanCardFile(null);
      setAadharCardFile(null);
      setValidationErrors({});

      // Reload KYC status
      const kycInfo = await apiService.getKycStatus(user.email);
      setKycStatus(kycInfo.status);
      setKycData(kycInfo.data);
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error("Failed to submit KYC information. Please try again.");
    } finally {
      setSubmittingKyc(false);
    }
  };

  const getKycStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "not_submitted":
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Submitted
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const getKycStatusMessage = (status) => {
    switch (status) {
      case "approved":
        return "Your KYC has been approved! You now have access to all employee features.";
      case "rejected":
        return "Your KYC was rejected. Please contact HR for more information.";
      case "pending":
        return "Your KYC is under review. You'll be notified once it's processed.";
      case "not_submitted":
        return "Please complete your KYC to access all employee features.";
      default:
        return "KYC status unknown. Please contact HR.";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            {user?.role === "admin"
              ? "Manage your personal information and account settings"
              : "Manage your personal information and KYC status"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Full Name</p>
                <p className="text-sm text-gray-600">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Status - Only show for non-admin users */}
        {user?.role !== "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                KYC Status
              </CardTitle>
              <CardDescription>
                Know Your Customer verification status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getKycStatusBadge(kycStatus)}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  {getKycStatusMessage(kycStatus)}
                </p>

                {kycStatus === "not_submitted" && (
                  <Button
                    onClick={() => {
                      setShowKycForm(true);
                      setTimeout(scrollToKycForm, 100);
                    }}
                    className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Complete KYC
                  </Button>
                )}

                {kycStatus === "rejected" && (
                  <Button
                    onClick={() => {
                      setShowKycForm(true);
                      setTimeout(scrollToKycForm, 100);
                    }}
                    variant="outline"
                    className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Resubmit KYC
                  </Button>
                )}
              </div>

              {kycData && (kycData.panNumber || kycData.aadharNumber) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">
                    Submitted KYC Information
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {kycData.panNumber && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">PAN Number:</span>
                        <span>{kycData.panNumber}</span>
                      </div>
                    )}
                    {kycData.aadharNumber && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Aadhar Number:</span>
                        <span>{kycData.aadharNumber}</span>
                      </div>
                    )}
                    {kycData.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="font-medium">Address: </span>
                          <span>{kycData.address}</span>
                        </div>
                      </div>
                    )}
                    {kycData.submittedAt && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Submitted:</span>
                        <span>
                          {new Date(kycData.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feature Access Status - Only show for non-admin users */}
      {user?.role !== "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Access</CardTitle>
            <CardDescription>
              Your access to different employee features based on KYC status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div
                  className={`p-2 rounded-full ${
                    kycStatus === "approved" ? "bg-green-100" : "bg-gray-100"
                  }`}>
                  <Calendar
                    className={`h-4 w-4 ${
                      kycStatus === "approved"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Attendance</p>
                  <p className="text-xs text-gray-500">
                    {kycStatus === "approved"
                      ? "Available"
                      : "Requires KYC approval"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div
                  className={`p-2 rounded-full ${
                    kycStatus === "approved" ? "bg-green-100" : "bg-gray-100"
                  }`}>
                  <FileText
                    className={`h-4 w-4 ${
                      kycStatus === "approved"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Payslip</p>
                  <p className="text-xs text-gray-500">
                    {kycStatus === "approved"
                      ? "Available"
                      : "Requires KYC approval"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div
                  className={`p-2 rounded-full ${
                    kycStatus === "approved" ? "bg-green-100" : "bg-gray-100"
                  }`}>
                  <Clock
                    className={`h-4 w-4 ${
                      kycStatus === "approved"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Leave Application</p>
                  <p className="text-xs text-gray-500">
                    {kycStatus === "approved"
                      ? "Available"
                      : "Requires KYC approval"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Form - Only show for non-admin users */}
      {showKycForm && user?.role !== "admin" && (
        <Card id="kyc-form" data-testid="kyc-form" className="kyc-form">
          <CardHeader>
            <CardTitle>Complete Your KYC</CardTitle>
            <CardDescription>
              Please provide your KYC information to complete your profile
              setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    placeholder="Enter PAN number (e.g., ABCDE1234F)"
                    value={kycFormData.panNumber}
                    onChange={(e) =>
                      handleFieldChange(
                        "panNumber",
                        e.target.value.toUpperCase()
                      )
                    }
                    onBlur={(e) => handleFieldBlur("panNumber", e.target.value)}
                    className={
                      validationErrors.panNumber ? "border-red-500" : ""
                    }
                    required
                  />
                  {validationErrors.panNumber && (
                    <p className="text-sm text-red-500">
                      {validationErrors.panNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                  <Input
                    id="aadharNumber"
                    placeholder="Enter Aadhar number (12 digits)"
                    value={kycFormData.aadharNumber}
                    onChange={(e) =>
                      handleFieldChange(
                        "aadharNumber",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    onBlur={(e) =>
                      handleFieldBlur("aadharNumber", e.target.value)
                    }
                    className={
                      validationErrors.aadharNumber ? "border-red-500" : ""
                    }
                    maxLength={12}
                    required
                  />
                  {validationErrors.aadharNumber && (
                    <p className="text-sm text-red-500">
                      {validationErrors.aadharNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={kycFormData.dob}
                  onChange={(e) => handleFieldChange("dob", e.target.value)}
                  onBlur={(e) => handleFieldBlur("dob", e.target.value)}
                  className={validationErrors.dob ? "border-red-500" : ""}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
                {validationErrors.dob && (
                  <p className="text-sm text-red-500">{validationErrors.dob}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete address"
                  value={kycFormData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  onBlur={(e) => handleFieldBlur("address", e.target.value)}
                  className={validationErrors.address ? "border-red-500" : ""}
                  required
                />
                {validationErrors.address && (
                  <p className="text-sm text-red-500">
                    {validationErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter phone number (10 digits)"
                    value={kycFormData.phoneNumber}
                    onChange={(e) =>
                      handleFieldChange(
                        "phoneNumber",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    onBlur={(e) =>
                      handleFieldBlur("phoneNumber", e.target.value)
                    }
                    className={
                      validationErrors.phoneNumber ? "border-red-500" : ""
                    }
                    maxLength={10}
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-sm text-red-500">
                      {validationErrors.phoneNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Emergency contact name"
                    value={kycFormData.emergencyContact}
                    onChange={(e) =>
                      handleFieldChange("emergencyContact", e.target.value)
                    }
                    onBlur={(e) =>
                      handleFieldBlur("emergencyContact", e.target.value)
                    }
                    className={
                      validationErrors.emergencyContact ? "border-red-500" : ""
                    }
                  />
                  {validationErrors.emergencyContact && (
                    <p className="text-sm text-red-500">
                      {validationErrors.emergencyContact}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  placeholder="Emergency contact phone number (10 digits)"
                  value={kycFormData.emergencyPhone}
                  onChange={(e) =>
                    handleFieldChange(
                      "emergencyPhone",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  onBlur={(e) =>
                    handleFieldBlur("emergencyPhone", e.target.value)
                  }
                  className={
                    validationErrors.emergencyPhone ? "border-red-500" : ""
                  }
                  maxLength={10}
                />
                {validationErrors.emergencyPhone && (
                  <p className="text-sm text-red-500">
                    {validationErrors.emergencyPhone}
                  </p>
                )}
              </div>

              {/* File Upload Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Document Upload</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="panCard">PAN Card Photo *</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 ${
                        validationErrors.panCard
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}>
                      {panCardFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileImage className="h-4 w-4" />
                            <span className="text-sm">{panCardFile.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPanCardFile(null);
                              setValidationErrors({
                                ...validationErrors,
                                panCard: "",
                              });
                            }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            Click to upload PAN card photo
                          </p>
                          <Input
                            id="panCard"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) =>
                              handleFileUpload(e.target.files[0], "panCard")
                            }
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById("panCard").click()
                            }>
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    {validationErrors.panCard && (
                      <p className="text-sm text-red-500">
                        {validationErrors.panCard}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadharCard">Aadhar Card Photo *</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 ${
                        validationErrors.aadharCard
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}>
                      {aadharCardFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileImage className="h-4 w-4" />
                            <span className="text-sm">
                              {aadharCardFile.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAadharCardFile(null);
                              setValidationErrors({
                                ...validationErrors,
                                aadharCard: "",
                              });
                            }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            Click to upload Aadhar card photo
                          </p>
                          <Input
                            id="aadharCard"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) =>
                              handleFileUpload(e.target.files[0], "aadharCard")
                            }
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById("aadharCard").click()
                            }>
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    {validationErrors.aadharCard && (
                      <p className="text-sm text-red-500">
                        {validationErrors.aadharCard}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowKycForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingKyc}>
                  {submittingKyc ? "Submitting..." : "Submit KYC"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
