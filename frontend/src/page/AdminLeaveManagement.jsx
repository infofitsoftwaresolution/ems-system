import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Mail,
  Filter
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function AdminLeaveManagement() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [reviewDialog, setReviewDialog] = useState({ open: false, leave: null });
  const [reviewData, setReviewData] = useState({
    status: "approved",
    remarks: ""
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const leavesData = await apiService.getLeaves();
      setLeaves(leavesData);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewLeave = async () => {
    if (!reviewDialog.leave) return;

    try {
      await apiService.reviewLeave(reviewDialog.leave.id, {
        ...reviewData,
        reviewedBy: user?.name || user?.email
      });
      
      toast.success(`Leave ${reviewData.status} successfully`);
      setReviewDialog({ open: false, leave: null });
      setReviewData({ status: "approved", remarks: "" });
      fetchLeaves();
    } catch (error) {
      console.error("Error reviewing leave:", error);
      toast.error("Failed to review leave request");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      'sick': 'bg-red-100 text-red-800',
      'casual': 'bg-blue-100 text-blue-800',
      'earned': 'bg-green-100 text-green-800',
      'unpaid': 'bg-gray-100 text-gray-800',
      'other': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredLeaves = leaves.filter(leave => {
    if (selectedStatus === "all") return true;
    return leave.status === selectedStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading leave requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground">Review and manage employee leave requests</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="status-filter">Status</Label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="text-sm text-muted-foreground">
              Showing {filteredLeaves.length} of {leaves.length} requests
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests ({filteredLeaves.length})</CardTitle>
          <CardDescription>
            Review and approve/reject employee leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeaves.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
              <p className="text-muted-foreground">
                {selectedStatus === "all" 
                  ? "No leave requests have been submitted yet."
                  : `No ${selectedStatus} leave requests found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeaves.map((leave) => (
                <div key={leave.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{leave.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{leave.email}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground">Leave Type</div>
                          <Badge className={getLeaveTypeColor(leave.type)}>
                            {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'Invalid Date'} - {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'Invalid Date'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Applied On</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString() : 'Invalid Date'}</span>
                          </div>
                        </div>
                      </div>

                      {leave.reason && (
                        <div className="mb-3">
                          <div className="text-sm text-muted-foreground mb-1">Reason</div>
                          <p className="text-sm bg-gray-50 p-2 rounded">{leave.reason}</p>
                        </div>
                      )}

                      {leave.reviewedAt && (
                        <div className="text-sm text-muted-foreground">
                          Reviewed by {leave.reviewedBy} on {leave.reviewedAt ? new Date(leave.reviewedAt).toLocaleDateString() : 'Invalid Date'}
                          {leave.remarks && (
                            <div className="mt-1">
                              <strong>Remarks:</strong> {leave.remarks}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(leave.status)}
                      {leave.status === 'pending' && (
                        <Dialog 
                          open={reviewDialog.open && reviewDialog.leave?.id === leave.id} 
                          onOpenChange={(open) => setReviewDialog({ open, leave: open ? leave : null })}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Leave Request</DialogTitle>
                              <DialogDescription>
                                Review and approve or reject this leave application.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Employee</Label>
                                <p className="font-medium">{leave.name} ({leave.email})</p>
                              </div>
                              <div>
                                <Label>Leave Details</Label>
                                <p className="text-sm text-muted-foreground">
                                  {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} leave from {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                                </p>
                              </div>
                              {leave.reason && (
                                <div>
                                  <Label>Reason</Label>
                                  <p className="text-sm bg-gray-50 p-2 rounded">{leave.reason}</p>
                                </div>
                              )}
                              <div>
                                <Label htmlFor="status">Decision</Label>
                                <select
                                  id="status"
                                  value={reviewData.status}
                                  onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
                                  className="w-full px-3 py-2 border rounded-md"
                                >
                                  <option value="approved">Approve</option>
                                  <option value="rejected">Reject</option>
                                </select>
                              </div>
                              <div>
                                <Label htmlFor="remarks">Remarks (Optional)</Label>
                                <Textarea
                                  id="remarks"
                                  value={reviewData.remarks}
                                  onChange={(e) => setReviewData({...reviewData, remarks: e.target.value})}
                                  placeholder="Add any remarks or comments..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setReviewDialog({ open: false, leave: null })}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={handleReviewLeave}>
                                  {reviewData.status === 'approved' ? 'Approve' : 'Reject'} Leave
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
