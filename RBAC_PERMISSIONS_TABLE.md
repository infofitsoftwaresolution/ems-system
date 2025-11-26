# RBAC Permissions - Tabular Format

## Complete Permission Matrix

### User Management

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **User Profile** |
| View Own Profile | GET | ✅ | ✅ | ✅ | ✅ |
| Update Own Profile | PUT | ✅ | ✅ | ✅ | ✅ |
| Change Email | PUT | ✅ | ❌ | ❌ | ❌ |
| Upload Avatar | POST | ✅ | ✅ | ✅ | ✅ |
| Remove Avatar | DELETE | ✅ | ✅ | ✅ | ✅ |
| **Employee Management** |
| View All Employees | GET | ✅ | ✅ | ✅ | ❌ |
| Create Employee | POST | ✅ | ✅ | ❌ | ❌ |
| Update Employee | PUT | ✅ | ✅ | ❌ | ❌ |
| Delete Employee | DELETE | ✅ | ✅ | ❌ | ❌ |
| Export Employees (CSV) | GET | ✅ | ✅ | ❌ | ❌ |
| Export Single Employee (CSV) | GET | ✅ | ✅ | ❌ | ❌ |

---

### Events Management

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Events** |
| View All Events | GET | ✅ | ✅ | ✅ | ❌ |
| View Assigned Events | GET | ✅ | ✅ | ✅ | ✅ |
| Create Event | POST | ✅ | ✅ | ❌ | ❌ |
| Update Event | PUT | ✅ | ✅ | ❌ | ❌ |
| Delete Event | DELETE | ✅ | ✅ | ❌ | ❌ |
| View My Events Feed | GET | ✅ | ✅ | ✅ | ✅ |

---

### Tasks Management

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Tasks** |
| View All Tasks | GET | ✅ | ✅ | ✅ | ❌ |
| View Assigned Tasks | GET | ✅ | ✅ | ✅ | ✅ |
| Create Task | POST | ✅ | ✅ | ❌ | ❌ |
| Update Task | PUT | ✅ | ✅ | ❌ | ❌ |
| Delete Task | DELETE | ✅ | ✅ | ❌ | ❌ |
| Mark Task Complete | PUT | ✅ | ✅ | ✅ | ✅ |
| Update Task Status | PUT | ✅ | ✅ | ✅ | ✅ |
| View My Tasks Feed | GET | ✅ | ✅ | ✅ | ✅ |

---

### KYC (Know Your Customer) Management

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **KYC Submissions** |
| View Own KYC Status | GET | ✅ | ✅ | ✅ | ✅ |
| View All KYC Submissions | GET | ✅ | ✅ | ✅ | ❌ |
| Submit KYC Documents | POST | ✅ | ✅ | ✅ | ✅ |
| View Specific KYC | GET | ✅ | ✅ | ✅ | ❌ |
| Review KYC (Approve/Reject) | POST | ✅ | ✅ | ✅ | ❌ |
| Delete KYC Submission | DELETE | ✅ | ✅ | ✅ | ❌ |

---

### Attendance Management

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Attendance** |
| View All Attendance | GET | ✅ | ✅ | ✅ | ❌ |
| View Own Attendance | GET | ✅ | ✅ | ✅ | ✅ |
| Check In | POST | ✅ | ✅ | ✅ | ✅ |
| Check Out | POST | ✅ | ✅ | ✅ | ✅ |
| View Attendance Test | GET | ✅ | ✅ | ✅ | ❌ |

---

### Leave Management

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Leaves** |
| View All Leaves | GET | ✅ | ✅ | ✅ | ❌ |
| View Own Leaves | GET | ✅ | ✅ | ✅ | ✅ |
| Submit Leave Request | POST | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject Leave | PUT | ✅ | ✅ | ✅ | ❌ |

---

### Payslip Management

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Payslips** |
| View All Payslips | GET | ✅ | ✅ | ✅ | ❌ |
| View Own Payslips | GET | ✅ | ✅ | ✅ | ✅ |
| Generate Payslip | POST | ✅ | ✅ | ❌ | ❌ |
| Update Payslip | PUT | ✅ | ✅ | ❌ | ❌ |
| Delete Payslip | DELETE | ✅ | ✅ | ❌ | ❌ |

---

### Analytics & Reports

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Analytics** |
| Team Activity Analytics | GET | ✅ | ✅ | ✅ | ❌ |
| Training Metrics | GET | ✅ | ✅ | ✅ | ❌ |
| Department Statistics | GET | ✅ | ✅ | ✅ | ❌ |
| Download Reports | GET | ✅ | ✅ | ❌ | ❌ |

---

