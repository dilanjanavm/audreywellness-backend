# Task Creation Templates - Phase-Based Documentation

## Overview

The task creation system supports different templates based on the phase. The **Filling & Packing** phase requires additional customer and order information, while other phases use a standard template.

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Task Template Endpoint](#task-template-endpoint)
3. [Standard Phase Template](#standard-phase-template)
4. [Filling & Packing Phase Template](#filling--packing-phase-template)
5. [Scenario-Based Examples](#scenario-based-examples)
6. [Validation Rules](#validation-rules)
7. [Database Schema](#database-schema)

---

## Phase Overview

The system has 4 phases:

1. **R&D** - Research and Development
2. **Blending** - Blending phase
3. **Filling & Packing** - Filling and Packing phase (requires customer details)
4. **Dispatch** - Dispatch phase

---

## Task Template Endpoint

### Get Task Template for Phase

**Endpoint:** `GET /tasks/template/:phaseId`

**Description:** Returns the task creation template for a specific phase, including required and optional fields.

**Example Request:**
```bash
GET /tasks/template/{phase-id-uuid}
```

**Response (Standard Phase):**
```json
{
  "data": {
    "phaseId": "phase-uuid-1234",
    "phaseName": "R&D",
    "isFillingAndPacking": false,
    "requiredFields": [
      "task",
      "phaseId",
      "status"
    ],
    "optionalFields": [
      "taskId",
      "description",
      "priority",
      "dueDate",
      "assignedUserId",
      "costingId",
      "batchSize",
      "rawMaterials",
      "assignee",
      "comments",
      "views",
      "order",
      "updatedBy",
      "orderNumber",
      "customerName",
      "customerMobile",
      "customerAddress"
    ],
    "fieldDescriptions": {
      "task": {
        "type": "string",
        "required": true,
        "description": "Task title/name"
      },
      "phaseId": {
        "type": "string (UUID)",
        "required": true,
        "description": "Phase ID where the task belongs"
      },
      "status": {
        "type": "string (enum)",
        "required": true,
        "description": "Task status. Allowed values: pending, ongoing, review, completed, failed"
      }
    },
    "exampleRequest": {
      "task": "Example Task Title",
      "phaseId": "phase-uuid-1234",
      "status": "pending",
      "description": "Optional task description",
      "priority": "medium",
      "dueDate": "2024-12-15T00:00:00.000Z"
    }
  }
}
```

**Response (Filling & Packing Phase):**
```json
{
  "data": {
    "phaseId": "phase-uuid-5678",
    "phaseName": "Filling & Packing",
    "isFillingAndPacking": true,
    "requiredFields": [
      "task",
      "phaseId",
      "status",
      "orderNumber",
      "customerName",
      "customerMobile",
      "customerAddress"
    ],
    "optionalFields": [
      "taskId",
      "description",
      "priority",
      "dueDate",
      "assignedUserId",
      "costingId",
      "batchSize",
      "rawMaterials",
      "assignee",
      "comments",
      "views",
      "order",
      "updatedBy"
    ],
    "fieldDescriptions": {
      "orderNumber": {
        "type": "string",
        "required": true,
        "description": "Order number for the task",
        "validation": "Required for Filling & Packing phase"
      },
      "customerName": {
        "type": "string",
        "required": true,
        "description": "Customer name",
        "validation": "Required for Filling & Packing phase"
      },
      "customerMobile": {
        "type": "string",
        "required": true,
        "description": "Customer mobile number (validated for SMS sending)",
        "validation": "Required for Filling & Packing phase. Must be valid mobile number format (e.g., +94771234567, 0771234567)"
      },
      "customerAddress": {
        "type": "string",
        "required": true,
        "description": "Customer delivery address",
        "validation": "Required for Filling & Packing phase"
      }
    },
    "exampleRequest": {
      "task": "Example Task Title",
      "phaseId": "phase-uuid-5678",
      "status": "pending",
      "description": "Optional task description",
      "priority": "medium",
      "dueDate": "2024-12-15T00:00:00.000Z",
      "orderNumber": "ORD-2024-001",
      "customerName": "John Doe",
      "customerMobile": "+94771234567",
      "customerAddress": "123 Main Street, Colombo 05, Sri Lanka"
    }
  }
}
```

---

## Standard Phase Template

### Phases Using Standard Template

- **R&D**
- **Blending**
- **Dispatch**

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `task` | string | Task title/name |
| `phaseId` | string (UUID) | Phase ID where the task belongs |
| `status` | string (enum) | Task status (pending, ongoing, review, completed, failed) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | Custom task ID. Auto-generated if not provided |
| `description` | string | Task description |
| `priority` | string (enum) | Task priority: low, medium, high, urgent |
| `dueDate` | string (ISO date) | Due date in ISO format |
| `assignedUserId` | string (UUID) | User ID to assign the task to |
| `costingId` | string (UUID) | Costing/Product ID to associate with the task |
| `batchSize` | string | Batch size identifier (e.g., "batch0_5kg", "batch1kg") |
| `rawMaterials` | array | Array of raw materials with batch-specific details |
| `assignee` | string | Legacy assignee field (backward compatibility) |
| `comments` | number | Comment count (default: 0) |
| `views` | number | View count (default: 0) |
| `order` | number | Task order (auto-calculated if not provided) |
| `updatedBy` | string | User ID or name who updated the task |

### Example Request (Standard Phase)

```json
{
  "task": "Develop new product formula",
  "description": "Research and develop a new skincare product formula",
  "phaseId": "phase-uuid-1234",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-12-31T00:00:00.000Z",
  "assignedUserId": "user-uuid-1234",
  "costingId": "costing-uuid-1234",
  "batchSize": "batch1kg",
  "rawMaterials": [
    {
      "rawMaterialId": "material-uuid-1234",
      "rawMaterialName": "CAPB",
      "percentage": "10.0000",
      "unitPrice": "1000.00",
      "units": "Kg",
      "supplier": "Supplier ABC",
      "category": "Raw Material",
      "kg": 0.1,
      "cost": 100
    }
  ]
}
```

---

## Filling & Packing Phase Template

### Required Fields

All standard required fields **PLUS**:

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `orderNumber` | string | Order number for the task | Required, cannot be empty |
| `customerName` | string | Customer name | Required, cannot be empty |
| `customerMobile` | string | Customer mobile number | Required, must be valid mobile format |
| `customerAddress` | string | Customer delivery address | Required, cannot be empty |

### Optional Fields

Same as standard phase optional fields (excluding the 4 customer fields which are required).

### Mobile Number Validation

The `customerMobile` field must be in a valid format for SMS sending:

**Valid Formats:**
- `+94771234567` (International format with +)
- `94771234567` (International format without +)
- `0771234567` (Local format with leading 0)
- `771234567` (Local format without leading 0)

**Invalid Formats:**
- Empty string
- Only spaces
- Non-numeric characters (except + at the start)
- Less than 9 digits

### Example Request (Filling & Packing Phase)

```json
{
  "task": "Pack and ship order ORD-2024-001",
  "description": "Fill containers and pack for customer delivery",
  "phaseId": "phase-uuid-5678",
  "status": "pending",
  "priority": "urgent",
  "dueDate": "2024-12-20T00:00:00.000Z",
  "assignedUserId": "user-uuid-5678",
  "costingId": "costing-uuid-5678",
  "batchSize": "batch0_5kg",
  "orderNumber": "ORD-2024-001",
  "customerName": "John Doe",
  "customerMobile": "+94771234567",
  "customerAddress": "123 Main Street, Colombo 05, Sri Lanka",
  "rawMaterials": [
    {
      "rawMaterialId": "material-uuid-5678",
      "rawMaterialName": "Essential Oil",
      "percentage": "5.0000",
      "unitPrice": "2000.00",
      "units": "Kg",
      "supplier": "Supplier XYZ",
      "category": "Raw Material",
      "kg": 0.025,
      "cost": 50
    }
  ]
}
```

---

## Scenario-Based Examples

### Scenario 1: Create R&D Task (Standard Phase)

**Goal:** Create a new research and development task.

**Step 1:** Get the phase ID
```bash
GET /tasks/phases
```

**Step 2:** Get the task template (optional, for reference)
```bash
GET /tasks/template/{r&d-phase-id}
```

**Step 3:** Create the task
```bash
POST /tasks
Content-Type: application/json

{
  "task": "Research new ingredient properties",
  "description": "Study the effects of new botanical extract",
  "phaseId": "r&d-phase-uuid",
  "status": "pending",
  "priority": "medium",
  "assignedUserId": "user-uuid-1234"
}
```

**Expected Response:**
```json
{
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "task": "Research new ingredient properties",
    "description": "Study the effects of new botanical extract",
    "phaseId": "r&d-phase-uuid",
    "status": "pending",
    "priority": "medium",
    "assignedUserId": "user-uuid-1234",
    "createdAt": "2024-12-15T10:00:00.000Z"
  }
}
```

---

### Scenario 2: Create Blending Task (Standard Phase)

**Goal:** Create a blending task with costing and raw materials.

**Request:**
```bash
POST /tasks
Content-Type: application/json

{
  "task": "Blend product batch BATCH-001",
  "description": "Blend ingredients for 1kg batch",
  "phaseId": "blending-phase-uuid",
  "status": "pending",
  "priority": "high",
  "assignedUserId": "user-uuid-5678",
  "costingId": "costing-uuid-1234",
  "batchSize": "batch1kg",
  "rawMaterials": [
    {
      "rawMaterialId": "material-uuid-1",
      "rawMaterialName": "Base Oil",
      "percentage": "80.0000",
      "unitPrice": "500.00",
      "units": "Kg",
      "supplier": "Supplier A",
      "category": "Raw Material",
      "kg": 0.8,
      "cost": 400
    },
    {
      "rawMaterialId": "material-uuid-2",
      "rawMaterialName": "Essential Oil",
      "percentage": "20.0000",
      "unitPrice": "2000.00",
      "units": "Kg",
      "supplier": "Supplier B",
      "category": "Raw Material",
      "kg": 0.2,
      "cost": 400
    }
  ]
}
```

**Expected Response:**
```json
{
  "data": {
    "id": "task-uuid-5678",
    "taskId": "TASK-1234567891-DEF",
    "task": "Blend product batch BATCH-001",
    "phaseId": "blending-phase-uuid",
    "status": "pending",
    "priority": "high",
    "costingId": "costing-uuid-1234",
    "batchSize": "batch1kg",
    "rawMaterials": [
      {
        "rawMaterialId": "material-uuid-1",
        "rawMaterialName": "Base Oil",
        "percentage": "80.0000",
        "kg": 0.8,
        "cost": 400
      },
      {
        "rawMaterialId": "material-uuid-2",
        "rawMaterialName": "Essential Oil",
        "percentage": "20.0000",
        "kg": 0.2,
        "cost": 400
      }
    ],
    "createdAt": "2024-12-15T10:30:00.000Z"
  }
}
```

---

### Scenario 3: Create Filling & Packing Task (With All Required Fields)

**Goal:** Create a filling and packing task with customer details.

**Step 1:** Get the Filling & Packing phase ID
```bash
GET /tasks/phases
```

**Step 2:** Get the task template
```bash
GET /tasks/template/{filling-packing-phase-id}
```

**Step 3:** Create the task
```bash
POST /tasks
Content-Type: application/json

{
  "task": "Pack order ORD-2024-001 for customer delivery",
  "description": "Fill containers and prepare for shipping",
  "phaseId": "filling-packing-phase-uuid",
  "status": "pending",
  "priority": "urgent",
  "dueDate": "2024-12-20T00:00:00.000Z",
  "assignedUserId": "user-uuid-9999",
  "costingId": "costing-uuid-5678",
  "batchSize": "batch0_5kg",
  "orderNumber": "ORD-2024-001",
  "customerName": "Jane Smith",
  "customerMobile": "+94771234567",
  "customerAddress": "456 Park Avenue, Kandy, Sri Lanka"
}
```

**Expected Response:**
```json
{
  "data": {
    "id": "task-uuid-9999",
    "taskId": "TASK-1234567892-GHI",
    "task": "Pack order ORD-2024-001 for customer delivery",
    "description": "Fill containers and prepare for shipping",
    "phaseId": "filling-packing-phase-uuid",
    "status": "pending",
    "priority": "urgent",
    "dueDate": "2024-12-20T00:00:00.000Z",
    "assignedUserId": "user-uuid-9999",
    "costingId": "costing-uuid-5678",
    "batchSize": "batch0_5kg",
    "orderNumber": "ORD-2024-001",
    "customerName": "Jane Smith",
    "customerMobile": "+94771234567",
    "customerAddress": "456 Park Avenue, Kandy, Sri Lanka",
    "createdAt": "2024-12-15T11:00:00.000Z"
  }
}
```

---

### Scenario 4: Create Filling & Packing Task (Missing Required Field - Error)

**Goal:** Attempt to create a Filling & Packing task without customer details.

**Request:**
```bash
POST /tasks
Content-Type: application/json

{
  "task": "Pack order ORD-2024-002",
  "phaseId": "filling-packing-phase-uuid",
  "status": "pending"
}
```

**Expected Error Response:**
```json
{
  "statusCode": 400,
  "message": "orderNumber is required for Filling & Packing phase tasks",
  "error": "Bad Request"
}
```

**Or if orderNumber is provided but customerName is missing:**
```json
{
  "statusCode": 400,
  "message": "customerName is required for Filling & Packing phase tasks",
  "error": "Bad Request"
}
```

---

### Scenario 5: Create Filling & Packing Task (Invalid Mobile Number - Error)

**Goal:** Attempt to create a Filling & Packing task with invalid mobile number.

**Request:**
```bash
POST /tasks
Content-Type: application/json

{
  "task": "Pack order ORD-2024-003",
  "phaseId": "filling-packing-phase-uuid",
  "status": "pending",
  "orderNumber": "ORD-2024-003",
  "customerName": "John Doe",
  "customerMobile": "123",  // Invalid: too short
  "customerAddress": "123 Main Street"
}
```

**Expected Error Response:**
```json
{
  "statusCode": 400,
  "message": "Invalid mobile number format. Must be a valid phone number (e.g., +94771234567, 0771234567)",
  "error": "Bad Request"
}
```

---

### Scenario 6: Update Task to Filling & Packing Phase

**Goal:** Move an existing task to Filling & Packing phase (requires adding customer details).

**Step 1:** Update task with phase change and customer details
```bash
PUT /tasks/{taskId}
Content-Type: application/json

{
  "phaseId": "filling-packing-phase-uuid",
  "orderNumber": "ORD-2024-004",
  "customerName": "Alice Johnson",
  "customerMobile": "0777654321",
  "customerAddress": "789 Beach Road, Galle, Sri Lanka"
}
```

**Expected Response:**
```json
{
  "data": {
    "id": "task-uuid-1234",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "filling-packing-phase-uuid",
    "orderNumber": "ORD-2024-004",
    "customerName": "Alice Johnson",
    "customerMobile": "0777654321",
    "customerAddress": "789 Beach Road, Galle, Sri Lanka",
    "updatedAt": "2024-12-15T12:00:00.000Z"
  }
}
```

---

## Validation Rules

### General Validation

1. **Task Title:** Required, cannot be empty
2. **Phase ID:** Required, must be a valid UUID and exist in database
3. **Status:** Required, must be one of the allowed statuses for the phase

### Filling & Packing Phase Specific Validation

1. **Order Number:**
   - Required
   - Cannot be empty or only whitespace
   - No specific format required (can be any string)

2. **Customer Name:**
   - Required
   - Cannot be empty or only whitespace
   - No specific format required (can be any string)

3. **Customer Mobile:**
   - Required
   - Cannot be empty or only whitespace
   - Must be valid mobile number format:
     - International: `+94771234567` or `94771234567`
     - Local: `0771234567` or `771234567`
   - Minimum 9 digits
   - Can start with `+` (optional)
   - Must be numeric (except optional `+` at start)

4. **Customer Address:**
   - Required
   - Cannot be empty or only whitespace
   - No specific format required (can be any string, supports multi-line)

### Error Messages

| Error Condition | Error Message |
|----------------|---------------|
| Missing `orderNumber` | `orderNumber is required for Filling & Packing phase tasks` |
| Missing `customerName` | `customerName is required for Filling & Packing phase tasks` |
| Missing `customerMobile` | `customerMobile is required for Filling & Packing phase tasks` |
| Missing `customerAddress` | `customerAddress is required for Filling & Packing phase tasks` |
| Invalid `customerMobile` format | `Invalid mobile number format. Must be a valid phone number (e.g., +94771234567, 0771234567)` |

---

## Database Schema

### Tasks Table

The `tasks` table includes the following columns for Filling & Packing phase:

| Column Name | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `order_number` | VARCHAR | YES | Order number for Filling & Packing tasks |
| `customer_name` | VARCHAR | YES | Customer name for Filling & Packing tasks |
| `customer_mobile` | VARCHAR | YES | Customer mobile number (validated for SMS) |
| `customer_address` | TEXT | YES | Customer address for Filling & Packing tasks |

**Note:** These columns are nullable in the database but are **required** when creating/updating tasks in the "Filling & Packing" phase. The validation is enforced at the application level.

### Migration SQL

If you need to add these columns manually:

```sql
ALTER TABLE `tasks`
ADD COLUMN `order_number` VARCHAR(255) NULL AFTER `updated_by`,
ADD COLUMN `customer_name` VARCHAR(255) NULL AFTER `order_number`,
ADD COLUMN `customer_mobile` VARCHAR(50) NULL AFTER `customer_name`,
ADD COLUMN `customer_address` TEXT NULL AFTER `customer_mobile`;
```

---

## Summary

### Key Points

1. **Standard Phases (R&D, Blending, Dispatch):**
   - Use standard template
   - Only require: `task`, `phaseId`, `status`
   - Customer fields are optional

2. **Filling & Packing Phase:**
   - Uses special template
   - Requires: `task`, `phaseId`, `status`, `orderNumber`, `customerName`, `customerMobile`, `customerAddress`
   - Mobile number is validated for SMS compatibility

3. **Template Endpoint:**
   - Use `GET /tasks/template/:phaseId` to get the template for any phase
   - Returns required fields, optional fields, and example request

4. **Validation:**
   - All validation is enforced at the application level
   - Clear error messages guide users on what's required

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tasks/template/:phaseId` | GET | Get task template for a phase |
| `/tasks` | POST | Create a new task |
| `/tasks/:taskId` | PUT | Update an existing task |
| `/tasks/phases` | GET | List all phases |

---

## Frontend Integration Guide

### Step 1: Get Phase Template

```typescript
const getTaskTemplate = async (phaseId: string) => {
  const response = await fetch(`/tasks/template/${phaseId}`);
  const { data } = await response.json();
  return data;
};
```

### Step 2: Build Form Based on Template

```typescript
const buildTaskForm = (template: TaskTemplate) => {
  const requiredFields = template.requiredFields;
  const optionalFields = template.optionalFields;
  
  // Show required fields with required indicator
  // Show optional fields as optional
  // For Filling & Packing, show customer fields section
};
```

### Step 3: Validate Before Submission

```typescript
const validateTask = (formData: any, template: TaskTemplate) => {
  // Check all required fields are present
  for (const field of template.requiredFields) {
    if (!formData[field] || formData[field].trim() === '') {
      return { valid: false, error: `${field} is required` };
    }
  }
  
  // Special validation for customerMobile if Filling & Packing
  if (template.isFillingAndPacking) {
    if (!isValidMobileNumber(formData.customerMobile)) {
      return { valid: false, error: 'Invalid mobile number format' };
    }
  }
  
  return { valid: true };
};
```

### Step 4: Submit Task

```typescript
const createTask = async (formData: any) => {
  const response = await fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};
```

---

**Last Updated:** December 2024  
**Version:** 1.0
