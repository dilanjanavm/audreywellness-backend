# Task Management API Documentation

**⭐ NEW** - Newly added endpoints  
**🔄 UPDATED** - Recently updated endpoints

## Base URL
```
http://localhost:3003
```

---

## Table of Contents
1. [Phase Management APIs](#phase-management-apis)
2. [Task Management APIs](#task-management-apis)

---

## Phase Management APIs

### 1. List All Phases
Get all task phases with optional task inclusion.

**Endpoint:** `GET /tasks/phases`

**Query Parameters:**
- `includeTasks` (boolean, optional): Set to `true` to include tasks in response

**Request Headers:**
```
Content-Type: application/json
```

**Example:** `GET /tasks/phases?includeTasks=true`

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "phase-uuid-1234",
      "name": "Development",
      "color": "#1890ff",
      "description": "Development phase",
      "order": 0,
      "statuses": ["pending", "ongoing", "review", "completed", "failed"],
      "taskCount": 3,
      "createdAt": "2025-12-05T10:30:00.000Z",
      "updatedAt": "2025-12-05T10:30:00.000Z",
      "tasks": [
        {
          "id": "task-uuid-1234",
          "taskId": "TASK-1234567890-ABC",
          "phaseId": "phase-uuid-1234",
          "status": "ongoing",
          "order": 0,
          "task": "Implement feature",
          "description": "Task description",
          "priority": "high",
          "dueDate": "2025-12-15T00:00:00.000Z",
          "assignedUserId": "user-uuid-1234",
          "assignedUser": {
            "id": "user-uuid-1234",
            "userName": "john_doe",
            "email": "john@example.com"
          },
          "costingId": "costing-uuid-1234",
          "costing": {
            "id": "costing-uuid-1234",
            "itemName": "Product Name",
            "itemCode": "ITEM-001",
            "version": 1,
            "isActive": true
          },
          "assignee": {
            "id": "user-uuid-1234",
            "name": "john_doe",
            "role": "MANAGER"
          },
          "comments": 0,
          "views": 0,
          "createdAt": "2025-12-05T10:30:00.000Z",
          "updatedAt": "2025-12-05T10:30:00.000Z",
          "updatedBy": null
        }
      ]
    }
  ]
}
```

---

### 2. Create Phase
Create a new task phase.

**Endpoint:** `POST /tasks/phases`

**Request Body:**
```json
{
  "name": "Development",
  "color": "#1890ff",
  "description": "Development phase",  // optional
  "statuses": ["pending", "ongoing", "review", "completed", "failed"],
  "order": 0,                          // optional
  "updatedBy": "user-id"               // optional
}
```

**Response (Success - 201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "phase-uuid-1234",
    "name": "Development",
    "color": "#1890ff",
    "description": "Development phase",
    "order": 0,
    "statuses": ["pending", "ongoing", "review", "completed", "failed"],
    "taskCount": 0,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z"
  }
}
```

---

### 3. Update Phase
Update an existing phase.

**Endpoint:** `PUT /tasks/phases/:phaseId`

**Path Parameters:**
- `phaseId` (UUID, required): Phase ID

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Phase Name",
  "color": "#ff4d4f",
  "description": "Updated description",
  "statuses": ["pending", "ongoing", "completed"],
  "order": 1
}
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "phase-uuid-1234",
    "name": "Updated Phase Name",
    "color": "#ff4d4f",
    "description": "Updated description",
    "order": 1,
    "statuses": ["pending", "ongoing", "completed"],
    "taskCount": 3,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T11:00:00.000Z"
  }
}
```

---

### 4. Delete Phase
Delete a phase. Tasks can be reassigned to another phase.

**Endpoint:** `DELETE /tasks/phases/:phaseId`

**Path Parameters:**
- `phaseId` (UUID, required): Phase ID

**Query Parameters:**
- `reassignPhaseId` (UUID, optional): Phase ID to reassign tasks to

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Phase deleted successfully"
  }
}
```

---

### 5. List Phase Tasks
Get all tasks for a specific phase with filtering options.

**Endpoint:** `GET /tasks/phases/:phaseId/tasks`

**Path Parameters:**
- `phaseId` (UUID, required): Phase ID

