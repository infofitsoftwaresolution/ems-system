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
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    emergencyContactAddress: "",
    dob: "",
    documentType: "aadhaar",
    bankName: "",
    bankBranch: "",
    accountNumber: "",
    ifscCode: "",
  });
  const [panCardFile, setPanCardFile] = useState(null);
  const [employeePhotoFile, setEmployeePhotoFile] = useState(null);
  // New KYC document files
  const [salarySlipMonth1, setSalarySlipMonth1] = useState(null);
  const [salarySlipMonth2, setSalarySlipMonth2] = useState(null);
  const [salarySlipMonth3, setSalarySlipMonth3] = useState(null);
  const [bankProofFile, setBankProofFile] = useState(null);
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
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

  const validateEmergencyContactName = (name) => {
    if (!name) return "Emergency contact name is required";
    if (name.trim().length < 2) {
      return "Emergency contact name must be at least 2 characters";
    }
    return "";
  };

  const validateEmergencyContactPhone = (phone) => {
    if (!phone) return "Emergency contact phone is required";
    const phoneRegex = /^[0-9]{10}$/;
    const cleanedPhone = phone.replace(/\s|-/g, "");
    if (!phoneRegex.test(cleanedPhone)) {
      return "Emergency contact phone must be exactly 10 digits";
    }
    return "";
  };

  const validateEmergencyContactRelation = (relation) => {
    if (!relation) return "Emergency contact relation is required";
    if (relation.trim().length < 2) {
      return "Relation must be at least 2 characters";
    }
    return "";
  };

  const validateEmergencyContactAddress = () => {
    // Optional field, no validation needed
    return "";
  };

  const validateBankName = (bankName) => {
    if (!bankName) return "Bank name is required";
    if (bankName.trim().length < 2) {
      return "Bank name must be at least 2 characters";
    }
    return "";
  };

  const validateBankBranch = (branch) => {
    if (!branch) return "Bank branch is required";
    if (branch.trim().length < 2) {
      return "Bank branch must be at least 2 characters";
    }
    return "";
  };

  const validateAccountNumber = (accountNumber) => {
    if (!accountNumber) return "Account number is required";
    const accountRegex = /^[0-9]{9,18}$/;
    const cleanedAccount = accountNumber.replace(/\s|-/g, "");
    if (!accountRegex.test(cleanedAccount)) {
      return "Account number must be between 9 and 18 digits";
    }
    return "";
  };

  const validateIFSC = (ifsc) => {
    if (!ifsc) return "IFSC code is required";
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      return "IFSC code must be in format: ABCD0123456 (4 letters, 0, 6 alphanumeric)";
    }
    return "";
  };

  const validateFile = (file, fieldName) => {
    if (!file) return `${fieldName} is required`;
    const maxSize = 10 * 1024 * 1024; // 10MB
    // Allow both images and PDFs for all document types
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a valid file (PDF, JPEG, PNG, or WebP)";
    }
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
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
      case "emergencyContactName":
        error = validateEmergencyContactName(value);
        break;
      case "emergencyContactPhone":
        error = validateEmergencyContactPhone(value);
        break;
      case "emergencyContactRelation":
        error = validateEmergencyContactRelation(value);
        break;
      case "emergencyContactAddress":
        error = validateEmergencyContactAddress(value);
        break;
      case "bankName":
        error = validateBankName(value);
        break;
      case "bankBranch":
        error = validateBankBranch(value);
        break;
      case "accountNumber":
        error = validateAccountNumber(value);
        break;
      case "ifscCode":
        error = validateIFSC(value);
        break;
      default:
        break;
    }

    setValidationErrors({ ...validationErrors, [field]: error });
  };

  // Handle file upload with validation
  const handleFileUpload = (file, fieldName) => {
    if (!file) {
      // User cancelled file selection - clear the file for this field
      switch (fieldName) {
        case "panCard":
          setPanCardFile(null);
          break;
        case "employeePhoto":
          setEmployeePhotoFile(null);
          break;
        case "aadhaarFront":
          setAadhaarFrontFile(null);
          break;
        case "aadhaarBack":
          setAadhaarBackFile(null);
          break;
        case "salarySlipMonth1":
          setSalarySlipMonth1(null);
          break;
        case "salarySlipMonth2":
          setSalarySlipMonth2(null);
          break;
        case "salarySlipMonth3":
          setSalarySlipMonth3(null);
          break;
        case "bankProof":
          setBankProofFile(null);
          break;
      }
      setValidationErrors({ ...validationErrors, [fieldName]: "" });
      return;
    }

    const error = validateFile(file, fieldName);
    setValidationErrors({ ...validationErrors, [fieldName]: error });

    // Only set the file if there's no validation error
    if (!error) {
      switch (fieldName) {
        case "panCard":
          setPanCardFile(file);
          break;
        case "employeePhoto":
          setEmployeePhotoFile(file);
          break;
        case "aadhaarFront":
          setAadhaarFrontFile(file);
          break;
        case "aadhaarBack":
          setAadhaarBackFile(file);
          break;
        case "salarySlipMonth1":
          setSalarySlipMonth1(file);
          break;
        case "salarySlipMonth2":
          setSalarySlipMonth2(file);
          break;
        case "salarySlipMonth3":
          setSalarySlipMonth3(file);
          break;
        case "bankProof":
          setBankProofFile(file);
          break;
      }
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
    errors.emergencyContactName = validateEmergencyContactName(
      kycFormData.emergencyContactName
    );
    errors.emergencyContactPhone = validateEmergencyContactPhone(
      kycFormData.emergencyContactPhone
    );
    errors.emergencyContactRelation = validateEmergencyContactRelation(
      kycFormData.emergencyContactRelation
    );
    errors.emergencyContactAddress = validateEmergencyContactAddress(
      kycFormData.emergencyContactAddress
    );
    errors.bankName = validateBankName(kycFormData.bankName);
    errors.bankBranch = validateBankBranch(kycFormData.bankBranch);
    errors.accountNumber = validateAccountNumber(kycFormData.accountNumber);
    errors.ifscCode = validateIFSC(kycFormData.ifscCode);
    errors.panCard = validateFile(panCardFile, "PAN Card");
    errors.employeePhoto = validateFile(employeePhotoFile, "Employee Photo");
    errors.aadhaarFront = validateFile(aadhaarFrontFile, "Aadhaar Front");
    errors.aadhaarBack = validateFile(aadhaarBackFile, "Aadhaar Back");

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
      // Get list of fields with errors for better error message
      const errorFields = Object.entries(validationErrors)
        .filter(([, error]) => error !== "")
        .map(([field]) => {
          // Convert field names to user-friendly labels
          const fieldLabels = {
            panNumber: "PAN Number",
            aadharNumber: "Aadhar Number",
            dob: "Date of Birth",
            address: "Address",
            phoneNumber: "Phone Number",
            emergencyContactName: "Emergency Contact Name",
            emergencyContactPhone: "Emergency Contact Phone",
            emergencyContactRelation: "Emergency Contact Relation",
            bankName: "Bank Name",
            bankBranch: "Bank Branch",
            accountNumber: "Account Number",
            ifscCode: "IFSC Code",
            panCard: "PAN Card Photo",
            employeePhoto: "Employee Photo",
            aadhaarFront: "Aadhaar Card - Front",
            aadhaarBack: "Aadhaar Card - Back",
          };
          return fieldLabels[field] || field;
        });

      if (errorFields.length > 0) {
        toast.error(
          `Please fix validation errors in: ${errorFields.join(", ")}`
        );
      } else {
        toast.error("Please fix all validation errors before submitting");
      }
      return;
    }

    setSubmittingKyc(true);
    try {
      console.log("Starting KYC submission...");
      console.log("Form data:", kycFormData);
      console.log("Files:", {
        panCardFile,
        employeePhotoFile,
        aadhaarFrontFile,
        aadhaarBackFile,
        salarySlipMonth1,
        salarySlipMonth2,
        salarySlipMonth3,
        bankProofFile,
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("panNumber", kycFormData.panNumber);
      formData.append("aadharNumber", kycFormData.aadharNumber);
      formData.append("address", kycFormData.address);
      formData.append("phoneNumber", kycFormData.phoneNumber);
      formData.append("emergencyContactName", kycFormData.emergencyContactName);
      formData.append(
        "emergencyContactPhone",
        kycFormData.emergencyContactPhone
      );
      formData.append(
        "emergencyContactRelation",
        kycFormData.emergencyContactRelation
      );
      formData.append(
        "emergencyContactAddress",
        kycFormData.emergencyContactAddress || ""
      );
      formData.append("bankName", kycFormData.bankName);
      formData.append("bankBranch", kycFormData.bankBranch);
      formData.append("accountNumber", kycFormData.accountNumber);
      formData.append("ifscCode", kycFormData.ifscCode);
      formData.append("panCard", panCardFile);
      formData.append("selfie", employeePhotoFile);

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
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to submit KYC" }));
        console.error("KYC submission error response:", errorData);
        console.error("Response status:", response.status);

        // Create error with full details
        const error = new Error(errorData.message || "Failed to submit KYC");
        error.status = response.status;
        error.errorData = errorData;
        throw error;
      }

      toast.success("KYC information submitted successfully!");
      setShowKycForm(false);

      // Reset form
      setKycFormData({
        panNumber: "",
        aadharNumber: "",
        address: "",
        phoneNumber: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelation: "",
        emergencyContactAddress: "",
        dob: "",
        documentType: "aadhaar",
        bankName: "",
        bankBranch: "",
        accountNumber: "",
        ifscCode: "",
      });
      setPanCardFile(null);
      setEmployeePhotoFile(null);
      setSalarySlipMonth1(null);
      setSalarySlipMonth2(null);
      setSalarySlipMonth3(null);
      setBankProofFile(null);
      setAadhaarFrontFile(null);
      setAadhaarBackFile(null);
      setValidationErrors({});

      // Reload KYC status
      const kycInfo = await apiService.getKycStatus(user.email);
      setKycStatus(kycInfo.status);
      setKycData(kycInfo.data);
    } catch (error) {
      console.error("KYC submission error:", error);

      // Show specific error message based on error response
      if (error.message && error.message.includes("already pending review")) {
        toast.error(
          "Your KYC is already pending review. Please wait for admin approval."
        );
      } else if (
        error.message &&
        error.message.includes("already been approved")
      ) {
        toast.error(
          "Your KYC has already been approved. No resubmission needed."
        );
      } else if (error.message && error.message.includes("already submitted")) {
        // Check if the error data contains status information
        if (error.errorData && error.errorData.status === "rejected") {
          toast.error(
            "Please try resubmitting. If the issue persists, contact support."
          );
        } else {
          toast.error(
            "KYC already submitted. If your KYC was rejected, you can resubmit it."
          );
        }
      } else {
        toast.error(
          error.message || "Failed to submit KYC information. Please try again."
        );
      }
    } finally {
      setSubmittingKyc(false);
    }
  };

  const getKycStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-primary">
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
        return "Your KYC was rejected. Please review and resubmit your KYC information.";
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
                    kycStatus === "approved" ? "bg-primary/20" : "bg-muted"
                  }`}>
                  <Calendar
                    className={`h-4 w-4 ${
                      kycStatus === "approved"
                        ? "text-primary"
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
                    kycStatus === "approved" ? "bg-primary/20" : "bg-muted"
                  }`}>
                  <FileText
                    className={`h-4 w-4 ${
                      kycStatus === "approved"
                        ? "text-primary"
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
                    kycStatus === "approved" ? "bg-primary/20" : "bg-muted"
                  }`}>
                  <Clock
                    className={`h-4 w-4 ${
                      kycStatus === "approved"
                        ? "text-primary"
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
                  onBlur={(e) => handleFieldBlur("phoneNumber", e.target.value)}
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

              {/* Emergency Contact Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">
                  Emergency Contact Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">
                      Emergency Contact Name *
                    </Label>
                    <Input
                      id="emergencyContactName"
                      placeholder="Enter emergency contact name"
                      value={kycFormData.emergencyContactName}
                      onChange={(e) =>
                        handleFieldChange(
                          "emergencyContactName",
                          e.target.value
                        )
                      }
                      onBlur={(e) =>
                        handleFieldBlur("emergencyContactName", e.target.value)
                      }
                      className={
                        validationErrors.emergencyContactName
                          ? "border-red-500"
                          : ""
                      }
                      required
                    />
                    {validationErrors.emergencyContactName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.emergencyContactName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">
                      Emergency Contact Phone *
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      placeholder="Enter phone number (10 digits)"
                      value={kycFormData.emergencyContactPhone}
                      onChange={(e) =>
                        handleFieldChange(
                          "emergencyContactPhone",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      onBlur={(e) =>
                        handleFieldBlur("emergencyContactPhone", e.target.value)
                      }
                      className={
                        validationErrors.emergencyContactPhone
                          ? "border-red-500"
                          : ""
                      }
                      maxLength={10}
                      required
                    />
                    {validationErrors.emergencyContactPhone && (
                      <p className="text-sm text-red-500">
                        {validationErrors.emergencyContactPhone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelation">Relation *</Label>
                    <Input
                      id="emergencyContactRelation"
                      placeholder="e.g., Father, Mother, Spouse, Sibling"
                      value={kycFormData.emergencyContactRelation}
                      onChange={(e) =>
                        handleFieldChange(
                          "emergencyContactRelation",
                          e.target.value
                        )
                      }
                      onBlur={(e) =>
                        handleFieldBlur(
                          "emergencyContactRelation",
                          e.target.value
                        )
                      }
                      className={
                        validationErrors.emergencyContactRelation
                          ? "border-red-500"
                          : ""
                      }
                      required
                    />
                    {validationErrors.emergencyContactRelation && (
                      <p className="text-sm text-red-500">
                        {validationErrors.emergencyContactRelation}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactAddress">
                      Emergency Contact Address
                    </Label>
                    <Input
                      id="emergencyContactAddress"
                      placeholder="Enter emergency contact address (optional)"
                      value={kycFormData.emergencyContactAddress}
                      onChange={(e) =>
                        handleFieldChange(
                          "emergencyContactAddress",
                          e.target.value
                        )
                      }
                      onBlur={(e) =>
                        handleFieldBlur(
                          "emergencyContactAddress",
                          e.target.value
                        )
                      }
                      className={
                        validationErrors.emergencyContactAddress
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {validationErrors.emergencyContactAddress && (
                      <p className="text-sm text-red-500">
                        {validationErrors.emergencyContactAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Account Details Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Bank Account Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      placeholder="Enter bank name"
                      value={kycFormData.bankName}
                      onChange={(e) =>
                        handleFieldChange("bankName", e.target.value)
                      }
                      onBlur={(e) =>
                        handleFieldBlur("bankName", e.target.value)
                      }
                      className={
                        validationErrors.bankName ? "border-red-500" : ""
                      }
                      required
                    />
                    {validationErrors.bankName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.bankName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankBranch">Bank Branch *</Label>
                    <Input
                      id="bankBranch"
                      placeholder="Enter bank branch"
                      value={kycFormData.bankBranch}
                      onChange={(e) =>
                        handleFieldChange("bankBranch", e.target.value)
                      }
                      onBlur={(e) =>
                        handleFieldBlur("bankBranch", e.target.value)
                      }
                      className={
                        validationErrors.bankBranch ? "border-red-500" : ""
                      }
                      required
                    />
                    {validationErrors.bankBranch && (
                      <p className="text-sm text-red-500">
                        {validationErrors.bankBranch}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Enter account number (9-18 digits)"
                      value={kycFormData.accountNumber}
                      onChange={(e) =>
                        handleFieldChange(
                          "accountNumber",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      onBlur={(e) =>
                        handleFieldBlur("accountNumber", e.target.value)
                      }
                      className={
                        validationErrors.accountNumber ? "border-red-500" : ""
                      }
                      maxLength={18}
                      required
                    />
                    {validationErrors.accountNumber && (
                      <p className="text-sm text-red-500">
                        {validationErrors.accountNumber}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code *</Label>
                    <Input
                      id="ifscCode"
                      placeholder="Enter IFSC code (e.g., ABCD0123456)"
                      value={kycFormData.ifscCode}
                      onChange={(e) =>
                        handleFieldChange(
                          "ifscCode",
                          e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                        )
                      }
                      onBlur={(e) =>
                        handleFieldBlur("ifscCode", e.target.value)
                      }
                      className={
                        validationErrors.ifscCode ? "border-red-500" : ""
                      }
                      maxLength={11}
                      required
                    />
                    {validationErrors.ifscCode && (
                      <p className="text-sm text-red-500">
                        {validationErrors.ifscCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Upload Sections */}
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Document Upload</h3>

                {/* Section 1: Employee Photo */}
                <div className="space-y-4 border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-700">
                    Employee Photo
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="employeePhoto">Employee Photo *</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 ${
                        validationErrors.employeePhoto
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}>
                      {employeePhotoFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileImage className="h-4 w-4" />
                            <span className="text-sm">
                              {employeePhotoFile.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEmployeePhotoFile(null);
                              setValidationErrors({
                                ...validationErrors,
                                employeePhoto: "",
                              });
                            }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            Click to upload employee photo
                          </p>
                          <Input
                            id="employeePhoto"
                            type="file"
                            accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) =>
                              handleFileUpload(
                                e.target.files[0],
                                "employeePhoto"
                              )
                            }
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById("employeePhoto").click()
                            }>
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    {validationErrors.employeePhoto && (
                      <p className="text-sm text-red-500">
                        {validationErrors.employeePhoto}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 2: PAN Card Photo */}
                <div className="space-y-4 border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-700">
                    PAN Card Photo
                  </h4>
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
                            accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
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
                </div>

                {/* Section 3: Aadhaar Card Photo (Front and Back) */}
                <div className="space-y-4 border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-700">
                    Aadhaar Card Photo
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaarFront">
                        Aadhaar Card - Front *
                      </Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 ${
                          validationErrors.aadhaarFront
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}>
                        {aadhaarFrontFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileImage className="h-4 w-4" />
                              <span className="text-sm">
                                {aadhaarFrontFile.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAadhaarFrontFile(null);
                                setValidationErrors({
                                  ...validationErrors,
                                  aadhaarFront: "",
                                });
                              }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500 mb-2">
                              Upload Aadhaar front
                            </p>
                            <Input
                              id="aadhaarFront"
                              type="file"
                              accept=".pdf,image/jpeg,image/jpg,image/png"
                              onChange={(e) =>
                                handleFileUpload(
                                  e.target.files[0],
                                  "aadhaarFront"
                                )
                              }
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document.getElementById("aadhaarFront").click()
                              }>
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                      {validationErrors.aadhaarFront && (
                        <p className="text-sm text-red-500">
                          {validationErrors.aadhaarFront}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aadhaarBack">Aadhaar Card - Back *</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 ${
                          validationErrors.aadhaarBack
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}>
                        {aadhaarBackFile ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileImage className="h-4 w-4" />
                              <span className="text-sm">
                                {aadhaarBackFile.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAadhaarBackFile(null);
                                setValidationErrors({
                                  ...validationErrors,
                                  aadhaarBack: "",
                                });
                              }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500 mb-2">
                              Upload Aadhaar back
                            </p>
                            <Input
                              id="aadhaarBack"
                              type="file"
                              accept=".pdf,image/jpeg,image/jpg,image/png"
                              onChange={(e) =>
                                handleFileUpload(
                                  e.target.files[0],
                                  "aadhaarBack"
                                )
                              }
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document.getElementById("aadhaarBack").click()
                              }>
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                      {validationErrors.aadhaarBack && (
                        <p className="text-sm text-red-500">
                          {validationErrors.aadhaarBack}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: 3 Months Salary Slips */}
                <div className="space-y-4 border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-700">
                    3 Months Salary Slips
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salarySlipMonth1">
                        Salary Slip - Month 1
                      </Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 ${
                          validationErrors.salarySlipMonth1
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}>
                        {salarySlipMonth1 ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileImage className="h-4 w-4" />
                              <span className="text-sm">
                                {salarySlipMonth1.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSalarySlipMonth1(null);
                                setValidationErrors({
                                  ...validationErrors,
                                  salarySlipMonth1: "",
                                });
                              }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500 mb-2">
                              Upload salary slip
                            </p>
                            <Input
                              id="salarySlipMonth1"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileUpload(
                                  e.target.files[0],
                                  "salarySlipMonth1"
                                )
                              }
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById("salarySlipMonth1")
                                  .click()
                              }>
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                      {validationErrors.salarySlipMonth1 && (
                        <p className="text-sm text-red-500">
                          {validationErrors.salarySlipMonth1}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salarySlipMonth2">
                        Salary Slip - Month 2
                      </Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 ${
                          validationErrors.salarySlipMonth2
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}>
                        {salarySlipMonth2 ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileImage className="h-4 w-4" />
                              <span className="text-sm">
                                {salarySlipMonth2.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSalarySlipMonth2(null);
                                setValidationErrors({
                                  ...validationErrors,
                                  salarySlipMonth2: "",
                                });
                              }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500 mb-2">
                              Upload salary slip
                            </p>
                            <Input
                              id="salarySlipMonth2"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileUpload(
                                  e.target.files[0],
                                  "salarySlipMonth2"
                                )
                              }
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById("salarySlipMonth2")
                                  .click()
                              }>
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                      {validationErrors.salarySlipMonth2 && (
                        <p className="text-sm text-red-500">
                          {validationErrors.salarySlipMonth2}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salarySlipMonth3">
                        Salary Slip - Month 3
                      </Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 ${
                          validationErrors.salarySlipMonth3
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}>
                        {salarySlipMonth3 ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileImage className="h-4 w-4" />
                              <span className="text-sm">
                                {salarySlipMonth3.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSalarySlipMonth3(null);
                                setValidationErrors({
                                  ...validationErrors,
                                  salarySlipMonth3: "",
                                });
                              }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-xs text-gray-500 mb-2">
                              Upload salary slip
                            </p>
                            <Input
                              id="salarySlipMonth3"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileUpload(
                                  e.target.files[0],
                                  "salarySlipMonth3"
                                )
                              }
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById("salarySlipMonth3")
                                  .click()
                              }>
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
                      {validationErrors.salarySlipMonth3 && (
                        <p className="text-sm text-red-500">
                          {validationErrors.salarySlipMonth3}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 5: Bank Proof */}
                <div className="space-y-4 border-b pb-4">
                  <h4 className="text-md font-semibold text-gray-700">
                    Bank Proof (Cancelled Cheque/Passbook)
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="bankProof">Bank Proof</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 ${
                        validationErrors.bankProof
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}>
                      {bankProofFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileImage className="h-4 w-4" />
                            <span className="text-sm">
                              {bankProofFile.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBankProofFile(null);
                              setValidationErrors({
                                ...validationErrors,
                                bankProof: "",
                              });
                            }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            Upload cancelled cheque or passbook (PDF or Image)
                          </p>
                          <Input
                            id="bankProof"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleFileUpload(e.target.files[0], "bankProof")
                            }
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById("bankProof").click()
                            }>
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    {validationErrors.bankProof && (
                      <p className="text-sm text-red-500">
                        {validationErrors.bankProof}
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
