# Complaint Management API Documentation

## Overview

The Complaint Management API provides comprehensive functionality for managing customer complaints, including employee assignment, status tracking, and timeline management. Employees can be assigned to complaints and update their status throughout the complaint lifecycle.

## Table of Contents

1. [Status Workflow](#status-workflow)
2. [API Endpoints](#api-endpoints)
3. [Status Transition Rules](#status-transition-rules)
4. [Scenarios](#scenarios)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)

---

## Status Workflow

The complaint lifecycle follows this workflow:

```
RECEIVED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
              ↓            ↓              ↓
           REJECTED    ON_HOLD    AWAITING_CUSTOMER
              ↓            ↓              ↓
           RECEIVED    IN_PROGRESS    RESOLVED
```

### Status Descriptions

| Status | Description | Who Can Set | Notes |
|--------|-------------|-------------|-------|
| **RECEIVED** | Complaint received, not yet assigned | Admin/Manager | Initial state if not immediately assigned |
| **ASSIGNED** | Allocated to a staff member | Admin/Manager | Default status when complaint is created with assigned employee |
| **IN_PROGRESS** | Currently being worked on | Employee/Manager/Admin | Active work state |
| **ON_HOLD** | Paused/Waiting for internal resources | Employee/Manager/Admin | Temporarily stopped |
| **AWAITING_CUSTOMER** | Waiting for user reply | Employee/Manager/Admin | Waiting for customer response |
| **RESOLVED** | Fix provided | Employee/Manager/Admin | Solution implemented |
| **CLOSED** | Confirmed and archived | Employee/Manager/Admin | Final state |
| **REJECTED** | Invalid or policy violation | Manager/Admin | Complaint deemed invalid |

---

## API Endpoints

### Base URL
```
/complaints
```

All endpoints require JWT authentication.

---

### 1. Create Complaint

**POST** `/complaints`

Creates a new complaint and assigns it to an employee.

**Required Roles:** ADMIN, MANAGER, USER

**Request Body:**
```json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "customerPhone": "0771234567",
  "customerCompany": "ABC Company",
  "headline": "Product quality issue",
  "description": "Received damaged product in delivery",
  "category": "PRODUCT_QUALITY",
  "priority": "HIGH",
  "assignedToId": "550e8400-e29b-41d4-a716-446655440000",
  "targetResolutionDate": "2024-12-31T23:59:59.000Z"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerEmail` | string | Yes | Customer's email address |
| `customerName` | string | Yes | Customer's full name |
| `customerPhone` | string | Yes | Customer's phone number |
| `customerCompany` | string | No | Customer's company name |
| `headline` | string | Yes | Brief complaint title |
| `description` | string | Yes | Detailed description |
| `category` | enum | Yes | See [Categories](#categories) |
| `priority` | enum | No | LOW, MEDIUM, HIGH, CRITICAL (default: MEDIUM) |
| `assignedToId` | UUID | **Yes** | Employee UUID who will manage the complaint |
| `targetResolutionDate` | DateTime | Yes | Expected resolution date |

**Categories:**
- `PRODUCT_QUALITY`
- `DELIVERY_ISSUE`
- `BILLING`
- `TECHNICAL`
- `SERVICE`
- `OTHER`

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "complaintNumber": "COMP-2025-001",
  "customer": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "sNo": "CUST-001",
    "name": "John Doe",
    "email": "customer@example.com",
    "phone": "0771234567",
    "branchName": "ABC Company",
    "cityArea": "Colombo",
    "salesGroup": "General",
    "customerType": "INDIVIDUAL"
  },
  "headline": "Product quality issue",
  "description": "Received damaged product in delivery",
  "category": "PRODUCT_QUALITY",
  "priority": "HIGH",
  "status": "ASSIGNED",
  "assignedTo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "employee@company.com",
    "username": "john.smith"
  },
  "targetResolutionDate": "2024-12-31T23:59:59.000Z",
  "actualResolutionDate": null,
  "closedAt": null,
  "clientFeedback": null,
  "feedbackRating": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "timelineEntries": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "entryType": "STATUS_CHANGE",
      "description": "Complaint created and assigned to john.smith",
      "createdBy": {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "email": "manager@company.com",
        "username": "manager.user"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Behavior:**
- If customer doesn't exist, a new customer record is created automatically
- Complaint number is auto-generated (format: `COMP-YYYY-XXX`)
- Initial status is set to `ASSIGNED` since employee is required
- Timeline entry is created for the assignment

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid data
- `404 Not Found`: Assigned employee not found
- `401 Unauthorized`: Invalid or missing JWT token

---

### 2. Get All Complaints

**GET** `/complaints`

Retrieves a paginated list of complaints with filtering options.

**Required Roles:** ADMIN, MANAGER, USER

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in headline | `?search=product` |
| `status` | array | Filter by status(es) | `?status=ASSIGNED&status=IN_PROGRESS` |
| `priority` | array | Filter by priority(es) | `?priority=HIGH&priority=CRITICAL` |
| `category` | array | Filter by category(ies) | `?category=PRODUCT_QUALITY` |
| `assignedTo` | UUID | Filter by assigned employee | `?assignedTo=550e8400-e29b-41d4-a716-446655440000` |
| `customerId` | UUID | Filter by customer | `?customerId=770e8400-e29b-41d4-a716-446655440002` |
| `startDate` | date | Filter from date | `?startDate=2024-01-01` |
| `endDate` | date | Filter to date | `?endDate=2024-12-31` |
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Items per page (default: 10, max: 100) | `?limit=20` |

**Example Request:**
```
GET /complaints?status=ASSIGNED&status=IN_PROGRESS&priority=HIGH&page=1&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "complaintNumber": "COMP-2025-001",
      "customer": { ... },
      "headline": "Product quality issue",
      "status": "ASSIGNED",
      "priority": "HIGH",
      "assignedTo": { ... },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 3. Get Complaint by ID

**GET** `/complaints/:id`

Retrieves a specific complaint with full details including timeline.

**Required Roles:** ADMIN, MANAGER, USER

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "complaintNumber": "COMP-2025-001",
  "customer": { ... },
  "headline": "Product quality issue",
  "description": "Received damaged product in delivery",
  "category": "PRODUCT_QUALITY",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "assignedTo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "employee@company.com",
    "username": "john.smith"
  },
  "targetResolutionDate": "2024-12-31T23:59:59.000Z",
  "actualResolutionDate": null,
  "closedAt": null,
  "timelineEntries": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "entryType": "STATUS_CHANGE",
      "description": "Complaint created and assigned to john.smith",
      "createdBy": { ... },
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "entryType": "STATUS_CHANGE",
      "description": "Status changed from ASSIGNED to IN_PROGRESS",
      "createdBy": { ... },
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### 4. Update Complaint

**PUT** `/complaints/:id`

Updates complaint details (excluding status - use status endpoint for that).

**Required Roles:** ADMIN, MANAGER

**Request Body:**
```json
{
  "headline": "Updated headline",
  "description": "Updated description",
  "category": "DELIVERY_ISSUE",
  "priority": "CRITICAL",
  "assignedToId": "550e8400-e29b-41d4-a716-446655440000",
  "targetResolutionDate": "2024-12-25T23:59:59.000Z"
}
```

All fields are optional. Only provided fields will be updated.

**Note:** To update status, use the dedicated status endpoint.

---

### 5. Update Complaint Status

**PUT** `/complaints/:id/status`

Updates the status of a complaint with validation and timeline tracking.

**Required Roles:** ADMIN, MANAGER, USER

**Permission Rules:**
- **ADMIN/MANAGER**: Can update status of any complaint
- **USER**: Can only update status of complaints assigned to them

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "note": "Started investigating the issue"
}
```

**Status Field Values:**
- `RECEIVED`
- `ASSIGNED`
- `IN_PROGRESS`
- `ON_HOLD`
- `AWAITING_CUSTOMER`
- `RESOLVED`
- `CLOSED`
- `REJECTED`

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "complaintNumber": "COMP-2025-001",
  "status": "IN_PROGRESS",
  "assignedTo": { ... },
  "timelineEntries": [
    {
      "entryType": "STATUS_CHANGE",
      "description": "Status changed from ASSIGNED to IN_PROGRESS",
      "createdAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "entryType": "NOTE_ADDED",
      "description": "Started investigating the issue",
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Automatic Actions:**
- When status changes to `RESOLVED`, `actualResolutionDate` is set automatically
- When status changes to `CLOSED`, `closedAt` is set automatically
- Timeline entry is created for status change
- If note is provided, additional timeline entry is created

**Error Responses:**
- `400 Bad Request`: Invalid status transition
- `400 Bad Request`: USER trying to update non-assigned complaint
- `404 Not Found`: Complaint not found

---

### 6. Add Note to Complaint

**POST** `/complaints/:id/notes`

Adds a note/timeline entry to a complaint.

**Required Roles:** ADMIN, MANAGER, USER

**Request Body:**
```json
{
  "note": "Customer confirmed receipt of replacement product"
}
```

**Response:**
Returns updated complaint with new timeline entry.

---

### 7. Submit Customer Feedback

**POST** `/complaints/:id/feedback`

Submits customer feedback and rating, automatically closing the complaint.

**Required Roles:** ADMIN, MANAGER, USER

**Request Body:**
```json
{
  "feedback": "Issue resolved satisfactorily",
  "rating": 5
}
```

**Response:**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "CLOSED",
  "clientFeedback": "Issue resolved satisfactorily",
  "feedbackRating": 5,
  "closedAt": "2024-01-20T14:30:00.000Z",
  "timelineEntries": [
    {
      "entryType": "NOTE_ADDED",
      "description": "Customer feedback received: Rating 5/5",
      "createdAt": "2024-01-20T14:30:00.000Z"
    }
  ]
}
```

---

## Status Transition Rules

### Valid Transitions

| From Status | To Status(es) | Notes |
|-------------|---------------|-------|
| **RECEIVED** | ASSIGNED, REJECTED | Initial state transitions |
| **ASSIGNED** | IN_PROGRESS, ON_HOLD, REJECTED | Start working or pause |
| **IN_PROGRESS** | ON_HOLD, AWAITING_CUSTOMER, RESOLVED, REJECTED | Active work states |
| **ON_HOLD** | IN_PROGRESS, AWAITING_CUSTOMER, REJECTED | Resume work |
| **AWAITING_CUSTOMER** | IN_PROGRESS, RESOLVED, REJECTED | Continue after customer response |
| **RESOLVED** | CLOSED, AWAITING_CUSTOMER | Finalize or reopen for feedback |
| **CLOSED** | RECEIVED | Reopen complaint |
| **REJECTED** | RECEIVED | Reopen rejected complaint |

### Invalid Transition Examples

❌ `RECEIVED` → `IN_PROGRESS` (must be ASSIGNED first)
❌ `ASSIGNED` → `RESOLVED` (must go through IN_PROGRESS)
❌ `CLOSED` → `IN_PROGRESS` (can only reopen to RECEIVED)
❌ `RESOLVED` → `ON_HOLD` (invalid from resolved state)

---

## Scenarios

### Scenario 1: Creating and Processing a New Complaint

**Actor:** Manager

1. **Create Complaint**
   ```
   POST /complaints
   {
     "customerEmail": "john@example.com",
     "customerName": "John Doe",
     "customerPhone": "0771234567",
     "headline": "Damaged package",
     "description": "Received package with visible damage",
     "category": "DELIVERY_ISSUE",
     "priority": "HIGH",
     "assignedToId": "employee-uuid",
     "targetResolutionDate": "2024-12-31"
   }
   ```
   - Status: `ASSIGNED`
   - Timeline: "Complaint created and assigned to [employee]"

2. **Employee Updates Status to IN_PROGRESS**
   ```
   PUT /complaints/:id/status
   {
     "status": "IN_PROGRESS",
     "note": "Contacting courier service for investigation"
   }
   ```
   - Status: `ASSIGNED` → `IN_PROGRESS`
   - Timeline: Status change + note added

3. **Employee Puts on Hold (Waiting for Information)**
   ```
   PUT /complaints/:id/status
   {
     "status": "ON_HOLD",
     "note": "Waiting for courier service to provide tracking details"
   }
   ```
   - Status: `IN_PROGRESS` → `ON_HOLD`

4. **Resume Work**
   ```
   PUT /complaints/:id/status
   {
     "status": "IN_PROGRESS",
     "note": "Received tracking information, proceeding with investigation"
   }
   ```
   - Status: `ON_HOLD` → `IN_PROGRESS`

5. **Mark as Resolved**
   ```
   PUT /complaints/:id/status
   {
     "status": "RESOLVED",
     "note": "Replacement package dispatched. Customer notified."
   }
   ```
   - Status: `IN_PROGRESS` → `RESOLVED`
   - `actualResolutionDate` set automatically

6. **Close Complaint**
   ```
   PUT /complaints/:id/status
   {
     "status": "CLOSED"
   }
   ```
   - Status: `RESOLVED` → `CLOSED`
   - `closedAt` set automatically

---

### Scenario 2: Employee Updates Their Assigned Complaint

**Actor:** Employee (USER role)

**Prerequisites:**
- Complaint is assigned to this employee
- Employee is logged in

**Update Status:**
```
PUT /complaints/:id/status
Authorization: Bearer [employee-jwt-token]
{
  "status": "AWAITING_CUSTOMER",
  "note": "Sent email to customer requesting additional photos"
}
```

**Success Response:**
- Status updated to `AWAITING_CUSTOMER`
- Timeline entry created

**If Employee Tries to Update Another Employee's Complaint:**
```
PUT /complaints/:id/status (complaint assigned to different employee)
Authorization: Bearer [employee-jwt-token]
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "You can only update status of complaints assigned to you",
  "error": "Bad Request"
}
```

---

### Scenario 3: Rejecting an Invalid Complaint

**Actor:** Manager

**Reject Complaint:**
```
PUT /complaints/:id/status
{
  "status": "REJECTED",
  "note": "Complaint does not meet policy requirements. Customer was using product outside warranty period."
}
```

- Status: Current → `REJECTED`
- Timeline entry created with rejection reason

**Reopen Rejected Complaint:**
```
PUT /complaints/:id/status
{
  "status": "RECEIVED",
  "note": "Reviewing rejection decision based on new evidence"
}
```

- Status: `REJECTED` → `RECEIVED`
- Complaint can now be reassigned

---

### Scenario 4: Customer Feedback Workflow

**Actor:** Employee

**After Resolution:**
```
PUT /complaints/:id/status
{
  "status": "RESOLVED",
  "note": "Solution implemented. Waiting for customer confirmation."
}
```

**Customer Submits Feedback:**
```
POST /complaints/:id/feedback
{
  "feedback": "Great service, issue resolved quickly",
  "rating": 5
}
```

- Status automatically changes to `CLOSED`
- `clientFeedback` and `feedbackRating` saved
- `closedAt` set automatically
- Timeline entry: "Customer feedback received: Rating 5/5"

---

### Scenario 5: Reassigning Complaint to Different Employee

**Actor:** Manager

**Update Assignment:**
```
PUT /complaints/:id
{
  "assignedToId": "new-employee-uuid"
}
```

- Employee assignment updated
- Status remains the same (e.g., `IN_PROGRESS`)
- No automatic timeline entry (can add note manually)

**Note:** Consider adding timeline entry:
```
POST /complaints/:id/notes
{
  "note": "Complaint reassigned from [old employee] to [new employee]"
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid status transition from ASSIGNED to RESOLVED",
  "error": "Bad Request"
}
```

**400 Bad Request - Missing Required Field:**
```json
{
  "statusCode": 400,
  "message": ["assignedToId should not be empty"],
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Complaint with ID [id] not found",
  "error": "Not Found"
}
```

**404 Not Found - Employee:**
```json
{
  "statusCode": 404,
  "message": "Employee with ID [id] not found",
  "error": "Not Found"
}
```

---

## Best Practices

### 1. Status Updates
- Always provide a note when changing status
- Update status promptly as work progresses
- Use `AWAITING_CUSTOMER` when waiting for customer response
- Use `ON_HOLD` when waiting for internal resources

### 2. Assignment
- Assign complaints to appropriate employees based on expertise
- Ensure employee is available before assignment
- Update assignment if employee is unavailable

### 3. Timeline Entries
- Add notes at key decision points
- Document customer communications
- Record internal discussions that affect resolution

### 4. Priority Management
- Set priority accurately during creation
- Update priority if issue escalates
- High/Critical priorities should be assigned to experienced staff

### 5. Resolution Tracking
- Set realistic target resolution dates
- Update target date if needed
- Close complaints promptly after resolution

---

## Testing Examples

### Test Case 1: Complete Complaint Lifecycle
```bash
# 1. Create complaint
POST /complaints
Body: { "assignedToId": "...", ... }

# 2. Employee updates to IN_PROGRESS
PUT /complaints/:id/status
Body: { "status": "IN_PROGRESS", "note": "Starting investigation" }

# 3. Put on hold
PUT /complaints/:id/status
Body: { "status": "ON_HOLD", "note": "Waiting for information" }

# 4. Resume
PUT /complaints/:id/status
Body: { "status": "IN_PROGRESS", "note": "Resuming work" }

# 5. Resolve
PUT /complaints/:id/status
Body: { "status": "RESOLVED", "note": "Issue fixed" }

# 6. Close
PUT /complaints/:id/status
Body: { "status": "CLOSED" }
```

### Test Case 2: Invalid Status Transition
```bash
# Try invalid transition
PUT /complaints/:id/status
Body: { "status": "RESOLVED" }
# Current status: ASSIGNED
# Expected: 400 Bad Request - Invalid transition
```

### Test Case 3: Employee Permission Check
```bash
# Employee tries to update another employee's complaint
PUT /complaints/:id/status
Authorization: Bearer [employee-token]
# Complaint assigned to different employee
# Expected: 400 Bad Request - Can only update own complaints
```

---

## Migration Notes

If upgrading from the old system:

1. **Legacy Status Mapping:**
   - `OPEN` → Maps to `RECEIVED`
   - `AWAITING_FEEDBACK` → Maps to `AWAITING_CUSTOMER`
   - `REOPENED` → Maps to `RECEIVED`

2. **Required Field:**
   - All existing complaints must have `assignedToId`
   - Migration script should assign to system admin if missing

3. **Status Updates:**
   - Update existing `OPEN` statuses to `RECEIVED` or `ASSIGNED`
   - Update existing `AWAITING_FEEDBACK` to `AWAITING_CUSTOMER`

---

## Support

For questions or issues:
- Check server logs for detailed error messages
- Review timeline entries for complaint history
- Contact system administrator for permission issues

