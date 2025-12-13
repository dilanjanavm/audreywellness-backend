# API Documentation

## Base URL
```
http://localhost:3000/api
```

---


## Table of Contents

1. [Tasks Module APIs](#tasks-module-apis)
2. [Costing Module APIs](#costing-module-apis)

---

## Tasks Module APIs

### 1. List All Phases

**Endpoint:** `GET /tasks/phases`

**Description:** Get all task phases with optional task inclusion.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeTasks | string | No | Set to "true" or "1" to include tasks in response |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "color": "string",
      "description": "string (optional)",
      "order": 0,
      "statuses": ["pending", "ongoing", "review", "completed", "failed"],
      "taskCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tasks": [
        {
          "id": "uuid",
          "taskId": "string",
          "phaseId": "uuid",
          "status": "pending",
          "order": 0,
          "task": "string",
          "description": "string (optional)",
          "priority": "low",
          "dueDate": "2024-01-01T00:00:00.000Z",
          "assignee": {
            "id": "string",
            "name": "string",
            "avatar": "string (optional)",
            "role": "string (optional)"
          },
          "comments": 0,
          "views": 0,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z",
          "updatedBy": "string (optional)"
        }
      ]
    }
  ]
}
```

**Example Request:**
```bash
GET /tasks/phases?includeTasks=true
```

---

### 2. Create Phase

**Endpoint:** `POST /tasks/phases`

**Description:** Create a new task phase.

**Request Body:**
```json
{
  "name": "string (required)",
  "color": "string (required)",
  "description": "string (optional)",
  "statuses": ["pending", "ongoing", "review", "completed", "failed"] (required),
  "order": 0 (optional),
  "updatedBy": "string (optional)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "color": "string",
    "description": "string (optional)",
    "order": 0,
    "statuses": ["pending", "ongoing"],
    "taskCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example Request:**
```bash
POST /tasks/phases
Content-Type: application/json

{
  "name": "Development",
  "color": "#3498db",
  "description": "Development phase",
  "statuses": ["pending", "ongoing", "review"],
  "order": 1
}
```

---

### 3. Update Phase

**Endpoint:** `PUT /tasks/phases/:phaseId`

**Description:** Update an existing task phase.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phaseId | string (UUID) | Yes | Phase ID |

**Request Body:**
```json
{
  "name": "string (optional)",
  "color": "string (optional)",
  "description": "string (optional)",
  "statuses": ["pending", "ongoing"] (optional),
  "order": 0 (optional),
  "updatedBy": "string (optional)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "color": "string",
    "description": "string (optional)",
    "order": 0,
    "statuses": ["pending", "ongoing"],
    "taskCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example Request:**
```bash
PUT /tasks/phases/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "name": "Updated Phase Name",
  "color": "#e74c3c"
}
```

---

### 4. Delete Phase

**Endpoint:** `DELETE /tasks/phases/:phaseId`

**Description:** Delete a task phase. If phase has tasks, provide reassignPhaseId to move tasks.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phaseId | string (UUID) | Yes | Phase ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reassignPhaseId | string (UUID) | No | Target phase ID to move tasks to (required if phase has tasks) |

**Response:**
```json
{
  "data": null
}
```

**Example Request:**
```bash
DELETE /tasks/phases/123e4567-e89b-12d3-a456-426614174000?reassignPhaseId=987fcdeb-51a2-43d7-b890-123456789abc
```

---

### 5. List Phase Tasks

**Endpoint:** `GET /tasks/phases/:phaseId/tasks`

**Description:** Get all tasks for a specific phase with optional filters.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| phaseId | string (UUID) | Yes | Phase ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string or string[] | No | Filter by status(es). Can be comma-separated: "pending,ongoing" |
| dateFrom | string (ISO date) | No | Filter tasks from this date |
| dateTo | string (ISO date) | No | Filter tasks to this date |
| search | string | No | Search in task, taskId, or description |

**Response:**
```json
{
  "data": {
    "phaseId": "uuid",
    "filters": {
      "status": ["pending"],
      "dateFrom": "2024-01-01T00:00:00.000Z",
      "dateTo": "2024-12-31T00:00:00.000Z",
      "search": "string"
    },
    "data": [
      {
        "id": "uuid",
        "taskId": "string",
        "phaseId": "uuid",
        "status": "pending",
        "order": 0,
        "task": "string",
        "description": "string (optional)",
        "priority": "low",
        "dueDate": "2024-01-01T00:00:00.000Z",
        "assignee": {
          "id": "string",
          "name": "string",
          "avatar": "string (optional)",
          "role": "string (optional)"
        },
        "comments": 0,
        "views": 0,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "updatedBy": "string (optional)"
      }
    ]
  }
}
```

**Example Request:**
```bash
GET /tasks/phases/123e4567-e89b-12d3-a456-426614174000/tasks?status=pending,ongoing&dateFrom=2024-01-01&search=bug
```

---

### 6. Create Task

**Endpoint:** `POST /tasks`

**Description:** Create a new task. The taskId will be auto-generated if not provided.

**Request Body:**
```json
{
  "task": "string (required)",
  "description": "string (optional)",
  "phaseId": "uuid (required)",
  "status": "pending|ongoing|review|completed|failed (required)",
  "priority": "low|medium|high|urgent (optional)",
  "dueDate": "string (ISO date, optional)",
  "assignee": "string|null (optional)",
  "comments": 0 (optional, default: 0),
  "views": 0 (optional, default: 0),
  "order": 0 (optional),
  "updatedBy": "string (optional)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "taskId": "string",
    "phaseId": "uuid",
    "status": "pending",
    "order": 0,
    "task": "string",
    "description": "string (optional)",
    "priority": "low",
    "dueDate": "2024-01-01T00:00:00.000Z",
    "assignee": {
      "id": "string",
      "name": "string",
      "avatar": "string (optional)",
      "role": "string (optional)"
    },
    "comments": 0,
    "views": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "updatedBy": "string (optional)"
  }
}
```

**Example Request:**
```bash
POST /tasks
Content-Type: application/json

