# Task Creation API - Filling & Packing Phase Special Requirements

## Overview

The Task Management system has **two different task creation flows** depending on the phase:

1. **Standard Task Creation** (R&D, Blending, Dispatch phases)
2. **Filling & Packing Task Creation** (special requirements with customer details)

## Phase Detection

The backend automatically detects the phase based on the `phaseId` provided in the request. When the phase is "Filling & Packing", additional required fields and validations are enforced.

---

## Standard Task Creation (R&D, Blending, Dispatch)

### Endpoint
```
POST /tasks
```

### Request Body
```json
{
  "task": "Task Title",
  "description": "Task description (optional)",
  "phaseId": "phase-uuid",
  "status": "pending",
  "priority": "high", // optional: "low", "medium", "high", "urgent"
  "dueDate": "2024-12-31T23:59:59Z", // optional
  "assignedUserId": "user-uuid", // optional
  "costingId": "costing-uuid", // optional
  "batchSize": "batch10kg", // optional
  "rawMaterials": [], // optional
  "order": 1 // optional - auto-generated if not provided
}
```

### Response
```json
{
  "statusCode": 200,
  "data": {
    "id": "task-uuid",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "phase-uuid",
    "status": "pending",
    "order": 1,
    "task": "Task Title",
    "description": "Task description",
    "priority": "high",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "assignedUserId": "user-uuid",
    "assignedUser": {
      "id": "user-uuid",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Filling & Packing Task Creation (Special Requirements)

### Endpoint
```
POST /tasks
```

### Required Additional Fields

For **Filling & Packing** phase tasks, the following fields are **REQUIRED**:

1. **orderNumber** (string, required) - Order number for the task
2. **customerName** (string, required) - Customer's full name
3. **customerMobile** (string, required) - Customer's mobile number (validated for SMS)
4. **customerAddress** (string, required) - Customer's address

### Mobile Number Validation

The `customerMobile` field is validated to ensure it can be used for SMS sending:

**Valid Formats:**
- International format: `+94771234567` or `94771234567`
- Local format (Sri Lanka): `0771234567` or `771234567`
- Other countries: Any format with 9-15 digits

**Validation Rules:**
- Must be 9-15 digits (after removing + and spaces)
- Must contain only digits (and optional + prefix)
- For Sri Lankan numbers, validates format matches local or international standards

### Request Body (Filling & Packing)
```json
{
  "task": "Package Product Order #12345",
  "description": "Package and prepare order for shipping",
  "phaseId": "filling-packing-phase-uuid",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59Z",
  "assignedUserId": "user-uuid",
  
  // REQUIRED: Filling & Packing specific fields
  "orderNumber": "ORD-2024-001234",
  "customerName": "John Doe",
  "customerMobile": "0771234567",
  "customerAddress": "123 Main Street, Colombo 05, Sri Lanka"
}
```

### Response (Filling & Packing)
```json
{
  "statusCode": 200,
  "data": {
    "id": "task-uuid",
    "taskId": "TASK-1234567890-ABC",
    "phaseId": "filling-packing-phase-uuid",
    "status": "pending",
    "order": 1,
    "task": "Package Product Order #12345",
    "description": "Package and prepare order for shipping",
    "priority": "high",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "assignedUserId": "user-uuid",
    "assignedUser": {
      "id": "user-uuid",
      "userName": "john_doe",
      "email": "john@example.com"
    },
    
    // Filling & Packing specific fields in response
    "orderNumber": "ORD-2024-001234",
    "customerName": "John Doe",
    "customerMobile": "0771234567",
    "customerAddress": "123 Main Street, Colombo 05, Sri Lanka",
    
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Error Responses

### Missing Required Fields (Filling & Packing)
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "orderNumber is required for Filling & Packing phase tasks"
}
```

### Invalid Mobile Number Format
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Mobile number must be between 9 and 15 digits"
}
```

### Invalid Mobile Number (Non-Digit Characters)
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "Mobile number must contain only digits (and optional + prefix)"
}
```

---

## Frontend Implementation Guide

### Step 1: Get Phase List

First, fetch all phases to determine which one is "Filling & Packing":

```javascript
// GET /tasks/phases
const phases = await fetch('/tasks/phases').then(r => r.json());
const fillingPackingPhase = phases.data.find(p => 
  p.name.toLowerCase() === 'filling & packing'
);
```

### Step 2: Conditional Form Rendering

Based on the selected phase, show/hide additional fields:

```javascript
const isFillingAndPackingPhase = selectedPhaseId === fillingPackingPhase?.id;

