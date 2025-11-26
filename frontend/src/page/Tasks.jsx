import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  Calendar,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Inbox,
  CheckSquare,
  Clock3,
  Loader2,
  AlarmClock,
  CalendarDays,
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

/**
 * @typedef {"todo" | "in-progress" | "review" | "completed"} TaskStatus
 */

/**
 * @typedef {"low" | "medium" | "high" | "urgent"} TaskPriority
 */

/**
 * @typedef {Object} Task
 * @property {string} id - Task ID
 * @property {string} title - Task title
 * @property {string} description - Task description
 * @property {TaskStatus} status - Task status
 * @property {TaskPriority} priority - Task priority
 * @property {string} createdAt - Creation date
 * @property {string} dueDate - Due date
 * @property {string} assigneeId - Assignee ID
 * @property {string} [completedAt] - Completion date
 */

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isViewTaskDialogOpen, setIsViewTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: "",
    dueDate: addDays(new Date(), 7).toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load tasks and employees on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsInitialLoading(true);
        const [tasksData, employeesResponse] = await Promise.all([
          apiService.getTasks(),
          apiService.getEmployees()
        ]);
        
        // Handle new API response format: { success: true, data: [...] }
        const tasksList = Array.isArray(tasksData)
          ? tasksData
          : tasksData?.data || tasksData?.tasks || [];
        setTasks(tasksList);
        
        // Handle new API response format: { success: true, data: [...], count: ... }
        const employeesData = Array.isArray(employeesResponse) 
          ? employeesResponse 
          : (employeesResponse?.data && Array.isArray(employeesResponse.data)) 
          ? employeesResponse.data 
          : [];
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error loading tasks:", error);
        toast.error("Failed to load tasks");
        setEmployees([]); // Ensure employees is always an array
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    // Ensure tasks is always an array
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    let result = tasksArray;

    if (searchQuery) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    if (assigneeFilter !== "all") {
      result = result.filter((task) => task.assigneeId === assigneeFilter);
    }

    setFilteredTasks(result);
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  // Handle task creation
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setIsLoading(true);
    try {
      const createdTaskResponse = await apiService.createTask({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        assigneeId: newTask.assigneeId || null,
        dueDate: newTask.dueDate,
        createdBy: user?.email || "",
        visibility_type: newTask.visibility_type || "ALL",
        assigned_users: newTask.assigned_users || null,
      });

      // Handle new API response format: { success: true, data: {...} }
      const createdTask = createdTaskResponse?.data || createdTaskResponse;
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      setTasks([createdTask, ...tasksArray]);
      setIsAddTaskDialogOpen(false);
      toast.success("Task created successfully");

      // Reset form
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assigneeId: "",
        dueDate: addDays(new Date(), 7).toISOString(),
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id) => {
    setIsLoading(true);
    try {
      await apiService.deleteTask(id);
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      setTasks(tasksArray.filter((task) => task.id !== id));
      setIsViewTaskDialogOpen(false);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(error.message || "Failed to delete task");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle task status update
  const handleUpdateTaskStatus = async (task, newStatus) => {
    setIsLoading(true);
    try {
      // Use the status endpoint for employees, full update for admin/hr
      let updatedTaskResponse;
      if (user?.role === "employee") {
        // Employees can only update status
        updatedTaskResponse = await apiService.updateTaskStatus(task.id, newStatus);
      } else {
        // Admin/HR can update all fields
        updatedTaskResponse = await apiService.updateTask(task.id, {
          status: newStatus,
        });
      }

      // Handle new API response format: { success: true, data: {...} }
      const updatedTask = updatedTaskResponse?.data || updatedTaskResponse;

      const tasksArray = Array.isArray(tasks) ? tasks : [];
      setTasks(tasksArray.map((t) => (t.id === task.id ? updatedTask : t)));
      setSelectedTask(updatedTask);
      toast.success("Task status updated successfully");
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error(error.message || "Failed to update task status");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get task priority styling
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Helper function to get task status styling
  const getStatusStyles = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "review":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Helper function to get task status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "review":
        return <AlertCircle className="h-4 w-4 text-purple-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "todo":
        return <Clock3 className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock3 className="h-4 w-4 text-gray-600" />;
    }
  };

  // Helper function to get assignee info
  const getAssigneeInfo = (assigneeId) => {
    if (!assigneeId) {
      return { name: "Unassigned", avatar: "", email: "" };
    }
    const assignee = employees.find((emp) => emp.employeeId === assigneeId);
    return assignee || { name: "Unknown", avatar: "", email: "" };
  };

  // Calculate task statistics
  // Ensure tasks is always an array to prevent filter errors
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  const totalTasks = tasksArray.length;
  const completedTasks = tasksArray.filter(
    (task) => task.status === "completed"
  ).length;
  const overdueTasks = tasksArray.filter(
    (task) =>
      task.status !== "completed" &&
      task.dueDate &&
      isBefore(parseISO(task.dueDate), new Date())
  ).length;
  const dueThisWeek = tasksArray.filter((task) => {
    if (!task.dueDate || task.status === "completed") return false;
    const dueDate = parseISO(task.dueDate);
    const oneWeek = addDays(new Date(), 7);
    return (
      isAfter(dueDate, new Date()) &&
      isBefore(dueDate, oneWeek)
    );
  }).length;

  if (isInitialLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track tasks for your team
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          Manage and track tasks for your team
        </p>
      </div>

      {/* Task stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <Progress
              value={(completedTasks / totalTasks) * 100}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((completedTasks / totalTasks) * 100)}% of total tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlarmClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((overdueTasks / totalTasks) * 100)}% of total tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dueThisWeek}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming deadlines</p>
          </CardContent>
        </Card>
      </div>

      {/* Task filters and task list implementation */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-10 w-full sm:w-[260px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">In Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Task Button */}
        <Button
          className="w-full sm:w-auto"
          onClick={() => setIsAddTaskDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Task list */}
      <Card>
        <CardHeader className="px-6">
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}{" "}
            found
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-lg font-medium">No tasks found</p>
                      <p className="text-muted-foreground mt-1">
                        Try changing your filters or create a new task
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTask(task);
                      setIsViewTaskDialogOpen(true);
                    }}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.status === "completed"}
                          onCheckedChange={(checked) => {
                            handleUpdateTaskStatus(
                              task,
                              checked ? "completed" : "todo"
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <p
                            className={`font-medium ${
                              task.status === "completed"
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}>
                            {task.title}
                          </p>
                          <p className="text-muted-foreground text-sm line-clamp-1">
                            {task.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={getAssigneeInfo(task.assigneeId).avatar}
                          />
                          <AvatarFallback>
                            {getAssigneeInfo(task.assigneeId)
                              .name.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {task.assigneeName || getAssigneeInfo(task.assigneeId).name || "Unassigned"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? (
                        <div
                          className={`flex items-center gap-1 ${
                            isBefore(parseISO(task.dueDate), new Date()) &&
                            task.status !== "completed"
                              ? "text-red-600"
                              : ""
                          }`}>
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {format(parseISO(task.dueDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`${getStatusStyles(
                          task.status
                        )} gap-1 capitalize`}>
                        {getStatusIcon(task.status)}
                        <span>{task.status.replace("-", " ")}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`${getPriorityStyles(
                          task.priority
                        )} capitalize`}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                              setIsViewTaskDialogOpen(true);
                            }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task for you or your team members
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task details"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={newTask.assigneeId}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, assigneeId: value === "none" ? "" : value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.employeeId}>
                        {employee.name} ({employee.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={format(
                    parseISO(newTask.dueDate || new Date().toISOString()),
                    "yyyy-MM-dd"
                  )}
                  onChange={(e) => {
                    const date = e.target.value;
                    const newDate = new Date(`${date}T23:59:59`);
                    setNewTask({ ...newTask, dueDate: newDate.toISOString() });
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, status: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, priority: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={isLoading || !newTask.title}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog
        open={isViewTaskDialogOpen}
        onOpenChange={setIsViewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTask.title}
                  <Badge
                    variant="outline"
                    className={getPriorityStyles(selectedTask.priority)}>
                    {selectedTask.priority}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Created on{" "}
                  {selectedTask.createdAt
                    ? format(parseISO(selectedTask.createdAt), "MMMM dd, yyyy")
                    : "Unknown date"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <p className="text-sm mb-2">{selectedTask.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Status
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedTask.status)}
                      <span className="capitalize">
                        {selectedTask.status.replace("-", " ")}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Due Date
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {selectedTask.dueDate
                          ? format(parseISO(selectedTask.dueDate), "MMMM dd, yyyy")
                          : "No due date"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsViewTaskDialogOpen(false)}>
                      Close
                    </Button>
                    <div className="flex gap-2">
                      {selectedTask.status !== "review" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateTaskStatus(selectedTask, "review")}
                          disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            "Mark as Review"
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedTask.status === "completed") {
                            handleUpdateTaskStatus(selectedTask, "todo");
                          } else {
                            handleUpdateTaskStatus(selectedTask, "completed");
                          }
                        }}
                        disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : selectedTask.status === "completed" ? (
                          "Mark as To Do"
                        ) : (
                          "Mark as Completed"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
