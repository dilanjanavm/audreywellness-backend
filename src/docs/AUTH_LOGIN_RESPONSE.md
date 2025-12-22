# Login API Response Documentation

## Endpoint
`POST /auth/login`

## Request Body
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

## Response Body Structure

### Success Response (200)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNjE2MjM5MDIyfQ...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNjE2MjM5MDIyfQ...",
  "user": {
    "id": "b535f60d-dbf3-477f-b5ae-f8c32effd387",
    "email": "user@example.com",
    "userName": "john_doe",
    "role": "admin",
    "roleId": "role-uuid-1234-5678-90ab",
    "roleName": "Super Admin",
    "permissions": [
      {
        "id": "permission-uuid-1",
        "name": "Create User",
        "code": "USER_CREATE",
        "description": "Permission to create users",
        "module": "users"
      },
      {
        "id": "permission-uuid-2",
        "name": "Update User",
        "code": "USER_UPDATE",
        "description": "Permission to update users",
        "module": "users"
      },
      {
        "id": "permission-uuid-3",
        "name": "Delete User",
        "code": "USER_DELETE",
        "description": "Permission to delete users",
        "module": "users"
      },
      {
        "id": "permission-uuid-4",
        "name": "View User",
        "code": "USER_VIEW",
        "description": "Permission to view users",
        "module": "users"
      },
      {
        "id": "permission-uuid-5",
        "name": "Create Task",
        "code": "TASK_CREATE",
        "description": "Permission to create tasks",
        "module": "tasks"
      },
      {
        "id": "permission-uuid-6",
        "name": "Update Task",
        "code": "TASK_UPDATE",
        "description": "Permission to update tasks",
        "module": "tasks"
      },
      {
        "id": "permission-uuid-7",
        "name": "Delete Task",
        "code": "TASK_DELETE",
        "description": "Permission to delete tasks",
        "module": "tasks"
      },
      {
        "id": "permission-uuid-8",
        "name": "View Task",
        "code": "TASK_VIEW",
        "description": "Permission to view tasks",
        "module": "tasks"
      },
      {
        "id": "permission-uuid-9",
        "name": "Create Role",
        "code": "ROLE_CREATE",
        "description": "Permission to create roles",
        "module": "roles"
      },
      {
        "id": "permission-uuid-10",
        "name": "Update Role",
        "code": "ROLE_UPDATE",
        "description": "Permission to update roles",
        "module": "roles"
      }
    ]
  }
}
```

## Response Fields

### Top Level
- `access_token` (string): JWT access token (expires in 60 minutes)
- `refresh_token` (string): JWT refresh token (expires in 7 days)
- `user` (object): User information with permissions

### User Object
- `id` (string, UUID): User's unique identifier
- `email` (string): User's email address
- `userName` (string): User's username
- `role` (string): User's role code (e.g., "admin", "manager", "user")
- `roleId` (string, UUID, nullable): User's role ID (null if no role assigned)
- `roleName` (string, nullable): User's role name (e.g., "Super Admin", "Manager")
- `permissions` (array): List of permissions assigned to the user's role

### Permission Object
Each permission in the `permissions` array contains:
- `id` (string, UUID): Permission's unique identifier
- `name` (string): Permission's display name (e.g., "Create User")
- `code` (string): Permission's code (e.g., "USER_CREATE")
- `description` (string, nullable): Permission's description
- `module` (string): Module this permission belongs to (e.g., "users", "tasks", "roles")

## Example Responses

### User with Role and Permissions
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b535f60d-dbf3-477f-b5ae-f8c32effd387",
    "email": "admin@example.com",
    "userName": "admin",
    "role": "admin",
    "roleId": "role-uuid-1234",
    "roleName": "Super Admin",
    "permissions": [
      {
        "id": "perm-1",
        "name": "Create User",
        "code": "USER_CREATE",
        "description": "Permission to create users",
        "module": "users"
      },
      {
        "id": "perm-2",
        "name": "Update User",
        "code": "USER_UPDATE",
        "description": "Permission to update users",
        "module": "users"
      }
    ]
  }
}
```

### User without Role
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b535f60d-dbf3-477f-b5ae-f8c32effd387",
    "email": "user@example.com",
    "userName": "john_doe",
    "role": "user",
    "roleId": null,
    "roleName": null,
    "permissions": []
  }
}
```

### User with Role but No Permissions Assigned
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b535f60d-dbf3-477f-b5ae-f8c32effd387",
    "email": "user@example.com",
    "userName": "john_doe",
    "role": "manager",
    "roleId": "role-uuid-5678",
    "roleName": "Manager",
    "permissions": []
  }
}
```

