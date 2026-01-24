# Task Creation API Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Base URL:** `http://localhost:3005` (or your server URL)

---

## Overview

This API endpoint allows you to create tasks based on task templates. The backend validates and saves all fields according to the template configuration for the selected phase. The response structure matches the template fields, ensuring consistency between frontend and backend.

---

## Endpoint

```
POST /tasks
```

---

## Authentication

Requires JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Request Structure

### Mandatory Core Fields (Always Required)

These fields are always included in the task form and cannot be disabled:

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `task` | string | Task Name | Required, max 512 characters |
| `description` | string | Task Description | Optional |
| `phaseId` | string (UUID) | Phase ID | Required, must exist |
| `status` | string | Task Status | Required, must be valid status for phase |
| `assignedUserId` | string (UUID) | Assign To - User ID | Required, user must exist and be active |
| `priority` | string | Priority | Required, one of: `low`, `medium`, `high`, `urgent` |
| `startDate` | string (ISO) | Start Date | Required, ISO 8601 date string |
| `dueDate` | string (ISO) | End Date | Required, ISO 8601 date string |

### Configurable Optional Fields

These fields can be included based on the template configuration:

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `orderNumber` | string | Order Number | Optional, reference ID for the order |
| `customerName` | string | Customer Name | Optional, part of Customer Details |
| `customerAddress` | string | Customer Address | Optional, part of Customer Details |
| `customerMobile` | string | Customer Contact | Optional, mobile number (validated for SMS) |
| `costingId` | string (UUID) | Costed Product | Optional, costing must exist and be active |
| `batchSize` | string | Batch Size Ratio | Optional, selects specific batch size (e.g., "batch0_5kg", "batch1kg", "batch10kg") |
| `rawMaterials` | array | Raw Materials | Optional, array of raw material objects (when batchSize is provided) |
| `courierNumber` | string | Courier Number | Optional, tracking number for logistics |
| `courierService` | string | Courier Service | Optional, vendor selection (e.g., "DHL", "Fedex", "Citypak") |

### Additional Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | Task ID | Optional, auto-generated if not provided (format: `TASK-{timestamp}-{randomString}`) |
| `comments` | number | Comments Count | Optional, default: 0 |
| `views` | number | Views Count | Optional, default: 0 |
| `order` | number | Order Index | Optional, auto-calculated if not provided |
| `updatedBy` | string | Updated By | Optional, user ID or name |

---

## Request Examples

### Example 1: Standard Task (Minimal Required Fields)

```json
{
  "task": "Complete product testing",
  "description": "Test the new product features",
  "phaseId": "phase-uuid-1234",
  "status": "pending",
  "assignedUserId": "user-uuid-1234",
  "priority": "high",
  "startDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-01-20T00:00:00.000Z"
}
```

### Example 2: Task with Costed Product and Batch Size

```json
{
  "task": "Manufacture Gel -100ml pack",
  "description": "Manufacture 100ml gel packs",
  "phaseId": "phase-uuid-1234",
  "status": "pending",
  "assignedUserId": "user-uuid-1234",
  "priority": "high",
  "startDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-01-20T00:00:00.000Z",
  "costingId": "costing-uuid-1234",
  "batchSize": "batch10kg",
  "rawMaterials": [
    {
      "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
      "rawMaterialName": "CAPB",
      "percentage": "10.0000",
      "unitPrice": "1000.00",
      "units": "Kg",
      "supplier": "Supplier Name",
      "category": "Raw Material",
      "kg": 1.0,
      "cost": 1000
    }
  ]
}
```

### Example 3: Task with Customer Details (Filling & Packing Phase)

```json
{
  "task": "Pack order ORD-2024-001",
  "description": "Pack and prepare order for dispatch",
  "phaseId": "filling-packing-phase-uuid",
  "status": "pending",
  "assignedUserId": "user-uuid-1234",
  "priority": "high",
  "startDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-01-20T00:00:00.000Z",
  "orderNumber": "ORD-2024-001",
  "customerName": "John Doe",
  "customerMobile": "+94771234567",
  "customerAddress": "123 Main Street, Colombo 05, Sri Lanka"
}
```

### Example 4: Task with Courier Information

```json
{
  "task": "Dispatch order ORD-2024-002",
  "description": "Dispatch order via courier",
  "phaseId": "dispatch-phase-uuid",
  "status": "pending",
  "assignedUserId": "user-uuid-1234",
  "priority": "high",
  "startDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-01-20T00:00:00.000Z",
  "orderNumber": "ORD-2024-002",
  "customerName": "Jane Doe",
  "customerMobile": "0777654321",
  "customerAddress": "456 Park Avenue, Kandy, Sri Lanka",
  "courierNumber": "CP123456789",
  "courierService": "Citypak"
}
```

### Example 5: Complete Task with All Optional Fields