{
  "task": "Fix login bug",
  "description": "User cannot login with email",
  "phaseId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "assignee": "user123",
  "updatedBy": "admin"
}
```

**Note:** The `taskId` field is optional. If not provided, the backend will auto-generate a unique taskId in the format `TASK-{timestamp}-{randomString}` (e.g., `TASK-1764924601440-0HZ0AZEP8`).

---

### 7. Update Task

**Endpoint:** `PUT /tasks/:taskId`

**Description:** Update an existing task.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| taskId | string | Yes | Task ID (not UUID, the taskId field) |

**Request Body:**
```json
{
  "task": "string (optional)",
  "description": "string (optional)",
  "phaseId": "uuid (optional)",
  "status": "pending|ongoing|review|completed|failed (optional)",
  "priority": "low|medium|high|urgent (optional)",
  "dueDate": "string (ISO date, optional)",
  "assignee": "string|null (optional)",
  "comments": 0 (optional),
  "views": 0 (optional),
  "order": 0 (optional),
  "updatedBy": "string (optional)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "taskId": "string",
    "phaseId": "uuid",
    "status": "ongoing",
    "order": 0,
    "task": "string",
    "description": "string (optional)",
    "priority": "high",
    "dueDate": "2024-01-01T00:00:00.000Z",
    "assignee": {
      "id": "string",
      "name": "string",
      "avatar": "string (optional)",
      "role": "string (optional)"
    },
    "comments": 0,
    "views": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "updatedBy": "string (optional)"
  }
}
```

**Example Request:**
```bash
PUT /tasks/TASK-001
Content-Type: application/json

{
  "status": "ongoing",
  "priority": "urgent",
  "updatedBy": "admin"
}
```

---

### 8. Delete Task

**Endpoint:** `DELETE /tasks/:taskId`

**Description:** Delete a task.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| taskId | string | Yes | Task ID (not UUID, the taskId field) |

**Response:**
```json
{
  "data": null
}
```

**Example Request:**
```bash
DELETE /tasks/TASK-001
```

---

### 9. Update Task Position

**Endpoint:** `PATCH /tasks/:taskId/position`

**Description:** Update task position (move task to different phase/status/order).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| taskId | string | Yes | Task ID (not UUID, the taskId field) |

**Request Body:**
```json
{
  "phaseId": "uuid (required)",
  "status": "pending|ongoing|review|completed|failed (required)",
  "order": 0 (required),
  "updatedBy": "string (optional)"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "taskId": "string",
    "phaseId": "uuid",
    "status": "review",
    "order": 2,
    "task": "string",
    "description": "string (optional)",
    "priority": "medium",
    "dueDate": "2024-01-01T00:00:00.000Z",
    "assignee": {
      "id": "string",
      "name": "string",
      "avatar": "string (optional)",
      "role": "string (optional)"
    },
    "comments": 0,
    "views": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "updatedBy": "string (optional)"
  }
}
```

**Example Request:**
```bash
PATCH /tasks/TASK-001/position
Content-Type: application/json

