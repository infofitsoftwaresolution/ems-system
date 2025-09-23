# MVC Architecture Documentation

## Project Structure Overview

The Employee Management System (EMS) has been restructured to follow the Model-View-Controller (MVC) architectural pattern for better code organization, maintainability, and scalability.

## Backend Structure

```
backend/
├── config/                 # Configuration files
│   └── sequelize.js       # Database configuration
├── controllers/           # Business logic controllers
│   ├── attendanceController.js
│   ├── authController.js
│   ├── employeeController.js
│   ├── emailController.js
│   ├── healthController.js
│   ├── kycController.js
│   ├── leaveController.js
│   ├── payslipController.js
│   └── userController.js
├── middleware/            # Custom middleware
│   └── auth.js           # Authentication middleware
├── models/               # Data models (Sequelize)
│   ├── AccessLog.js
│   ├── Attendance.js
│   ├── Course.js
│   ├── Employee.js
│   ├── Event.js
│   ├── Kyc.js
│   ├── Leave.js
│   ├── NotificationSetting.js
│   ├── Payslip.js
│   ├── SiteSetting.js
│   └── User.js
├── routes/               # API route definitions
│   ├── attendance.js
│   ├── auth.js
│   ├── employees.js
│   ├── emailTest.js
│   ├── health.js
│   ├── kyc.js
│   ├── leaves.js
│   ├── payslip.js
│   └── users.js
├── services/             # Business services
│   └── emailService.js   # Email service
├── utils/                # Utility functions
│   ├── seed.js          # Database seeding
│   ├── seedKyc.js       # KYC seeding
│   └── test.js          # Test utilities
├── views/                # View templates (if needed)
├── uploads/              # File uploads
├── server.js             # Main application entry point
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables
```

## Frontend Structure

```
frontend/src/
├── components/           # Reusable UI components
│   ├── Calendar.js
│   ├── DepartmentDistribution.js
│   ├── EditEmployeeModal.js
│   ├── Email.js
│   ├── Header.js
│   ├── KycReminder.js
│   ├── LeaveActionSuccessPopup.js
│   ├── LeaveApprovalPopup.js
│   ├── Messages.js
│   ├── Notifications.js
│   ├── PayslipsList.js
│   ├── Sidebar.js
│   ├── StatCard.js
│   ├── SuccessPopup.js
│   ├── TeamActivityChart.js
│   └── TrainingMetrics.js
├── pages/               # Page components (Views)
│   ├── AccessLogs.js
│   ├── AddCourse.js
│   ├── AddEmployee.js
│   ├── AdminPresets.js
│   ├── AdvancedFeatures.js
│   ├── AnalyticsModels.js
│   ├── AnalyticsSettings.js
│   ├── Attendance.js
│   ├── AttendanceManagement.js
│   ├── Courses.js
│   ├── Dashboard.js
│   ├── Employees.js
│   ├── FeedbackSettings.js
│   ├── KycReview.js
│   ├── KycSubmit.js
│   ├── LeaveApply.js
│   ├── LeaveReview.js
│   ├── Login.js
│   ├── NotificationSettings.js
│   ├── NotificationsPage.js
│   ├── Payslips.js
│   ├── RegistrationSettings.js
│   ├── Reports.js
│   ├── Settings.js
│   ├── SetupPassword.js
│   ├── SiteAdmin.js
│   ├── SiteAdminAccess.js
│   ├── SiteInformation.js
│   ├── SystemServices.js
│   ├── UserPermissions.js
│   ├── UserRoles.js
│   └── [corresponding .css files]
├── services/            # API services
│   └── api.js          # API client
├── App.js              # Main application component
├── App.css             # Global styles
├── index.js            # Application entry point
└── index.css           # Global styles
```

## MVC Pattern Implementation

### Models (Data Layer)

- **Location**: `backend/models/`
- **Purpose**: Define data structures and database relationships
- **Technology**: Sequelize ORM
- **Responsibilities**:
  - Database schema definition
  - Data validation
  - Model associations
  - Database operations

### Views (Presentation Layer)

- **Location**: `frontend/src/pages/` and `frontend/src/components/`
- **Purpose**: User interface components
- **Technology**: React.js
- **Responsibilities**:
  - User interface rendering
  - User interaction handling
  - Data presentation
  - Form handling

### Controllers (Business Logic Layer)

- **Location**: `backend/controllers/`
- **Purpose**: Handle business logic and coordinate between models and views
- **Technology**: Node.js/Express
- **Responsibilities**:
  - Request processing
  - Business logic implementation
  - Data validation
  - Response formatting
  - Error handling

## Key Benefits of MVC Structure

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Maintainability**: Code is organized and easy to locate
3. **Scalability**: Easy to add new features without affecting existing code
4. **Testability**: Each component can be tested independently
5. **Reusability**: Controllers and models can be reused across different views
6. **Team Collaboration**: Different team members can work on different layers

## API Endpoints Structure

All API endpoints follow RESTful conventions:

- **Authentication**: `/api/auth/*`
- **Employees**: `/api/employees/*`
- **Users**: `/api/users/*`
- **KYC**: `/api/kyc/*`
- **Attendance**: `/api/attendance/*`
- **Leaves**: `/api/leaves/*`
- **Payslips**: `/api/payslip/*`
- **Health Check**: `/api/health/*`
- **Email Testing**: `/api/email/*`

## Development Workflow

1. **Models**: Define data structures in `backend/models/`
2. **Controllers**: Implement business logic in `backend/controllers/`
3. **Routes**: Define API endpoints in `backend/routes/`
4. **Views**: Create UI components in `frontend/src/pages/` and `frontend/src/components/`
5. **Services**: Implement API calls in `frontend/src/services/`

## Environment Setup

1. **Backend**:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Database Configuration

- **Configuration**: `backend/config/sequelize.js`
- **Models**: `backend/models/`
- **Seeding**: `backend/utils/seed.js`

This MVC structure provides a solid foundation for the Employee Management System, making it easier to maintain, extend, and scale the application.
