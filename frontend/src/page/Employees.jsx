import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  UserPlus,
  Download,
  MailIcon,
  PhoneIcon,
  Calendar,
  Building,
  ChevronUp,
  ChevronDown,
  RefreshCcw,
  Trash2,
  PencilLine,
  CheckCircle,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { departments, roles } from "@/lib/data";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getAvatarUrl } from "@/lib/imageUtils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Type imports removed - types are now JSDoc comments in types/index.js

export default function Employees() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isHR = user?.role === "hr";
  const canDelete = isAdmin || isHR; // Only Admin and HR can delete

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  // Add Employee Form State
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    emp_id: "", // Optional - will auto-generate if empty
    name: "",
    email: "",
    mobile_number: "",
    location: "",
    designation: "",
    department: "",
    position: "",
    role: "",
    joinDate: "",
    isActive: true,
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    emp_id: "",
    name: "",
    email: "",
    mobile_number: "",
    location: "",
    designation: "",
    department: "",
    role: "",
    position: "",
    joinDate: "",
  });

  // Delete Employee State
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null);
  const [deleteEmployeeName, setDeleteEmployeeName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Employee State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Active Tab State
  const [activeTab, setActiveTab] = useState("all");

  // KYC Approval State
  const [kycSubmissions, setKycSubmissions] = useState([]);

  // Load employees from API
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getEmployees();
      // Handle new API response format: { success: true, data: [...], count: ... }
      const employeesData = Array.isArray(response)
        ? response
        : response?.data && Array.isArray(response.data)
        ? response.data
        : [];
      setEmployees(employeesData);
    } catch (err) {
      setError("Failed to load employees");
      console.error("Error loading employees:", err);
      setEmployees([]); // Ensure employees is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadKycSubmissions();
  }, []);

  // Load KYC submissions for approval
  const loadKycSubmissions = async () => {
    try {
      const data = await apiService.getKycSubmissions();
      setKycSubmissions(data || []);
    } catch (err) {
      console.error("Error loading KYC submissions:", err);
    }
  };

  // Handle KYC status update
  const handleKycStatusUpdate = async (kycId, status) => {
    try {
      await apiService.updateKycStatus(kycId, status);
      toast.success(`KYC status updated to ${status}`);
      loadKycSubmissions();
      loadEmployees(); // Refresh employees to update KYC status
    } catch (err) {
      console.error("Error updating KYC status:", err);
      toast.error(`Failed to update KYC status: ${err.message}`);
    }
  };

  // Get department name (handles both string names and IDs)
  // Must be defined before filteredEmployees uses it
  const getDepartmentName = (department) => {
    if (!department) return "N/A";
    // If it's an ID (starts with 'd' and a number like 'd1', 'd2', etc.), look it up
    if (typeof department === "string" && /^d\d+$/.test(department)) {
      const dept = departments.find((dept) => dept.id === department);
      return dept ? dept.name : department;
    }
    // If it's already a department name (not an ID), return it as-is
    if (typeof department === "string") {
      // Check if it's actually a department name by looking it up
      const deptByName = departments.find((dept) => dept.name === department);
      if (deptByName) {
        return department; // It's a valid department name
      }
      // If not found by name, try as ID
      const deptById = departments.find((dept) => dept.id === department);
      return deptById ? deptById.name : department;
    }
    // If it's not a string, try to find by ID
    const dept = departments.find((dept) => dept.id === department);
    return dept ? dept.name : "N/A";
  };

  // Filter employees based on search query, filters, and active tab
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      searchQuery === "" ||
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      selectedDepartment === null ||
      employee.department === selectedDepartment ||
      employee.department === getDepartmentName(selectedDepartment) ||
      getDepartmentName(employee.department) ===
        getDepartmentName(selectedDepartment);

    const matchesStatus =
      selectedStatus === null ||
      employee.status === selectedStatus ||
      (selectedStatus === "active" &&
        (employee.status === "active" || employee.status === "Working")) ||
      (selectedStatus === "inactive" &&
        (employee.status === "inactive" || employee.status === "Not Working"));

    // Tab filtering - handle both old format (active/inactive) and new format (Working/Not Working)
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" &&
        (employee.status === "active" || employee.status === "Working")) ||
      (activeTab === "inactive" &&
        (employee.status === "inactive" ||
          employee.status === "Not Working")) ||
      (activeTab === "onLeave" && employee.status === "onLeave");

    return matchesSearch && matchesDepartment && matchesStatus && matchesTab;
  });

  // Sort employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue, bValue;

    // Handle special cases for sorting
    if (key === "emp_id") {
      // Sort by emp_id, fallback to employeeId
      aValue = a.emp_id || a.employeeId || "";
      bValue = b.emp_id || b.employeeId || "";
    } else {
      aValue = a[key] || "";
      bValue = b[key] || "";
    }

    // Handle numeric sorting for emp_id (e.g., RST1001, RST1002)
    if (key === "emp_id") {
      const aNum = parseInt(aValue.replace(/\D/g, "")) || 0;
      const bNum = parseInt(bValue.replace(/\D/g, "")) || 0;
      return direction === "asc" ? aNum - bNum : bNum - aNum;
    }

    // String comparison for other fields
    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // Delete Employee Functions
  const handleDeleteClick = (employee) => {
    setDeleteEmployeeId(employee.id);
    setDeleteEmployeeName(employee.name);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteEmployeeId) return;

    setIsDeleting(true);
    try {
      const response = await apiService.deleteEmployee(deleteEmployeeId);
      console.log("Delete response:", response);

      // Remove the employee from the list
      setEmployees(employees.filter((emp) => emp.id !== deleteEmployeeId));

      toast.success(
        `Employee ${deleteEmployeeName} and all associated data deleted successfully!`
      );

      // Show deletion summary if available
      if (response.deletionSummary) {
        const summary = response.deletionSummary;
        const summaryText = [
          summary.kycRecords > 0 && `${summary.kycRecords} KYC record(s)`,
          summary.attendanceRecords > 0 &&
            `${summary.attendanceRecords} attendance record(s)`,
          summary.leaveRecords > 0 && `${summary.leaveRecords} leave record(s)`,
          summary.payslipRecords > 0 &&
            `${summary.payslipRecords} payslip record(s)`,
          summary.accessLogs > 0 && `${summary.accessLogs} access log(s)`,
          summary.userAccount && "User account",
        ]
          .filter(Boolean)
          .join(", ");

        if (summaryText) {
          toast.info(`Also deleted: ${summaryText}`);
        }
      }

      // Close dialog
      setShowDeleteDialog(false);
      setDeleteEmployeeId(null);
      setDeleteEmployeeName("");
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast.error(
        `Failed to delete employee: ${err.message || "Please try again."}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeleteEmployeeId(null);
    setDeleteEmployeeName("");
  };

  // Handle Edit Employee
  const handleEditClick = (employee) => {
    setEditingEmployee({
      id: employee.id,
      emp_id: employee.emp_id || employee.employeeId || "",
      name: employee.name,
      email: employee.email,
      mobile_number: employee.mobile_number || "",
      location: employee.location || employee.department || "",
      designation: employee.designation || employee.position || "",
      department: employee.department,
      position: employee.position || "",
      role: employee.role || "",
      joinDate: employee.hireDate || "",
      isActive: employee.status === "active" || employee.status === "Working",
    });
    setShowEditDialog(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee || !editingEmployee.name || !editingEmployee.email) {
      toast.error("Please fill in required fields (Name and Email)");
      return;
    }

    setIsUpdating(true);
    try {
      const employeeData = {
        emp_id: editingEmployee.emp_id || "",
        name: editingEmployee.name,
        email: editingEmployee.email,
        mobile_number: editingEmployee.mobile_number || "",
        location: editingEmployee.location || "",
        designation: editingEmployee.designation || "",
        position: editingEmployee.position,
        department: editingEmployee.department,
        role: editingEmployee.role,
        hireDate: editingEmployee.joinDate,
        status: editingEmployee.isActive ? "Working" : "Not Working",
      };

      const updatedEmployee = await apiService.updateEmployee(
        editingEmployee.id,
        employeeData
      );

      // Update the employee in the list
      setEmployees(
        employees.map((emp) =>
          emp.id === editingEmployee.id ? updatedEmployee : emp
        )
      );

      toast.success("Employee updated successfully!");
      setShowEditDialog(false);
      setEditingEmployee(null);
    } catch (err) {
      console.error("Error updating employee:", err);
      toast.error(
        `Failed to update employee: ${err.message || "Please try again."}`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Email Employee
  const handleEmailClick = (employee) => {
    window.location.href = `mailto:${employee.email}`;
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Department",
      "Position",
      "Role",
      "Start Date",
      "Status",
    ];
    const csvData = filteredEmployees.map((emp) => [
      emp.name,
      emp.email,
      getDepartmentName(emp.department),
      emp.position || "N/A",
      emp.role || "N/A",
      emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "N/A",
      emp.status || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `employees_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Employees exported to CSV successfully!");
  };

  // Handle Refresh
  const handleRefresh = () => {
    loadEmployees();
    toast.success("Employees list refreshed!");
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Validation functions
  const validateName = (name) => {
    if (!name || name.trim() === "") {
      return "Full name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (name.trim().length > 100) {
      return "Name must be less than 100 characters";
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === "") {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    if (email.trim().length > 255) {
      return "Email must be less than 255 characters";
    }
    return "";
  };

  const validateDepartment = (department) => {
    if (!department || department === "") {
      return "Department is required";
    }
    return "";
  };

  const validateRole = (role) => {
    if (!role || role === "") {
      return "Role is required";
    }
    return "";
  };

  const validatePosition = (position) => {
    if (position && position.trim().length > 100) {
      return "Position must be less than 100 characters";
    }
    return "";
  };

  const validateJoinDate = (date) => {
    if (date) {
      const selectedDate = new Date(date);
      const today = new Date();

      // Check if date is too far in the past (e.g., more than 50 years)
      const fiftyYearsAgo = new Date();
      fiftyYearsAgo.setFullYear(today.getFullYear() - 50);

      if (selectedDate < fiftyYearsAgo) {
        return "Start date cannot be more than 50 years ago";
      }

      // Allow future dates for new employees (e.g., scheduled start dates)
    }
    return "";
  };

  // Validate all fields
  const validateForm = () => {
    const errors = {
      name: validateName(newEmployee.name),
      email: validateEmail(newEmployee.email),
      department: validateDepartment(newEmployee.department),
      role: validateRole(newEmployee.role),
      position: validatePosition(newEmployee.position),
      joinDate: validateJoinDate(newEmployee.joinDate),
    };

    setValidationErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  // Handle field validation on change
  const handleFieldChange = (field, value) => {
    setNewEmployee({ ...newEmployee, [field]: value });

    // Clear error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  // Handle adding new employee
  const handleAddEmployee = async () => {
    // Validate all fields before submission
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setIsAddingEmployee(true);
    try {
      const employeeData = {
        emp_id: newEmployee.emp_id?.trim() || "", // Empty string will trigger auto-generation
        name: newEmployee.name,
        email: newEmployee.email,
        mobile_number: newEmployee.mobile_number || "",
        location: newEmployee.location || "",
        designation: newEmployee.designation || "",
        position: newEmployee.position,
        department: newEmployee.department, // Send the department ID, backend will handle mapping
        role: newEmployee.role, // Send the role ID, backend will handle mapping
        hireDate: newEmployee.joinDate,
        status: newEmployee.isActive ? "Working" : "Not Working",
      };

      console.log("Submitting employee data:", employeeData);
      const response = await apiService.createEmployee(employeeData);
      console.log("Employee created successfully:", response);

      // Extract employee data from response (handle both old and new API response formats)
      const createdEmployee = response?.data || response;

      // Add the new employee to the list
      setEmployees([...employees, createdEmployee]);

      // Reset form and validation errors
      setNewEmployee({
        emp_id: "",
        name: "",
        email: "",
        mobile_number: "",
        location: "",
        designation: "",
        department: "",
        position: "",
        role: "",
        joinDate: "",
        isActive: true,
      });
      setValidationErrors({
        emp_id: "",
        name: "",
        email: "",
        mobile_number: "",
        location: "",
        designation: "",
        department: "",
        role: "",
        position: "",
        joinDate: "",
      });

      toast.success("Employee added successfully!");

      // Close the dialog
      setShowAddEmployeeDialog(false);
    } catch (err) {
      console.error("Error adding employee:", err);

      // Handle specific error cases
      let errorMessage = "Failed to add employee. Please try again.";

      if (err.message && err.message.includes("already exists")) {
        errorMessage =
          "An employee with this email already exists. Please use a different email address.";
      } else if (err.message && err.message.includes("DUPLICATE_EMAIL")) {
        errorMessage =
          "An employee with this email already exists. Please use a different email address.";
      } else if (err.message) {
        errorMessage = `Failed to add employee: ${err.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsAddingEmployee(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage and organize your company's workforce
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage and organize your company's workforce
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
        <p className="text-muted-foreground">
          Manage and organize your company's workforce
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Employees</TabsTrigger>
            <TabsTrigger value="active">Working</TabsTrigger>
            <TabsTrigger value="onLeave">On Leave</TabsTrigger>
            <TabsTrigger value="inactive">Not Working</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Dialog
              open={showAddEmployeeDialog}
              onOpenChange={setShowAddEmployeeDialog}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2"
                  onClick={() => setShowAddEmployeeDialog(true)}>
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Create a new employee record in the system.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddEmployee();
                  }}>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp_id">Employee ID</Label>
                      <Input
                        id="emp_id"
                        placeholder="Leave empty for auto-generation (e.g., RST1001)"
                        value={newEmployee.emp_id}
                        onChange={(e) =>
                          handleFieldChange("emp_id", e.target.value)
                        }
                        className={
                          validationErrors.emp_id ? "border-red-500" : ""
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional: Leave empty to auto-generate (RST1001,
                        RST1002...)
                      </p>
                      {validationErrors.emp_id && (
                        <p className="text-sm text-red-500">
                          {validationErrors.emp_id}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={newEmployee.name}
                        onChange={(e) =>
                          handleFieldChange("name", e.target.value)
                        }
                        onBlur={() => {
                          setValidationErrors({
                            ...validationErrors,
                            name: validateName(newEmployee.name),
                          });
                        }}
                        required
                        className={
                          validationErrors.name ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.name && (
                        <p className="text-sm text-red-500">
                          {validationErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        value={newEmployee.email}
                        onChange={(e) =>
                          handleFieldChange("email", e.target.value)
                        }
                        onBlur={() => {
                          setValidationErrors({
                            ...validationErrors,
                            email: validateEmail(newEmployee.email),
                          });
                        }}
                        required
                        className={
                          validationErrors.email ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.email && (
                        <p className="text-sm text-red-500">
                          {validationErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={newEmployee.department}
                        onValueChange={(value) => {
                          handleFieldChange("department", value);
                          setValidationErrors({
                            ...validationErrors,
                            department: validateDepartment(value),
                          });
                        }}>
                        <SelectTrigger
                          className={
                            validationErrors.department ? "border-red-500" : ""
                          }>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.department && (
                        <p className="text-sm text-red-500">
                          {validationErrors.department}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile_number">Mobile Number</Label>
                      <Input
                        id="mobile_number"
                        type="tel"
                        placeholder="9910955040"
                        value={newEmployee.mobile_number}
                        onChange={(e) =>
                          handleFieldChange("mobile_number", e.target.value)
                        }
                        className={
                          validationErrors.mobile_number ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.mobile_number && (
                        <p className="text-sm text-red-500">
                          {validationErrors.mobile_number}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Noida"
                        value={newEmployee.location}
                        onChange={(e) =>
                          handleFieldChange("location", e.target.value)
                        }
                        className={
                          validationErrors.location ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.location && (
                        <p className="text-sm text-red-500">
                          {validationErrors.location}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        placeholder="Software Developer"
                        value={newEmployee.designation}
                        onChange={(e) =>
                          handleFieldChange("designation", e.target.value)
                        }
                        className={
                          validationErrors.designation ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.designation && (
                        <p className="text-sm text-red-500">
                          {validationErrors.designation}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position (Legacy)</Label>
                      <Input
                        id="position"
                        placeholder="Software Engineer"
                        value={newEmployee.position}
                        onChange={(e) =>
                          handleFieldChange("position", e.target.value)
                        }
                        onBlur={() => {
                          setValidationErrors({
                            ...validationErrors,
                            position: validatePosition(newEmployee.position),
                          });
                        }}
                        className={
                          validationErrors.position ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.position && (
                        <p className="text-sm text-red-500">
                          {validationErrors.position}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={newEmployee.role}
                        onValueChange={(value) => {
                          handleFieldChange("role", value);
                          setValidationErrors({
                            ...validationErrors,
                            role: validateRole(value),
                          });
                        }}>
                        <SelectTrigger
                          className={
                            validationErrors.role ? "border-red-500" : ""
                          }>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.role && (
                        <p className="text-sm text-red-500">
                          {validationErrors.role}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="join-date">Start Date</Label>
                      <Input
                        id="join-date"
                        type="date"
                        value={newEmployee.joinDate}
                        onChange={(e) =>
                          handleFieldChange("joinDate", e.target.value)
                        }
                        onBlur={() => {
                          setValidationErrors({
                            ...validationErrors,
                            joinDate: validateJoinDate(newEmployee.joinDate),
                          });
                        }}
                        className={
                          validationErrors.joinDate ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.joinDate && (
                        <p className="text-sm text-red-500">
                          {validationErrors.joinDate}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={newEmployee.isActive}
                        onCheckedChange={(checked) =>
                          setNewEmployee({ ...newEmployee, isActive: checked })
                        }
                      />
                      <Label htmlFor="active">
                        Employee is active and can access the system
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setNewEmployee({
                          emp_id: "",
                          name: "",
                          email: "",
                          mobile_number: "",
                          location: "",
                          designation: "",
                          department: "",
                          position: "",
                          role: "",
                          joinDate: "",
                          isActive: true,
                        });
                        setValidationErrors({
                          emp_id: "",
                          name: "",
                          email: "",
                          mobile_number: "",
                          location: "",
                          designation: "",
                          department: "",
                          role: "",
                          position: "",
                          joinDate: "",
                        });
                        setShowAddEmployeeDialog(false);
                      }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isAddingEmployee}>
                      {isAddingEmployee ? "Adding..." : "Add Employee"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Edit Employee Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Edit Employee</DialogTitle>
                  <DialogDescription>
                    Update employee information in the system.
                  </DialogDescription>
                </DialogHeader>
                {editingEmployee && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateEmployee();
                    }}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-emp_id">Employee ID</Label>
                        <Input
                          id="edit-emp_id"
                          placeholder="RST1001"
                          value={editingEmployee.emp_id || ""}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              emp_id: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Employee ID (must be unique)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Full Name *</Label>
                        <Input
                          id="edit-name"
                          placeholder="John Doe"
                          value={editingEmployee.name}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email *</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          placeholder="john.doe@company.com"
                          value={editingEmployee.email}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              email: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-mobile_number">
                          Mobile Number
                        </Label>
                        <Input
                          id="edit-mobile_number"
                          type="tel"
                          placeholder="9910955040"
                          value={editingEmployee.mobile_number || ""}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              mobile_number: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-location">Location</Label>
                        <Input
                          id="edit-location"
                          placeholder="Noida"
                          value={editingEmployee.location || ""}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              location: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-designation">Designation</Label>
                        <Input
                          id="edit-designation"
                          placeholder="Software Developer"
                          value={editingEmployee.designation || ""}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              designation: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-department">Department</Label>
                        <Select
                          value={editingEmployee.department}
                          onValueChange={(value) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              department: value,
                            })
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-position">Position</Label>
                        <Input
                          id="edit-position"
                          placeholder="Software Engineer"
                          value={editingEmployee.position}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              position: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select
                          value={editingEmployee.role}
                          onValueChange={(value) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              role: value,
                            })
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-join-date">Start Date</Label>
                        <Input
                          id="edit-join-date"
                          type="date"
                          value={editingEmployee.joinDate}
                          onChange={(e) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              joinDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-2 flex items-center space-x-2">
                        <Switch
                          id="edit-active"
                          checked={editingEmployee.isActive}
                          onCheckedChange={(checked) =>
                            setEditingEmployee({
                              ...editingEmployee,
                              isActive: checked,
                            })
                          }
                        />
                        <Label htmlFor="edit-active">
                          Employee is active and can access the system
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEditDialog(false);
                          setEditingEmployee(null);
                        }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? "Updating..." : "Update Employee"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Employee Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle
                    className={isAdmin ? "text-red-600" : "text-orange-600"}>
                    {isAdmin
                      ? "Permanently Delete Employee"
                      : "Soft Delete Employee"}
                  </DialogTitle>
                  <DialogDescription>
                    {isAdmin ? (
                      <>
                        <strong className="text-red-600">
                          Warning: This action cannot be undone.
                        </strong>
                        <br />
                        This will <strong>permanently delete</strong> the
                        employee and all associated data.
                      </>
                    ) : (
                      <>
                        This will <strong>soft delete</strong> the employee. The
                        employee will be marked as inactive and hidden from
                        listings, but data will be preserved.
                        <br />
                        <span className="text-sm text-muted-foreground mt-2 block">
                          Note: Only Admin can permanently delete employees.
                        </span>
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {isAdmin ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        The following data will be permanently deleted:
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Employee record and profile information</li>
                        <li>• User account and login credentials</li>
                        <li>• All KYC documents and verification records</li>
                        <li>• All attendance records and location data</li>
                        <li>• All leave applications and approvals</li>
                        <li>• All payslip records and salary history</li>
                        <li>• All access logs and activity history</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">
                        Soft Delete Actions:
                      </h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>
                          • Employee will be marked as inactive (is_active =
                          false)
                        </li>
                        <li>• Status will be set to "Not Working"</li>
                        <li>• User account will be deactivated</li>
                        <li>• Employee will be hidden from active listings</li>
                        <li>• All data will be preserved for audit purposes</li>
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Employee:</strong> {deleteEmployeeName}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={isAdmin ? "destructive" : "default"}
                    className={
                      isAdmin
                        ? ""
                        : "bg-orange-600 hover:bg-orange-700 text-white"
                    }
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}>
                    {isDeleting
                      ? isAdmin
                        ? "Deleting..."
                        : "Soft Deleting..."
                      : isAdmin
                      ? "Permanently Delete"
                      : "Soft Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" /> Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onClick={handleRefresh}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <Trash2 className="h-4 w-4" /> Bulk Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* KYC Approval Section */}
        {kycSubmissions.filter((k) => k.status === "pending").length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-600" />
                Pending KYC Approvals (
                {kycSubmissions.filter((k) => k.status === "pending").length})
              </CardTitle>
              <CardDescription>
                Review and approve pending KYC submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {kycSubmissions
                  .filter((k) => k.status === "pending")
                  .slice(0, 5)
                  .map((kyc) => (
                    <div
                      key={kyc.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                      <div className="flex-1">
                        <p className="font-medium">{kyc.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {kyc.employeeId} • Submitted{" "}
                          {new Date(
                            kyc.submittedAt || kyc.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(`/kyc-management`, "_blank")
                          }>
                          Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleKycStatusUpdate(kyc.id, "approved")
                          }>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleKycStatusUpdate(kyc.id, "rejected")
                          }>
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                {kycSubmissions.filter((k) => k.status === "pending").length >
                  5 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`/kyc-management`, "_blank")}>
                    View All Pending KYC Submissions (
                    {
                      kycSubmissions.filter((k) => k.status === "pending")
                        .length
                    }
                    )
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center gap-2 relative">
                <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="w-full sm:w-[250px] pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Department
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedDepartment(null)}>
                      All Departments
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {departments.map((dept) => (
                      <DropdownMenuItem
                        key={dept.id}
                        onClick={() => setSelectedDepartment(dept.id)}>
                        {dept.name}
                        {selectedDepartment === dept.id && (
                          <CheckCircle className="ml-2 h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("active")}>
                      Working
                      {selectedStatus === "active" && (
                        <CheckCircle className="ml-2 h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("inactive")}>
                      Not Working
                      {selectedStatus === "inactive" && (
                        <CheckCircle className="ml-2 h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("onLeave")}>
                      On Leave
                      {selectedStatus === "onLeave" && (
                        <CheckCircle className="ml-2 h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead
                    onClick={() => handleSort("emp_id")}
                    className="cursor-pointer hover:text-primary">
                    <div className="flex items-center gap-1">
                      Emp Id
                      {sortConfig?.key === "emp_id" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("name")}
                    className="cursor-pointer hover:text-primary">
                    <div className="flex items-center gap-1">
                      Name of Employee
                      {sortConfig?.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Mobile Number
                  </TableHead>
                  <TableHead>Mail Id</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Designation
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEmployees.map((employee, index) => (
                  <TableRow key={employee.id}>
                    <TableCell className="w-12">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {employee.emp_id || employee.employeeId || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            key={employee.avatar || `no-avatar-${employee.id}`}
                            src={getAvatarUrl(employee.avatar)}
                            alt={employee.name}
                            crossOrigin="anonymous"
                            onError={(e) => {
                              // Hide broken image and show fallback
                              e.target.style.display = 'none';
                            }}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
                            {employee.name
                              ? employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : "N/A"}
                          </AvatarFallback>
                        </Avatar>
                        <div>{employee.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {employee.mobile_number || "N/A"}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {employee.location || employee.department || "N/A"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {employee.designation || employee.position || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "Working" ||
                          employee.status === "active"
                            ? "default"
                            : employee.status === "onLeave"
                            ? "outline"
                            : "secondary"
                        }
                        className={
                          employee.is_active === false
                            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30"
                            : employee.status === "Not Working" ||
                              employee.status === "inactive"
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                            : ""
                        }>
                        {employee.status === "active" ||
                        employee.status === "Working"
                          ? "Working"
                          : employee.status === "inactive" ||
                            employee.status === "Not Working"
                          ? "Not Working"
                          : employee.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleEditClick(employee)}>
                            <PencilLine className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => handleEmailClick(employee)}>
                            <MailIcon className="h-4 w-4" /> Email
                          </DropdownMenuItem>
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className={
                                  isAdmin
                                    ? "text-red-600 gap-2"
                                    : "text-orange-600 gap-2"
                                }
                                onClick={() => handleDeleteClick(employee)}>
                                <Trash2 className="h-4 w-4" />
                                {isAdmin ? "Permanently Delete" : "Soft Delete"}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
