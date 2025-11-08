import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function EmployeeLeave() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'sick'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check KYC status first
        if (user?.email) {
          const kycInfo = await apiService.getKycStatus(user.email);
          setKycStatus(kycInfo.status);
          
          if (kycInfo.status === 'approved') {
            // Load leaves data - only for current user
            const leavesData = await apiService.getLeaves(user.email);
            setLeaves(leavesData);
          }
        }
      } catch (err) {
        console.error('Error loading leaves data:', err);
        toast.error('Failed to load leaves data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    if (!user?.email) {
      toast.error('User email not found. Please log in again.');
      return;
    }
    
    try {
      // Include user email and name in the leave data
      const leaveData = {
        ...leaveForm,
        email: user.email,
        name: user.name || user.email.split('@')[0]
      };
      
      console.log('Submitting leave data:', leaveData);
      await apiService.createLeave(leaveData);
      toast.success('Leave application submitted successfully!');
      setShowLeaveForm(false);
      setLeaveForm({
        startDate: '',
        endDate: '',
        reason: '',
        type: 'sick'
      });
      // Reload leaves data - only for current user
      const leavesData = await apiService.getLeaves(user.email);
      setLeaves(leavesData);
    } catch (err) {
      toast.error('Failed to submit leave application');
      console.error('Leave submission error:', err);
    }
  };

  const getLeaveStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
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
          <Badge variant="secondary">
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading leaves...</p>
        </div>
      </div>
    );
  }

  if (kycStatus !== 'approved') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">KYC Required</h2>
          <p className="text-gray-600 mb-4">
            You need to complete and get your KYC approved to access leave application features.
          </p>
          <Button asChild>
            <a href="/profile">Complete KYC</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Apply for leaves and track your leave applications
          </p>
        </div>
        <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>
                Submit a new leave application
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Leave Type</Label>
                <select
                  id="type"
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="vacation">Vacation</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for leave"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowLeaveForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Application
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Your Leave Applications
          </CardTitle>
          <CardDescription>
            Track the status of your leave applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaves.length > 0 ? (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{leave.type} Leave</p>
                      <p className="text-sm text-gray-600">
                        {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'Invalid Date'} - {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'Invalid Date'}
                      </p>
                      <p className="text-sm text-gray-500">{leave.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getLeaveStatusBadge(leave.status)}
                    <span className="text-sm text-gray-500">
                      {leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString() : 'Invalid Date'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave applications yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Submit your first leave application using the button above
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
          <CardDescription>
            Your available leave days for this year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">12</p>
              <p className="text-sm text-gray-600">Sick Leave</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">21</p>
              <p className="text-sm text-gray-600">Personal Leave</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-purple-600">5</p>
              <p className="text-sm text-gray-600">Emergency Leave</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