### Notifications

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Notifications** |
| View Own Notifications | GET | ✅ | ✅ | ✅ | ✅ |
| View All Notifications | GET | ✅ | ✅ | ❌ | ❌ |
| Mark as Read | PUT | ✅ | ✅ | ✅ | ✅ |
| Mark All as Read | PUT | ✅ | ✅ | ✅ | ✅ |
| Create Notification | POST | ✅ | ✅ | ❌ | ❌ |
| Delete Notification | DELETE | ✅ | ✅ | ❌ | ❌ |

---

### Messages & Communication

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Messages** |
| View Department Messages | GET | ✅ | ✅ | ✅ | ✅ |
| Send Message | POST | ✅ | ✅ | ✅ | ✅ |
| View All Channels | GET | ✅ | ✅ | ❌ | ❌ |
| Create Channel | POST | ✅ | ✅ | ❌ | ❌ |
| Delete Message | DELETE | ✅ | ✅ | ❌ | ❌ |

---

### Settings & Profile

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Settings** |
| View Settings | GET | ✅ | ✅ | ✅ | ✅ |
| Update Profile Info | PUT | ✅ | ✅ | ✅ | ✅ |
| Change Password | PUT | ✅ | ✅ | ✅ | ✅ |
| Update Notification Settings | PUT | ✅ | ✅ | ✅ | ✅ |
| Update Security Settings | PUT | ✅ | ✅ | ✅ | ✅ |
| Manage Sessions | GET/DELETE | ✅ | ✅ | ✅ | ✅ |
| Setup 2FA | POST | ✅ | ✅ | ✅ | ✅ |
| Disable 2FA | POST | ✅ | ✅ | ✅ | ✅ |
| Change Email | PUT | ✅ | ❌ | ❌ | ❌ |

---

### System Administration

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Administration** |
| Access Admin Panel | GET | ✅ | ❌ | ❌ | ❌ |
| System Settings | GET/PUT | ✅ | ❌ | ❌ | ❌ |
| User Role Management | GET/PUT | ✅ | ❌ | ❌ | ❌ |
| Database Management | GET/PUT | ✅ | ❌ | ❌ | ❌ |
| System Logs | GET | ✅ | ❌ | ❌ | ❌ |

---

### Training & Courses

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Training** |
| View Courses | GET | ✅ | ✅ | ✅ | ✅ |
| Create Course | POST | ✅ | ✅ | ❌ | ❌ |
| Update Course | PUT | ✅ | ✅ | ❌ | ❌ |
| Delete Course | DELETE | ✅ | ✅ | ❌ | ❌ |
| Enroll in Course | POST | ✅ | ✅ | ✅ | ✅ |
| View Training Progress | GET | ✅ | ✅ | ✅ | ✅ |

---

### Calendar

| Feature | Action | Admin | HR | Manager | Employee |
|---------|--------|:-----:|:--:|:-------:|:--------:|
| **Calendar** |
| View Calendar | GET | ✅ | ✅ | ✅ | ✅ |
| View All Events | GET | ✅ | ✅ | ✅ | ❌ |
| View Assigned Events | GET | ✅ | ✅ | ✅ | ✅ |
| Create Event | POST | ✅ | ✅ | ❌ | ❌ |
| Update Event | PUT | ✅ | ✅ | ❌ | ❌ |
| Delete Event | DELETE | ✅ | ✅ | ❌ | ❌ |

---

## Frontend Page Access

| Page/Route | Admin | HR | Manager | Employee |
|------------|:-----:|:--:|:-------:|:--------:|
| `/` (Dashboard) | ✅ | ✅ | ✅ | ✅ |
| `/profile` | ✅ | ✅ | ✅ | ✅ |
| `/employees` | ✅ | ✅ | ✅ | ❌ |
| `/attendance` | ✅ | ✅ | ✅ | ✅ |
| `/admin-attendance` | ✅ | ✅ | ✅ | ❌ |
| `/leave` | ✅ | ✅ | ✅ | ✅ |
| `/admin-leave-management` | ✅ | ✅ | ✅ | ❌ |
| `/payslip` | ✅ | ✅ | ✅ | ✅ |
| `/payslip-management` | ✅ | ✅ | ✅ | ❌ |
| `/training` | ✅ | ✅ | ✅ | ✅ |
| `/calendar` | ✅ | ✅ | ✅ | ✅ |
| `/tasks` | ✅ | ✅ | ✅ | ✅ |
| `/messages` | ✅ | ✅ | ✅ | ✅ |
| `/communication` | ✅ | ✅ | ✅ | ✅ |
| `/notifications` | ✅ | ✅ | ✅ | ✅ |
| `/settings` | ✅ | ✅ | ✅ | ✅ |
| `/kyc-management` | ✅ | ✅ | ✅ | ❌ |
| `/admin` | ✅ | ❌ | ❌ | ❌ |
| `/departments` | ✅ | ✅ | ✅ | ❌ |
| `/performance` | ✅ | ✅ | ✅ | ❌ |