// Show additional fields only for Filling & Packing
{isFillingAndPackingPhase && (
  <>
    <input 
      name="orderNumber" 
      required 
      placeholder="Order Number (e.g., ORD-2024-001234)"
    />
    <input 
      name="customerName" 
      required 
      placeholder="Customer Name"
    />
    <input 
      name="customerMobile" 
      required 
      type="tel"
      placeholder="Mobile Number (e.g., 0771234567)"
      pattern="[0-9+\\s-]{9,15}"
    />
    <textarea 
      name="customerAddress" 
      required 
      placeholder="Customer Address"
    />
  </>
)}
```

### Step 3: Form Validation

Validate mobile number format before submission:

```javascript
function validateMobileNumber(mobile) {
  const cleaned = mobile.trim().replace(/\s+/g, '');
  const withoutPlus = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
  
  // Check if all digits
  if (!/^\d+$/.test(withoutPlus)) {
    return 'Mobile number must contain only digits';
  }
  
  // Check length
  if (withoutPlus.length < 9 || withoutPlus.length > 15) {
    return 'Mobile number must be between 9 and 15 digits';
  }
  
  return null; // Valid
}

// In form submit handler
const mobileError = validateMobileNumber(formData.customerMobile);
if (mobileError) {
  alert(mobileError);
  return;
}
```

### Step 4: Submit Request

```javascript
const taskData = {
  task: formData.task,
  description: formData.description,
  phaseId: formData.phaseId,
  status: formData.status,
  priority: formData.priority,
  dueDate: formData.dueDate,
  assignedUserId: formData.assignedUserId,
};

// Add Filling & Packing fields only if needed
if (isFillingAndPackingPhase) {
  taskData.orderNumber = formData.orderNumber;
  taskData.customerName = formData.customerName;
  taskData.customerMobile = formData.customerMobile;
  taskData.customerAddress = formData.customerAddress;
}

const response = await fetch('/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(taskData)
});
```

---

## Update Task

### Endpoint
```
PUT /tasks/:taskId
```

### Filling & Packing Fields Update

When updating a task, if it's in the Filling & Packing phase, the same validation applies:

```json
{
  "orderNumber": "ORD-2024-001234",
  "customerName": "John Doe Updated",
  "customerMobile": "0771234567",
  "customerAddress": "Updated Address"
}
```

**Note:** If updating a task to move it TO the Filling & Packing phase, all required fields must be provided.

---

## Complete Example (Filling & Packing)

### Frontend Form Submission

```javascript
const createFillingPackingTask = async (formData) => {
  const taskPayload = {
    task: "Package Product Order #12345",
    description: "Package and prepare order for shipping",
    phaseId: "filling-packing-phase-uuid", // Must be Filling & Packing phase
    status: "pending",
    priority: "high",
    dueDate: "2024-12-31T23:59:59Z",
    assignedUserId: "user-uuid",
    
    // REQUIRED for Filling & Packing phase
    orderNumber: "ORD-2024-001234",
    customerName: "John Doe",
    customerMobile: "0771234567", // Validated for SMS
    customerAddress: "123 Main Street, Colombo 05, Sri Lanka"
  };

  try {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(taskPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Task created:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error creating task:', error.message);
    throw error;
  }
};
```

---

## Summary

| Phase Type | Required Fields | Special Validation |
|------------|----------------|-------------------|
| **R&D, Blending, Dispatch** | Standard task fields | None |
| **Filling & Packing** | Standard fields + `orderNumber`, `customerName`, `customerMobile`, `customerAddress` | Mobile number format validation |

### Key Points

1. ✅ **Phase Detection**: Backend automatically detects phase based on `phaseId`
2. ✅ **Required Fields**: Filling & Packing requires 4 additional fields
3. ✅ **Mobile Validation**: Mobile number is validated for SMS compatibility
4. ✅ **Backward Compatible**: Standard phases work exactly as before
5. ✅ **Error Messages**: Clear error messages guide frontend developers

---

## Testing

### Test Case 1: Standard Phase Task
```bash
curl -X POST http://localhost:3005/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Test Task",
    "phaseId": "rd-phase-uuid",
    "status": "pending"
  }'
```

### Test Case 2: Filling & Packing Task (Success)
```bash
curl -X POST http://localhost:3005/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Package Order",
    "phaseId": "filling-packing-phase-uuid",
    "status": "pending",
    "orderNumber": "ORD-001",
    "customerName": "John Doe",
    "customerMobile": "0771234567",
    "customerAddress": "123 Main St"
  }'
```

### Test Case 3: Filling & Packing Task (Missing Field)
```bash
curl -X POST http://localhost:3005/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Package Order",
    "phaseId": "filling-packing-phase-uuid",
    "status": "pending",
    "orderNumber": "ORD-001",
    "customerName": "John Doe"
    // Missing customerMobile and customerAddress
  }'
```
**Expected Response:** `400 Bad Request - customerMobile is required for Filling & Packing phase tasks`