**Query Parameters:**
- `status` (string | array, optional): Filter by status(es)
- `dateFrom` (string, optional): Filter tasks from date (ISO format)
- `dateTo` (string, optional): Filter tasks to date (ISO format)
- `search` (string, optional): Search in task title, description, or taskId

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "phaseId": "phase-uuid-1234",
    "filters": {
      "status": ["ongoing"],
      "dateFrom": null,
      "dateTo": null,
      "search": null
    },
    "data": [
      {
        "id": "task-uuid-1234",
        "taskId": "TASK-1234567890-ABC",
        "phaseId": "phase-uuid-1234",
        "status": "ongoing",
        "order": 0,
        "task": "Implement feature",
        "description": "Task description",
        "priority": "high",
        "dueDate": "2025-12-15T00:00:00.000Z",
        "assignedUserId": "user-uuid-1234",
        "assignedUser": {
          "id": "user-uuid-1234",
          "userName": "john_doe",
          "email": "john@example.com"
        },
        "costingId": "costing-uuid-1234",
        "costing": {
          "id": "costing-uuid-1234",
          "itemName": "Product Name",
          "itemCode": "ITEM-001",
          "version": 1,
          "isActive": true
        },
        "batchSize": "batch0_5kg",
        "rawMaterials": [
          {
            "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
            "rawMaterialName": "CAPB",
            "percentage": "10.0000",
            "unitPrice": "1000.00",
            "units": "Kg",
            "supplier": "",
            "category": "Raw Material",
            "kg": 0.05,
            "cost": 50
          }
        ],
        "assignee": {
          "id": "user-uuid-1234",
          "name": "john_doe",
          "role": "MANAGER"
        },
        "comments": 0,
        "views": 0,
        "createdAt": "2025-12-05T10:30:00.000Z",
        "updatedAt": "2025-12-05T10:30:00.000Z",
        "updatedBy": null
      }
    ]
  }
}
```

---

## Task Management APIs

### 🔄 1. Create Task (UPDATED)
Create a new task with optional user and costing assignment.

**Endpoint:** `POST /tasks`

**Request Body:**
```json
{
  "taskId": "TASK-1234567890-ABC",     // optional - auto-generated if not provided
  "task": "Implement new feature",     // required
  "description": "Task description",    // optional
  "phaseId": "phase-uuid-1234",        // required
  "status": "pending",                  // required
  "priority": "high",                   // optional: "low" | "medium" | "high" | "urgent"
  "dueDate": "2025-12-15T00:00:00.000Z", // optional (ISO format)
  "assignedUserId": "user-uuid-1234",  // NEW - optional - User UUID
  "costingId": "costing-uuid-1234",    // NEW - optional - Costing UUID
  "batchSize": "batch0_5kg",           // NEW - optional - Batch size (e.g., "batch0_5kg", "batch1kg", etc.)
  "rawMaterials": [                     // NEW - optional - Raw materials array
    {
      "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
      "rawMaterialName": "CAPB",
      "percentage": "10.0000",
      "unitPrice": "1000.00",
      "units": "Kg",
      "supplier": "",
      "category": "Raw Material",
      "kg": 0.05,
      "cost": 50
    }
  ],
  "assignee": "john_doe",              // optional - legacy field (backward compatibility)
  "comments": 0,                        // optional, default: 0
  "views": 0,                           // optional, default: 0
  "order": 0,                           // optional - auto-calculated if not provided
  "updatedBy": "user-id"                // optional
}
```

**New Fields:**
- `assignedUserId` (string, optional): UUID of the user to assign the task to. User must exist and be active.
- `costingId` (string, optional): UUID of the costing/product to associate with the task. Costing must exist and be active.
- `batchSize` (string, optional): Batch size identifier (e.g., "batch0_5kg", "batch1kg", "batch10kg", etc.)
- `rawMaterials` (array, optional): Array of raw material objects with batch-specific details:
  - `rawMaterialId` (string): UUID of the raw material item
  - `rawMaterialName` (string): Name of the raw material
  - `percentage` (string): Percentage value as string
  - `unitPrice` (string): Unit price as string
  - `units` (string): Unit of measurement (e.g., "Kg")
  - `supplier` (string): Supplier name
  - `category` (string): Category name
  - `kg` (number): Kilograms for the selected batch
  - `cost` (number): Cost for the selected batch

**Response (Success - 201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid-1234",
    "status": "pending",
    "order": 0,
    "task": "Implement new feature",
    "description": "Task description",
    "priority": "high",
    "dueDate": "2025-12-15T00:00:00.000Z",
    "assignedUserId": "user-uuid-1234",
    "assignedUser": {
      "id": "user-uuid-1234",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "costingId": "costing-uuid-1234",
    "costing": {
      "id": "costing-uuid-1234",
      "itemName": "Product Name",
      "itemCode": "ITEM-001",
      "version": 1,
      "isActive": true
    },
    "assignee": {
      "id": "user-uuid-1234",
      "name": "john_doe",
      "role": "MANAGER"
    },
    "comments": 0,
    "views": 0,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z",
    "updatedBy": null
  }
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 400,
  "message": "User with ID user-uuid-1234 not found"
}
```

