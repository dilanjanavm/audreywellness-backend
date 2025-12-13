# User, Role & Permission Management API Documentation

**⭐ NEW** - Newly added endpoints  
**🔄 UPDATED** - Recently updated endpoints

## Base URL
```
http://localhost:3003
```

---

## Table of Contents
1. [User Management APIs](#user-management-apis)
2. [Role Management APIs](#role-management-apis)
3. [Permission Management APIs](#permission-management-apis)

---

## User Management APIs

### 1. Create User
Create a new user with email notification.

**Endpoint:** `POST /users`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userName": "john_doe",
  "email": "john.doe@example.com",
  "mobileNumber": "1234567890",           // optional
  "address": "123 Main Street, City",     // optional
  "contactNumber": "1234567890",
  "age": 30,                              // optional
  "gender": "MALE",                       // optional: "MALE" | "FEMALE" | "OTHER"
  "roleId": "uuid-of-role",               // optional
  "permissionIds": ["uuid1", "uuid2"],    // optional - not yet implemented
  "password": "custom-password",          // optional - will generate if not provided
  "sendEmail": true                       // optional, default: true
}
```

**Response (Success - 201):**
```json
{
  "statusCode": 201,
  "data": {
    "message": "User created successfully. Credentials sent via email.",
    "data": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "john_doe",
      "email": "john.doe@example.com",
      "mobileNumber": "1234567890",
      "address": "123 Main Street, City",
      "contactNumber": "1234567890",
      "age": 30,
      "gender": "MALE",
      "roleId": "uuid-of-role",
      "role": {
        "id": "uuid-of-role",
        "name": "Manager",
        "code": "MANAGER"
      },
      "isActive": true,
      "isEmailVerified": false,
      "mustChangePassword": true,
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/users",
  "method": "POST",
  "message": "User with email john.doe@example.com already exists"
}
```

---

### 2. Get All Users
Retrieve a list of all users.

**Endpoint:** `GET /users`

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "john_doe",
      "email": "john.doe@example.com",
      "mobileNumber": "1234567890",
      "address": "123 Main Street, City",
      "contactNumber": "1234567890",
      "age": 30,
      "gender": "MALE",
      "roleId": "uuid-of-role",
      "role": {
        "id": "uuid-of-role",
        "name": "Manager",
        "code": "MANAGER"
      },
      "isActive": true,
      "isEmailVerified": false,
      "mustChangePassword": true,
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get User by ID
Retrieve a specific user by their UUID.

**Endpoint:** `GET /users/:id`

**Path Parameters:**
- `id` (UUID, required): User ID

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "userName": "john_doe",
    "email": "john.doe@example.com",
    "mobileNumber": "1234567890",
    "address": "123 Main Street, City",
    "contactNumber": "1234567890",
    "age": 30,
    "gender": "MALE",
    "roleId": "uuid-of-role",
    "role": {
      "id": "uuid-of-role",
      "name": "Manager",
      "code": "MANAGER"
    },
    "isActive": true,
    "isEmailVerified": false,
    "mustChangePassword": true,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z"
  }
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/users/invalid-id",
  "method": "GET",
  "message": "User with ID invalid-id not found"
}
```

---

### 4. Update User
Update an existing user's information.

**Endpoint:** `PUT /users/:id`

**Path Parameters:**
- `id` (UUID, required): User ID

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** (All fields are optional)
```json
{
  "userName": "john_doe_updated",
  "email": "john.updated@example.com",
  "mobileNumber": "9876543210",
  "address": "456 New Street, City",
  "contactNumber": "9876543210",
  "age": 31,
  "gender": "MALE",
  "roleId": "new-role-uuid",
  "isActive": true,
  "isEmailVerified": true,
  "mustChangePassword": false
}
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "User updated successfully",
    "data": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "john_doe_updated",
      "email": "john.updated@example.com",
      "mobileNumber": "9876543210",
      "address": "456 New Street, City",
      "contactNumber": "9876543210",
      "age": 31,
      "gender": "MALE",
      "roleId": "new-role-uuid",
      "role": {
        "id": "new-role-uuid",
        "name": "Admin",
        "code": "ADMIN"
      },
      "isActive": true,
      "isEmailVerified": true,
      "mustChangePassword": false,
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:35:00.000Z"
    }
  }
}
```

---

### 5. Delete User (Soft Delete)
Deactivate a user (soft delete - sets isActive to false).

**Endpoint:** `DELETE /users/:id`

**Path Parameters:**
- `id` (UUID, required): User ID

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/users/invalid-id",
  "method": "DELETE",
  "message": "User with ID invalid-id not found"
}
```

---

## Role Management APIs

### 🔄 1. Create Role (UPDATED)
Create a new role from the frontend. Permissions can be assigned during creation or later.

**Endpoint:** `POST /roles`

**Note:** Roles are created from the frontend. Use `GET /permissions/grouped/by-module` to get the permission list for selection.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Manager",
  "code": "MANAGER",
  "description": "Manager role with elevated permissions",  // optional
  "isActive": true,                                          // optional, default: true
  "permissionIds": [                                         // optional
    "permission-uuid-1",
    "permission-uuid-2",
    "permission-uuid-3"
  ]
}
```

**Note:** `code` must be uppercase letters and underscores only (e.g., `MANAGER`, `ADMIN`, `SALES_REP`)

**Response (Success - 201):**
```json
{
  "statusCode": 201,
  "data": {
    "data": {
      "id": "role-uuid-1234-5678-90ab",
      "name": "Manager",
      "code": "MANAGER",
      "description": "Manager role with elevated permissions",
      "isActive": true,
      "permissions": [
        {
          "id": "permission-uuid-1",
          "name": "Create User",
          "code": "USER_CREATE",
          "description": "Permission to create users",
          "module": "users",
          "createdAt": "2025-12-05T10:00:00.000Z",
          "updatedAt": "2025-12-05T10:00:00.000Z"
        },
        {
          "id": "permission-uuid-2",
          "name": "Update User",
          "code": "USER_UPDATE",
          "description": "Permission to update users",
          "module": "users",
          "createdAt": "2025-12-05T10:00:00.000Z",
          "updatedAt": "2025-12-05T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/roles",
  "method": "POST",
  "message": "Role with name \"Manager\" already exists"
}
```

---

### 2. Get All Roles
Retrieve a list of all roles with their permissions.

**Endpoint:** `GET /roles`

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "role-uuid-1234-5678-90ab",
      "name": "Manager",
      "code": "MANAGER",
      "description": "Manager role with elevated permissions",
      "isActive": true,
      "permissions": [
        {
          "id": "permission-uuid-1",
          "name": "Create User",
          "code": "USER_CREATE",
          "description": "Permission to create users",
          "module": "users",
          "createdAt": "2025-12-05T10:00:00.000Z",
          "updatedAt": "2025-12-05T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Role by ID
Retrieve a specific role by its UUID.

**Endpoint:** `GET /roles/:id`

**Path Parameters:**
- `id` (UUID, required): Role ID

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "role-uuid-1234-5678-90ab",
    "name": "Manager",
    "code": "MANAGER",
    "description": "Manager role with elevated permissions",
    "isActive": true,
    "permissions": [
      {
        "id": "permission-uuid-1",
        "name": "Create User",
        "code": "USER_CREATE",
        "description": "Permission to create users",
        "module": "users",
        "createdAt": "2025-12-05T10:00:00.000Z",
        "updatedAt": "2025-12-05T10:00:00.000Z"
      }
    ],
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z"
  }
}
```

---

### 4. Update Role
Update an existing role's information and permissions.

**Endpoint:** `PUT /roles/:id`

**Path Parameters:**
- `id` (UUID, required): Role ID

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** (All fields are optional)
```json
{
  "name": "Senior Manager",
  "code": "SENIOR_MANAGER",
  "description": "Updated description",
  "isActive": true,
  "permissionIds": [
    "permission-uuid-1",
    "permission-uuid-2",
    "permission-uuid-4"
  ]
}
```

**Note:** If `permissionIds` is provided, it will replace all existing permissions for the role.

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Role updated successfully",
    "data": {
      "id": "role-uuid-1234-5678-90ab",
      "name": "Senior Manager",
      "code": "SENIOR_MANAGER",
      "description": "Updated description",
      "isActive": true,
      "permissions": [
        {
          "id": "permission-uuid-1",
          "name": "Create User",
          "code": "USER_CREATE",
          "description": "Permission to create users",
          "module": "users",
          "createdAt": "2025-12-05T10:00:00.000Z",
          "updatedAt": "2025-12-05T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:35:00.000Z"
    }
  }
}
```

---

### 5. Delete Role (Soft Delete)
Deactivate a role (soft delete - sets isActive to false).

**Endpoint:** `DELETE /roles/:id`

**Path Parameters:**
- `id` (UUID, required): Role ID

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Role deleted successfully"
  }
}
```

---

### 🔄 6. Assign Permissions to Role (UPDATED)
Assign permissions to a role (replaces existing permissions). Use this endpoint after selecting permissions in the frontend.

**Endpoint:** `POST /roles/:id/permissions`

**Note:** This endpoint is designed to work with the frontend permission picker. Get permissions using `GET /permissions/grouped/by-module`, let users select permissions, then submit the selected permission IDs here.

**Path Parameters:**
- `id` (UUID, required): Role ID

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "permissionIds": [
    "permission-uuid-1",
    "permission-uuid-2",
    "permission-uuid-3"
  ]
}
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Permissions assigned successfully",
    "data": {
      "id": "role-uuid-1234-5678-90ab",
      "name": "Manager",
      "code": "MANAGER",
      "description": "Manager role",
      "isActive": true,
      "permissions": [
        {
          "id": "permission-uuid-1",
          "name": "Create User",
          "code": "USER_CREATE",
          "description": "Permission to create users",
          "module": "users",
          "createdAt": "2025-12-05T10:00:00.000Z",
          "updatedAt": "2025-12-05T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  }
}
```