{
  "phaseId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "review",
  "order": 2,
  "updatedBy": "admin"
}
```

---

### 10. Get Status Reference

**Endpoint:** `GET /tasks/reference/statuses`

**Description:** Get reference data for all available task statuses.

**Response:**
```json
{
  "data": [
    {
      "id": "pending",
      "label": "Pending",
      "color": "#f39c12"
    },
    {
      "id": "ongoing",
      "label": "Ongoing",
      "color": "#3498db"
    },
    {
      "id": "review",
      "label": "Review",
      "color": "#9b59b6"
    },
    {
      "id": "completed",
      "label": "Completed",
      "color": "#27ae60"
    },
    {
      "id": "failed",
      "label": "Failed",
      "color": "#e74c3c"
    }
  ]
}
```

**Example Request:**
```bash
GET /tasks/reference/statuses
```

---

## Costing Module APIs

### 1. Create Costing

**Endpoint:** `POST /costing`

**Description:** Create a new costing record for a product with version control.

**Request Body:**
```json
{
  "itemId": "uuid (required)",
  "itemName": "string (required)",
  "itemCode": "string (required)",
  "rawMaterials": [
    {
      "rawMaterialId": "uuid (required)",
      "rawMaterialName": "string (required)",
      "percentage": 0 (required),
      "unitPrice": 0 (required),
      "supplier": "string (required)",
      "supplierId": "uuid (required)",
      "category": "string (required)",
      "categoryId": "uuid (required)",
      "units": "string (required)",
      "amountNeeded": 0 (required),
      "batchCalculations": {
        "batch0.5kg": {
          "cost": 0,
          "kg": 0
        },
        "batch1kg": {
          "cost": 0,
          "kg": 0
        },
        "batch10kg": {
          "cost": 0,
          "kg": 0
        },
        "batch25kg": {
          "cost": 0,
          "kg": 0
        },
        "batch50kg": {
          "cost": 0,
          "kg": 0
        },
        "batch100kg": {
          "cost": 0,
          "kg": 0
        },
        "batch150kg": {
          "cost": 0,
          "kg": 0
        },
        "batch200kg": {
          "cost": 0,
          "kg": 0
        }
      }
    }
  ],
  "additionalCosts": [
    {
      "costName": "string (required)",
      "description": "string (optional)",
      "costPerUnit": 0 (required),
      "batchCosts": {
        "batch0.5kg": 0,
        "batch1kg": 0,
        "batch10kg": 0,
        "batch25kg": 0,
        "batch50kg": 0,
        "batch100kg": 0,
        "batch150kg": 0,
        "batch200kg": 0
      }
    }
  ],
  "totalCosts": {
    "batch0.5kg": {
      "cost": 0,
      "kg": 0
    },
    "batch1kg": {
      "cost": 0,
      "kg": 0
    },
    "batch10kg": {
      "cost": 0,
      "kg": 0
    },
    "batch25kg": {
      "cost": 0,
      "kg": 0
    },
    "batch50kg": {
      "cost": 0,
      "kg": 0
    },
    "batch100kg": {
      "cost": 0,
      "kg": 0
    },
    "batch150kg": {
      "cost": 0,
      "kg": 0
    },
    "batch200kg": {
      "cost": 0,
      "kg": 0
    }
  },
  "setAsActive": true (optional, default: true),
  "createdAt": "string (optional, ISO date)"
}
```

**Response:**
```json
{
  "message": "Costing created successfully",
  "data": {
    "id": "uuid",
    "version": 1,
    "isActive": true,
    "itemId": "uuid",
    "itemName": "string",
    "itemCode": "string",
    "rawMaterials": [
      {
        "id": "uuid",
        "rawMaterialId": "uuid",
        "rawMaterialName": "string",
        "percentage": 0,
        "unitPrice": 0,
        "supplier": "string",
        "supplierId": "uuid",
        "category": "string",
        "categoryId": "uuid",
        "units": "string",
        "amountNeeded": 0,
        "totalCost": 0,
        "batchCalculations": {
          "batch0_5kg": { "cost": 0, "kg": 0 },
          "batch1kg": { "cost": 0, "kg": 0 },
          "batch10kg": { "cost": 0, "kg": 0 },
          "batch25kg": { "cost": 0, "kg": 0 },
          "batch50kg": { "cost": 0, "kg": 0 },
          "batch100kg": { "cost": 0, "kg": 0 },
          "batch150kg": { "cost": 0, "kg": 0 },
          "batch200kg": { "cost": 0, "kg": 0 }
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "additionalCosts": [
      {
        "id": "uuid",
        "costName": "string",
        "description": "string",
        "costPerUnit": 0,
        "batchCosts": {
          "batch0_5kg": 0,
          "batch1kg": 0,
          "batch10kg": 0,
          "batch25kg": 0,
          "batch50kg": 0,
          "batch100kg": 0,
          "batch150kg": 0,
          "batch200kg": 0
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCosts": [
      {
        "id": "uuid",
        "batchSize": "BATCH_1_KG",
        "cost": 0,
        "kg": 0,
        "rawMaterialCost": 0,
        "additionalCost": 0,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "status": "ACTIVE",
    "totalRawMaterialCost": 0,
    "totalAdditionalCost": 0,
    "totalPercentage": 0
  }
}
```

**Example Request:**
```bash
POST /costing
Content-Type: application/json

{
  "itemId": "123e4567-e89b-12d3-a456-426614174000",
  "itemName": "Herbal Oil",
  "itemCode": "OIL-001",
  "rawMaterials": [
    {
      "rawMaterialId": "987fcdeb-51a2-43d7-b890-123456789abc",
      "rawMaterialName": "Coconut Oil",
      "percentage": 50,
      "unitPrice": 100,
      "supplier": "Supplier A",
      "supplierId": "supplier-uuid",
      "category": "Oils",
      "categoryId": "category-uuid",
      "units": "kg",
      "amountNeeded": 0.5,
      "batchCalculations": {
        "batch0.5kg": { "cost": 50, "kg": 0.25 },
        "batch1kg": { "cost": 100, "kg": 0.5 },
        "batch10kg": { "cost": 1000, "kg": 5 }
      }
    }
  ],
  "additionalCosts": [
    {
      "costName": "Packaging",
      "description": "Bottle and label",
      "costPerUnit": 10,
      "batchCosts": {
        "batch0.5kg": 5,
        "batch1kg": 10,
        "batch10kg": 100
      }
    }
  ],
  "totalCosts": {
    "batch0.5kg": { "cost": 55, "kg": 0.5 },
    "batch1kg": { "cost": 110, "kg": 1 },
    "batch10kg": { "cost": 1100, "kg": 10 }
  },
  "setAsActive": true
}
```

---

### 2. Get All Costings for an Item

**Endpoint:** `GET /costing/item/:itemId`

**Description:** Get all costing versions for a specific item.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | string (UUID) | Yes | Item ID |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "version": 2,
      "isActive": true,
      "itemId": "uuid",
      "itemName": "string",
      "itemCode": "string",
      "rawMaterials": [],
      "additionalCosts": [],
      "totalCosts": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "status": "ACTIVE",
      "totalRawMaterialCost": 0,
      "totalAdditionalCost": 0,
      "totalPercentage": 0
    }
  ]
}
```

**Example Request:**
```bash
GET /costing/item/123e4567-e89b-12d3-a456-426614174000
```

---

### 3. Get Active Costing for an Item

**Endpoint:** `GET /costing/item/:itemId/active`

**Description:** Get the currently active costing version for an item.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | string (UUID) | Yes | Item ID |

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "version": 2,
    "isActive": true,
    "itemId": "uuid",
    "itemName": "string",
    "itemCode": "string",
    "rawMaterials": [],
    "additionalCosts": [],
    "totalCosts": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "status": "ACTIVE",
    "totalRawMaterialCost": 0,
    "totalAdditionalCost": 0,
    "totalPercentage": 0
  }
}
```

**Example Request:**
```bash
GET /costing/item/123e4567-e89b-12d3-a456-426614174000/active
```

---

### 4. Get Costing by ID

**Endpoint:** `GET /costing/:id`

**Description:** Get a specific costing record by its ID.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Costing ID |

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "version": 1,
    "isActive": false,
    "itemId": "uuid",
    "itemName": "string",
    "itemCode": "string",
    "rawMaterials": [],
    "additionalCosts": [],
    "totalCosts": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "status": "ACTIVE",
    "totalRawMaterialCost": 0,
    "totalAdditionalCost": 0,
    "totalPercentage": 0
  }
}
```

**Example Request:**
```bash
GET /costing/123e4567-e89b-12d3-a456-426614174000
```

---

### 5. Update Costing

**Endpoint:** `PUT /costing/:id`

**Description:** Update an existing costing record. All fields are optional.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Costing ID |

**Request Body:**
```json
{
  "itemId": "uuid (optional)",
  "itemName": "string (optional)",
  "itemCode": "string (optional)",
  "rawMaterials": [] (optional),
  "additionalCosts": [] (optional),
  "totalCosts": {} (optional),
  "setAsActive": true (optional),
  "isActive": true (optional),
  "recalculate": false (optional)
}
```

**Response:**
```json
{
  "message": "Costing updated successfully",
  "data": {
    "id": "uuid",
    "version": 1,
    "isActive": true,
    "itemId": "uuid",
    "itemName": "string",
    "itemCode": "string",
    "rawMaterials": [],
    "additionalCosts": [],
    "totalCosts": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "status": "ACTIVE",
    "totalRawMaterialCost": 0,
    "totalAdditionalCost": 0,
    "totalPercentage": 0
  }
}
```

**Example Request:**
```bash
PUT /costing/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "rawMaterials": [
    {
      "rawMaterialId": "uuid",
      "rawMaterialName": "Updated Material",
      "percentage": 60,
      "unitPrice": 120
    }
  ]
}
```

---

### 6. Set Costing as Active Version

**Endpoint:** `PUT /costing/:id/set-active`

**Description:** Set a specific costing version as the active version for its item.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Costing ID |

**Response:**
```json
{
  "message": "Costing set as active version successfully",
  "data": {
    "id": "uuid",
    "version": 2,
    "isActive": true,
    "itemId": "uuid",
    "itemName": "string",
    "itemCode": "string",
    "rawMaterials": [],
    "additionalCosts": [],
    "totalCosts": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "status": "ACTIVE",
    "totalRawMaterialCost": 0,
    "totalAdditionalCost": 0,
    "totalPercentage": 0
  }
}
```

**Example Request:**
```bash
PUT /costing/123e4567-e89b-12d3-a456-426614174000/set-active
```

---

### 7. Delete Costing

**Endpoint:** `DELETE /costing/:id`

**Description:** Delete a costing record. Cannot delete active costing.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Costing ID |

**Response:**
```json
{
  "message": "Costing deleted successfully"
}
```

**Example Request:**
```bash
DELETE /costing/123e4567-e89b-12d3-a456-426614174000
```

---

### 8. Compare Two Costing Versions

**Endpoint:** `GET /costing/compare/:costingId1/:costingId2`

**Description:** Compare two costing versions and get differences.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| costingId1 | string (UUID) | Yes | First costing ID |
| costingId2 | string (UUID) | Yes | Second costing ID |

**Response:**
```json
{
  "data": {
    "costing1": {
      "id": "uuid",
      "version": 1,
      "isActive": false,
      "itemId": "uuid",
      "itemName": "string",
      "itemCode": "string",
      "rawMaterials": [],
      "additionalCosts": [],
      "totalCosts": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "status": "ACTIVE",
      "totalRawMaterialCost": 0,
      "totalAdditionalCost": 0,
      "totalPercentage": 0
    },
    "costing2": {
      "id": "uuid",
      "version": 2,
      "isActive": true,
      "itemId": "uuid",
      "itemName": "string",
      "itemCode": "string",
      "rawMaterials": [],
      "additionalCosts": [],
      "totalCosts": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "status": "ACTIVE",
      "totalRawMaterialCost": 0,
      "totalAdditionalCost": 0,
      "totalPercentage": 0
    },
    "differences": {
      "totalCosts": {
        "BATCH_1_KG": {
          "cost1": 100,
          "cost2": 120,
          "difference": 20,
          "percentageChange": 20
        }
      },
      "rawMaterials": [
        {
          "rawMaterialName": "Coconut Oil",
          "percentage1": 50,
          "percentage2": 60,
          "unitPrice1": 100,
          "unitPrice2": 120,
          "totalCost1": 50,
          "totalCost2": 72
        }
      ],
      "additionalCosts": []
    }
  }
}
```

**Example Request:**
```bash
GET /costing/compare/123e4567-e89b-12d3-a456-426614174000/987fcdeb-51a2-43d7-b890-123456789abc
```

---

### 9. Get Costing History for an Item

**Endpoint:** `GET /costing/item/:itemId/history`

**Description:** Get paginated costing history for an item.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | string (UUID) | Yes | Item ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "version": 2,
      "isActive": true,
      "itemId": "uuid",
      "itemName": "string",
      "itemCode": "string",
      "rawMaterials": [],
      "additionalCosts": [],
      "totalCosts": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "status": "ACTIVE",
      "totalRawMaterialCost": 0,
      "totalAdditionalCost": 0,
      "totalPercentage": 0
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Example Request:**
```bash
GET /costing/item/123e4567-e89b-12d3-a456-426614174000/history?page=1&limit=10
```

---

### 10. Recalculate Costing

**Endpoint:** `POST /costing/:id/recalculate`

**Description:** Recalculate costing based on current raw material prices.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Costing ID |

**Response:**
```json
{
  "message": "Costing recalculated with current prices",
  "data": {
    "id": "uuid",
    "version": 1,
    "isActive": true,
    "itemId": "uuid",
    "itemName": "string",
    "itemCode": "string",
    "rawMaterials": [],
    "additionalCosts": [],
    "totalCosts": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "status": "ACTIVE",
    "totalRawMaterialCost": 0,
    "totalAdditionalCost": 0,
    "totalPercentage": 0
  }
}
```

**Example Request:**
```bash
POST /costing/123e4567-e89b-12d3-a456-426614174000/recalculate
```

---

### 11. Bulk Deactivate Costings

**Endpoint:** `POST /costing/bulk/deactivate`

**Description:** Deactivate multiple costing records.

**Request Body:**
```json
{
  "costingIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "message": "3 costings deactivated successfully",
  "deactivatedCount": 3
}
```

**Example Request:**
```bash
POST /costing/bulk/deactivate
Content-Type: application/json

{
  "costingIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "987fcdeb-51a2-43d7-b890-123456789abc"
  ]
}
```

---

### 12. Health Check

**Endpoint:** `GET /costing/health/check`

**Description:** Health check endpoint for costing service.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Costing Service"
}
```

**Example Request:**
```bash
GET /costing/health/check
```

---

### 13. Get All Items with Costing (Paginated)

**Endpoint:** `GET /costing/items/co`

**Description:** Get all items with their costing information (paginated).

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeSuppliers | boolean | No | Include supplier information |
| category | string | No | Filter by category |
| search | string | No | Search in description, itemCode, or category |
| onlyWithCosting | boolean | No | Return only items with costing records |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |

**Response:**
```json
{
  "data": {
    "data": [
      {
        "id": "uuid",
        "itemCode": "string",
        "stockId": "string",
        "description": "string",
        "category": "string",
        "categoryId": "uuid",
        "units": "string",
        "price": 0,
        "altPrice": 0,
        "currency": "string",
        "status": "ACTIVE",
        "suppliers": [],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "hasCostingRecords": true,
        "latestCostingRecordDetails": {
          "id": "uuid",
          "version": 1,
          "isActive": true,
          "itemId": "uuid",
          "itemName": "string",
          "itemCode": "string",
          "rawMaterials": [],
          "additionalCosts": [],
          "totalCosts": [],
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z",
          "status": "ACTIVE",
          "totalRawMaterialCost": 0,
          "totalAdditionalCost": 0,
          "totalPercentage": 0
        }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Example Request:**
```bash
GET /costing/items/co?page=1&limit=10&onlyWithCosting=true&search=oil
```

---

### 14. Get Items by Category with Costing

**Endpoint:** `GET /costing/items/category/:category`

**Description:** Get items by category with costing information (paginated).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | Yes | Category name |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeSuppliers | boolean | No | Include supplier information |
| search | string | No | Search in description, itemCode, or category |
| onlyWithCosting | boolean | No | Return only items with costing records |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |

**Response:**
```json
{
  "data": {
    "data": [],
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Example Request:**
```bash
GET /costing/items/category/Oils?page=1&limit=10&onlyWithCosting=true
```

---

### 15. Get Single Item with Costing

**Endpoint:** `GET /costing/items/:itemCode`

**Description:** Get a single item with its costing information by item code.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemCode | string | Yes | Item code |

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "itemCode": "string",
    "stockId": "string",
    "description": "string",
    "category": "string",
    "categoryId": "uuid",
    "units": "string",
    "price": 0,
    "altPrice": 0,
    "currency": "string",
    "status": "ACTIVE",
    "suppliers": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "hasCostingRecords": true,
    "latestCostingRecordDetails": {
      "id": "uuid",
      "version": 1,
      "isActive": true,
      "itemId": "uuid",
      "itemName": "string",
      "itemCode": "string",
      "rawMaterials": [],
      "additionalCosts": [],
      "totalCosts": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "status": "ACTIVE",
      "totalRawMaterialCost": 0,
      "totalAdditionalCost": 0,
      "totalPercentage": 0
    }
  }
}
```

**Example Request:**
```bash
GET /costing/items/OIL-001
```

---

### 16. Search Items with Costing

**Endpoint:** `GET /costing/items/search/:term`

**Description:** Search items with costing information (paginated).

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| term | string | Yes | Search term |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeSuppliers | boolean | No | Include supplier information |
| category | string | No | Filter by category |
| onlyWithCosting | boolean | No | Return only items with costing records |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |

**Response:**
```json
{
  "data": {
    "data": [],
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Example Request:**
```bash
GET /costing/items/search/herbal?page=1&limit=10
```

---

### 17. Get Items by Multiple Category IDs

**Endpoint:** `POST /costing/items/by-categories`

**Description:** Get items by multiple category IDs with costing information (paginated).

**Request Body:**
```json
{
  "categoryIds": ["uuid1", "uuid2", "uuid3"] (required),
  "includeSuppliers": true (optional),
  "onlyWithCosting": true (optional),
  "page": 1 (optional, default: 1),
  "limit": 10 (optional, default: 10)
}
```

**Response:**
```json
{
  "data": {
    "data": [],
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

**Example Request:**
```bash
POST /costing/items/by-categories
Content-Type: application/json

{
  "categoryIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "987fcdeb-51a2-43d7-b890-123456789abc"
  ],
  "onlyWithCosting": true,
  "page": 1,
  "limit": 10
}
```

---

### 18. Get Costed Products ⭐ NEW

**Endpoint:** `GET /costing/products/costed`

**Description:** Get all products that have costing records (costed products) with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| search | string | No | Search in item description, itemCode, or category |
| category | string | No | Filter by category |

**Response:**
```json
{
  "data": {
    "data": [
      {
        "itemId": "uuid",
        "itemCode": "string",
        "itemName": "string",
        "category": "string",
        "categoryId": "uuid",
        "units": "string",
        "price": 0,
        "currency": "string",
        "status": "ACTIVE",
        "hasActiveCosting": true,
        "activeCostingVersion": 2,
        "totalCostingVersions": 3,
        "latestCosting": {
          "id": "uuid",
          "version": 3,
          "isActive": false,
          "itemId": "uuid",
          "itemName": "string",
          "itemCode": "string",
          "rawMaterials": [],
          "additionalCosts": [],
          "totalCosts": [],
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z",
          "status": "ACTIVE",
          "totalRawMaterialCost": 0,
          "totalAdditionalCost": 0,
          "totalPercentage": 0
        },
        "lastCostUpdate": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Example Request:**
```bash
GET /costing/products/costed?page=1&limit=10&search=oil&category=Herbs
```

---

### 19. Get Product Cost History ⭐ NEW

**Endpoint:** `GET /costing/products/:itemId/cost-history`

**Description:** Get detailed cost history for a product with cost change tracking between versions.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemId | string (UUID) | Yes | Item ID |

**Response:**
```json
{
  "data": {
    "itemId": "uuid",
    "itemCode": "string",
    "itemName": "string",
    "totalVersions": 3,
    "currentActiveVersion": 2,
    "history": [
      {
        "costing": {
          "id": "uuid",
          "version": 1,
          "isActive": false,
          "itemId": "uuid",
          "itemName": "string",
          "itemCode": "string",
          "rawMaterials": [],
          "additionalCosts": [],
          "totalCosts": [
            {
              "id": "uuid",
              "batchSize": "BATCH_1_KG",
              "cost": 100,
              "kg": 1,
              "rawMaterialCost": 80,
              "additionalCost": 20,
              "createdAt": "2024-01-01T00:00:00.000Z",
              "updatedAt": "2024-01-01T00:00:00.000Z"
            }
          ],
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z",
          "status": "ACTIVE",
          "totalRawMaterialCost": 80,
          "totalAdditionalCost": 20,
          "totalPercentage": 100
        },
        "costChanges": null,
        "isActive": false,
        "version": 1,
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "costing": {
          "id": "uuid",
          "version": 2,
          "isActive": true,
          "itemId": "uuid",
          "itemName": "string",
          "itemCode": "string",
          "rawMaterials": [],
          "additionalCosts": [],
          "totalCosts": [
            {
              "id": "uuid",
              "batchSize": "BATCH_1_KG",
              "cost": 120,
              "kg": 1,
              "rawMaterialCost": 100,
              "additionalCost": 20,
              "createdAt": "2024-01-15T00:00:00.000Z",
              "updatedAt": "2024-01-15T00:00:00.000Z"
            }
          ],
          "createdAt": "2024-01-15T00:00:00.000Z",
          "updatedAt": "2024-01-15T00:00:00.000Z",
          "status": "ACTIVE",
          "totalRawMaterialCost": 100,
          "totalAdditionalCost": 20,
          "totalPercentage": 100
        },
        "costChanges": [
          {
            "batchSize": "BATCH_1_KG",
            "previousCost": 100,
            "currentCost": 120,
            "costDifference": 20,
            "percentageChange": 20
          }
        ],
        "isActive": true,
        "version": 2,
        "updatedAt": "2024-01-15T00:00:00.000Z",
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastUpdated": "2024-01-15T00:00:00.000Z"
  }
}
```

**Example Request:**
```bash
GET /costing/products/123e4567-e89b-12d3-a456-426614174000/cost-history
```

---

## Batch Size Enum Values

The following batch sizes are used in costing calculations:

- `BATCH_0_5_KG` - 0.5 kg batch
- `BATCH_1_KG` - 1 kg batch
- `BATCH_10_KG` - 10 kg batch
- `BATCH_25_KG` - 25 kg batch
- `BATCH_50_KG` - 50 kg batch
- `BATCH_100_KG` - 100 kg batch
- `BATCH_150_KG` - 150 kg batch
- `BATCH_200_KG` - 200 kg batch

---

## Task Status Enum Values

- `pending` - Task is pending
- `ongoing` - Task is in progress
- `review` - Task is under review
- `completed` - Task is completed
- `failed` - Task has failed

---

## Task Priority Enum Values

- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `urgent` - Urgent priority

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Notes

1. All UUIDs should be valid UUID v4 format
2. All dates should be in ISO 8601 format (e.g., `2024-01-01T00:00:00.000Z`)
3. All monetary values are in decimal format
4. Pagination starts from page 1
5. The `⭐ NEW` marker indicates newly added endpoints
6. When updating costings, only provide the fields you want to update
7. Active costing versions cannot be deleted - set another version as active first
8. Cost history shows cost changes between consecutive versions

---

**Document Version:** 1.0  
**Last Updated:** 2024-12-05  
**Generated For:** Frontend Development Team

