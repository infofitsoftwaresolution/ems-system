# Role-Based Access Control (RBAC) - Complete Documentation

## 📋 Overview

The EMS System implements a comprehensive Role-Based Access Control (RBAC) system with four distinct roles: **Admin**, **HR**, **Manager**, and **Employee**. Each role has specific permissions and access levels throughout the application.

---

## 🔐 Role Definitions

### Database Schema

**Table:** `users`  
**Field:** `role` (ENUM)  
**Allowed Values:** `'admin'`, `'manager'`, `'hr'`, `'employee'`  
**Default:** `'employee'`

```sql
role: {
  type: DataTypes.ENUM('admin', 'manager', 'hr', 'employee'),
  allowNull: false,
  defaultValue: 'employee'
}
```

---

## 👥 Role Hierarchy & Permissions

### 1. **Admin** (Highest Privileges)
**Full system access with all permissions**

#### Backend Permissions:
- ✅ Full CRUD on all resources
- ✅ System administration
- ✅ User management
- ✅ Email modification (only role that can change emails)
- ✅ All analytics and reports
- ✅ KYC approval/rejection
- ✅ Employee deletion
- ✅ Event creation/update/delete
- ✅ Task creation/update/delete
- ✅ All attendance management
- ✅ All leave management
- ✅ Payslip management

#### Frontend Access:
- ✅ Dashboard with full analytics
- ✅ Employees management
- ✅ Admin Attendance
- ✅ KYC Management
- ✅ Administration panel
- ✅ All management pages
- ✅ Settings (can change email)

#### Special Privileges:
- Only role that can modify user emails
- Access to Administration panel (`/admin`)
- Can view all data across all departments

---

### 2. **HR** (Human Resources)
**Employee and HR process management**

#### Backend Permissions:
- ✅ Employee CRUD operations
- ✅ Employee deletion (soft delete)
- ✅ Event creation/update/delete
- ✅ Task creation/update/delete
- ✅ KYC review and approval
- ✅ Attendance management
- ✅ Leave management
- ✅ Payslip management
- ✅ Analytics access
- ✅ Export employee data (CSV)
- ❌ Cannot change user emails
- ❌ No system administration access

#### Frontend Access:
- ✅ Dashboard with analytics
- ✅ Employees management
- ✅ Admin Attendance
- ✅ KYC Management
- ✅ Leave Management
- ✅ Payslip Management
- ✅ Training
- ✅ Calendar/Events
- ✅ Tasks
- ✅ Settings (email read-only)

#### Special Privileges:
- Can create events and tasks for all employees
- Can review and approve KYC submissions
- Can export employee data

---

### 3. **Manager** (Department Head)
**Team and department management**

#### Backend Permissions:
- ✅ View team analytics
- ✅ View attendance (all employees)
- ✅ View leaves (all employees)
- ✅ View payslips (all employees)
- ✅ KYC review and approval
- ✅ View events (all)
- ✅ View tasks (all)
- ✅ Analytics access (team activity, training metrics, departments)
- ❌ Cannot create/update/delete events
- ❌ Cannot create/update/delete tasks
- ❌ Cannot delete employees
- ❌ Cannot change user emails

#### Frontend Access:
- ✅ Dashboard with analytics
- ✅ Employees (view only)
- ✅ Admin Attendance (view only)
- ✅ KYC Management
- ✅ Leave Management (view)
- ✅ Payslip Management (view)
- ✅ Training
- ✅ Calendar/Events (view)
- ✅ Tasks (view)
- ✅ Settings (email read-only)

#### Special Privileges:
- Can view analytics for their department/team
- Can review KYC submissions
- Read-only access to most management features

---

### 4. **Employee** (Standard User)
**Basic user access with limited permissions**

