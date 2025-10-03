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
    name: "",
    email: "",
    department: "",
    position: "",
    role: "",
    joinDate: "",
    isActive: true,
  });

  // Delete Employee State
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null);
  const [deleteEmployeeName, setDeleteEmployeeName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load employees from API
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const data = await apiService.getEmployees();
        setEmployees(data);
      } catch (err) {
        setError("Failed to load employees");
        console.error("Error loading employees:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // Filter employees based on search query and filters
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      searchQuery === "" ||
      employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      selectedDepartment === null || employee.department === selectedDepartment;

    const matchesStatus =
      selectedStatus === null || employee.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Sort employees
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
    if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
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

  // Handle sort
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get department name (handles both string names and IDs)
  const getDepartmentName = (department) => {
    if (!department) return "N/A";
    // If it's already a string name, return it
    if (typeof department === "string") {
      return department;
    }
    // If it's an ID, look it up in the departments array
    const dept = departments.find((dept) => dept.id === department);
    return dept ? dept.name : "N/A";
  };

  // Get role name by id
  const getRoleName = (id) => {
    if (!id) return "employee";
    const role = roles.find((r) => r.id === id);
    return role ? role.name : "employee";
  };

  // Handle adding new employee
  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email) {
      toast.error("Please fill in required fields (Name and Email)");
      return;
    }

    setIsAddingEmployee(true);
    try {
      const employeeData = {
        name: newEmployee.name,
        email: newEmployee.email,
        position: newEmployee.position,
        department: newEmployee.department, // Send the department ID, backend will handle mapping
        role: newEmployee.role, // Send the role ID, backend will handle mapping
        hireDate: newEmployee.joinDate,
        status: newEmployee.isActive ? "active" : "inactive",
      };

      console.log("Submitting employee data:", employeeData);
      const createdEmployee = await apiService.createEmployee(employeeData);
      console.log("Employee created successfully:", createdEmployee);

      // Add the new employee to the list
      setEmployees([...employees, createdEmployee]);

      // Reset form
      setNewEmployee({
        name: "",
        email: "",
        department: "",
        position: "",
        role: "",
        joinDate: "",
        isActive: true,
      });

      toast.success("Employee added successfully!");

      // Close the dialog
      setShowAddEmployeeDialog(false);
    } catch (err) {
      console.error("Error adding employee:", err);
      
      // Handle specific error cases
      let errorMessage = "Failed to add employee. Please try again.";
      
      if (err.message && err.message.includes("already exists")) {
        errorMessage = "An employee with this email already exists. Please use a different email address.";
      } else if (err.message && err.message.includes("DUPLICATE_EMAIL")) {
        errorMessage = "An employee with this email already exists. Please use a different email address.";
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

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Employees</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="onLeave">On Leave</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Dialog open={showAddEmployeeDialog} onOpenChange={setShowAddEmployeeDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => setShowAddEmployeeDialog(true)}>
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
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={newEmployee.name}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        value={newEmployee.email}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={newEmployee.department}
                        onValueChange={(value) =>
                          setNewEmployee({ ...newEmployee, department: value })
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
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        placeholder="Software Engineer"
                        value={newEmployee.position}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            position: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newEmployee.role}
                        onValueChange={(value) =>
                          setNewEmployee({ ...newEmployee, role: value })
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
                      <Label htmlFor="join-date">Start Date</Label>
                      <Input
                        id="join-date"
                        type="date"
                        value={newEmployee.joinDate}
                        onChange={(e) =>
                          setNewEmployee({
                            ...newEmployee,
                            joinDate: e.target.value,
                          })
                        }
                      />
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
                          name: "",
                          email: "",
                          department: "",
                          position: "",
                          role: "",
                          joinDate: "",
                          isActive: true,
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

            {/* Delete Employee Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-red-600">
                    Delete Employee
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    the employee and all associated data.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">
                      The following data will be deleted:
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
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete Employee"}
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
                <DropdownMenuItem className="gap-2">
                  <Download className="h-4 w-4" /> Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
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
                      Active
                      {selectedStatus === "active" && (
                        <CheckCircle className="ml-2 h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedStatus("inactive")}>
                      Inactive
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
                  <TableHead
                    onClick={() => handleSort("name")}
                    className="cursor-pointer hover:text-primary">
                    <div className="flex items-center gap-1">
                      Name
                      {sortConfig?.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Department
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Position
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort("hireDate")}
                    className="cursor-pointer hover:text-primary hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      Start Date
                      {sortConfig?.key === "hireDate" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={employee.avatar}
                            alt={employee.name}
                          />
                          <AvatarFallback>
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>{employee.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getDepartmentName(employee.department)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {employee.position || "N/A"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {employee.hireDate
                        ? new Date(employee.hireDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "active"
                            ? "default"
                            : employee.status === "onLeave"
                            ? "outline"
                            : "secondary"
                        }>
                        {employee.status}
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
                          <DropdownMenuItem className="gap-2">
                            <PencilLine className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <MailIcon className="h-4 w-4" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 gap-2"
                            onClick={() => handleDeleteClick(employee)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
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
