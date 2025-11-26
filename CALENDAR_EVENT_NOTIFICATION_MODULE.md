# Calendar Event + Notification Module - Complete Implementation

## Overview
A comprehensive Calendar Event + Notification module has been implemented with role-based access control, automatic notification generation, and real-time updates. This module allows Admin and HR to create events that automatically notify employees, and employees can view these events and notifications on their dashboard.

## Database Schema

### Events Table
The `events` table already exists with the following structure:
- `id` - Auto-increment primary key
- `title` - Event title (required)
- `description` - Event details (optional)
- `start_date_time` - Event start datetime (required)
- `end_date_time` - Event end datetime (required)
- `created_by` - Admin/HR user ID (FK to users.id)
- `visibility_type` - Enum: "ALL" or "SPECIFIC"
- `assigned_users` - JSON array of employee IDs (null if visibility_type = ALL)
- `notification_sent` - Boolean flag
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Notifications Table
The `notifications` table has been updated with:
- `id` - Auto-increment primary key
- `user_id` - Employee ID who receives the notification (FK to users.id)
- `event_id` - Reference to events table (NEW - FK to events.id, nullable)
- `title` - Notification title
- `message` - Notification message
- `type` - Notification type (info, success, warning, error)
- `is_read` - Boolean (default false)
- `read_at` - Timestamp when read
- `link` - Optional link to event/calendar
- `metadata` - JSON string for additional data
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Backend Implementation

### 1. Migration: Add event_id to Notifications
**File**: `backend/src/migrations/addEventIdToNotifications.js`
- Adds `event_id` column to notifications table
- Creates index for better query performance
- Handles both SQLite and PostgreSQL

### 2. Updated Models

#### Event Model (`backend/src/models/Event.js`)
- Already exists with proper structure
- Associations: `Event.belongsTo(User, { foreignKey: "created_by", as: "creator" })`

#### Notification Model (`backend/src/models/Notification.js`)
- Updated to include `eventId` field
- Links notifications to events via foreign key

### 3. API Routes

#### Events Routes (`backend/src/routes/events.js`)

**GET `/api/events`** - Get all events
- Employees: See only ALL events or SPECIFIC events assigned to them
- Admin/HR: See all events
- Supports date range filtering via query params

**GET `/api/events/:id`** - Get single event
- Role-based access control
- Employees can only view events assigned to them

**GET `/api/events/feed/my-events`** - Employee-specific event feed (NEW)
- Returns upcoming events for the logged-in employee
- Only shows events where:
  - `visibility_type = "ALL"`, OR
  - `visibility_type = "SPECIFIC"` AND employee is in `assigned_users`
- Sorted by `start_date_time` ascending
- Limited to 10 upcoming events

**POST `/api/events`** - Create event (Admin/HR only)
- Validates: title required, start < end, visibility_type
- Automatically generates notifications for all/specific employees
- Notification message format: `"New Event Assigned: {title} on {start_date_time}"`

**PUT `/api/events/:id`** - Update event (Admin/HR only)
- Regenerates notifications when event is updated
- Notification message format: `"Event Updated: {title} on {start_date_time}"`

**DELETE `/api/events/:id`** - Delete event (Admin/HR only)
- Soft delete (cascades to notifications via SET NULL)

#### Notification Generation Logic
The `sendEventNotifications()` function:
1. Determines target users based on `visibility_type`:
   - `ALL`: Gets all employee user IDs
   - `SPECIFIC`: Gets user IDs from `assigned_users` array
2. Creates notifications with:
   - Proper title and message format
   - `event_id` linking to the event
   - `userEmail` from user record
   - `link` to calendar event
   - `metadata` with event details
3. Emits Socket.IO events for real-time updates
4. Marks `notification_sent = true` on event

#### Notifications Routes (`backend/src/routes/notifications.js`)

**GET `/api/notifications`** - Get notifications
- Updated to order by: unread first, then newest first
- Supports filtering by `eventId` query parameter
- Supports `unreadOnly` filter

**GET `/api/notifications/unread-count`** - Get unread count
- Returns count of unread notifications for current user

**PUT `/api/notifications/:id/read`** - Mark notification as read
- Marks single notification as read

**PUT `/api/notifications/read-all`** - Mark all as read
- Marks all notifications for current user as read

### 4. Seed Data
**File**: `backend/src/seeders/seedEventsAndNotifications.js`
- Creates 3 sample events:
  1. Monthly All-Hands Meeting (ALL visibility)
  2. Team Training Session (SPECIFIC visibility - 3 employees)
  3. Department Review Meeting (ALL visibility)
- Generates corresponding notifications for all affected employees
- Marks some notifications as read for variety
- Automatically runs in development mode

## Frontend Implementation

### 1. API Service Updates (`frontend/src/lib/api.js`)
- **`getMyEvents()`** - Fetches employee-specific upcoming events
- **`getNotifications()`** - Updated to support `eventId` filtering

### 2. Employee Dashboard (`frontend/src/page/EmployeeDashboard.jsx`)