or

```json
{
  "statusCode": 400,
  "message": "Costing with ID costing-uuid-1234 not found"
}
```

---

### 🔄 2. Update Task (UPDATED)
Update an existing task including user and costing assignments.

**Endpoint:** `PUT /tasks/:taskId`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Request Body:** (All fields optional except those being updated)
```json
{
  "task": "Updated task name",
  "description": "Updated description",
  "phaseId": "phase-uuid-5678",
  "status": "ongoing",
  "priority": "medium",
  "dueDate": "2025-12-20T00:00:00.000Z",
  "assignedUserId": "user-uuid-5678",  // NEW - optional - Update assigned user (null to unassign)
  "costingId": "costing-uuid-5678",    // NEW - optional - Update costing (null to unassign)
  "batchSize": "batch1kg",             // NEW - optional - Update batch size
  "rawMaterials": [                     // NEW - optional - Update raw materials
    {
      "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
      "rawMaterialName": "CAPB",
      "percentage": "10.0000",
      "unitPrice": "1000.00",
      "units": "Kg",
      "supplier": "Supplier Name",
      "category": "Raw Material",
      "kg": 0.1,
      "cost": 100
    }
  ],
  "assignee": "jane_doe",              // optional - legacy field
  "comments": 5,
  "views": 10,
  "order": 1,
  "updatedBy": "user-id"
}
```

**New Fields:**
- `assignedUserId` (string | null, optional): Update assigned user. Set to `null` or empty string to unassign.
- `costingId` (string | null, optional): Update costing. Set to `null` or empty string to unassign.
- `batchSize` (string, optional): Update batch size identifier
- `rawMaterials` (array, optional): Update raw materials array with batch-specific details

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid-5678",
    "status": "ongoing",
    "order": 1,
    "task": "Updated task name",
    "description": "Updated description",
    "priority": "medium",
    "dueDate": "2025-12-20T00:00:00.000Z",
    "assignedUserId": "user-uuid-5678",
    "assignedUser": {
      "id": "user-uuid-5678",
      "userName": "jane_doe",
      "email": "jane@example.com"
    },
    "costingId": "costing-uuid-5678",
        "costing": {
          "id": "costing-uuid-5678",
          "itemName": "Another Product",
          "itemCode": "ITEM-002",
          "version": 2,
          "isActive": true
        },
        "batchSize": "batch1kg",
        "rawMaterials": [
          {
            "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
            "rawMaterialName": "CAPB",
            "percentage": "10.0000",
            "unitPrice": "1000.00",
            "units": "Kg",
            "supplier": "Supplier Name",
            "category": "Raw Material",
            "kg": 0.1,
            "cost": 100
          }
        ],
        "assignee": {
      "id": "user-uuid-5678",
      "name": "jane_doe",
      "role": "DEVELOPER"
    },
    "comments": 5,
    "views": 10,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T11:00:00.000Z",
    "updatedBy": "user-id"
  }
}
```

---

### 3. Get Task by ID
Get a specific task by its ID or taskId.

**Endpoint:** `GET /tasks/:taskId`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid-1234",
    "status": "ongoing",
    "order": 0,
    "task": "Implement new feature",
    "description": "Task description",
    "priority": "high",
    "dueDate": "2025-12-15T00:00:00.000Z",
    "assignedUserId": "user-uuid-1234",
    "assignedUser": {
      "id": "user-uuid-1234",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "costingId": "costing-uuid-1234",
    "costing": {
      "id": "costing-uuid-1234",
      "itemName": "Product Name",
      "itemCode": "ITEM-001",
      "version": 1,
      "isActive": true
    },
    "batchSize": "batch0_5kg",
    "rawMaterials": [
      {
        "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
        "rawMaterialName": "CAPB",
        "percentage": "10.0000",
        "unitPrice": "1000.00",
        "units": "Kg",
        "supplier": "",
        "category": "Raw Material",
        "kg": 0.05,
        "cost": 50
      }
    ],
    "assignee": {
      "id": "user-uuid-1234",
      "name": "john_doe",
      "role": "MANAGER"
    },
    "comments": 0,
    "views": 0,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z",
    "updatedBy": null
  }
}
```

