// Sample data for demonstration purposes
// In a real application, this would be fetched from a backend API

// Users/Employees
export const users = [
  {
    id: "u1",
    name: "John Doe",
    email: "john.doe@company.com",
    role: "r1",
    avatar: "https://ui-avatars.com/api/?name=John+Doe",
    department: "d1",
    position: "Software Engineer",
    dateJoined: "2022-01-15",
    status: "active",
  },
  {
    id: "u2",
    name: "Jane Smith",
    email: "jane.smith@company.com",
    role: "r2",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith",
    department: "d2",
    position: "HR Manager",
    dateJoined: "2021-08-10",
    status: "active",
  },
  {
    id: "u3",
    name: "Michael Johnson",
    email: "michael.j@company.com",
    role: "r3",
    avatar: "https://ui-avatars.com/api/?name=Michael+Johnson",
    department: "d3",
    position: "Finance Director",
    dateJoined: "2020-03-22",
    status: "active",
  },
  {
    id: "u4",
    name: "Emily Davis",
    email: "emily.davis@company.com",
    role: "r1",
    avatar: "https://ui-avatars.com/api/?name=Emily+Davis",
    department: "d1",
    position: "UX Designer",
    dateJoined: "2022-11-05",
    status: "active",
  },
  {
    id: "u5",
    name: "Robert Wilson",
    email: "robert.w@company.com",
    role: "r4",
    avatar: "https://ui-avatars.com/api/?name=Robert+Wilson",
    department: "d4",
    position: "Marketing Specialist",
    dateJoined: "2021-06-18",
    status: "onLeave",
  },
];

// Departments
export const departments = [
  {
    id: "d1",
    name: "Engineering",
    description: "Software development and technical operations",
    managerId: "u1",
    employeeCount: 24,
  },
  {
    id: "d2",
    name: "Human Resources",
    description: "Employee management and recruitment",
    managerId: "u2",
    employeeCount: 8,
  },
  {
    id: "d3",
    name: "Finance",
    description: "Budget management and financial operations",
    managerId: "u3",
    employeeCount: 12,
  },
  {
    id: "d4",
    name: "Marketing",
    description: "Brand management and market research",
    managerId: "u5",
    employeeCount: 15,
  },
];

// Roles
export const roles = [
  {
    id: "r1",
    name: "Employee",
    permissions: ["view_profile", "view_courses", "submit_reviews"],
    description: "Regular employee with basic access",
  },
  {
    id: "r2",
    name: "HR Manager",
    permissions: [
      "view_profile",
      "view_courses",
      "submit_reviews",
      "manage_employees",
      "manage_departments",
      "view_analytics",
    ],
    description: "Manages HR processes and employee data",
  },
  {
    id: "r3",
    name: "Department Head",
    permissions: [
      "view_profile",
      "view_courses",
      "submit_reviews",
      "manage_team",
      "approve_leaves",
      "view_team_analytics",
    ],
    description: "Manages a specific department",
  },
  {
    id: "r4",
    name: "Administrator",
    permissions: [
      "view_profile",
      "view_courses",
      "submit_reviews",
      "manage_employees",
      "manage_departments",
      "view_analytics",
      "manage_roles",
      "system_settings",
    ],
    description: "Full system access",
  },
];

// Courses
export const courses = [
  {
    id: "c1",
    title: "Workplace Safety",
    description: "Essential guidelines for maintaining a safe workplace",
    category: "Compliance",
    duration: 60,
    instructor: "Safety Officer",
    requiredFor: ["r1", "r2", "r3", "r4"],
    completionRate: 89,
    status: "active",
  },
  {
    id: "c2",
    title: "Leadership Fundamentals",
    description: "Core skills for effective leadership in the workplace",
    category: "Professional Development",
    duration: 120,
    instructor: "Leadership Coach",
    requiredFor: ["r2", "r3", "r4"],
    completionRate: 76,
    status: "active",
  },
  {
    id: "c3",
    title: "Technical Onboarding",
    description: "Introduction to company technical systems and practices",
    category: "Onboarding",
    duration: 180,
    instructor: "IT Department",
    requiredFor: ["r1"],
    completionRate: 95,
    status: "active",
  },
];

// Performance Reviews
export const performanceReviews = [
  {
    id: "pr1",
    employeeId: "u1",
    reviewerId: "u3",
    date: "2023-06-15",
    scores: [
      {
        category: "Technical Skills",
        score: 4.5,
        comment: "Excellent technical knowledge and problem-solving skills",
      },
      {
        category: "Communication",
        score: 4.0,
        comment: "Communicates effectively with team members and stakeholders",
      },
      {
        category: "Teamwork",
        score: 3.8,
        comment: "Works well in team settings, contributes to group projects",
      },
    ],
    overallScore: 4.1,
    status: "submitted",
    feedback:
      "John has been a valuable team member, consistently delivering high-quality work. Areas for growth include taking more initiative on new projects.",
    goals: [
      "Complete advanced certification",
      "Mentor junior team members",
      "Lead at least one major project",
    ],
  },
  {
    id: "pr2",
    employeeId: "u4",
    reviewerId: "u1",
    date: "2023-05-22",
    scores: [
      {
        category: "Design Skills",
        score: 4.7,
        comment: "Outstanding design work, very creative solutions",
      },
      {
        category: "Communication",
        score: 3.5,
        comment: "Could improve communication with technical team members",
      },
      {
        category: "Time Management",
        score: 4.2,
        comment: "Consistently delivers projects on time",
      },
    ],
    overallScore: 4.1,
    status: "acknowledged",
    feedback:
      "Emily produces exceptional design work. To advance further, should focus on strengthening collaboration with the development team.",
    goals: [
      "Improve cross-functional communication",
      "Learn basics of front-end development",
      "Lead redesign of a major feature",
    ],
  },
];