---

### 7. Get Role Permissions
Get all permissions assigned to a specific role.

**Endpoint:** `GET /roles/:id/permissions`

**Path Parameters:**
- `id` (UUID, required): Role ID

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
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
    }
  ]
}
```

---

## Permission Management APIs

### 1. Create Permission
Create a new permission.

**Endpoint:** `POST /permissions`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Create User",
  "code": "USER_CREATE",
  "description": "Permission to create new users",  // optional
  "module": "users"
}
```

**Note:** 
- `code` must be uppercase letters and underscores only (e.g., `USER_CREATE`, `TASK_UPDATE`)
- `module` examples: `users`, `tasks`, `costing`, `customers`, `suppliers`, etc.

**Response (Success - 201):**
```json
{
  "statusCode": 201,
  "data": {
    "data": {
      "id": "permission-uuid-1234-5678-90ab",
      "name": "Create User",
      "code": "USER_CREATE",
      "description": "Permission to create new users",
      "module": "users",
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/permissions",
  "method": "POST",
  "message": "Permission with code \"USER_CREATE\" already exists"
}
```

---

### 2. Get All Permissions
Retrieve a list of all permissions, optionally filtered by module.

**Endpoint:** `GET /permissions`

**Query Parameters:**
- `module` (string, optional): Filter permissions by module