#### Backend Permissions:
- ✅ View own profile
- ✅ Update own profile (except email)
- ✅ View own attendance
- ✅ View own leaves
- ✅ View own payslips
- ✅ View own KYC status
- ✅ Submit KYC documents
- ✅ View assigned events
- ✅ View assigned tasks
- ✅ Mark tasks as complete
- ✅ Update task status
- ✅ View own notifications
- ✅ View messages in own department
- ❌ Cannot view other employees' data
- ❌ Cannot create events
- ❌ Cannot create tasks
- ❌ Cannot access analytics
- ❌ Cannot change email

#### Frontend Access:
- ✅ Employee Dashboard
- ✅ Own Profile
- ✅ Own Attendance
- ✅ Own Leave
- ✅ Own Payslip
- ✅ Settings (email read-only)
- ✅ Notifications
- ✅ Messages (department-based)
- ✅ Calendar (assigned events only)
- ✅ Tasks (assigned tasks only)
- ❌ No access to Employees page
- ❌ No access to Admin Attendance
- ❌ No access to KYC Management
- ❌ No access to Analytics

#### Special Privileges:
- Can mark assigned tasks as complete
- Can update status of assigned tasks
- Can submit KYC documents
- Can view only events/tasks assigned to them or marked as "ALL"

---

## 🛡️ Authentication & Authorization Middleware

### Backend Middleware (`backend/src/middleware/auth.js`)

#### 1. `authenticateToken`
Verifies JWT token and attaches user to request.

```javascript
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Attaches user object with role
    next();
  });
};
```

**Usage:**
```javascript
router.get('/endpoint', authenticateToken, handler);
```

#### 2. `requireRole`
Checks if user has one of the required roles.

```javascript
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
```

**Usage:**
```javascript
router.delete('/:id', authenticateToken, requireRole(['admin', 'hr']), handler);
```

---

## 🔒 Route-Level Permissions

### Employees Routes (`backend/src/routes/employees.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/employees` | GET | All authenticated | View employees (filtered by role) |
| `/api/employees` | POST | admin, hr | Create employee |
| `/api/employees/:id` | PUT | admin, hr | Update employee |
| `/api/employees/:id` | DELETE | admin, hr | Soft delete employee |
| `/api/employees/export/csv` | GET | admin, hr | Export all employees |
| `/api/employees/:id/export/csv` | GET | admin, hr | Export single employee |

**Code Example:**
```javascript
// Only Admin and HR can delete
router.delete('/:id', authenticateToken, requireRole(['admin', 'hr']), async (req, res) => {
  // Soft delete implementation
});
```

---

### Events Routes (`backend/src/routes/events.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/events` | GET | All authenticated | View events (filtered by visibility) |
| `/api/events` | POST | admin, hr | Create event |
| `/api/events/:id` | PUT | admin, hr | Update event |
| `/api/events/:id` | DELETE | admin, hr | Delete event |
| `/api/events/feed/my-events` | GET | employee | View assigned events |

**Employee Access Logic:**
```javascript
// Employees can only see:
// 1. Events with visibility_type = "ALL"
// 2. Events with visibility_type = "SPECIFIC" where they are in assigned_users
if (user.role === "employee") {
  whereClause[Op.or] = [
    { visibility_type: "ALL" },
    {
      [Op.and]: [
        { visibility_type: "SPECIFIC" },
        { assigned_users: { [Op.like]: `%${employeeId}%` } }
      ]
    }
  ];
}
```

---

### Tasks Routes (`backend/src/routes/tasks.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/tasks` | GET | All authenticated | View tasks (filtered by visibility) |
| `/api/tasks` | POST | admin, hr | Create task |
| `/api/tasks/:id` | PUT | admin, hr | Update task |
| `/api/tasks/:id` | DELETE | admin, hr | Delete task |
| `/api/tasks/:id/complete` | PUT | employee | Mark task as complete |
| `/api/tasks/:id/status` | PUT | employee | Update task status |
| `/api/tasks/feed/my-tasks` | GET | employee | View assigned tasks |