---

## API Endpoint Access Summary

### Public Endpoints (No Authentication)
| Endpoint | Method | Access |
|----------|--------|--------|
| `/api/auth/login` | POST | Public |
| `/api/auth/register` | POST | Public |
| `/api/health` | GET | Public |

### Authenticated Endpoints (All Roles)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/verify` | GET | Verify token |
| `/api/users/me/profile` | GET | Get own profile |
| `/api/users/:email` | PUT | Update own profile |
| `/api/users/upload-avatar` | POST | Upload avatar |
| `/api/users/remove-avatar` | DELETE | Remove avatar |
| `/api/attendance/check-in` | POST | Check in |
| `/api/attendance/check-out` | POST | Check out |
| `/api/attendance/my-attendance` | GET | View own attendance |
| `/api/leaves` | POST | Submit leave |
| `/api/leaves/my-leaves` | GET | View own leaves |
| `/api/payslip/my-payslips` | GET | View own payslips |
| `/api/kyc` | POST | Submit KYC |
| `/api/kyc` | GET | View own KYC status |
| `/api/events/feed/my-events` | GET | View assigned events |
| `/api/tasks/feed/my-tasks` | GET | View assigned tasks |
| `/api/tasks/:id/complete` | PUT | Mark task complete |
| `/api/tasks/:id/status` | PUT | Update task status |
| `/api/notifications` | GET | View own notifications |
| `/api/notifications/:id/read` | PUT | Mark notification read |
| `/api/sessions/me` | GET | View own sessions |
| `/api/two-factor/status` | GET | Get 2FA status |
| `/api/two-factor/setup` | POST | Setup 2FA |
| `/api/two-factor/verify` | POST | Verify 2FA |
| `/api/two-factor/disable` | POST | Disable 2FA |

### Admin & HR Only Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employees` | POST | Create employee |
| `/api/employees/:id` | PUT | Update employee |
| `/api/employees/:id` | DELETE | Delete employee |
| `/api/employees/export/csv` | GET | Export all employees |
| `/api/employees/:id/export/csv` | GET | Export single employee |
| `/api/events` | POST | Create event |
| `/api/events/:id` | PUT | Update event |
| `/api/events/:id` | DELETE | Delete event |
| `/api/tasks` | POST | Create task |
| `/api/tasks/:id` | PUT | Update task |
| `/api/tasks/:id` | DELETE | Delete task |

### Admin, HR & Manager Only Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employees` | GET | View all employees |
| `/api/attendance` | GET | View all attendance |
| `/api/attendance/test` | GET | Test attendance endpoint |
| `/api/leaves` | GET | View all leaves |
| `/api/payslip/all` | GET | View all payslips |
| `/api/kyc/:id` | GET | View specific KYC |
| `/api/kyc/:id/review` | POST | Review KYC |
| `/api/kyc/:id` | DELETE | Delete KYC |
| `/api/analytics/team-activity` | GET | Team activity analytics |
| `/api/analytics/training-metrics` | GET | Training metrics |
| `/api/analytics/departments` | GET | Department statistics |

### Admin Only Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:email` | PUT | Change user email |
| `/api/admin/*` | ALL | Administration panel endpoints |

---

## Role Capabilities Summary

### Admin
- ✅ **Full System Access** - Can perform all operations
- ✅ **User Management** - Create, update, delete users
- ✅ **Email Modification** - Only role that can change emails
- ✅ **System Administration** - Access to admin panel
- ✅ **Data Export** - Export all data
- ✅ **Analytics** - Full analytics access
- ✅ **All CRUD Operations** - On all resources

### HR
- ✅ **Employee Management** - Full CRUD on employees
- ✅ **Event & Task Management** - Create, update, delete
- ✅ **KYC Review** - Approve/reject KYC submissions
- ✅ **Attendance Management** - View all attendance
- ✅ **Leave Management** - View all leaves
- ✅ **Payslip Management** - View all payslips
- ✅ **Analytics Access** - Team activity, training, departments
- ✅ **Data Export** - Export employee data
- ❌ **Email Modification** - Cannot change emails
- ❌ **System Administration** - No admin panel access