**Request Headers:**
```
Content-Type: application/json
```

**Example:** `GET /permissions?module=users`

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "permission-uuid-1234-5678-90ab",
      "name": "Create User",
      "code": "USER_CREATE",
      "description": "Permission to create new users",
      "module": "users",
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    },
    {
      "id": "permission-uuid-5678-90ab-cdef",
      "name": "Update User",
      "code": "USER_UPDATE",
      "description": "Permission to update users",
      "module": "users",
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  ]
}
```

---

### ⭐ 2b. Get All Permissions Grouped by Module (NEW)
Retrieve all permissions organized by module. This endpoint is designed for frontend role management interfaces where you can pick permissions to assign to roles.

**Endpoint:** `GET /permissions/grouped/by-module`

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "modules": {
      "users": [
        {
          "id": "permission-uuid-1",
          "name": "Create User",
          "code": "USER_CREATE",
          "description": "Permission to create new users",
          "module": "users",
          "createdAt": "2025-12-05T10:30:00.000Z",
          "updatedAt": "2025-12-05T10:30:00.000Z"
        },
        {
          "id": "permission-uuid-2",
          "name": "Update User",
          "code": "USER_UPDATE",
          "description": "Permission to update users",
          "module": "users",
          "createdAt": "2025-12-05T10:30:00.000Z",
          "updatedAt": "2025-12-05T10:30:00.000Z"
        },
        {
          "id": "permission-uuid-3",
          "name": "Delete User",
          "code": "USER_DELETE",
          "description": "Permission to delete users",
          "module": "users",
          "createdAt": "2025-12-05T10:30:00.000Z",
          "updatedAt": "2025-12-05T10:30:00.000Z"
        },
        {
          "id": "permission-uuid-4",
          "name": "View User",
          "code": "USER_VIEW",
          "description": "Permission to view users",
          "module": "users",
          "createdAt": "2025-12-05T10:30:00.000Z",
          "updatedAt": "2025-12-05T10:30:00.000Z"
        }
      ],
      "roles": [
        {
          "id": "permission-uuid-5",
          "name": "Create Role",
          "code": "ROLE_CREATE",
          "description": "Permission to create roles",
          "module": "roles",
          "createdAt": "2025-12-05T10:30:00.000Z",
          "updatedAt": "2025-12-05T10:30:00.000Z"
        }
      ],
      "tasks": [
        {
          "id": "permission-uuid-9",
          "name": "Create Task",
          "code": "TASK_CREATE",
          "description": "Permission to create tasks",
          "module": "tasks",
          "createdAt": "2025-12-05T10:30:00.000Z",
          "updatedAt": "2025-12-05T10:30:00.000Z"
        }
      ],
      "costing": [...],
      "customers": [...],
      "suppliers": [...],
      "items": [...],
      "categories": [...],
      "complaints": [...]
    },
    "totalPermissions": 46,
    "totalModules": 9
  }
}
```

