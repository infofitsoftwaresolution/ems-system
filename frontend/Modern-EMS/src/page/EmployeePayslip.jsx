import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar,
  DollarSign,
  AlertCircle,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

export default function EmployeePayslip() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check KYC status first
        if (user?.email) {
          const kycInfo = await apiService.getKycStatus(user.email);
          setKycStatus(kycInfo.status);
          
          if (kycInfo.status === 'approved') {
            // Load payslips data
            const payslipsData = await apiService.getPayslips();
            setPayslips(payslipsData);
          }
        }
      } catch (err) {
        console.error('Error loading payslips data:', err);
        toast.error('Failed to load payslips data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleDownloadPayslip = async (payslipId) => {
    try {
      await apiService.downloadPayslip(payslipId);
      toast.success('Payslip downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download payslip');
      console.error('Download error:', err);
    }
  };

  const handleViewPayslip = async (payslipId) => {
    try {
      const payslipData = await apiService.getPayslip(payslipId);
      // Open payslip in new window or modal
      window.open(`/payslip/${payslipId}`, '_blank');
    } catch (err) {
      toast.error('Failed to view payslip');
      console.error('View error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading payslips...</p>
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
            You need to complete and get your KYC approved to access payslip features.
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
          <h1 className="text-3xl font-bold tracking-tight">Payslips</h1>
          <p className="text-muted-foreground">
            View and download your salary payslips
          </p>
        </div>
      </div>

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Your Payslips
          </CardTitle>
          <CardDescription>
            All your salary payslips are listed below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length > 0 ? (
            <div className="space-y-4">
              {payslips.map((payslip) => (
                <div key={payslip.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Payslip - {new Date(payslip.payPeriod).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Generated on {new Date(payslip.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      <DollarSign className="h-3 w-3 mr-1" />
                      ₹{payslip.netSalary?.toLocaleString() || 'N/A'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPayslip(payslip.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPayslip(payslip.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payslips available yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Your payslips will appear here once they are generated
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salary Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Summary</CardTitle>
          <CardDescription>
            Your current salary information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">Basic Salary</p>
              <p className="text-2xl font-bold">₹45,000</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">Net Salary</p>
              <p className="text-2xl font-bold">₹42,500</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