**Employee Task Completion:**
```javascript
// Employees can mark their assigned tasks as complete
router.put('/:id/complete', authenticateToken, async (req, res) => {
  // Verify task is assigned to user
  // Update status to 'completed'
});
```

---

### Analytics Routes (`backend/src/routes/analytics.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/analytics/team-activity` | GET | admin, hr, manager | Team activity metrics |
| `/api/analytics/training-metrics` | GET | admin, hr, manager | Training completion rates |
| `/api/analytics/departments` | GET | admin, hr, manager | Department statistics |

**Code Example:**
```javascript
router.get('/team-activity', 
  authenticateToken, 
  requireRole(['admin', 'hr', 'manager']), 
  async (req, res) => {
    // Return analytics data
  }
);
```

---

### KYC Routes (`backend/src/routes/kyc.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/kyc` | GET | All authenticated | View own KYC or all (if admin/hr/manager) |
| `/api/kyc` | POST | employee | Submit KYC documents |
| `/api/kyc/:id` | GET | admin, manager, hr | View specific KYC submission |
| `/api/kyc/:id/review` | POST | admin, manager, hr | Approve/reject KYC |
| `/api/kyc/:id` | DELETE | admin, manager, hr | Delete KYC submission |

**Employee Access:**
```javascript
// Employees can only check their own KYC status
if (!isAdminOrManagerOrHR) {
  if (userEmail !== email) {
    return res.status(403).json({ 
      message: 'You can only check your own KYC status.' 
    });
  }
}
```

---

### Attendance Routes (`backend/src/routes/attendance.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/attendance` | GET | admin, manager, hr | View all attendance |
| `/api/attendance/check-in` | POST | employee | Check in |
| `/api/attendance/check-out` | POST | employee | Check out |
| `/api/attendance/my-attendance` | GET | employee | View own attendance |

---

### Leaves Routes (`backend/src/routes/leaves.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/leaves` | GET | admin, manager, hr | View all leaves |
| `/api/leaves` | POST | employee | Submit leave request |
| `/api/leaves/my-leaves` | GET | employee | View own leaves |

---

### Payslip Routes (`backend/src/routes/payslip.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/payslip/all` | GET | admin, manager, hr | View all payslips |
| `/api/payslip/my-payslips` | GET | employee | View own payslips |

---

### Users Routes (`backend/src/routes/users.js`)

| Endpoint | Method | Allowed Roles | Description |
|----------|--------|---------------|-------------|
| `/api/users/me/profile` | GET | All authenticated | Get own profile |
| `/api/users/:email` | PUT | All authenticated | Update profile (email change: admin only) |
| `/api/users/upload-avatar` | POST | All authenticated | Upload avatar |
| `/api/users/remove-avatar` | DELETE | All authenticated | Remove avatar |

**Email Modification Restriction:**
```javascript
// Only admin can change email
if (updateData.email && updateData.email !== email && req.user.role !== 'admin') {
  return res.status(403).json({ 
    message: 'Only administrators can change email addresses' 
  });
}
```

---

## 🎨 Frontend Role-Based Access

### Sidebar Navigation (`frontend/src/components/layout/sidebar-nav.jsx`)

**All Users:**
- Dashboard
- Profile
- Attendance
- Leave
- Payslip
- Messages
- Notifications
- Settings

**Admin/HR/Manager Additional:**
- Employees
- Admin Attendance
- Departments
- Training
- Performance
- Payslip Management
- Leave Management
- KYC Management

**Admin Only:**
- Administration

**Code Example:**
```javascript
// Add admin/manager/hr specific items
if (user?.role === "admin" || user?.role === "manager" || user?.role === "hr") {
  baseItems.splice(1, 0, {
    title: "Employees",
    href: "/employees",
    icon: Users,
  });
  // ... more items
}

// Add admin-only items
if (user?.role === "admin") {
  baseItems.push({
    title: "Administration",
    href: "/admin",
    icon: ServerCog,
  });
}
```

---

