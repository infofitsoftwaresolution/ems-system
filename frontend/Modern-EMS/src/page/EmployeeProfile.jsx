import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileImage
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function EmployeeProfile() {
  const { user } = useAuth();
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

  // Load KYC status (only for non-admin users)
  useEffect(() => {
    const loadKycStatus = async () => {
      try {
        setLoading(true);
        // Only load KYC status for non-admin users
        if (user?.email && user?.role !== 'admin') {
          const kycInfo = await apiService.getKycStatus(user.email);
          console.log('KYC Info received:', kycInfo);
          console.log('KYC Status:', kycInfo.status);
          console.log('KYC Data:', kycInfo.data);
          
          // Handle different possible status values
          if (!kycInfo || !kycInfo.status) {
            setKycStatus('not_submitted');
          } else {
            // Map backend status to frontend status
            let frontendStatus = kycInfo.status;
            if (kycInfo.status === 'pending' && kycInfo.message === 'No KYC request found') {
              frontendStatus = 'not_submitted';
            }
            setKycStatus(frontendStatus);
            setKycData(kycInfo.data || kycInfo);
          }
        } else if (user?.role === 'admin') {
          // Admin users don't need KYC
          setKycStatus('not_required');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading KYC status:', err);
        setKycStatus('not_submitted');
      } finally {
        setLoading(false);
      }
    };
    loadKycStatus();
  }, [user]);

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    
    if (!kycFormData.panNumber || !kycFormData.aadharNumber || !kycFormData.address || !kycFormData.dob) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!panCardFile || !aadharCardFile) {
      toast.error("Please upload both PAN card and Aadhar card photos");
      return;
    }

    setSubmittingKyc(true);
    try {
      console.log('Starting KYC submission...');
      console.log('Form data:', kycFormData);
      console.log('Files:', { panCardFile, aadharCardFile });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('panNumber', kycFormData.panNumber);
      formData.append('aadharNumber', kycFormData.aadharNumber);
      formData.append('address', kycFormData.address);
      formData.append('phoneNumber', kycFormData.phoneNumber);
      formData.append('emergencyContact', kycFormData.emergencyContact);
      formData.append('emergencyPhone', kycFormData.emergencyPhone);
      formData.append('panCard', panCardFile);
      formData.append('aadharCard', aadharCardFile);
      
      // Add required fields for backend
      formData.append('dob', kycFormData.dob);
      formData.append('documentType', kycFormData.documentType);
      formData.append('documentNumber', kycFormData.aadharNumber);
      
      // Add required user information
      if (user) {
        console.log('User object:', user);
        formData.append('fullName', user.name || '');
        formData.append('employeeId', user.id || '');
        formData.append('email', user.email || '');
        console.log('Sending user data:', {
          fullName: user.name || '',
          employeeId: user.id || '',
          email: user.email || ''
        });
      }

      // Debug FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      // Submit KYC data
      console.log('Submitting to:', 'http://localhost:3001/api/kyc');
      const response = await fetch('http://localhost:3001/api/kyc', {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('KYC submission error response:', errorData);
        throw new Error(errorData.message || 'Failed to submit KYC');
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
      
      // Reload KYC status
      const kycInfo = await apiService.getKycStatus(user.email);
      setKycStatus(kycInfo.status);
      setKycData(kycInfo.data);
    } catch (error) {
      console.error('KYC submission error:', error);
      toast.error("Failed to submit KYC information. Please try again.");
    } finally {
      setSubmittingKyc(false);
    }
  };

  const getKycStatusBadge = (status) => {
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
            Pending Review
          </Badge>
        );
      case 'not_submitted':
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
      case 'approved':
        return "Your KYC has been approved! You now have access to all employee features.";
      case 'rejected':
        return "Your KYC was rejected. Please contact HR for more information.";
      case 'pending':
        return "Your KYC is under review. You'll be notified once it's processed.";
      case 'not_submitted':
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
            {user?.role === 'admin' 
              ? 'Manage your personal information and account settings'
              : 'Manage your personal information and KYC status'
            }
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
            <CardDescription>
              Your basic profile information
            </CardDescription>
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
        {user?.role !== 'admin' && (
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
                
                {kycStatus === 'not_submitted' && (
                  <Button 
                    onClick={() => setShowKycForm(true)}
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Complete KYC
                  </Button>
                )}
                
                {kycStatus === 'rejected' && (
                  <Button 
                    onClick={() => setShowKycForm(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Resubmit KYC
                  </Button>
                )}
              </div>

              {kycData && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">KYC Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">PAN:</span> {kycData.panNumber}</p>
                    <p><span className="font-medium">Aadhar:</span> {kycData.aadharNumber}</p>
                    <p><span className="font-medium">Submitted:</span> {new Date(kycData.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feature Access Status - Only show for non-admin users */}
      {user?.role !== 'admin' && (
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
                <div className={`p-2 rounded-full ${kycStatus === 'approved' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Calendar className={`h-4 w-4 ${kycStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Attendance</p>
                  <p className="text-xs text-gray-500">
                    {kycStatus === 'approved' ? 'Available' : 'Requires KYC approval'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${kycStatus === 'approved' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <FileText className={`h-4 w-4 ${kycStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Payslip</p>
                  <p className="text-xs text-gray-500">
                    {kycStatus === 'approved' ? 'Available' : 'Requires KYC approval'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${kycStatus === 'approved' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Clock className={`h-4 w-4 ${kycStatus === 'approved' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Leave Application</p>
                  <p className="text-xs text-gray-500">
                    {kycStatus === 'approved' ? 'Available' : 'Requires KYC approval'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KYC Form - Only show for non-admin users */}
      {showKycForm && user?.role !== 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your KYC</CardTitle>
            <CardDescription>
              Please provide your KYC information to complete your profile setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    placeholder="Enter PAN number"
                    value={kycFormData.panNumber}
                    onChange={(e) => setKycFormData({...kycFormData, panNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                  <Input
                    id="aadharNumber"
                    placeholder="Enter Aadhar number"
                    value={kycFormData.aadharNumber}
                    onChange={(e) => setKycFormData({...kycFormData, aadharNumber: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={kycFormData.dob}
                  onChange={(e) => setKycFormData({...kycFormData, dob: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete address"
                  value={kycFormData.address}
                  onChange={(e) => setKycFormData({...kycFormData, address: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter phone number"
                    value={kycFormData.phoneNumber}
                    onChange={(e) => setKycFormData({...kycFormData, phoneNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Emergency contact name"
                    value={kycFormData.emergencyContact}
                    onChange={(e) => setKycFormData({...kycFormData, emergencyContact: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  placeholder="Emergency contact phone number"
                  value={kycFormData.emergencyPhone}
                  onChange={(e) => setKycFormData({...kycFormData, emergencyPhone: e.target.value})}
                />
              </div>
              
              {/* File Upload Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Document Upload</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="panCard">PAN Card Photo *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                            onClick={() => setPanCardFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">Click to upload PAN card photo</p>
                          <Input
                            id="panCard"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPanCardFile(e.target.files[0])}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('panCard').click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="aadharCard">Aadhar Card Photo *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {aadharCardFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileImage className="h-4 w-4" />
                            <span className="text-sm">{aadharCardFile.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setAadharCardFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">Click to upload Aadhar card photo</p>
                          <Input
                            id="aadharCard"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAadharCardFile(e.target.files[0])}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('aadharCard').click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowKycForm(false)}
                >
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
