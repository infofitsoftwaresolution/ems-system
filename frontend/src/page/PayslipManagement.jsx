import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, FileText, Plus, Search, Calendar, User } from "lucide-react";
import { apiService } from "@/lib/api";
import { PayslipPDFService } from "@/lib/pdfService";

export default function PayslipManagement() {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  // Generate payslip form state
  const [generateForm, setGenerateForm] = useState({
    employeeId: "",
    month: "",
    year: new Date().getFullYear().toString()
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // Fetch data sequentially to avoid race conditions
        await fetchPayslips();
        await fetchEmployees();
      } catch (error) {
        console.error("Error initializing data:", error);
        setError(error.message || "Failed to load data");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const fetchPayslips = async () => {
    try {
      const response = await apiService.getPayslips();
      setPayslips(response);
    } catch (error) {
      console.error("Error fetching payslips:", error);
      toast.error("Failed to fetch payslips");
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees();
      setEmployees(response);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    }
  };

  const handleGeneratePayslip = async () => {
    if (!generateForm.employeeId || !generateForm.month || !generateForm.year) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await apiService.generatePayslip(generateForm);
      toast.success("Payslip generated successfully");
      setShowGenerateDialog(false);
      setGenerateForm({
        employeeId: "",
        month: "",
        year: new Date().getFullYear().toString()
      });
      await fetchPayslips();
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast.error(error.message || "Failed to generate payslip");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      const payslip = payslips.find(p => p.id === payslipId);
      if (!payslip) {
        toast.error("Payslip not found");
        return;
      }

      // Validate required fields
      if (!payslip.employeeName || !payslip.month || !payslip.year) {
        toast.error("Payslip data is incomplete. Cannot generate PDF.");
        console.error("Incomplete payslip data:", payslip);
        return;
      }

      // Ensure numeric fields are properly formatted
      const payslipData = {
        ...payslip,
        basicSalary: parseFloat(payslip.basicSalary || 0),
        hra: parseFloat(payslip.hra || 0),
        da: parseFloat(payslip.da || 0),
        transportAllowance: parseFloat(payslip.transportAllowance || 0),
        medicalAllowance: parseFloat(payslip.medicalAllowance || 0),
        specialAllowance: parseFloat(payslip.specialAllowance || 0),
        grossSalary: parseFloat(payslip.grossSalary || payslip.earnedSalary || 0),
        pf: parseFloat(payslip.pf || 0),
        esi: parseFloat(payslip.esi || 0),
        tds: parseFloat(payslip.tds || 0),
        professionalTax: parseFloat(payslip.professionalTax || 0),
        leaveDeduction: parseFloat(payslip.leaveDeduction || 0),
        otherDeductions: parseFloat(payslip.otherDeductions || 0),
        totalDeductions: parseFloat(payslip.totalDeductions || 0),
        netSalary: parseFloat(payslip.netSalary || 0),
        workingDays: parseInt(payslip.workingDays || 0),
        totalDays: parseInt(payslip.totalDays || 0),
        leaveDays: parseInt(payslip.leaveDays || 0),
        month: parseInt(payslip.month),
        year: parseInt(payslip.year),
      };

      PayslipPDFService.downloadPayslipPDF(payslipData);
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      console.error("Error downloading payslip:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        payslipId
      });
      toast.error(error.message || "Failed to download payslip. Please check the console for details.");
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

  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payslip.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = selectedMonth === "all" || !selectedMonth || payslip.month.toString() === selectedMonth;
    const matchesYear = selectedYear === "all" || !selectedYear || payslip.year.toString() === selectedYear;
    const matchesEmployee = selectedEmployee === "all" || !selectedEmployee || payslip.employeeId === selectedEmployee;
    
    return matchesSearch && matchesMonth && matchesYear && matchesEmployee;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Payslip Management</h1>
          <p className="text-muted-foreground">Generate and manage employee payslips</p>
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

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Payslip Management</h1>
          <p className="text-muted-foreground">Generate and manage employee payslips</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Payslip Management</h1>
        <p className="text-muted-foreground">Generate and manage employee payslips</p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payslip Management
          </CardTitle>
          <CardDescription>
            Generate new payslips and manage existing ones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="min-w-[120px]">
              <Label htmlFor="month">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {getMonthName(i + 1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[100px]">
              <Label htmlFor="year">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
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
            </div>

            <div className="min-w-[150px]">
              <Label htmlFor="employee">Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.employeeId}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Generate Payslip
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Generate New Payslip</DialogTitle>
                  <DialogDescription>
                    Generate a payslip for an employee for a specific month and year.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Employee</Label>
                    <Select 
                      value={generateForm.employeeId} 
                      onValueChange={(value) => setGenerateForm({...generateForm, employeeId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.employeeId}>
                            {employee.name} ({employee.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="month">Month</Label>
                      <Select 
                        value={generateForm.month} 
                        onValueChange={(value) => setGenerateForm({...generateForm, month: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {getMonthName(i + 1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={generateForm.year}
                        onChange={(e) => setGenerateForm({...generateForm, year: e.target.value})}
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowGenerateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleGeneratePayslip}
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Generate Payslip"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips ({filteredPayslips.length})</CardTitle>
          <CardDescription>
            View and manage all generated payslips
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayslips.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payslips found</h3>
              <p className="text-muted-foreground mb-4">
                {payslips.length === 0 
                  ? "No payslips have been generated yet. Generate your first payslip to get started."
                  : "No payslips match your current filters. Try adjusting your search criteria."
                }
              </p>
              {payslips.length === 0 && (
                <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Generate First Payslip
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross Salary</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>Working Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payslip.employeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {payslip.employeeEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {getMonthName(payslip.month)} {payslip.year}
                      </div>
                    </TableCell>
                    <TableCell>
                      ₹{((payslip.grossSalary || payslip.earnedSalary || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      ₹{(payslip.netSalary || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {payslip.workingDays}/{payslip.totalDays}
                    </TableCell>
                    <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                    <TableCell>
                      {new Date(payslip.generatedAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPayslip(payslip.id)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