### Dashboard Access (`frontend/src/page/Dashboard.jsx`)

**Analytics (Admin/HR/Manager only):**
```javascript
// Only fetch analytics for privileged roles
if (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') {
  fetchTeamActivity();
  fetchTrainingMetrics();
  fetchDepartmentStats();
}
```

**Employee Dashboard:**
- Shows assigned events
- Shows assigned tasks
- Shows own notifications
- No analytics access

---

### Component-Level Protection

**KYC Management (`frontend/src/page/KycManagement.jsx`):**
```javascript
// Role-based access control - only admin, manager, and HR can access
if (
  !isLoading &&
  user &&
  user.role !== "admin" &&
  user.role !== "manager" &&
  user.role !== "hr"
) {
  return <Navigate to="/" replace />;
}
```

**Employees Page (`frontend/src/page/Employees.jsx`):**
```javascript
const isAdmin = user?.role === "admin";
const isHR = user?.role === "hr";
const canDelete = isAdmin || isHR; // Only Admin and HR can delete

// UI shows delete button only if canDelete is true
{canDelete && (
  <Button onClick={() => handleDelete(employee.id)}>
    Delete
  </Button>
)}
```

---

## 📊 Permission Matrix

| Feature | Admin | HR | Manager | Employee |
|---------|-------|----|---------|----------| 
| **User Management** |
| Create Employee | ✅ | ✅ | ❌ | ❌ |
| Update Employee | ✅ | ✅ | ❌ | ❌ |
| Delete Employee | ✅ | ✅ | ❌ | ❌ |
| Change Email | ✅ | ❌ | ❌ | ❌ |
| **Events** |
| Create Event | ✅ | ✅ | ❌ | ❌ |
| Update Event | ✅ | ✅ | ❌ | ❌ |
| Delete Event | ✅ | ✅ | ❌ | ❌ |
| View All Events | ✅ | ✅ | ✅ | ❌ |
| View Assigned Events | ✅ | ✅ | ✅ | ✅ |
| **Tasks** |
| Create Task | ✅ | ✅ | ❌ | ❌ |
| Update Task | ✅ | ✅ | ❌ | ❌ |
| Delete Task | ✅ | ✅ | ❌ | ❌ |
| View All Tasks | ✅ | ✅ | ✅ | ❌ |
| View Assigned Tasks | ✅ | ✅ | ✅ | ✅ |
| Mark Task Complete | ✅ | ✅ | ✅ | ✅ |
| **KYC** |
| Submit KYC | ✅ | ✅ | ✅ | ✅ |
| Review KYC | ✅ | ✅ | ✅ | ❌ |
| Approve/Reject KYC | ✅ | ✅ | ✅ | ❌ |
| Delete KYC | ✅ | ✅ | ✅ | ❌ |
| **Attendance** |
| View All Attendance | ✅ | ✅ | ✅ | ❌ |
| View Own Attendance | ✅ | ✅ | ✅ | ✅ |
| Check In/Out | ✅ | ✅ | ✅ | ✅ |
| **Leaves** |
| View All Leaves | ✅ | ✅ | ✅ | ❌ |
| View Own Leaves | ✅ | ✅ | ✅ | ✅ |
| Submit Leave | ✅ | ✅ | ✅ | ✅ |
| **Payslips** |
| View All Payslips | ✅ | ✅ | ✅ | ❌ |
| View Own Payslips | ✅ | ✅ | ✅ | ✅ |
| **Analytics** |
| Team Activity | ✅ | ✅ | ✅ | ❌ |
| Training Metrics | ✅ | ✅ | ✅ | ❌ |
| Department Stats | ✅ | ✅ | ✅ | ❌ |
| **System** |
| Administration Panel | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |

---

## 🔍 Implementation Examples

### Example 1: Protected Route with Role Check