```json
{
  "task": "Complete manufacturing and dispatch",
  "description": "Manufacture, pack, and dispatch order",
  "phaseId": "phase-uuid-1234",
  "status": "pending",
  "assignedUserId": "user-uuid-1234",
  "priority": "urgent",
  "startDate": "2025-01-15T00:00:00.000Z",
  "dueDate": "2025-01-20T00:00:00.000Z",
  "costingId": "costing-uuid-1234",
  "batchSize": "batch10kg",
  "rawMaterials": [
    {
      "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
      "rawMaterialName": "CAPB",
      "percentage": "10.0000",
      "unitPrice": "1000.00",
      "units": "Kg",
      "supplier": "Supplier Name",
      "category": "Raw Material",
      "kg": 1.0,
      "cost": 1000
    }
  ],
  "orderNumber": "ORD-2024-003",
  "customerName": "Alice Johnson",
  "customerMobile": "+94771234567",
  "customerAddress": "789 Beach Road, Galle, Sri Lanka",
  "courierNumber": "CP987654321",
  "courierService": "Citypak"
}
```

---

## Response Structure

### Success Response (201 Created)

```json
{
  "statusCode": 201,
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid-1234",
    "status": "pending",
    "order": 0,
    "task": "Complete product testing",
    "description": "Test the new product features",
    "priority": "high",
    "startDate": "2025-01-15T00:00:00.000Z",
    "dueDate": "2025-01-20T00:00:00.000Z",
    "assignedUserId": "user-uuid-1234",
    "assignedUser": {
      "id": "user-uuid-1234",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "assignee": {
      "id": "user-uuid-1234",
      "name": "john_doe",
      "role": "MANAGER"
    },
    "costingId": "costing-uuid-1234",
    "costing": {
      "id": "costing-uuid-1234",
      "itemName": "Product Name",
      "itemCode": "ITEM-001",
      "version": 1,
      "isActive": true
    },
    "batchSize": "batch10kg",
    "rawMaterials": [
      {
        "rawMaterialId": "a2d57131-ecdf-42a2-b114-e7c64f777ef9",
        "rawMaterialName": "CAPB",
        "percentage": "10.0000",
        "unitPrice": "1000.00",
        "units": "Kg",
        "supplier": "Supplier Name",
        "category": "Raw Material",
        "kg": 1.0,
        "cost": 1000
      }
    ],
    "orderNumber": "ORD-2024-001",
    "customerName": "John Doe",
    "customerMobile": "+94771234567",
    "customerAddress": "123 Main Street, Colombo 05, Sri Lanka",
    "courierNumber": "CP123456789",
    "courierService": "Citypak",
    "comments": 0,
    "commentList": [],
    "views": 0,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "updatedBy": null
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Task UUID |
| `taskId` | string | Task identifier (format: `TASK-{timestamp}-{randomString}`) |
| `phaseId` | string (UUID) | Phase UUID |
| `status` | string | Task status |
| `order` | number | Order index within phase/status |
| `task` | string | Task name |
| `description` | string | Task description |
| `priority` | string | Task priority |
| `startDate` | string (ISO) | Start date |
| `dueDate` | string (ISO) | End date |
| `assignedUserId` | string (UUID) | Assigned user UUID |
| `assignedUser` | object | Assigned user object |
| `assignee` | object | Legacy assignee object (for backward compatibility) |
| `costingId` | string (UUID) | Costing UUID (if provided) |
| `costing` | object | Costing object (if provided) |
| `batchSize` | string | Batch size (if provided) |
| `rawMaterials` | array | Raw materials array (if provided) |
| `orderNumber` | string | Order number (if provided) |
| `customerName` | string | Customer name (if provided) |
| `customerMobile` | string | Customer mobile (if provided) |
| `customerAddress` | string | Customer address (if provided) |
| `courierNumber` | string | Courier tracking number (if provided) |
| `courierService` | string | Courier service vendor (if provided) |
| `comments` | number | Comment count |
| `commentList` | array | Array of comments (empty initially) |
| `views` | number | View count |
| `createdAt` | string (ISO) | Creation timestamp |
| `updatedAt` | string (ISO) | Update timestamp |
| `updatedBy` | string | Updated by user ID (if provided) |

---

## Error Responses

### 400 Bad Request - Missing Required Field

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "task is required"
}
```

### 400 Bad Request - Invalid Status

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Status 'invalid_status' is not allowed for phase 'R&D'"
}
```

### 400 Bad Request - Invalid Mobile Number

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Mobile number must be between 9 and 15 digits"
}
```

### 404 Not Found - Phase Not Found

```json
{
  "statusCode": 404,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Phase invalid-phase-id not found"
}
```

### 404 Not Found - User Not Found

```json
{
  "statusCode": 404,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "User with ID invalid-user-id not found"
}
```

### 404 Not Found - Costing Not Found

```json
{
  "statusCode": 404,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Costing with ID invalid-costing-id not found"
}
```

### 400 Bad Request - User Not Active

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "User invalid-user-id is not active"
}
```

### 400 Bad Request - Costing Not Active

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Costing invalid-costing-id is not active"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Unauthorized"
}
```

---

## Field Validation Rules

### Task Name (`task`)
- **Required:** Yes
- **Type:** string
- **Max Length:** 512 characters
- **Validation:** Cannot be empty or whitespace only

### Task Description (`description`)
- **Required:** No (optional)
- **Type:** string
- **Validation:** None