#### Recent Notifications Section
- Shows latest 5 notifications
- Unread notifications appear first (highlighted with background and dot indicator)
- Displays:
  - Notification title
  - Notification message
  - Timestamp
  - Unread indicator
- Empty state: "No notifications"

#### Upcoming Events Section
- Shows upcoming events assigned to the employee
- Displays:
  - Event title
  - Event date and time
  - Event description (truncated)
- Sorted by start date/time
- Empty state: "No upcoming events"

#### Data Loading
- `loadNotifications()` - Fetches recent notifications
- `loadUpcomingEvents()` - Fetches employee-specific events
- Both functions called on component mount and refresh

### 3. Dashboard Layout
- Grid layout: `md:grid-cols-2 lg:grid-cols-3`
- Cards for:
  1. Upcoming Tasks
  2. Recent Notifications
  3. Upcoming Events

## Functional Requirements Implementation

### ✅ 1. Event Creation & Update
- Only Admin/HR can create, update, or delete events
- When event is created/updated:
  - `visibility_type = "ALL"`: Generates notifications for all employees
  - `visibility_type = "SPECIFIC"`: Generates notifications only for assigned employees
- Notification message format matches requirements

### ✅ 2. Employee Dashboard
- **Recent Notifications**: Shows latest notifications from events (unread first)
- **Upcoming Events**: Shows upcoming events assigned to employee, sorted by start_date_time

### ✅ 3. Notification Rules
- Each event creation triggers notification entries for every target employee
- Notification message format: `"New Event Assigned: {title} on {start_date_time}"`
- Notifications stored in database with `event_id` reference
- Notifications visible until marked read

### ✅ 4. Access Control
- **Admin & HR**: Full CRUD on events
- **Employees**: Can view only their assigned events + global events
- **Employees**: Cannot modify events

### ✅ 5. APIs Generated
- ✅ Create event (with notification generation)
- ✅ Update event (regenerates notifications)
- ✅ Get event list for admin/hr
- ✅ Get employee-specific event feed (`/api/events/feed/my-events`)
- ✅ Get employee notifications (Recent Notifications)
- ✅ Mark notification as read

### ✅ 6. Validation
- ✅ `start_date_time < end_date_time`
- ✅ `title` is required
- ✅ Only Admin or HR can create/update/delete

### ✅ 7. Generated Files
- ✅ Migrations: `addEventIdToNotifications.js`
- ✅ Models: Updated `Notification.js`
- ✅ Controllers: Updated `events.js` and `notifications.js`
- ✅ Notification generator logic: `sendEventNotifications()` in `events.js`
- ✅ Clean JSON responses: All endpoints return consistent format
- ✅ Sample seed: `seedEventsAndNotifications.js`

## Real-time Features

### Socket.IO Integration
- When events are created/updated, Socket.IO emits:
  - `new_notification` - To target user rooms
  - `event_created` - To notify about new events
- Clients can listen to these events for real-time updates

## Usage Examples

### Creating an Event (Admin/HR)
```javascript
POST /api/events
{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "start_date_time": "2024-01-15T10:00:00Z",
  "end_date_time": "2024-01-15T11:00:00Z",
  "visibility_type": "ALL",
  "assigned_users": null
}
```

### Creating a Specific Event (Admin/HR)
```javascript
POST /api/events
{
  "title": "Training Session",
  "description": "Mandatory training",
  "start_date_time": "2024-01-20T14:00:00Z",
  "end_date_time": "2024-01-20T16:00:00Z",
  "visibility_type": "SPECIFIC",
  "assigned_users": [1, 2, 3] // Employee IDs
}
```

### Getting Employee Events
```javascript
GET /api/events/feed/my-events
// Returns upcoming events for logged-in employee
```

### Getting Notifications
```javascript
GET /api/notifications?limit=5&offset=0&unreadOnly=false
// Returns notifications, unread first
```

## Migration Instructions

1. **Run the migration** (automatically on server start):
   ```bash
   # Migration runs automatically when server starts
   npm start
   ```

2. **Seed sample data** (development only):
   ```bash
   # Seed data is automatically created in development mode
   # Or run manually:
   node backend/src/seeders/seedEventsAndNotifications.js
   ```

## Testing Checklist

- [ ] Admin can create events with ALL visibility
- [ ] Admin can create events with SPECIFIC visibility
- [ ] Notifications are generated for ALL events
- [ ] Notifications are generated only for SPECIFIC assigned employees
- [ ] Employee dashboard shows Recent Notifications
- [ ] Employee dashboard shows Upcoming Events
- [ ] Unread notifications appear first
- [ ] Employee can only see assigned/global events
- [ ] Employee cannot modify events
- [ ] Event update regenerates notifications
- [ ] Notification message format is correct

## Notes

- The `event_id` field in notifications is nullable to support non-event notifications
- When an event is deleted, notifications remain but `event_id` is set to NULL
- Real-time updates use Socket.IO for instant notification delivery
- All date/time handling uses ISO 8601 format
- The system supports both SQLite (development) and PostgreSQL (production)