## Error Responses

### Invalid Credentials (401)
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

## Usage Notes

1. **Permissions Array**: The permissions array contains all permissions assigned to the user's role. If the user has no role or the role has no permissions, the array will be empty.

2. **Role Information**: 
   - `role`: The role code (lowercase, e.g., "admin", "manager")
   - `roleId`: The UUID of the role (null if no role assigned)
   - `roleName`: The display name of the role (null if no role assigned)

3. **Permission Codes**: Use the `code` field (e.g., "USER_CREATE") for permission checks in the frontend.

4. **Permission Modules**: Permissions are organized by module (e.g., "users", "tasks", "roles") for easier filtering and display.

5. **JWT Tokens**: 
   - `access_token`: Use for API requests (include in Authorization header)
   - `refresh_token`: Use to get a new access token when it expires

## Frontend Usage Example

```typescript
// After login
const response = await login(username, password);
const { access_token, refresh_token, user } = response;

// Store tokens
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// Store user info
localStorage.setItem('user', JSON.stringify(user));

// Check permissions
const hasPermission = (code: string) => {
  return user.permissions.some(p => p.code === code);
};

// Example: Check if user can create users
if (hasPermission('USER_CREATE')) {
  // Show create user button
}

// Group permissions by module
const permissionsByModule = user.permissions.reduce((acc, perm) => {
  if (!acc[perm.module]) {
    acc[perm.module] = [];
  }
  acc[perm.module].push(perm);
  return acc;
}, {});
```

## Permission Codes Reference

For a complete list of all 46 permissions, see: [ALL_PERMISSIONS_LIST.md](./ALL_PERMISSIONS_LIST.md)

### Quick Reference by Module

#### Users Module (4 permissions)
- `USER_CREATE` - Create users
- `USER_UPDATE` - Update users
- `USER_DELETE` - Delete users
- `USER_VIEW` - View users

#### Roles Module (5 permissions)
- `ROLE_CREATE` - Create roles
- `ROLE_UPDATE` - Update roles
- `ROLE_DELETE` - Delete roles
- `ROLE_VIEW` - View roles
- `ROLE_ASSIGN_PERMISSIONS` - Assign permissions to roles

#### Permissions Module (4 permissions)
- `PERMISSION_CREATE` - Create permissions
- `PERMISSION_UPDATE` - Update permissions
- `PERMISSION_DELETE` - Delete permissions
- `PERMISSION_VIEW` - View permissions

#### Tasks Module (4 permissions)
- `TASK_CREATE` - Create tasks
- `TASK_UPDATE` - Update tasks
- `TASK_DELETE` - Delete tasks
- `TASK_VIEW` - View tasks

#### Costing Module (4 permissions)
- `COSTING_CREATE` - Create costings
- `COSTING_UPDATE` - Update costings
- `COSTING_DELETE` - Delete costings
- `COSTING_VIEW` - View costings

#### Customers Module (4 permissions)
- `CUSTOMER_CREATE` - Create customers
- `CUSTOMER_UPDATE` - Update customers
- `CUSTOMER_DELETE` - Delete customers
- `CUSTOMER_VIEW` - View customers

#### Suppliers Module (4 permissions)
- `SUPPLIER_CREATE` - Create suppliers
- `SUPPLIER_UPDATE` - Update suppliers
- `SUPPLIER_DELETE` - Delete suppliers
- `SUPPLIER_VIEW` - View suppliers

#### Items Module (4 permissions)
- `ITEM_CREATE` - Create items
- `ITEM_UPDATE` - Update items
- `ITEM_DELETE` - Delete items
- `ITEM_VIEW` - View items

#### Categories Module (4 permissions)
- `CATEGORY_CREATE` - Create categories
- `CATEGORY_UPDATE` - Update categories
- `CATEGORY_DELETE` - Delete categories
- `CATEGORY_VIEW` - View categories

#### Complaints Module (4 permissions)
- `COMPLAINT_CREATE` - Create complaints
- `COMPLAINT_UPDATE` - Update complaints
- `COMPLAINT_DELETE` - Delete complaints
- `COMPLAINT_VIEW` - View complaints

**Total: 46 permissions across 9 modules**

For the complete detailed list, see: [ALL_PERMISSIONS_LIST.md](./ALL_PERMISSIONS_LIST.md)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-16  
**Generated For:** Frontend Development Team

