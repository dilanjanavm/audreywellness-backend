# Complete API Documentation

**Base URL:** `http://localhost:3005` (or as configured in `PORT` environment variable)  
**API Version:** 1.0  
**Last Updated:** 2025-12-16

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Roles](#roles)
4. [Permissions](#permissions)
5. [Customers](#customers)
6. [Suppliers](#suppliers)
7. [Items](#items)
8. [Categories](#categories)
9. [Costing](#costing)
10. [Tasks](#tasks)
11. [Complaints](#complaints)
12. [Attachments](#attachments)
13. [Email Service](#email-service)

---

## Authentication

### POST /auth/login

**Description:** Authenticate user and receive JWT tokens.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Request Body Fields:**
- `username` (string, required): User email address
- `password` (string, required): User password

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b535f60d-dbf3-477f-b5ae-f8c32effd387",
    "email": "user@example.com",
    "userName": "john_doe",
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
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "timestamp": "2025-12-16T10:00:00.000Z",
  "path": "/auth/login",
  "method": "POST"
}
```

---

## Users

**Base Path:** `/users`  
**Authentication:** Not required (should be added)

### POST /users

**Description:** Create a new user with optional email notification.

**Request Body:**
```json
{
  "userName": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "contactNumber": "+1234567890",
  "roleId": "role-uuid-1234",
  "sendEmail": true
}
```

**Request Body Fields:**
- `userName` (string, required): Unique username
- `email` (string, required): Unique email address
- `password` (string, optional): User password (auto-generated if not provided)
- `contactNumber` (string, required): Contact number
- `roleId` (string, optional): Role UUID
- `sendEmail` (boolean, optional): Send welcome email (default: true)

**Response (200 OK):**
```json
{
  "message": "User created successfully. Credentials sent via email.",
  "data": {
    "id": "user-uuid",
    "userName": "john_doe",
    "email": "john@example.com",
    "contactNumber": "+1234567890",
    "role": {
      "id": "role-uuid",
      "name": "Manager",
      "code": "MANAGER"
    },
    "isActive": true,
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

### GET /users

**Description:** Get all users.

**Query Parameters:** None

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "user-uuid",
      "userName": "john_doe",
      "email": "john@example.com",
      "contactNumber": "+1234567890",
      "role": {
        "id": "role-uuid",
        "name": "Manager",
        "code": "MANAGER"
      },
      "isActive": true,
      "createdAt": "2025-12-16T10:00:00.000Z",
      "updatedAt": "2025-12-16T10:00:00.000Z"
    }
  ]
}
```

### GET /users/:id

**Description:** Get user by ID.

**Path Parameters:**
- `id` (UUID, required): User ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "user-uuid",
    "userName": "john_doe",
    "email": "john@example.com",
    "contactNumber": "+1234567890",
    "role": {
      "id": "role-uuid",
      "name": "Manager",
      "code": "MANAGER"
    },
    "isActive": true,
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

### PUT /users/:id

**Description:** Update user.

**Path Parameters:**
- `id` (UUID, required): User ID

**Request Body:**
```json
{
  "userName": "john_doe_updated",
  "email": "john.updated@example.com",
  "contactNumber": "+1234567890",
  "roleId": "role-uuid-5678",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "message": "User updated successfully",
  "data": {
    "id": "user-uuid",
    "userName": "john_doe_updated",
    "email": "john.updated@example.com",
    "contactNumber": "+1234567890",
    "role": {
      "id": "role-uuid-5678",
      "name": "Admin",
      "code": "ADMIN"
    },
    "isActive": true,
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:30:00.000Z"
  }
}
```

### DELETE /users/:id

**Description:** Delete user (hard delete).

**Path Parameters:**
- `id` (UUID, required): User ID

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

---

## Roles

**Base Path:** `/roles`  
**Authentication:** Not required (should be added)

### POST /roles

**Description:** Create a new role.

**Request Body:**
```json
{
  "name": "Manager",
  "code": "MANAGER",
  "description": "Manager role with elevated permissions"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "role-uuid",
    "name": "Manager",
    "code": "MANAGER",
    "description": "Manager role with elevated permissions",
    "isActive": true,
    "permissions": [],
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

### GET /roles

**Description:** Get all roles.

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "role-uuid",
      "name": "Manager",
      "code": "MANAGER",
      "description": "Manager role",
      "isActive": true,
      "permissions": [],
      "createdAt": "2025-12-16T10:00:00.000Z",
      "updatedAt": "2025-12-16T10:00:00.000Z"
    }
  ]
}
```

### GET /roles/:id

**Description:** Get role by ID.

**Path Parameters:**
- `id` (UUID, required): Role ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "role-uuid",
    "name": "Manager",
    "code": "MANAGER",
    "description": "Manager role",
    "isActive": true,
    "permissions": [
      {
        "id": "perm-uuid",
        "name": "Create User",
        "code": "USER_CREATE",
        "description": "Permission to create users",
        "module": "users"
      }
    ],
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

### PUT /roles/:id

**Description:** Update role.

**Path Parameters:**
- `id` (UUID, required): Role ID

**Request Body:**
```json
{
  "name": "Updated Manager",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "message": "Role updated successfully",
  "data": {
    "id": "role-uuid",
    "name": "Updated Manager",
    "code": "MANAGER",
    "description": "Updated description",
    "isActive": true,
    "permissions": [],
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:30:00.000Z"
  }
}
```

### DELETE /roles/:id

**Description:** Delete role.

**Path Parameters:**
- `id` (UUID, required): Role ID

**Response (200 OK):**
```json
{
  "message": "Role deleted successfully"
}
```

### POST /roles/:id/permissions

**Description:** Assign permissions to role.

**Path Parameters:**
- `id` (UUID, required): Role ID

**Request Body:**
```json
{
  "permissionIds": [
    "perm-uuid-1",
    "perm-uuid-2",
    "perm-uuid-3"
  ]
}
```

**Response (200 OK):**
```json
{
  "message": "Permissions assigned successfully",
  "data": {
    "id": "role-uuid",
    "name": "Manager",
    "code": "MANAGER",
    "permissions": [
      {
        "id": "perm-uuid-1",
        "name": "Create User",
        "code": "USER_CREATE",
        "module": "users"
      }
    ]
  }
}
```

### GET /roles/:id/permissions

**Description:** Get permissions for a role.

**Path Parameters:**
- `id` (UUID, required): Role ID

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "perm-uuid-1",
      "name": "Create User",
      "code": "USER_CREATE",
      "description": "Permission to create users",
      "module": "users"
    }
  ]
}
```

---

## Permissions

**Base Path:** `/permissions`  
**Authentication:** Not required (should be added)

### POST /permissions

**Description:** Create a new permission.

**Request Body:**
```json
{
  "name": "Create User",
  "code": "USER_CREATE",
  "description": "Permission to create users",
  "module": "users"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "perm-uuid",
    "name": "Create User",
    "code": "USER_CREATE",
    "description": "Permission to create users",
    "module": "users",
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

### GET /permissions

**Description:** Get all permissions, optionally filtered by module.

**Query Parameters:**
- `module` (string, optional): Filter by module name (e.g., "users", "tasks")

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "perm-uuid",
      "name": "Create User",
      "code": "USER_CREATE",
      "description": "Permission to create users",
      "module": "users",
      "createdAt": "2025-12-16T10:00:00.000Z",
      "updatedAt": "2025-12-16T10:00:00.000Z"
    }
  ]
}
```

### GET /permissions/:id

**Description:** Get permission by ID.

**Path Parameters:**
- `id` (UUID, required): Permission ID

**Response (200 OK):**
```json
{
  "data": {
    "id": "perm-uuid",
    "name": "Create User",
    "code": "USER_CREATE",
    "description": "Permission to create users",
    "module": "users",
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:00:00.000Z"
  }
}
```

### GET /permissions/module/:module

**Description:** Get permissions by module.

**Path Parameters:**
- `module` (string, required): Module name (e.g., "users", "tasks")

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "perm-uuid",
      "name": "Create User",
      "code": "USER_CREATE",
      "description": "Permission to create users",
      "module": "users"
    }
  ]
}
```

### GET /permissions/grouped/by-module

**Description:** Get all permissions grouped by module.

**Response (200 OK):**
```json
{
  "data": {
    "modules": {
      "users": [
        {
          "id": "perm-uuid-1",
          "name": "Create User",
          "code": "USER_CREATE",
          "module": "users"
        }
      ],
      "tasks": [
        {
          "id": "perm-uuid-2",
          "name": "Create Task",
          "code": "TASK_CREATE",
          "module": "tasks"
        }
      ]
    },
    "totalPermissions": 46,
    "totalModules": 9
  }
}
```

### PUT /permissions/:id

**Description:** Update permission.

**Path Parameters:**
- `id` (UUID, required): Permission ID

**Request Body:**
```json
{
  "name": "Updated Create User",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "message": "Permission updated successfully",
  "data": {
    "id": "perm-uuid",
    "name": "Updated Create User",
    "code": "USER_CREATE",
    "description": "Updated description",
    "module": "users",
    "createdAt": "2025-12-16T10:00:00.000Z",
    "updatedAt": "2025-12-16T10:30:00.000Z"
  }
}
```

### DELETE /permissions/:id

**Description:** Delete permission.

**Path Parameters:**
- `id` (UUID, required): Permission ID

**Response (200 OK):**
```json
{
  "message": "Permission deleted successfully"
}
```

---

## Customers

**Base Path:** `/customers`  
**Authentication:** Required (JWT)  
**Authorization:** Role-based (varies by endpoint)

### POST /customers

**Description:** Create a new customer with optional email notification.

**Authorization:** ADMIN, MANAGER

**Request Body:**
```json
{
  "sNo": "CUST-001",
  "name": "John Doe",
  "shortName": "John",
  "branchName": "Main Branch",
  "cityArea": "Colombo",
  "email": "john@example.com",
  "smsPhone": "+94771234567",
  "currency": "LKR",
  "salesGroup": "Retail",
  "address": "123 Main Street",
  "sendEmail": true
}
```

**Response (200 OK):**
```json
{
  "id": "customer-uuid",
  "sNo": "CUST-001",
  "name": "John Doe",
  "shortName": "John",
  "branchName": "Main Branch",
  "cityArea": "Colombo",
  "email": "john@example.com",
  "smsPhone": "+94771234567",
  "currency": "LKR",
  "salesGroup": "Retail",
  "address": "123 Main Street",
  "status": "Active",
  "createdAt": "2025-12-16T10:00:00.000Z",
  "updatedAt": "2025-12-16T10:00:00.000Z"
}
```

### POST /customers/import-csv

**Description:** Import customers from CSV file.

**Authorization:** ADMIN, MANAGER

**Request:** Multipart form data
- `file` (file, required): CSV file

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Import completed",
  "totalRecords": 100,
  "imported": 95,
  "updated": 3,
  "skipped": 2,
  "errors": [
    {
      "row": 5,
      "error": "Invalid email format"
    }
  ]
}
```

### GET /customers

**Description:** Get all customers with pagination and filters.

**Authorization:** ADMIN, MANAGER, USER

**Query Parameters:**
- `search` (string, optional): Search term
- `type` (string, optional): Customer type filter
- `salesType` (string, optional): Sales type filter
- `status` (string, optional): Status filter
- `cityArea` (string, optional): City/Area filter
- `salesGroup` (string, optional): Sales group filter
- `sNo` (string, optional): Customer number filter
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 10, max: 100): Items per page

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "customer-uuid",
      "sNo": "CUST-001",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "Active"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### GET /customers/:id

**Description:** Get customer by ID.

**Authorization:** ADMIN, MANAGER, USER

**Path Parameters:**
- `id` (UUID, required): Customer ID

**Response (200 OK):**
```json
{
  "id": "customer-uuid",
  "sNo": "CUST-001",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "Active"
}
```

### GET /customers/sno/:sNo

**Description:** Get customer by customer number.

**Authorization:** ADMIN, MANAGER, USER

**Path Parameters:**
- `sNo` (string, required): Customer number

**Response (200 OK):**
```json
{
  "id": "customer-uuid",
  "sNo": "CUST-001",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### PUT /customers/:id

**Description:** Update customer.

**Authorization:** ADMIN, MANAGER

**Path Parameters:**
- `id` (UUID, required): Customer ID

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

**Response (200 OK):**
```json
{
  "id": "customer-uuid",
  "sNo": "CUST-001",
  "name": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

### DELETE /customers/:id

**Description:** Delete customer.

**Authorization:** ADMIN

**Path Parameters:**
- `id` (UUID, required): Customer ID

**Response (200 OK):**
```json
{
  "message": "Customer deleted successfully"
}
```

### GET /customers/search/:term

**Description:** Search customers by term.

**Authorization:** ADMIN, MANAGER, USER

**Path Parameters:**
- `term` (string, required): Search term

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "customer-uuid",
      "sNo": "CUST-001",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### GET /customers/:id/complaints

**Description:** Get all complaints for a customer.

**Authorization:** ADMIN, MANAGER, USER

**Path Parameters:**
- `id` (UUID, required): Customer ID

**Response (200 OK):**
```json
{
  "message": "Customer complaints retrieved",
  "customer": {
    "id": "customer-uuid",
    "name": "John Doe"
  },
  "complaints": [
    {
      "id": "complaint-uuid",
      "complaintNumber": "COMP-2025-001",
      "status": "Open"
    }
  ]
}
```

---

*Note: This is Part 1 of the API documentation. Due to length constraints, the remaining sections (Suppliers, Items, Categories, Costing, Tasks, Complaints, Attachments, Email Service) will continue in the next part. The complete documentation would be approximately 200+ pages.*

**To continue reading, see:**
- Part 2: Suppliers, Items, Categories
- Part 3: Costing
- Part 4: Tasks
- Part 5: Complaints, Attachments, Email Service

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-16

