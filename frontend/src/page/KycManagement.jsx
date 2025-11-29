import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  FileImage,
  User,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function KycManagement() {
  const { user, isLoading } = useAuth();
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Load KYC submissions
  useEffect(() => {
    const loadKycSubmissions = async () => {
      try {
        setLoading(true);
        const data = await apiService.getKycSubmissions();
        console.log("📥 Loaded KYC submissions from API:", data);

        // Log document counts for each submission
        data.forEach((submission) => {
          let docCount = 0;
          if (submission.documents) {
            if (Array.isArray(submission.documents)) {
              docCount = submission.documents.length;
            } else if (
              submission.documents.documents &&
              Array.isArray(submission.documents.documents)
            ) {
              docCount = submission.documents.documents.length;
            }
          }
          console.log(
            `📄 ${submission.fullName} (ID: ${submission.id}): ${docCount} documents`,
            submission.documents && Array.isArray(submission.documents)
              ? submission.documents.map((d) => d.type)
              : submission.documents?.documents
              ? submission.documents.documents.map((d) => d.type)
              : []
          );
        });

        setKycSubmissions(data);
      } catch (err) {
        setError("Failed to load KYC submissions");
        console.error("Error loading KYC submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    loadKycSubmissions();
  }, []);

  // Role-based access control - only admin, manager, and HR can access
  if (
    !isLoading &&
    user &&
    user.role !== "admin" &&
    user.role !== "manager" &&
    user.role !== "hr"
  ) {
    return <Navigate to="/" replace />;
  }

  // Filter submissions
  const filteredSubmissions = kycSubmissions.filter((submission) => {
    const matchesSearch =
      submission.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle status update
  const handleStatusUpdate = async (submissionId, newStatus) => {
    try {
      console.log("Updating KYC status:", { submissionId, newStatus });
      const result = await apiService.updateKycStatus(submissionId, newStatus);
      console.log("KYC status update result:", result);

      setKycSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === submissionId ? { ...sub, status: newStatus } : sub
        )
      );
      toast.success(`KYC status updated to ${newStatus}`);

      // Close the dialog after successful update
      setDialogOpen(false);
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Error updating KYC status:", err);
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  // Reload KYC submissions after review
  const reloadSubmissions = async () => {
    try {
      const data = await apiService.getKycSubmissions();
      setKycSubmissions(data);
      // Update selected submission if it exists
      if (selectedSubmission) {
        const updated = data.find(s => s.id === selectedSubmission.id);
        if (updated) setSelectedSubmission(updated);
      }
    } catch (err) {
      console.error("Error reloading submissions:", err);
    }
  };

  // Map document type to API document type
  const getDocumentTypeForAPI = (docType) => {
    if (!docType) return null;
    
    const normalizedType = docType.toLowerCase().trim();
    
    // Direct mapping
    const typeMap = {
      'employee photo': 'employee_photo',
      'selfie': 'employee_photo',
      'pan card': 'pan_card',
      'pan card photo': 'pan_card',
      'aadhaar card - front': 'aadhaar_front',
      'aadhaar front': 'aadhaar_front',
      'aadhaar card - back': 'aadhaar_back',
      'aadhaar back': 'aadhaar_back',
      'aadhar card': 'aadhaar_front',
      'salary slip - month 1': 'salary_slip_month_1',
      'salary slip month 1': 'salary_slip_month_1',
      'salary slip - month 2': 'salary_slip_month_2',
      'salary slip month 2': 'salary_slip_month_2',
      'salary slip - month 3': 'salary_slip_month_3',
      'salary slip month 3': 'salary_slip_month_3',
      'bank proof (cancelled cheque/passbook)': 'bank_proof',
      'bank proof': 'bank_proof',
      'cancelled cheque': 'bank_proof',
      'passbook': 'bank_proof',
    };
    
    // Check direct match first
    if (typeMap[normalizedType]) {
      return typeMap[normalizedType];
    }
    
    // Check partial matches
    if (normalizedType.includes('employee photo') || normalizedType.includes('selfie')) {
      return 'employee_photo';
    }
    if (normalizedType.includes('pan')) {
      return 'pan_card';
    }
    if (normalizedType.includes('aadhaar front') || (normalizedType.includes('aadhaar') && normalizedType.includes('front'))) {
      return 'aadhaar_front';
    }
    if (normalizedType.includes('aadhaar back') || (normalizedType.includes('aadhaar') && normalizedType.includes('back'))) {
      return 'aadhaar_back';
    }
    if (normalizedType.includes('salary slip') && normalizedType.includes('1')) {
      return 'salary_slip_month_1';
    }
    if (normalizedType.includes('salary slip') && normalizedType.includes('2')) {
      return 'salary_slip_month_2';
    }
    if (normalizedType.includes('salary slip') && normalizedType.includes('3')) {
      return 'salary_slip_month_3';
    }
    if (normalizedType.includes('bank proof') || normalizedType.includes('cancelled cheque') || normalizedType.includes('passbook')) {
      return 'bank_proof';
    }
    
    return null;
  };

  // Handle document rejection
  const handleRejectDocument = async () => {
    if (!rejectRemark.trim()) {
      toast.error("Please provide a remark for rejection");
      return;
    }

    if (!selectedDocument || !selectedSubmission) {
      toast.error("Document or submission not selected");
      return;
    }

    setRejecting(true);
    try {
      // Parse documents array to find education documents if needed
      let documentsArray = [];
      if (selectedSubmission.documents) {
        if (typeof selectedSubmission.documents === "string") {
          try {
            const parsed = JSON.parse(selectedSubmission.documents);
            documentsArray = parsed.documents || (Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            documentsArray = [];
          }
        } else if (selectedSubmission.documents.documents && Array.isArray(selectedSubmission.documents.documents)) {
          documentsArray = selectedSubmission.documents.documents;
        } else if (Array.isArray(selectedSubmission.documents)) {
          documentsArray = selectedSubmission.documents;
        }
      }

      // Get document type - try from documentType field first, then type field
      const docType = selectedDocument.documentType || selectedDocument.type;
      const documentType = getDocumentTypeForAPI(docType);
      
      if (!documentType) {
        // Check if it's an education document
        if (docType?.toLowerCase().includes('education') || docType?.toLowerCase().includes('educational')) {
          // For education documents, we need to find the index
          const educationDocs = documentsArray.filter(d => 
            d.type?.toLowerCase().includes('education') || d.type?.toLowerCase().includes('educational')
          );
          const index = educationDocs.findIndex(d => 
            (d.path === selectedDocument.path || d.originalName === selectedDocument.originalName) && 
            (d.type === selectedDocument.type || d.type === docType)
          );
          if (index >= 0) {
            await apiService.reviewEducationDocument(
              selectedSubmission.id,
              index,
              'reject',
              rejectRemark
            );
          } else {
            toast.error("Could not determine education document index. Please try again.");
            return;
          }
        } else {
          toast.error(`Could not determine document type for: ${docType || 'Unknown'}. Please contact support.`);
          console.error("Document type mapping failed:", { docType, selectedDocument });
          return;
        }
      } else {
        await apiService.reviewDocument(
          selectedSubmission.id,
          documentType,
          'reject',
          rejectRemark
        );
      }

      toast.success("Document rejected successfully. Employee will be notified.");
      setRejectDialogOpen(false);
      setRejectRemark("");
      setSelectedDocument(null);
      await reloadSubmissions();
    } catch (error) {
      toast.error(error.message || "Failed to reject document");
    } finally {
      setRejecting(false);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
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
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading KYC submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Management</h1>
          <p className="text-muted-foreground">
            Review and manage employee KYC submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Total Submissions</Label>
              <div className="text-2xl font-bold">
                {filteredSubmissions.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Submissions</CardTitle>
          <CardDescription>
            Review employee KYC documents and update status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{submission.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{submission.employeeId}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        let docCount = 0;
                        if (submission.documents) {
                          if (
                            submission.documents.documents &&
                            Array.isArray(submission.documents.documents)
                          ) {
                            docCount = submission.documents.documents.length;
                          } else if (Array.isArray(submission.documents)) {
                            docCount = submission.documents.length;
                          }
                        }
                        return (
                          <>
                            {Array.from({ length: Math.min(docCount, 3) }).map(
                              (_, i) => (
                                <FileImage
                                  key={i}
                                  className="h-4 w-4 text-primary"
                                />
                              )
                            )}
                            <span className="text-sm text-gray-500">
                              {docCount} file{docCount !== 1 ? "s" : ""}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog
                        open={
                          dialogOpen && selectedSubmission?.id === submission.id
                        }
                        onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) {
                            setSelectedSubmission(null);
                          }
                        }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setDialogOpen(true);
                            }}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>KYC Submission Details</DialogTitle>
                            <DialogDescription>
                              Review documents and update status for{" "}
                              {submission.fullName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Employee Basic Info */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="text-lg font-semibold">
                                Basic Information
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-semibold">
                                    Full Name
                                  </Label>
                                  <p className="text-sm text-gray-700">
                                    {submission.fullName || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="font-semibold">
                                    Employee ID
                                  </Label>
                                  <p className="text-sm text-gray-700">
                                    {submission.employeeId || "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="font-semibold">
                                    Date of Birth
                                  </Label>
                                  <p className="text-sm text-gray-700">
                                    {submission.dob
                                      ? new Date(
                                          submission.dob
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="font-semibold">
                                    Address
                                  </Label>
                                  <p className="text-sm text-gray-700">
                                    {submission.address || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Personal Information */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="text-lg font-semibold">
                                Personal Information
                              </h3>
                              {(() => {
                                // Handle both new format (object with personalInfo) and old format
                                let personalInfo = {};

                                // Check if personalInfo is at top level (new format from backend)
                                if (submission.personalInfo) {
                                  personalInfo = submission.personalInfo;
                                  console.log(
                                    "📋 Using top-level personalInfo:",
                                    personalInfo
                                  );
                                } else if (
                                  submission.documents &&
                                  typeof submission.documents === "object" &&
                                  !Array.isArray(submission.documents)
                                ) {
                                  // Fallback: check if documents is the old format with personalInfo
                                  personalInfo =
                                    submission.documents.personalInfo || {};
                                  console.log(
                                    "📋 Using nested personalInfo:",
                                    personalInfo
                                  );
                                } else {
                                  console.log(
                                    "⚠️ No personalInfo found for",
                                    submission.fullName
                                  );
                                }

                                const panNumber = personalInfo.panNumber || "";
                                const aadharNumber =
                                  personalInfo.aadharNumber ||
                                  submission.documentNumber ||
                                  "";
                                const phoneNumber =
                                  personalInfo.phoneNumber || "";

                                return (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="font-semibold">
                                        PAN Number
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {panNumber || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        Aadhar Number
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {aadharNumber || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        Phone Number
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {phoneNumber || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Emergency Contact Details */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="text-lg font-semibold">
                                Emergency Contact Details
                              </h3>
                              {(() => {
                                let emergencyContact = {};

                                // Check if emergencyContact is at top level (new format from backend)
                                if (submission.emergencyContact) {
                                  emergencyContact =
                                    submission.emergencyContact;
                                } else if (
                                  submission.documents &&
                                  typeof submission.documents === "object" &&
                                  !Array.isArray(submission.documents)
                                ) {
                                  // Fallback: check if documents is the old format with emergencyContact
                                  emergencyContact =
                                    submission.documents.emergencyContact || {};
                                }

                                return (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="font-semibold">
                                        Contact Name
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {emergencyContact.name || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        Contact Phone
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {emergencyContact.phone || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        Relation
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {emergencyContact.relation || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        Contact Address
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {emergencyContact.address || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Bank Account Details */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="text-lg font-semibold">
                                Bank Account Details
                              </h3>
                              {(() => {
                                let bankAccount = {};

                                // Check if bankAccount is at top level (new format from backend)
                                if (submission.bankAccount) {
                                  bankAccount = submission.bankAccount;
                                } else if (
                                  submission.documents &&
                                  typeof submission.documents === "object" &&
                                  !Array.isArray(submission.documents)
                                ) {
                                  // Fallback: check if documents is the old format with bankAccount
                                  bankAccount =
                                    submission.documents.bankAccount || {};
                                }

                                return (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="font-semibold">
                                        Bank Name
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {bankAccount.bankName || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        Bank Branch
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {bankAccount.bankBranch || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        Account Number
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {bankAccount.accountNumber || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">
                                        IFSC Code
                                      </Label>
                                      <p className="text-sm text-gray-700">
                                        {bankAccount.ifscCode || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Documents */}
                            <div className="space-y-4 border-b pb-4">
                              <h3 className="text-lg font-semibold">
                                Uploaded Documents
                              </h3>
                              {(() => {
                                // Extract documents array from different possible formats
                                let documentsArray = [];

                                // Try to parse documents from different formats
                                if (submission.documents) {
                                  if (
                                    typeof submission.documents === "string"
                                  ) {
                                    try {
                                      const parsed = JSON.parse(
                                        submission.documents
                                      );
                                      if (
                                        parsed.documents &&
                                        Array.isArray(parsed.documents)
                                      ) {
                                        documentsArray = parsed.documents;
                                      } else if (Array.isArray(parsed)) {
                                        documentsArray = parsed;
                                      }
                                    } catch (e) {
                                      console.error(
                                        "Error parsing documents JSON:",
                                        e
                                      );
                                    }
                                  } else if (
                                    submission.documents.documents &&
                                    Array.isArray(
                                      submission.documents.documents
                                    )
                                  ) {
                                    documentsArray =
                                      submission.documents.documents;
                                  } else if (
                                    Array.isArray(submission.documents)
                                  ) {
                                    documentsArray = submission.documents;
                                  }
                                }

                                console.log(
                                  "📄 Documents for",
                                  submission.fullName,
                                  ":",
                                  documentsArray
                                );

                                if (documentsArray.length === 0) {
                                  return (
                                    <p className="text-sm text-gray-500">
                                      No documents uploaded
                                    </p>
                                  );
                                }

                                // Helper function to get document URL
                                const getDocumentUrl = (doc) => {
                                  const apiUrl =
                                    import.meta.env.VITE_API_URL ||
                                    (import.meta.env.PROD
                                      ? ""
                                      : "http://localhost:3001");
                                  let baseUrl = apiUrl.replace(/\/api\/?$/, "");
                                  if (!baseUrl || baseUrl === "/api") {
                                    // In production, use same origin
                                    if (
                                      import.meta.env.PROD ||
                                      (typeof window !== "undefined" &&
                                        window.location.hostname !==
                                          "localhost")
                                    ) {
                                      baseUrl =
                                        typeof window !== "undefined"
                                          ? window.location.origin
                                          : "";
                                    } else {
                                      baseUrl = "http://localhost:3001";
                                    }
                                  }
                                  return `${baseUrl}${doc.path}`;
                                };

                                // Helper function to render a document card
                                const renderDocumentCard = (doc, index) => {
                                  const filename =
                                    doc.originalName || doc.path?.split('/').pop() || "Unknown file";
                                  return (
                                    <div
                                      key={index}
                                      className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                      {/* Upper div - Text content */}
                                      <div className="mb-3">
                                        <span className="font-medium text-sm block truncate">
                                          {filename}
                                        </span>
                                        {doc.type && (
                                          <span className="text-xs text-gray-500 block mt-1">
                                            {doc.type}
                                          </span>
                                        )}
                                      </div>
                                      {/* Lower div - Buttons */}
                                      <div className="flex gap-2 flex-wrap">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const url = getDocumentUrl(doc);
                                            if (url) {
                                              window.open(url, "_blank");
                                            } else {
                                              toast.error("Document URL not available");
                                            }
                                          }}>
                                          <Eye className="h-4 w-4 mr-1" />
                                          View
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const url = getDocumentUrl(doc);
                                            if (url) {
                                              const link = document.createElement('a');
                                              link.href = url;
                                              link.download = filename;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                            } else {
                                              toast.error("Document URL not available");
                                            }
                                          }}>
                                          <Download className="h-4 w-4 mr-1" />
                                          Download
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedDocument({ ...doc, documentType: doc.type });
                                            setRejectRemark("");
                                            setRejectDialogOpen(true);
                                          }}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Reject
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                };

                                // Categorize documents by type
                                const selfieDocs = documentsArray.filter(
                                  (doc) => {
                                    const type = doc.type?.toLowerCase() || "";
                                    return (
                                      type.includes("selfie") ||
                                      type.includes("employee photo")
                                    );
                                  }
                                );

                                const panDocs = documentsArray.filter((doc) => {
                                  const type = doc.type?.toLowerCase() || "";
                                  return type.includes("pan");
                                });

                                const aadhaarDocs = documentsArray.filter(
                                  (doc) => {
                                    const type = doc.type?.toLowerCase() || "";
                                    return (
                                      type.includes("aadhaar") ||
                                      type.includes("aadhar card")
                                    );
                                  }
                                );

                                const salarySlipDocs = documentsArray.filter(
                                  (doc) => {
                                    const type = doc.type?.toLowerCase() || "";
                                    return type.includes("salary slip");
                                  }
                                );

                                const bankProofDocs = documentsArray.filter(
                                  (doc) => {
                                    const type = doc.type?.toLowerCase() || "";
                                    return (
                                      type.includes("bank proof") ||
                                      type.includes("cancelled cheque") ||
                                      type.includes("passbook")
                                    );
                                  }
                                );

                                const otherDocs = documentsArray.filter(
                                  (doc) => {
                                    const type = doc.type?.toLowerCase() || "";
                                    return (
                                      !type.includes("selfie") &&
                                      !type.includes("employee photo") &&
                                      !type.includes("pan") &&
                                      !type.includes("aadhaar") &&
                                      !type.includes("aadhar card") &&
                                      !type.includes("salary slip") &&
                                      !type.includes("bank proof") &&
                                      !type.includes("cancelled cheque") &&
                                      !type.includes("passbook")
                                    );
                                  }
                                );

                                return (
                                  <div className="space-y-6">
                                    {/* Selfie Section */}
                                    {selfieDocs.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-md font-semibold text-gray-700 border-b pb-2">
                                          Selfie
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                          {selfieDocs.map((doc, index) =>
                                            renderDocumentCard(
                                              doc,
                                              `selfie-${index}`
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* PAN Card Section */}
                                    {panDocs.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-md font-semibold text-gray-700 border-b pb-2">
                                          PAN Card
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                          {panDocs.map((doc, index) =>
                                            renderDocumentCard(
                                              doc,
                                              `pan-${index}`
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Aadhaar Card Section */}
                                    {aadhaarDocs.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-md font-semibold text-gray-700 border-b pb-2">
                                          Aadhaar Card
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                          {aadhaarDocs.map((doc, index) =>
                                            renderDocumentCard(
                                              doc,
                                              `aadhaar-${index}`
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Salary Slip Section */}
                                    {salarySlipDocs.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-md font-semibold text-gray-700 border-b pb-2">
                                          Salary Slip (3 Months)
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                          {salarySlipDocs.map((doc, index) =>
                                            renderDocumentCard(
                                              doc,
                                              `salary-${index}`
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Bank Proof Section */}
                                    {bankProofDocs.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-md font-semibold text-gray-700 border-b pb-2">
                                          Bank Proof (Cancelled Cheque/Passbook)
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                          {bankProofDocs.map((doc, index) =>
                                            renderDocumentCard(
                                              doc,
                                              `bank-${index}`
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Other Documents Section */}
                                    {otherDocs.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-md font-semibold text-gray-700 border-b pb-2">
                                          Other Documents
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                          {otherDocs.map((doc, index) =>
                                            renderDocumentCard(
                                              doc,
                                              `other-${index}`
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Status Update */}
                            <div className="flex items-center justify-between pt-4 border-t">
                              <div>
                                <Label className="font-semibold">
                                  Current Status:
                                </Label>
                                <div className="mt-2">
                                  {getStatusBadge(submission.status)}
                                </div>
                                {submission.reviewedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Reviewed on:{" "}
                                    {new Date(
                                      submission.reviewedAt
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                                {submission.remarks && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Remarks: {submission.remarks}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-4">
                                <Label className="font-semibold">
                                  Update Status:
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      submission.id,
                                      "approved"
                                    )
                                  }
                                  disabled={submission.status === "approved"}
                                  className="bg-primary/10 hover:bg-primary/20">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusUpdate(
                                      submission.id,
                                      "rejected"
                                    )
                                  }
                                  disabled={submission.status === "rejected"}
                                  className="bg-red-50 hover:bg-red-100">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Document Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document. The employee will be notified and can re-upload it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocument && (
              <div>
                <Label>Document</Label>
                <p className="text-sm text-gray-700 font-medium">{selectedDocument.type}</p>
                {selectedDocument.originalName && (
                  <p className="text-xs text-gray-500 mt-1">{selectedDocument.originalName}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejectRemark">
                Rejection Remark <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectRemark"
                placeholder="Enter reason for rejection (e.g., Document is unclear, Wrong document uploaded, etc.)"
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-gray-500">
                This remark will be shown to the employee. They will receive a notification and can re-upload the document.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectRemark("");
                  setSelectedDocument(null);
                }}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectDocument}
                disabled={!rejectRemark.trim() || rejecting}
              >
                {rejecting ? "Rejecting..." : "Reject Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