---

### 4. Delete Task
Delete a task by its ID or taskId.

**Endpoint:** `DELETE /tasks/:taskId`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Task deleted successfully"
  }
}
```

---

### 5. Update Task Position
Update a task's position (phase, status, and order).

**Endpoint:** `PATCH /tasks/:taskId/position`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Request Body:**
```json
{
  "phaseId": "phase-uuid-5678",
  "status": "completed",
  "order": 5,
  "updatedBy": "user-id"  // optional
}
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid-5678",
    "status": "completed",
    "order": 5,
    "task": "Implement new feature",
    "description": "Task description",
    "priority": "high",
    "dueDate": "2025-12-15T00:00:00.000Z",
    "assignedUserId": "user-uuid-1234",
    "assignedUser": {
      "id": "user-uuid-1234",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "costingId": "costing-uuid-1234",
    "costing": {
      "id": "costing-uuid-1234",
      "itemName": "Product Name",
      "itemCode": "ITEM-001",
      "version": 1,
      "isActive": true
    },
    "assignee": {
      "id": "user-uuid-1234",
      "name": "john_doe",
      "role": "MANAGER"
    },
    "comments": 0,
    "views": 0,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T11:00:00.000Z",
    "updatedBy": "user-id"
  }
}
```

---

### 6. Get Status Reference
Get the task status reference configuration.

**Endpoint:** `GET /tasks/status-reference`

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "pending": { "id": 1, "label": "Pending" },
    "ongoing": { "id": 2, "label": "Ongoing" },
    "review": { "id": 3, "label": "Review" },
    "completed": { "id": 4, "label": "Completed" },
    "failed": { "id": 5, "label": "Failed" }
  }
}
```

---

## Data Types & Enumerations

### Task Status
- `pending` - Task is pending
- `ongoing` - Task is in progress
- `review` - Task is under review
- `completed` - Task is completed
- `failed` - Task has failed

### Task Priority
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `urgent` - Urgent priority

---

## New Features Summary

### User Assignment
- **Field:** `assignedUserId` (optional)
- **Type:** UUID string
- **Validation:** User must exist and be active
- **Response:** Includes `assignedUser` object with user details

### Costed Product Assignment
- **Field:** `costingId` (optional)
- **Type:** UUID string
- **Validation:** Costing must exist and be active
- **Response:** Includes `costing` object with product details

### Batch Size and Raw Materials
- **Field:** `batchSize` (optional)
- **Type:** String (e.g., "batch0_5kg", "batch1kg", "batch10kg", etc.)
- **Description:** Identifies the batch size selected for the task

- **Field:** `rawMaterials` (optional)
- **Type:** Array of raw material objects
- **Description:** Contains raw materials with batch-specific calculations (kg, cost) for the selected batch size
- **Structure:**
  - `rawMaterialId`: UUID of the raw material item
  - `rawMaterialName`: Name of the raw material
  - `percentage`: Percentage as string
  - `unitPrice`: Unit price as string
  - `units`: Unit of measurement
  - `supplier`: Supplier name
  - `category`: Category name
  - `kg`: Kilograms for the selected batch
  - `cost`: Cost for the selected batch