```javascript
// Backend
router.post('/events', 
  authenticateToken,           // 1. Verify token
  requireRole(['admin', 'hr']), // 2. Check role
  async (req, res) => {
    // 3. Handler only executes if both checks pass
    const event = await Event.create(req.body);
    res.json({ success: true, data: event });
  }
);
```

### Example 2: Conditional Data Filtering

```javascript
// Backend - Events route
if (user.role === "employee") {
  // Employees can only see assigned events
  whereClause[Op.or] = [
    { visibility_type: "ALL" },
    {
      [Op.and]: [
        { visibility_type: "SPECIFIC" },
        { assigned_users: { [Op.like]: `%${employeeId}%` } }
      ]
    }
  ];
} else {
  // Admin/HR/Manager see all events
  // No additional filtering
}
```

### Example 3: Frontend Conditional Rendering

```javascript
// Frontend - Employees page
const { user } = useAuth();
const canDelete = user?.role === "admin" || user?.role === "hr";

return (
  <div>
    {canDelete && (
      <Button onClick={handleDelete}>Delete Employee</Button>
    )}
  </div>
);
```

### Example 4: Email Modification Restriction

```javascript
// Backend - Users route
router.put('/:email', authenticateToken, async (req, res) => {
  const { email } = req.params;
  const { updateData } = req.body;
  
  // Only admin can change email
  if (updateData.email && updateData.email !== email && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Only administrators can change email addresses' 
    });
  }
  
  // Update user
  await user.update(updateData);
  res.json({ success: true, data: user });
});
```

---

## 🚨 Error Responses

### 401 Unauthorized
Returned when:
- No token provided
- Invalid/expired token

```json
{
  "message": "Access token required"
}
```

### 403 Forbidden
Returned when:
- User doesn't have required role
- User tries to access another user's data
- User tries to perform unauthorized action

```json
{
  "message": "Insufficient permissions"
}
```

---

## 🔄 Role Assignment

### Default Role
- New users are assigned `'employee'` role by default
- Only Admin can change user roles (through Administration panel)

### Role Migration
The system includes a migration to add the `'hr'` role to the ENUM:
```javascript
// backend/src/migrations/addHrRole.js
ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'hr';
```

---

## 📝 Best Practices

1. **Always use middleware:** Use `authenticateToken` before `requireRole`
2. **Check on both ends:** Implement role checks in both backend and frontend
3. **Filter data by role:** Employees should only see their own data
4. **Use consistent role names:** Always use lowercase: `'admin'`, `'hr'`, `'manager'`, `'employee'`
5. **Handle errors gracefully:** Show appropriate messages for 401/403 errors
6. **Test all roles:** Ensure each role can only access permitted features

---

## 🔐 Security Considerations

1. **JWT Secret:** Always use a strong `JWT_SECRET` in production
2. **Token Expiration:** Tokens expire after 24 hours (configurable)
3. **Role Validation:** Always validate roles on the backend, never trust frontend
4. **Data Filtering:** Filter sensitive data based on user role
5. **Audit Logging:** Consider logging role-based actions for audit trails

---

## 📚 Related Files

- **Backend Middleware:** `backend/src/middleware/auth.js`
- **User Model:** `backend/src/models/User.js`
- **Role Migration:** `backend/src/migrations/addHrRole.js`
- **Frontend Auth Context:** `frontend/src/lib/auth-context.jsx`
- **Role-Based Dashboard:** `frontend/src/components/RoleBasedDashboard.jsx`
- **Sidebar Navigation:** `frontend/src/components/layout/sidebar-nav.jsx`

---

## 🎯 Summary

The RBAC system provides:
- ✅ **4 distinct roles** with clear permission boundaries
- ✅ **Middleware-based protection** for all routes
- ✅ **Frontend conditional rendering** based on roles
- ✅ **Data filtering** to ensure users only see permitted data
- ✅ **Consistent implementation** across all modules
- ✅ **Security-first approach** with backend validation

This ensures that users can only access and modify data they are authorized to, maintaining system security and data integrity.

