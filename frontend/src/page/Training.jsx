import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { courses } from "@/lib/data";
// Type imports removed - types are now JSDoc comments in types/index.js
import {
  Search,
  Filter,
  GraduationCap,
  Clock,
  MoreHorizontal,
  PlayCircle,
  BookOpen,
  CheckCircle,
  PlusCircle,
  Award,
  FileText,
  BarChart2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * @typedef {Object} UserCourse
 * @property {boolean} enrolled - Whether user is enrolled
 * @property {number} progress - Progress percentage
 * @property {boolean} completed - Whether course is completed
 * @property {string} [certificateUrl] - Certificate URL
 * @property {string} [lastAccessed] - Last accessed date
 */

export default function Training() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Mock data: In a real application, this would come from the backend
  const userCourses = courses.map((course) => ({
    ...course,
    enrolled: Math.random() > 0.5,
    progress: Math.floor(Math.random() * 101),
    completed: Math.random() > 0.7,
    lastAccessed: Math.random() > 0.6 ? new Date().toISOString() : undefined,
    certificateUrl: Math.random() > 0.8 ? "#certificate" : undefined,
  }));

  // All available categories
  const categories = Array.from(
    new Set(userCourses.map((course) => course.category))
  );

  // Filter courses based on search and category
  const filteredCourses = userCourses.filter((course) => {
    const matchesSearch =
      searchQuery === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Split courses into enrolled and available
  const enrolledCourses = filteredCourses.filter((course) => course.enrolled);
  const availableCourses = filteredCourses.filter((course) => !course.enrolled);
  const completedCourses = filteredCourses.filter((course) => course.completed);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Training Center</h1>
        <p className="text-muted-foreground">
          Expand your skills and knowledge through our training programs
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Available in our library
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrolledCourses.filter((c) => !c.completed).length}
            </div>
            <p className="text-xs text-muted-foreground">Courses being taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCourses.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedCourses.filter((c) => c.certificateUrl).length}
            </div>
            <p className="text-xs text-muted-foreground">Earned credentials</p>
          </CardContent>
        </Card>
      </div>

      {/* Course tabs and filters */}
      <Tabs defaultValue="enrolled" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="enrolled">My Courses</TabsTrigger>
            <TabsTrigger value="available">Available Courses</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Request New Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request New Training</DialogTitle>
                <DialogDescription>
                  Submit a request for a new training course to be added to the
                  platform
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    placeholder="Enter the desired course title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Explain why this course would be beneficial"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filter by Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Enrolled courses tab */}
        <TabsContent value="enrolled">
          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-[200px]">
                <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No courses enrolled</p>
                <p className="text-muted-foreground mt-1">
                  Browse available courses to start learning
                </p>
                <Button className="mt-4" variant="outline" asChild>
                  <a href="#available">Browse Courses</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {course.description}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>
                            Download Materials
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Unenroll
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration} minutes</span>
                    </div>
                    <Badge className="mb-4">{course.category}</Badge>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full gap-2">
                      {course.progress > 0 ? "Continue Course" : "Start Course"}
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available courses tab */}
        <TabsContent value="available">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge>{course.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {course.completionRate}% completion rate
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Enroll in Course
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {availableCourses.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-[200px]">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No courses available</p>
                  <p className="text-muted-foreground mt-1">
                    All courses have been enrolled or don't match your filter
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Completed courses tab */}
        <TabsContent value="completed">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {completedCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {course.description}
                      </CardDescription>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration} minutes</span>
                  </div>
                  <Badge>{course.category}</Badge>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {course.certificateUrl && (
                    <Button className="flex-1 gap-2">
                      <Award className="h-4 w-4" /> View Certificate
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 gap-2">
                    <FileText className="h-4 w-4" /> Review Course
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {completedCourses.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center h-[200px]">
                  <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    No completed courses yet
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Complete your enrolled courses to see them here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