### Phase ID (`phaseId`)
- **Required:** Yes
- **Type:** string (UUID)
- **Validation:** Must exist in database

### Status (`status`)
- **Required:** Yes
- **Type:** string (enum)
- **Valid Values:** `pending`, `ongoing`, `review`, `completed`, `failed`
- **Validation:** Must be a valid status for the selected phase

### Assigned User ID (`assignedUserId`)
- **Required:** Yes
- **Type:** string (UUID)
- **Validation:** 
  - User must exist
  - User must be active

### Priority (`priority`)
- **Required:** Yes
- **Type:** string (enum)
- **Valid Values:** `low`, `medium`, `high`, `urgent`
- **Validation:** Must be one of the valid values

### Start Date (`startDate`)
- **Required:** Yes
- **Type:** string (ISO 8601)
- **Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example:** `2025-01-15T00:00:00.000Z`
- **Validation:** Must be a valid ISO date string

### End Date (`dueDate`)
- **Required:** Yes
- **Type:** string (ISO 8601)
- **Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example:** `2025-01-20T00:00:00.000Z`
- **Validation:** Must be a valid ISO date string

### Customer Mobile (`customerMobile`)
- **Required:** No (optional)
- **Type:** string
- **Validation:** (Only if provided)
  - Must be 9-15 digits
  - Can include optional `+` prefix
  - Examples: `+94771234567`, `94771234567`, `0771234567`, `771234567`

### Costing ID (`costingId`)
- **Required:** No (optional)
- **Type:** string (UUID)
- **Validation:**
  - Must exist in database
  - Must be active

### Batch Size (`batchSize`)
- **Required:** No (optional)
- **Type:** string
- **Examples:** `batch0_5kg`, `batch1kg`, `batch10kg`
- **Validation:** None

### Raw Materials (`rawMaterials`)
- **Required:** No (optional, but recommended when `batchSize` is provided)
- **Type:** array of objects
- **Structure:**
  ```json
  {
    "rawMaterialId": "string (UUID)",
    "rawMaterialName": "string",
    "percentage": "string",
    "unitPrice": "string",
    "units": "string",
    "supplier": "string",
    "category": "string",
    "kg": "number",
    "cost": "number"
  }
  ```

---

## Template-Based Validation

The backend validates fields based on the template configuration for the selected phase:

1. **Get Template:** The backend retrieves the template for the selected phase (or default template if none assigned)
2. **Validate Mandatory Fields:** All mandatory fields from the template are validated
3. **Save Optional Fields:** Optional fields are saved if provided
4. **Return Response:** Response includes all saved fields matching the template structure

### Optional Fields

All template optional fields are truly optional and can be omitted:

- `orderNumber` - Order number reference (optional)
- `customerName` - Customer name (optional)
- `customerMobile` - Customer mobile number (optional, validated for format if provided)
- `customerAddress` - Customer address (optional)
- `courierNumber` - Courier tracking number (optional)
- `courierService` - Courier service vendor (optional)

**Note:** 
- These fields are **not required** for any phase, including "Filling & Packing"
- If `customerMobile` is provided, it will be validated for proper format (9-15 digits)
- All optional fields are saved to the database if included in the request

---

## Integration with Task Templates

The task creation endpoint integrates with the Task Template Management System:

1. **Template Resolution:** When a task is created, the backend:
   - Retrieves the template for the selected phase (or default template)
   - Validates mandatory fields according to the template
   - Saves optional fields that are included in the template

2. **Response Structure:** The response includes all fields that were saved, matching the template configuration

3. **Field Validation:** Validation rules are applied based on:
   - Template mandatory fields
   - Phase-specific requirements (e.g., Filling & Packing)
   - Field type validations

---

## Best Practices

1. **Always Get Template First:** Before creating a task, call `GET /tasks/template/:phaseId` to get the template configuration
2. **Validate on Frontend:** Validate required fields on the frontend before sending the request
3. **Handle Errors Gracefully:** Display appropriate error messages based on the error response
4. **Use ISO Dates:** Always use ISO 8601 format for date fields
5. **Validate Mobile Numbers:** If including `customerMobile`, ensure it's in a valid format
6. **Include Batch Materials:** When providing `batchSize`, include the corresponding `rawMaterials` array

---

## Related Endpoints

- `GET /tasks/template/:phaseId` - Get task template for a phase
- `GET /tasks/phases` - List all phases
- `PUT /tasks/:taskId` - Update task
- `GET /tasks/:taskId` - Get task by ID

---

## Notes

1. **Auto-generation:** If `taskId` is not provided, it will be auto-generated in the format `TASK-{timestamp}-{randomString}`
2. **Order Calculation:** If `order` is not provided, it will be auto-calculated based on the status
3. **Recipe Auto-binding:** If a `costingId` is provided, the system will automatically attempt to bind a recipe execution
4. **Legacy Support:** The `assignee` field is still supported for backward compatibility but `assignedUserId` is preferred
5. **Date Formats:** All dates should be in ISO 8601 format (e.g., `2025-01-15T00:00:00.000Z`)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Generated For:** Frontend Development Team