### Backward Compatibility
- Legacy `assignee` field is still supported for backward compatibility
- If `assignedUserId` is provided, it takes precedence over `assignee`
- Both `assignee` (legacy) and `assignedUser` (new) are included in responses

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "User with ID user-uuid-1234 not found"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T10:30:00.000Z",
  "path": "/tasks/invalid-id",
  "method": "GET",
  "message": "Task invalid-id not found"
}
```

---

## Notes

1. **Task ID Format**: Tasks can be identified by UUID (`id`) or by `taskId` string (format: `TASK-{timestamp}-{randomString}`)

2. **User Assignment**:
   - `assignedUserId` is the preferred method (uses User entity relation)
   - Legacy `assignee` field is still supported but uses string-based reference
   - If both are provided, `assignedUserId` takes precedence

3. **Costing Assignment**:
   - Only active costings can be assigned
   - Set `costingId` to `null` or empty string to unassign

4. **Auto-generation**:
   - `taskId` is auto-generated if not provided
   - `order` is auto-calculated based on status if not provided

5. **Relations**:
   - Tasks loaded with `assignedUser` and `costing` relations
   - Response includes both relation objects and IDs

---

---

## Task Comment Management APIs

### ⭐ 1. Add Comment to Task (NEW)
Add a comment to a specific task.

**Endpoint:** `POST /tasks/:taskId/comments`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "comment": "This is a comment on the task",
  "ownerId": "user-uuid-1234"  // optional - User UUID (if provided, ownerName/ownerEmail will be auto-filled from user)
}
```

**Alternative Request Body (for anonymous/external comments):**
```json
{
  "comment": "This is a comment on the task",
  "ownerName": "John Doe",      // optional - if ownerId not provided
  "ownerEmail": "john@example.com"  // optional - if ownerId not provided
}
```