**Use Case:** 
This endpoint is perfect for frontend role creation/editing forms where you need to:
1. Display permissions organized by module
2. Allow users to select/deselect permissions
3. Submit selected permission IDs when creating/updating a role

---

### 3. Get Permission by ID
Retrieve a specific permission by its UUID.

**Endpoint:** `GET /permissions/:id`

**Path Parameters:**
- `id` (UUID, required): Permission ID

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "permission-uuid-1234-5678-90ab",
    "name": "Create User",
    "code": "USER_CREATE",
    "description": "Permission to create new users",
    "module": "users",
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z"
  }
}
```

---

### 4. Get Permissions by Module
Retrieve all permissions for a specific module.

**Endpoint:** `GET /permissions/module/:module`

**Path Parameters:**
- `module` (string, required): Module name (e.g., `users`, `tasks`, `costing`)

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "permission-uuid-1234-5678-90ab",
      "name": "Create User",
      "code": "USER_CREATE",
      "description": "Permission to create new users",
      "module": "users",
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    },
    {
      "id": "permission-uuid-5678-90ab-cdef",
      "name": "Update User",
      "code": "USER_UPDATE",
      "description": "Permission to update users",
      "module": "users",
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z"
    }
  ]
}
```

---

### 5. Update Permission
Update an existing permission's information.

**Endpoint:** `PUT /permissions/:id`

**Path Parameters:**
- `id` (UUID, required): Permission ID

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** (All fields are optional)
```json
{
  "name": "Create and Manage Users",
  "code": "USER_CREATE_UPDATE",
  "description": "Updated description",
  "module": "users"
}
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Permission updated successfully",
    "data": {
      "id": "permission-uuid-1234-5678-90ab",
      "name": "Create and Manage Users",
      "code": "USER_CREATE_UPDATE",
      "description": "Updated description",
      "module": "users",
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:35:00.000Z"
    }
  }
}
```

---

### 6. Delete Permission
Delete a permission (hard delete).

