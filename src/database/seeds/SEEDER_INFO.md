# Database Seeder Information

## Overview
The seed service automatically creates a Super Admin user with all permissions when the application starts.

## What Gets Created

### 1. Permissions (46 permissions across 9 modules)

#### Users Module (4 permissions)
- `USER_CREATE` - Create User
- `USER_UPDATE` - Update User
- `USER_DELETE` - Delete User
- `USER_VIEW` - View User

#### Roles Module (5 permissions)
- `ROLE_CREATE` - Create Role
- `ROLE_UPDATE` - Update Role
- `ROLE_DELETE` - Delete Role
- `ROLE_VIEW` - View Role
- `ROLE_ASSIGN_PERMISSIONS` - Assign Permissions

#### Permissions Module (4 permissions)
- `PERMISSION_CREATE` - Create Permission
- `PERMISSION_UPDATE` - Update Permission
- `PERMISSION_DELETE` - Delete Permission
- `PERMISSION_VIEW` - View Permission

#### Tasks Module (4 permissions)
- `TASK_CREATE` - Create Task
- `TASK_UPDATE` - Update Task
- `TASK_DELETE` - Delete Task
- `TASK_VIEW` - View Task

#### Costing Module (4 permissions)
- `COSTING_CREATE` - Create Costing
- `COSTING_UPDATE` - Update Costing
- `COSTING_DELETE` - Delete Costing
- `COSTING_VIEW` - View Costing

#### Customers Module (4 permissions)
- `CUSTOMER_CREATE` - Create Customer
- `CUSTOMER_UPDATE` - Update Customer
- `CUSTOMER_DELETE` - Delete Customer
- `CUSTOMER_VIEW` - View Customer

#### Suppliers Module (4 permissions)
- `SUPPLIER_CREATE` - Create Supplier
- `SUPPLIER_UPDATE` - Update Supplier
- `SUPPLIER_DELETE` - Delete Supplier
- `SUPPLIER_VIEW` - View Supplier

#### Items Module (4 permissions)
- `ITEM_CREATE` - Create Item
- `ITEM_UPDATE` - Update Item
- `ITEM_DELETE` - Delete Item
- `ITEM_VIEW` - View Item

#### Categories Module (4 permissions)
- `CATEGORY_CREATE` - Create Category
- `CATEGORY_UPDATE` - Update Category
- `CATEGORY_DELETE` - Delete Category
- `CATEGORY_VIEW` - View Category

#### Complaints Module (4 permissions)
- `COMPLAINT_CREATE` - Create Complaint
- `COMPLAINT_UPDATE` - Update Complaint
- `COMPLAINT_DELETE` - Delete Complaint
- `COMPLAINT_VIEW` - View Complaint

### 2. Super Admin Role
- **Name:** Super Admin
- **Code:** `SUPER_ADMIN`
- **Description:** Super Administrator with all permissions
- **Status:** Active
- **Permissions:** All 46 permissions assigned

### 3. Super Admin User

**Login Credentials:**
- **Email:** `admin@app.com`
- **Password:** `1234`
- **Username:** `admin`
- **Role:** Super Admin (with all permissions)
- **Legacy Role:** ADMIN (for backward compatibility)
- **Status:** Active, Email Verified

## How It Works

1. **On Application Start:** The seed service runs automatically via `main.ts`
2. **Idempotent:** Safe to run multiple times - won't create duplicates
3. **Checks Existing:** Verifies if admin user exists before creating
4. **Updates Role:** If admin exists but doesn't have Super Admin role, it updates it

## Manual Execution

The seeder runs automatically on application startup. If you need to re-run it manually, you can:

1. Delete the admin user from the database
2. Restart the application

Or use the seed script:
```bash
npm run seed
```

## Notes

- All permissions are created first
- Super Admin role is created and assigned all permissions
- Admin user is created last and assigned the Super Admin role
- The seeder uses transactions to ensure data consistency
- If any step fails, it logs the error but doesn't stop the application

