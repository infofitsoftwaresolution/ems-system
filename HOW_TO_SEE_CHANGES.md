# How to See the Soft Delete Changes

## Steps to Apply Changes

### 1. Restart Backend Server
The migration needs to run to add the `is_active` column to the database.

**Stop the current backend server** (Ctrl+C) and restart it:

```bash
cd backend
npm start
```

**Look for this in the console:**
```
✅ Added is_active column
✅ Set all existing employees as active
```

### 2. Refresh Frontend
- Hard refresh the browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear cache and reload

### 3. Verify Changes

#### Check Backend Console
When you start the backend, you should see:
```
🔄 Starting employees table structure update...
➕ Adding is_active column...
✅ Added is_active column
✅ Set all existing employees as active
```

#### Test Soft Delete
1. Login as **Admin** or **HR** user
2. Go to Employees page
3. Try to delete an employee
4. The employee should disappear from the list (soft deleted)
5. The employee record still exists in database with `is_active = false`

#### Test Role-Based Access
1. Login as **Employee** role
2. Try to delete an employee
3. Should get **403 Forbidden** error

---

## If Changes Still Don't Appear

### Option 1: Manual Migration Check
Check if the column exists in your database:

**For SQLite:**
```bash
sqlite3 backend/database.sqlite
.schema employees
```

**For PostgreSQL:**
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'is_active';
```

### Option 2: Force Migration
If the column doesn't exist, you can manually add it:

**SQLite:**
```sql
ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT 1;
UPDATE employees SET is_active = 1 WHERE is_active IS NULL;
```

**PostgreSQL:**
```sql
ALTER TABLE employees ADD COLUMN is_active BOOLEAN DEFAULT true;
UPDATE employees SET is_active = true WHERE is_active IS NULL;
```

### Option 3: Check Browser Console
Open browser DevTools (F12) and check:
- Network tab: Are API calls successful?
- Console tab: Any JavaScript errors?
- Check if DELETE request returns 403 (for non-admin users)

---

## Quick Test Checklist

- [ ] Backend server restarted
- [ ] Migration logs show "Added is_active column"
- [ ] Frontend refreshed (hard refresh)
- [ ] Logged in as Admin or HR
- [ ] Can see employees list
- [ ] Can delete employee (soft delete)
- [ ] Deleted employee disappears from list
- [ ] Logged in as Employee role
- [ ] Cannot delete employee (403 error)

---

## Expected Behavior

### Before Soft Delete:
- Employee appears in list
- `is_active = true` in database

### After Soft Delete (Admin/HR):
- Employee disappears from list
- `is_active = false` in database
- `status = "Not Working"` in database
- User account deactivated

### After Soft Delete (Employee role):
- 403 Forbidden error
- Employee remains in list
- No changes to database