**Endpoint:** `DELETE /permissions/:id`

**Path Parameters:**
- `id` (UUID, required): Permission ID

**Request Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Permission deleted successfully"
  }
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/endpoint",
  "method": "METHOD",
  "message": "Error message describing what went wrong"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/endpoint/invalid-id",
  "method": "METHOD",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/endpoint",
  "method": "METHOD",
  "message": "Internal server error"
}
```

---

## Data Types & Enumerations

### Gender Enum
- `MALE`
- `FEMALE`
- `OTHER`

### Permission Code Convention
Format: `MODULE_ACTION`

Examples:
- `USER_CREATE`
- `USER_UPDATE`
- `USER_DELETE`
- `USER_VIEW`
- `TASK_CREATE`
- `TASK_UPDATE`
- `COSTING_VIEW`
- `COSTING_EDIT`

### Common Modules
- `users` - User management operations
- `roles` - Role management operations
- `permissions` - Permission management operations
- `tasks` - Task management operations
- `costing` - Costing management operations
- `customers` - Customer management operations
- `suppliers` - Supplier management operations
- `items` - Item management operations
- `categories` - Category management operations
- `complaints` - Complaint management operations

### Permission List (All Available Permissions)

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
- `ROLE_ASSIGN_PERMISSIONS` - Assign Permissions to Role

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

**Total: 46 permissions across 9 modules**

---

## Email Notification

When a user is created with `sendEmail: true` (default), they will receive a welcome email containing:
- Username (email address)
- Temporary password (if password was auto-generated)
- Login link
- Security instructions

**Note:** Ensure email configuration is set up in `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

---

## Frontend Integration Guide

### Creating a Role with Permissions (Recommended Flow)

1. **Get All Permissions Grouped by Module:**
   ```javascript
   GET /permissions/grouped/by-module
   ```
   This returns all permissions organized by module, perfect for displaying in a role creation form.

2. **Display Permissions in UI:**
   - Show permissions grouped by module (users, tasks, costing, etc.)
   - Allow users to select/deselect permissions using checkboxes
   - Collect selected permission IDs

3. **Create Role:**
   ```javascript
   POST /roles
   Body: {
     "name": "Manager",
     "code": "MANAGER",
     "description": "Manager role",
     "permissionIds": ["uuid1", "uuid2", "uuid3"] // Selected permission IDs
   }
   ```

4. **Or Assign Permissions Later:**
   ```javascript
   POST /roles/:roleId/permissions
   Body: {
     "permissionIds": ["uuid1", "uuid2", "uuid3"]
   }
   ```

### Workflow Summary

```
Frontend Role Creation Flow:
┌─────────────────────────────────────┐
│ 1. GET /permissions/grouped/by-module │
│    → Receive permissions by module    │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. Display permissions in UI         │
│    → User selects permissions        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. POST /roles                       │
│    → Create role with permissions    │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. POST /roles/:id/permissions       │
│    → Update permissions if needed    │
└─────────────────────────────────────┘
```

## Notes

1. **UUID Format**: All IDs are UUIDs (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

2. **Soft Delete**: Users and Roles are soft-deleted (deactivated), while Permissions are hard-deleted

3. **Temporary Passwords**: If no password is provided during user creation, a temporary password is auto-generated and sent via email

4. **Permission Assignment**: Permissions are assigned to roles, not directly to users. Users inherit permissions through their assigned role

5. **Validation**: 
   - Email must be valid and unique
   - UserName must be unique
   - MobileNumber must be unique (if provided)
   - Role code and Permission code must be uppercase with underscores

6. **Role Code vs Permission Code**:
   - Role Code: Single identifier (e.g., `MANAGER`, `ADMIN`)
   - Permission Code: Module + Action (e.g., `USER_CREATE`, `TASK_UPDATE`)

7. **Frontend Role Management**:
   - Roles are created from the frontend
   - Permissions list is provided by the backend via `GET /permissions/grouped/by-module`
   - Frontend displays permissions organized by module
   - Users select permissions and assign them to roles
   - All 46 permissions are pre-seeded and ready to use