### Manager
- ✅ **View Access** - Can view all employees, attendance, leaves, payslips
- ✅ **KYC Review** - Can approve/reject KYC submissions
- ✅ **Analytics Access** - Team activity, training, departments
- ✅ **View Events & Tasks** - Can view all events and tasks
- ❌ **Create/Update/Delete** - Cannot modify events, tasks, employees
- ❌ **Email Modification** - Cannot change emails
- ❌ **System Administration** - No admin panel access

### Employee
- ✅ **Own Data Access** - View and update own profile, attendance, leaves, payslips
- ✅ **Task Management** - View assigned tasks, mark complete, update status
- ✅ **Event Viewing** - View assigned events
- ✅ **KYC Submission** - Submit KYC documents
- ✅ **Notifications** - View own notifications
- ✅ **Messages** - Send/receive messages in own department
- ❌ **Other Users' Data** - Cannot view other employees' data
- ❌ **Create Events/Tasks** - Cannot create events or tasks
- ❌ **Analytics** - No analytics access
- ❌ **Email Modification** - Cannot change email

---

## Special Permissions & Restrictions

### Email Modification
| Role | Can Change Own Email | Can Change Others' Email |
|------|:-------------------:|:----------------------:|
| Admin | ✅ | ✅ |
| HR | ❌ | ❌ |
| Manager | ❌ | ❌ |
| Employee | ❌ | ❌ |

### Employee Deletion
| Role | Can Delete Employees | Delete Type |
|------|:-------------------:|:-----------:|
| Admin | ✅ | Hard Delete |
| HR | ✅ | Soft Delete |
| Manager | ❌ | N/A |
| Employee | ❌ | N/A |

### Event/Task Visibility
| Visibility Type | Admin | HR | Manager | Employee |
|-----------------|:-----:|:--:|:-------:|:--------:|
| ALL | ✅ View | ✅ View | ✅ View | ✅ View |
| SPECIFIC | ✅ View | ✅ View | ✅ View | ✅ View (if assigned) |
| Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |

### Data Filtering Rules
| Data Type | Admin | HR | Manager | Employee |
|-----------|:-----:|:--:|:-------:|:--------:|
| Employees | All | All | All | None |
| Attendance | All | All | All | Own Only |
| Leaves | All | All | All | Own Only |
| Payslips | All | All | All | Own Only |
| Events | All | All | All | Assigned Only |
| Tasks | All | All | All | Assigned Only |
| KYC | All | All | All | Own Only |
| Notifications | All | All | Own | Own Only |
| Messages | All | All | Department | Department |

---

## Route Protection Examples

### Backend Route Protection
```javascript
// Public route
router.post('/login', loginHandler);

// Authenticated route (all roles)
router.get('/profile', authenticateToken, getProfileHandler);

// Role-restricted route (admin & HR only)
router.post('/employees', authenticateToken, requireRole(['admin', 'hr']), createEmployeeHandler);

// Role-restricted route (admin, HR, manager)
router.get('/analytics', authenticateToken, requireRole(['admin', 'hr', 'manager']), getAnalyticsHandler);
```

### Frontend Route Protection
```javascript
// Component-level check
if (user?.role !== 'admin' && user?.role !== 'hr' && user?.role !== 'manager') {
  return <Navigate to="/" replace />;
}

// Conditional rendering
{user?.role === 'admin' && <AdminPanel />}
{(user?.role === 'admin' || user?.role === 'hr') && <DeleteButton />}
```

---

## Error Codes

| HTTP Code | Meaning | When It Occurs |
|-----------|---------|----------------|
| 401 | Unauthorized | No token or invalid token |
| 403 | Forbidden | Insufficient permissions (wrong role) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## Quick Reference

### Who Can Do What?

**Create/Update/Delete Employees:**
- ✅ Admin
- ✅ HR
- ❌ Manager
- ❌ Employee

**Create/Update/Delete Events:**
- ✅ Admin
- ✅ HR
- ❌ Manager
- ❌ Employee

**Create/Update/Delete Tasks:**
- ✅ Admin
- ✅ HR
- ❌ Manager
- ❌ Employee

**View Analytics:**
- ✅ Admin
- ✅ HR
- ✅ Manager
- ❌ Employee

**Review KYC:**
- ✅ Admin
- ✅ HR
- ✅ Manager
- ❌ Employee

**Change Email:**
- ✅ Admin (only)
- ❌ HR
- ❌ Manager
- ❌ Employee

**Access Admin Panel:**
- ✅ Admin (only)
- ❌ HR
- ❌ Manager
- ❌ Employee

**Mark Tasks Complete:**
- ✅ Admin
- ✅ HR
- ✅ Manager
- ✅ Employee

**View All Data:**
- ✅ Admin
- ✅ HR
- ✅ Manager (view only)
- ❌ Employee

