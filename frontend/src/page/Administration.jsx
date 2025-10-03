import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Users,
  BookOpen,
  Settings,
  Layout,
  Shield,
  FileText,
  Database,
  Bell,
  Upload,
  PieChart,
  Sliders,
  PlugZap,
  Globe,
  PaintBucket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

export default function Administration() {
  const [mainTab, setMainTab] = useState("dashboard");
  const [subTab, setSubTab] = useState({
    dashboard: "overview",
    users: "manage",
    courses: "manage",
    appearance: "themes",
    plugins: "manage",
    security: "settings",
    reports: "logs",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  // Mock data for the dashboard
  const systemStats = {
    activeUsers: 1248,
    activeCourses: 87,
    storageUsed: 68,
    systemLoad: 12,
    lastBackup: "2025-08-06 03:00 AM",
    pendingUpdates: 3,
  };

  // Mock plugins data
  const plugins = [
    {
      id: 1,
      name: "Advanced Forums",
      status: "active",
      version: "3.2.1",
      type: "communication",
    },
    {
      id: 2,
      name: "Interactive Content",
      status: "active",
      version: "2.1.0",
      type: "content",
    },
    {
      id: 3,
      name: "Gamification Pack",
      status: "inactive",
      version: "1.9.5",
      type: "engagement",
    },
    {
      id: 4,
      name: "Analytics Dashboard",
      status: "active",
      version: "4.0.2",
      type: "analytics",
    },
    {
      id: 5,
      name: "External Tools",
      status: "active",
      version: "2.8.7",
      type: "integration",
    },
    {
      id: 6,
      name: "Assignment Feedback",
      status: "inactive",
      version: "1.5.3",
      type: "assessment",
    },
  ];

  // Mock themes data
  const themes = [
    {
      id: 1,
      name: "Modern Light",
      active: true,
      preview: "https://placehold.co/600x400/e9ecef/495057?text=Modern+Light",
    },
    {
      id: 2,
      name: "Dark Academia",
      active: false,
      preview: "https://placehold.co/600x400/212529/e9ecef?text=Dark+Academia",
    },
    {
      id: 3,
      name: "Vibrant Campus",
      active: false,
      preview: "https://placehold.co/600x400/4263eb/ffffff?text=Vibrant+Campus",
    },
    {
      id: 4,
      name: "Minimalist",
      active: false,
      preview: "https://placehold.co/600x400/f8f9fa/495057?text=Minimalist",
    },
  ];

  // Mock logs data
  const systemLogs = [
    {
      id: 1,
      type: "login",
      user: "admin@example.com",
      action: "Successful login",
      timestamp: "2025-08-07 09:23:15",
      ip: "192.168.1.1",
    },
    {
      id: 2,
      type: "course",
      user: "instructor1@example.com",
      action: "Created new course: Advanced Analytics",
      timestamp: "2025-08-07 08:14:22",
      ip: "192.168.1.45",
    },
    {
      id: 3,
      type: "user",
      user: "admin@example.com",
      action: "Updated user roles for user ID: 127",
      timestamp: "2025-08-07 07:55:01",
      ip: "192.168.1.1",
    },
    {
      id: 4,
      type: "security",
      user: "system",
      action: "Failed login attempt for user: unknown",
      timestamp: "2025-08-07 06:12:37",
      ip: "203.0.113.45",
    },
    {
      id: 5,
      type: "backup",
      user: "system",
      action: "Automatic backup completed successfully",
      timestamp: "2025-08-07 03:00:00",
      ip: "127.0.0.1",
    },
  ];

  // Helper to filter modules by search query
  const filterAdminModules = (modules) => {
    if (!searchQuery) return modules;
    return modules.filter(
      (module) =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Admin modules data
  const adminModules = {
    dashboard: [
      {
        title: "Overview",
        value: "overview",
        icon: Layout,
        description: "System overview and statistics",
      },
      {
        title: "Updates",
        value: "updates",
        icon: Upload,
        description: "System updates and notifications",
      },
      {
        title: "Health Check",
        value: "health",
        icon: Shield,
        description: "System health and diagnostics",
      },
    ],
    users: [
      {
        title: "Manage Users",
        value: "manage",
        icon: Users,
        description: "Add, edit, and manage users",
      },
      {
        title: "User Roles",
        value: "roles",
        icon: Shield,
        description: "Configure user roles and permissions",
      },
      {
        title: "Bulk Actions",
        value: "bulk",
        icon: Database,
        description: "Perform bulk operations on users",
      },
    ],
    courses: [
      {
        title: "Manage Courses",
        value: "manage",
        icon: BookOpen,
        description: "Add, edit, and manage courses",
      },
      {
        title: "Categories",
        value: "categories",
        icon: Layout,
        description: "Organize courses into categories",
      },
      {
        title: "Course Settings",
        value: "settings",
        icon: Settings,
        description: "Configure global course settings",
      },
      {
        title: "Enrollments",
        value: "enrollments",
        icon: Users,
        description: "Manage course enrollments",
      },
    ],
    appearance: [
      {
        title: "Themes",
        value: "themes",
        icon: PaintBucket,
        description: "Customize the look and feel",
      },
      {
        title: "Navigation",
        value: "navigation",
        icon: Layout,
        description: "Configure site navigation",
      },
      {
        title: "Branding",
        value: "branding",
        icon: Globe,
        description: "Site branding and identity",
      },
    ],
    plugins: [
      {
        title: "Manage Plugins",
        value: "manage",
        icon: PlugZap,
        description: "Install and manage plugins",
      },
      {
        title: "Settings",
        value: "settings",
        icon: Settings,
        description: "Configure plugin settings",
      },
    ],
    security: [
      {
        title: "Security Settings",
        value: "settings",
        icon: Shield,
        description: "Configure security options",
      },
      {
        title: "IP Blocking",
        value: "ip",
        icon: Shield,
        description: "Manage IP restrictions",
      },
      {
        title: "Authentication",
        value: "auth",
        icon: Users,
        description: "Configure authentication methods",
      },
    ],
    reports: [
      {
        title: "System Logs",
        value: "logs",
        icon: FileText,
        description: "View system activity logs",
      },
      {
        title: "Course Reports",
        value: "courses",
        icon: BarChart,
        description: "Reports on course activity",
      },
      {
        title: "User Statistics",
        value: "users",
        icon: PieChart,
        description: "User participation statistics",
      },
    ],
  };

  const renderDashboardOverview = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="bg-muted/50 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" /> Active Users
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{systemStats.activeUsers}</div>
            <p className="text-sm text-muted-foreground mt-1">
              +12% from last week
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-l-4 border-l-green-500">
          <CardHeader className="bg-muted/50 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">
              {systemStats.activeCourses}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              3 new courses this month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="bg-muted/50 pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Database className="h-5 w-5" /> Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {systemStats.storageUsed}%
              </div>
              <Progress
                value={systemStats.storageUsed}
                className="h-2 flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              512GB of 750GB used
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="col-span-full">
        <Card className="overflow-hidden w-full">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-lg font-medium">System Status</CardTitle>
            <CardDescription>
              Current system health and recent activity
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1">
                <div className="font-medium">System Load</div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={systemStats.systemLoad}
                    className="h-2 flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {systemStats.systemLoad}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">Last Backup</div>
                <div className="text-sm">{systemStats.lastBackup}</div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">Pending Updates</div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {systemStats.pendingUpdates}
                  </Badge>
                  <Button size="sm" variant="outline">
                    View Updates
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">Memory Usage</div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={systemStats.memoryUsage || 45}
                    className="h-2 flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {systemStats.memoryUsage || 45}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">CPU Usage</div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={systemStats.cpuUsage || 23}
                    className="h-2 flex-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {systemStats.cpuUsage || 23}%
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-medium">Database Status</div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800">
                    Online
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium">Recent System Logs</h4>
              <div className="rounded-md border">
                <div className="bg-muted/50 px-6 py-3 grid grid-cols-12 text-sm font-medium">
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">User</div>
                  <div className="col-span-4">Action</div>
                  <div className="col-span-3">Timestamp</div>
                </div>
                {systemLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="px-6 py-3 grid grid-cols-12 text-sm border-t">
                    <div className="col-span-2">
                      <Badge
                        variant={
                          log.type === "security" ? "destructive" : "outline"
                        }
                        className="capitalize">
                        {log.type}
                      </Badge>
                    </div>
                    <div className="col-span-3 truncate">{log.user}</div>
                    <div className="col-span-4 truncate">{log.action}</div>
                    <div className="col-span-3 text-muted-foreground">
                      {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <Button variant="link" size="sm" className="mt-2">
                  View All Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  const renderPluginsManage = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Plugins</h2>
          <p className="text-muted-foreground">
            Manage and configure system plugins
          </p>
        </div>
        <div>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Install New Plugin
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Installed Plugins</CardTitle>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Total of {plugins.length} plugins installed,{" "}
            {plugins.filter((p) => p.status === "active").length} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div className="space-y-4" variants={containerVariants}>
            {plugins.map((plugin) => (
              <motion.div
                key={plugin.id}
                variants={itemVariants}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{plugin.name}</h4>
                    <Badge
                      variant={
                        plugin.status === "active" ? "default" : "outline"
                      }
                      className="capitalize">
                      {plugin.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-3">
                    <span>v{plugin.version}</span>
                    <Badge variant="outline" className="capitalize">
                      {plugin.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    Settings
                  </Button>
                  <Switch checked={plugin.status === "active"} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderThemes = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Themes</h2>
          <p className="text-muted-foreground">
            Customize the look and feel of your platform
          </p>
        </div>
        <div>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Upload Theme
          </Button>
        </div>
      </div>

      <motion.div className="grid gap-6 md:grid-cols-2">
        {themes.map((theme) => (
          <motion.div key={theme.id} variants={itemVariants} className="group">
            <Card className={theme.active ? "border-2 border-primary" : ""}>
              <CardContent className="p-0 overflow-hidden">
                <div className="relative">
                  <img
                    src={theme.preview}
                    alt={theme.name}
                    className="w-full aspect-video object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-white text-white hover:text-white">
                        Preview
                      </Button>
                      {!theme.active && <Button>Activate</Button>}
                    </div>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{theme.name}</h3>
                    {theme.active && <Badge className="mt-1">Active</Badge>}
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );

  const renderSystemLogs = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">System Logs</h2>
          <p className="text-muted-foreground">
            View and analyze system activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Log type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Logs</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>System Activity</CardTitle>
            <div className="relative">
              <Input
                type="search"
                placeholder="Search logs..."
                className="w-[280px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="bg-muted/50 px-4 py-2 grid grid-cols-12 text-sm font-medium">
              <div className="col-span-2">Type</div>
              <div className="col-span-2">User</div>
              <div className="col-span-4">Action</div>
              <div className="col-span-2">IP</div>
              <div className="col-span-2">Timestamp</div>
            </div>
            <motion.div variants={containerVariants}>
              {systemLogs.map((log) => (
                <motion.div
                  key={log.id}
                  variants={itemVariants}
                  className="px-4 py-2 grid grid-cols-12 text-sm border-t hover:bg-muted/30">
                  <div className="col-span-2">
                    <Badge
                      variant={
                        log.type === "security" ? "destructive" : "outline"
                      }
                      className="capitalize">
                      {log.type}
                    </Badge>
                  </div>
                  <div className="col-span-2 truncate">{log.user}</div>
                  <div className="col-span-4 truncate">{log.action}</div>
                  <div className="col-span-2 font-mono text-xs">{log.ip}</div>
                  <div className="col-span-2 text-muted-foreground">
                    {log.timestamp}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">5</span> of{" "}
              <span className="font-medium">100</span> results
            </div>
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSubTabContent = () => {
    if (mainTab === "dashboard" && subTab.dashboard === "overview")
      return renderDashboardOverview();
    if (mainTab === "plugins" && subTab.plugins === "manage")
      return renderPluginsManage();
    if (mainTab === "appearance" && subTab.appearance === "themes")
      return renderThemes();
    if (mainTab === "reports" && subTab.reports === "logs")
      return renderSystemLogs();

    // For other tabs, show a placeholder
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Settings className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">This section is coming soon</h2>
        <p className="text-muted-foreground max-w-md mt-2">
          We're currently working on implementing this feature. Check back soon!
        </p>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col gap-6 transition-all ${
        isFullscreen ? "fixed inset-0 z-50 bg-background p-6" : ""
      }`}>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Site Administration
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-minimize-2">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" x2="21" y1="10" y2="3"></line>
                <line x1="3" x2="10" y1="21" y2="14"></line>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-maximize-2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" x2="14" y1="3" y2="10"></line>
                <line x1="3" x2="10" y1="21" y2="14"></line>
              </svg>
            )}
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage your site settings, users, courses and more
        </p>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <Card className="p-0 md:h-[calc(100vh-280px)] flex flex-col">
          <div className="p-4 border-b">
            <Input
              type="search"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1 p-4">
            <Accordion
              type="single"
              collapsible
              defaultValue="dashboard"
              className="w-full">
              {Object.entries({
                dashboard: { title: "Dashboard", icon: BarChart },
                users: { title: "Users", icon: Users },
                courses: { title: "Courses", icon: BookOpen },
                appearance: { title: "Appearance", icon: PaintBucket },
                plugins: { title: "Plugins", icon: PlugZap },
                security: { title: "Security", icon: Shield },
                reports: { title: "Reports", icon: FileText },
                // eslint-disable-next-line no-unused-vars
              }).map(([key, { title, icon: Icon }]) => (
                <AccordionItem key={key} value={key}>
                  <AccordionTrigger
                    className="hover:no-underline py-2"
                    onClick={() => setMainTab(key)}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="space-y-1 pl-6">
                      {filterAdminModules(adminModules[key]).map((module) => (
                        <Button
                          key={module.value}
                          variant={
                            subTab[key] === module.value ? "secondary" : "ghost"
                          }
                          className="w-full justify-start"
                          size="sm"
                          onClick={() => {
                            setSubTab((prev) => ({
                              ...prev,
                              [key]: module.value,
                            }));
                            setMainTab(key);
                          }}>
                          {module.title}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </Card>

        <Card className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mainTab}-${subTab[mainTab]}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}>
              {renderSubTabContent()}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