**Response (Success - 201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "comment-uuid-1234",
    "taskId": "task-uuid-1234",
    "comment": "This is a comment on the task",
    "ownerId": "user-uuid-1234",
    "owner": {
      "id": "user-uuid-1234",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "ownerName": "john_doe",
    "ownerEmail": "john@example.com",
    "commentedDate": "2025-12-05T12:30:00.000Z",
    "createdAt": "2025-12-05T12:30:00.000Z",
    "updatedAt": "2025-12-05T12:30:00.000Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-05T12:30:00.000Z",
  "path": "/tasks/task-uuid-1234/comments",
  "method": "POST",
  "message": "Comment is required"
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T12:30:00.000Z",
  "path": "/tasks/invalid-id/comments",
  "method": "POST",
  "message": "Task invalid-id not found"
}
```

---

### ⭐ 2. Get Task Comments (NEW)
Get all comments for a specific task, ordered by most recent first.

**Endpoint:** `GET /tasks/:taskId/comments`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "comment-uuid-1234",
      "taskId": "task-uuid-1234",
      "comment": "This is the most recent comment",
      "ownerId": "user-uuid-1234",
      "owner": {
        "id": "user-uuid-1234",
        "userName": "john_doe",
        "email": "john@example.com"
      },
      "ownerName": "john_doe",
      "ownerEmail": "john@example.com",
      "commentedDate": "2025-12-05T12:30:00.000Z",
      "createdAt": "2025-12-05T12:30:00.000Z",
      "updatedAt": "2025-12-05T12:30:00.000Z"
    },
    {
      "id": "comment-uuid-5678",
      "taskId": "task-uuid-1234",
      "comment": "This is an older comment",
      "ownerId": "user-uuid-5678",
      "owner": {
        "id": "user-uuid-5678",
        "userName": "jane_doe",
        "email": "jane@example.com"
      },
      "ownerName": "jane_doe",
      "ownerEmail": "jane@example.com",
      "commentedDate": "2025-12-05T10:00:00.000Z",
      "createdAt": "2025-12-05T10:00:00.000Z",
      "updatedAt": "2025-12-05T10:00:00.000Z"
    }
  ]
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T12:30:00.000Z",
  "path": "/tasks/invalid-id/comments",
  "method": "GET",
  "message": "Task invalid-id not found"
}
```

---

### ⭐ 3. Delete Comment (NEW)
Delete a comment by its ID.

**Endpoint:** `DELETE /tasks/comments/:commentId`

**Path Parameters:**
- `commentId` (string, required): Comment ID (UUID)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Comment deleted successfully"
  }
}
```

**Response (Error - 404):**
```json
{
  "statusCode": 404,
  "timestamp": "2025-12-05T12:30:00.000Z",
  "path": "/tasks/comments/invalid-id",
  "method": "DELETE",
  "message": "Comment with ID invalid-id not found"
}
```

---

## Updated Task Response with Comments

When fetching task details (GET /tasks/:taskId, GET /tasks/phases, etc.), the response now includes a `commentList` array:

**Example Task Response with Comments:**
```json
{
  "statusCode": 200,
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid-1234",
    "status": "ongoing",
    "order": 0,
    "task": "Implement new feature",
    "description": "Task description",
    "priority": "high",
    "dueDate": "2025-12-15T00:00:00.000Z",
    "assignedUserId": "user-uuid-1234",
    "assignedUser": {
      "id": "user-uuid-1234",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "costingId": "costing-uuid-1234",
    "costing": {
      "id": "costing-uuid-1234",
      "itemName": "Product Name",
      "itemCode": "ITEM-001",
      "version": 1,
      "isActive": true
    },
    "batchSize": "batch0_5kg",
    "rawMaterials": [...],
    "assignee": {...},
    "comments": 2,
    "commentList": [
      {
        "id": "comment-uuid-1234",
        "taskId": "task-uuid-1234",
        "comment": "This is the most recent comment",
        "ownerId": "user-uuid-1234",
        "owner": {
          "id": "user-uuid-1234",
          "userName": "john_doe",
          "email": "john@example.com"
        },
        "ownerName": "john_doe",
        "ownerEmail": "john@example.com",
        "commentedDate": "2025-12-05T12:30:00.000Z",
        "createdAt": "2025-12-05T12:30:00.000Z",
        "updatedAt": "2025-12-05T12:30:00.000Z"
      },
      {
        "id": "comment-uuid-5678",
        "taskId": "task-uuid-1234",
        "comment": "This is an older comment",
        "ownerId": "user-uuid-5678",
        "owner": {
          "id": "user-uuid-5678",
          "userName": "jane_doe",
          "email": "jane@example.com"
        },
        "ownerName": "jane_doe",
        "ownerEmail": "jane@example.com",
        "commentedDate": "2025-12-05T10:00:00.000Z",
        "createdAt": "2025-12-05T10:00:00.000Z",
        "updatedAt": "2025-12-05T10:00:00.000Z"
      }
    ],
    "views": 0,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-05T10:30:00.000Z",
    "updatedBy": null
  }
}
```

**Notes:**
- `comments` field contains the total count of comments (legacy field)
- `commentList` field contains the array of comment objects (NEW)
- Comments in `commentList` are sorted by `commentedDate` in descending order (most recent first)
- If a task has no comments, `commentList` will be `undefined` or an empty array

---

---

## Task Movement & Phase Management APIs

### ⭐ 1. Move Task to Another Phase (NEW)
Move a task from one phase to another. This is useful when a task is completed in one phase (e.g., "Manufacturing") and needs to be moved to the next phase (e.g., "Packing"). The movement is automatically tracked in the history.

**Endpoint:** `POST /tasks/:taskId/move`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "toPhaseId": "phase-uuid-5678",          // required - Target phase UUID
  "toStatus": "pending",                   // optional - Target status (defaults to first status of target phase)
  "order": 0,                              // optional - Target order position (defaults to next available)
  "reason": "Task completed in Manufacturing, moving to Packing phase",  // optional
  "movedBy": "user-uuid-1234"              // optional - User ID or name who initiated the movement
}
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid-5678",
    "status": "pending",
    "order": 0,
    "task": "Manufacturing Gel -100ml pack",
    "description": "Task description",
    "priority": "medium",
    "dueDate": "2025-12-20T00:00:00.000Z",
    "assignedUserId": "user-uuid-1234",
    "assignedUser": {
      "id": "user-uuid-1234",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "costingId": "costing-uuid-1234",
    "costing": {
      "id": "costing-uuid-1234",
      "itemName": "Gel -100ml pack",
      "itemCode": "ITEM-001",
      "version": 1,
      "isActive": true
    },
    "batchSize": "batch0_5kg",
    "rawMaterials": [...],
    "assignee": {...},
    "comments": 2,
    "commentList": [...],
    "views": 0,
    "createdAt": "2025-12-05T10:30:00.000Z",
    "updatedAt": "2025-12-13T12:00:00.000Z",
    "updatedBy": null
  }
}
```

