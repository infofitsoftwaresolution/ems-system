import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  User
} from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function KycManagement() {
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Load KYC submissions
  useEffect(() => {
    const loadKycSubmissions = async () => {
      try {
        setLoading(true);
        const data = await apiService.getKycSubmissions();
        setKycSubmissions(data);
      } catch (err) {
        setError('Failed to load KYC submissions');
        console.error('Error loading KYC submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadKycSubmissions();
  }, []);

  // Filter submissions
  const filteredSubmissions = kycSubmissions.filter(submission => {
    const matchesSearch = submission.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle status update
  const handleStatusUpdate = async (submissionId, newStatus) => {
    try {
      console.log('Updating KYC status:', { submissionId, newStatus });
      const result = await apiService.updateKycStatus(submissionId, newStatus);
      console.log('KYC status update result:', result);
      
      setKycSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: newStatus }
            : sub
        )
      );
      toast.success(`KYC status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating KYC status:', err);
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Total Submissions</Label>
              <div className="text-2xl font-bold">{filteredSubmissions.length}</div>
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
                      {submission.documents?.map((doc, index) => (
                        <FileImage key={index} className="h-4 w-4 text-blue-500" />
                      ))}
                      <span className="text-sm text-gray-500">
                        {submission.documents?.length || 0} files
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>KYC Submission Details</DialogTitle>
                            <DialogDescription>
                              Review documents and update status for {submission.fullName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Employee Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="font-semibold">Full Name</Label>
                                <p>{submission.fullName}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Employee ID</Label>
                                <p>{submission.employeeId}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">PAN Number</Label>
                                <p>{submission.panNumber}</p>
                              </div>
                              <div>
                                <Label className="font-semibold">Aadhar Number</Label>
                                <p>{submission.aadharNumber}</p>
                              </div>
                            </div>

                            {/* Documents */}
                            <div>
                              <Label className="font-semibold">Uploaded Documents</Label>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                {submission.documents?.map((doc, index) => (
                                  <div key={index} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium">{doc.type}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`http://localhost:3001${doc.path}`, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                    <p className="text-sm text-gray-500">{doc.originalName}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Status Update */}
                            <div className="flex items-center space-x-4">
                              <Label className="font-semibold">Update Status:</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(submission.id, 'approved')}
                                disabled={submission.status === 'approved'}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                                disabled={submission.status === 'rejected'}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
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
    </div>
  );
}