// Events
export const events = [
  {
    id: "e1",
    title: "Quarterly Team Meeting",
    description: "Review of Q2 goals and planning for Q3",
    start: "2023-07-15T10:00:00",
    end: "2023-07-15T12:00:00",
    organizer: "u3",
    attendees: ["u1", "u2", "u3", "u4", "u5"],
    location: "Conference Room A",
    type: "meeting",
  },
  {
    id: "e2",
    title: "New Employee Orientation",
    description: "Welcome session for new team members",
    start: "2023-07-18T09:00:00",
    end: "2023-07-18T16:00:00",
    organizer: "u2",
    attendees: [],
    location: "Training Center",
    type: "training",
  },
  {
    id: "e3",
    title: "Independence Day",
    description: "Company holiday",
    start: "2023-07-04T00:00:00",
    end: "2023-07-04T23:59:59",
    organizer: "u2",
    attendees: [],
    location: "Offsite",
    type: "holiday",
  },
];

// Notifications
export const notifications = [
  {
    id: "n1",
    userId: "u1",
    title: "Performance Review",
    message: "Your annual performance review is scheduled for next week",
    type: "info",
    isRead: false,
    date: "2023-07-01T09:15:00",
    link: "/reviews/upcoming",
  },
  {
    id: "n2",
    userId: "u1",
    title: "Training Completion",
    message:
      "You have successfully completed the Leadership Fundamentals course",
    type: "success",
    isRead: true,
    date: "2023-06-28T14:22:00",
    link: "/training/certificates",
  },
  {
    id: "n3",
    userId: "u1",
    title: "Meeting Reminder",
    message: "Quarterly Team Meeting starts in 30 minutes",
    type: "info",
    isRead: false,
    date: "2023-07-15T09:30:00",
    link: "/calendar/e1",
  },
];

// Dashboard Statistics
export const dashboardStats = {
  totalEmployees: 120,
  activeEmployees: 112,
  departmentsCount: 8,
  newHires: 5,
  upcomingReviews: 12,
  trainingCompletionRate: 84,
  employeeSatisfactionRate: 88,
};

// Team Activity
export const teamActivity = [
  { date: "2023-06-29", activeUsers: 98, completedTasks: 45, newDocuments: 12 },
  { date: "2023-06-30", activeUsers: 105, completedTasks: 52, newDocuments: 8 },
  { date: "2023-07-01", activeUsers: 88, completedTasks: 37, newDocuments: 5 },
  { date: "2023-07-02", activeUsers: 45, completedTasks: 18, newDocuments: 2 },
  {
    date: "2023-07-03",
    activeUsers: 112,
    completedTasks: 64,
    newDocuments: 15,
  },
  { date: "2023-07-04", activeUsers: 32, completedTasks: 12, newDocuments: 3 },
  {
    date: "2023-07-05",
    activeUsers: 101,
    completedTasks: 58,
    newDocuments: 11,
  },
];

// Service functions to mimic API calls
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// User services
export const getUserById = async (id) => {
  await delay(300); // Simulate API delay
  return users.find((user) => user.id === id);
};

export const getAllUsers = async () => {
  await delay(500);
  return [...users];
};

export const getDepartmentById = async (id) => {
  await delay(300);
  return departments.find((dept) => dept.id === id);
};

export const getAllDepartments = async () => {
  await delay(400);
  return [...departments];
};

export const getCourseById = async (id) => {
  await delay(300);
  return courses.find((course) => course.id === id);
};

export const getAllCourses = async () => {
  await delay(400);
  return [...courses];
};

export const getReviewsByEmployeeId = async (employeeId) => {
  await delay(400);
  return performanceReviews.filter(
    (review) => review.employeeId === employeeId
  );
};

export const getUpcomingEvents = async (days = 30) => {
  await delay(400);
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + days);

  return events.filter((event) => {
    const eventDate = new Date(event.start);
    return eventDate >= now && eventDate <= futureDate;
  });
};

export const getUserNotifications = async (userId) => {
  await delay(300);
  return notifications.filter((notification) => notification.userId === userId);
};

export const getDashboardData = async () => {
  await delay(600);
  return dashboardStats;
};

export const getTeamActivityData = async (days = 7) => {
  await delay(400);
  return teamActivity.slice(-days);
};