**Response (Error - 400):**
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-13T12:00:00.000Z",
  "path": "/tasks/task-uuid-1234/move",
  "method": "POST",
  "message": "toPhaseId is required"
}
```

or

```json
{
  "statusCode": 400,
  "timestamp": "2025-12-13T12:00:00.000Z",
  "path": "/tasks/task-uuid-1234/move",
  "method": "POST",
  "message": "Task is already in phase Packing. Cannot move to the same phase."
}
```

---

### ⭐ 2. Get Task Movement History (NEW)
Get the complete movement history for a task, showing all phase transitions.

**Endpoint:** `GET /tasks/:taskId/movement-history`

**Path Parameters:**
- `taskId` (string, required): Task ID (UUID or taskId string)

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Response (Success - 200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "movement-uuid-1234",
      "taskId": "task-uuid-1234",
      "fromPhaseId": "phase-uuid-1234",
      "fromPhaseName": "Manufacturing",
      "toPhaseId": "phase-uuid-5678",
      "toPhaseName": "Packing",
      "fromStatus": "completed",
      "toStatus": "pending",
      "movedByUserId": "user-uuid-1234",
      "movedByName": "john_doe",
      "movedByUser": {
        "id": "user-uuid-1234",
        "userName": "john_doe",
        "email": "john@example.com"
      },
      "reason": "Task completed in Manufacturing, moving to Packing phase",
      "movedAt": "2025-12-13T12:00:00.000Z"
    },
    {
      "id": "movement-uuid-5678",
      "taskId": "task-uuid-1234",
      "fromPhaseId": "phase-uuid-0001",
      "fromPhaseName": "Planning",
      "toPhaseId": "phase-uuid-1234",
      "toPhaseName": "Manufacturing",
      "fromStatus": "completed",
      "toStatus": "pending",
      "movedByUserId": "user-uuid-5678",
      "movedByName": "jane_doe",
      "movedByUser": {
        "id": "user-uuid-5678",
        "userName": "jane_doe",
        "email": "jane@example.com"
      },
      "reason": "Planning completed, ready for manufacturing",
      "movedAt": "2025-12-10T10:00:00.000Z"
    }
  ]
}
```

**Notes:**
- Movements are returned in descending order (most recent first)
- Each movement record shows the complete transition: from phase/status to phase/status
- Includes who initiated the movement and optional reason/notes
- History is automatically created when tasks are moved between phases

---

## Use Case: Kanban Board Task Flow

### Example Workflow

1. **Task in Manufacturing Phase:**
   - Task: "Manufacturing Gel -100ml pack"
   - Phase: "Manufacturing"
   - Status: "ongoing" → "completed"

2. **Move to Packing Phase:**
   ```
   POST /tasks/{taskId}/move
   {
     "toPhaseId": "packing-phase-uuid",
     "toStatus": "pending",
     "reason": "Task completed in Manufacturing, moving to Packing phase",
     "movedBy": "current-user-uuid"
   }
   ```

3. **Result:**
   - Task moves to "Packing" phase
   - Status changes to "pending" (first status of Packing phase)
   - Movement history is recorded
   - Task appears in Packing phase kanban board

4. **View History:**
   ```
   GET /tasks/{taskId}/movement-history
   ```
   - Shows all phase transitions
   - Can track complete task lifecycle

---

## Implementation Details

### Automatic Features
- **History Tracking**: Every phase movement is automatically recorded
- **Order Management**: Task order is automatically adjusted in the target phase
- **Status Validation**: Ensures target status is valid for the target phase
- **Order Calculation**: Automatically calculates next available order if not provided

### Movement History Fields
- `fromPhaseId` / `fromPhaseName`: Source phase
- `toPhaseId` / `toPhaseName`: Target phase
- `fromStatus` / `toStatus`: Status before and after movement
- `movedByUserId` / `movedByName`: User who initiated the movement
- `reason`: Optional notes explaining the movement
- `movedAt`: Timestamp of the movement

### Best Practices
1. **Use Movement Endpoint**: When a task status changes to "completed" in a phase, use the move endpoint to transition to the next phase
2. **Provide Reason**: Always include a `reason` field to document why the task was moved
3. **Track User**: Include `movedBy` to track who initiated the movement
4. **Check History**: Before moving, check movement history to understand task lifecycle

---

**Document Version:** 2.2  
**Last Updated:** 2025-12-13  
**Generated For:** Frontend Development Team

