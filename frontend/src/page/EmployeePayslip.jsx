import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, FileText, Calendar, User, DollarSign, Clock, AlertCircle } from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { PayslipPDFService } from "@/lib/pdfService";

export default function EmployeePayslip() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    if (user?.email) {
      fetchPayslips();
    }
  }, [user, selectedYear]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      // Find employee by email
      const employees = await apiService.getEmployees();
      const employee = employees.find(emp => emp.email === user.email);
      
      if (!employee) {
        toast.error("Employee record not found. Please contact HR.");
        setPayslips([]);
        return;
      }
      
      if (!employee.employeeId) {
        toast.error("Employee ID not found. Please contact HR.");
        setPayslips([]);
        return;
      }
      
      const response = await apiService.getEmployeePayslips(employee.employeeId, null, selectedYear);
      setPayslips(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Error fetching payslips:", error);
      const errorMessage = error.message || "Failed to fetch payslips";
      toast.error(errorMessage);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      const payslip = payslips.find(p => p.id === payslipId);
      if (payslip) {
        PayslipPDFService.downloadPayslipPDF(payslip);
        toast.success("Payslip downloaded successfully");
      } else {
        toast.error("Payslip not found");
      }
    } catch (error) {
      console.error("Error downloading payslip:", error);
      toast.error("Failed to download payslip");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      generated: { variant: "default", label: "Generated" },
      paid: { variant: "secondary", label: "Paid" },
      pending: { variant: "outline", label: "Pending" }
    };
    
    const config = statusConfig[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMonthName = (month) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1] || month;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">My Payslips</h1>
          <p className="text-muted-foreground">View and download your payslips</p>
        </div>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading payslips...</p>
          </div>
        </div>
      </div>
    );
  }

    return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Payslips</h1>
        <p className="text-muted-foreground">View and download your payslips</p>
      </div>

      {/* Year Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter by Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Showing payslips for {selectedYear}
          </p>
        </div>
        </CardContent>
      </Card>

      {/* Payslips List */}
      {payslips.length === 0 ? (
      <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No payslips available</h3>
            <p className="text-muted-foreground mb-2">
              No payslips have been generated for you for the year {selectedYear}.
            </p>
            <p className="text-sm text-muted-foreground">
              Payslips are typically generated monthly by HR. If you believe this is an error, please contact HR.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payslips.map((payslip) => (
            <Card key={payslip.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {getMonthName(payslip.month)} {payslip.year}
          </CardTitle>
          <CardDescription>
                        Payslip for {payslip.employeeName}
          </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payslip.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPayslip(payslip.id)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Gross Salary
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(payslip.grossSalary || payslip.earnedSalary || 0)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Net Salary
                    </div>
                    <div className="font-semibold text-green-600">
                      {formatCurrency(payslip.netSalary || 0)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Working Days
                    </div>
                    <div className="font-semibold">
                      {payslip.workingDays}/{payslip.totalDays}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Leave Days
                    </div>
                    <div className="font-semibold">
                      {payslip.leaveDays || 0}
                    </div>
                  </div>
                </div>

                {payslip.leaveDeduction > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Leave Deduction</span>
            </div>
                    <p className="text-sm text-orange-700 mt-1">
                      {formatCurrency(payslip.leaveDeduction)} deducted for {payslip.leaveDays} leave days
              </p>
            </div>
          )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Generated on {new Date(payslip.generatedAt).toLocaleDateString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPayslip(selectedPayslip === payslip.id ? null : payslip.id)}
                    >
                      {selectedPayslip === payslip.id ? "Hide Details" : "View Details"}
                    </Button>
                  </div>
                </div>

                {selectedPayslip === payslip.id && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-3">Payslip Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground mb-2">Earnings</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Basic Salary:</span>
                            <span>{formatCurrency(payslip.basicSalary || 0)}</span>
                          </div>
                          {(payslip.hra || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>HRA:</span>
                              <span>{formatCurrency(payslip.hra)}</span>
                            </div>
                          )}
                          {(payslip.da || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>DA:</span>
                              <span>{formatCurrency(payslip.da)}</span>
                            </div>
                          )}
                          {(payslip.transportAllowance || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>Transport Allowance:</span>
                              <span>{formatCurrency(payslip.transportAllowance)}</span>
                            </div>
                          )}
                          {(payslip.medicalAllowance || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>Medical Allowance:</span>
                              <span>{formatCurrency(payslip.medicalAllowance)}</span>
                            </div>
                          )}
                          {(payslip.specialAllowance || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>Special Allowance:</span>
                              <span>{formatCurrency(payslip.specialAllowance)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                            <span>Gross Salary:</span>
                            <span>{formatCurrency(payslip.grossSalary || payslip.earnedSalary || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-2">Deductions</div>
                        <div className="space-y-1">
                          {(payslip.pf || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>PF:</span>
                              <span className="text-red-600">-{formatCurrency(payslip.pf)}</span>
                            </div>
                          )}
                          {(payslip.esi || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>ESI:</span>
                              <span className="text-red-600">-{formatCurrency(payslip.esi)}</span>
                            </div>
                          )}
                          {(payslip.tds || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>TDS:</span>
                              <span className="text-red-600">-{formatCurrency(payslip.tds)}</span>
                            </div>
                          )}
                          {(payslip.professionalTax || 0) > 0 && (
                            <div className="flex justify-between">
                              <span>Professional Tax:</span>
                              <span className="text-red-600">-{formatCurrency(payslip.professionalTax)}</span>
                            </div>
                          )}
                          {(payslip.leaveDeduction || 0) > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span>Leave Deduction:</span>
                              <span>-{formatCurrency(payslip.leaveDeduction)}</span>
                            </div>
                          )}
                          {(payslip.otherDeductions || 0) > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Other Deductions:</span>
                              <span>-{formatCurrency(payslip.otherDeductions)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                            <span>Total Deductions:</span>
                            <span className="text-red-600">-{formatCurrency(payslip.totalDeductions || 0)}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t-2 pt-2 mt-2 text-lg">
                            <span>Net Salary:</span>
                            <span className="text-green-600">{formatCurrency(payslip.netSalary || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="font-medium text-muted-foreground mb-2">Attendance Summary</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Days:</span>
                          <span className="ml-2 font-semibold">{payslip.totalDays}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Working Days:</span>
                          <span className="ml-2 font-semibold">{payslip.workingDays}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Leave Days:</span>
                          <span className="ml-2 font-semibold">{payslip.leaveDays || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
        </CardContent>
      </Card>
          ))}
        </div>
      )}
    </div>
  );
}
