# Task Creation Scenarios Documentation

## Overview

This document explains the different task creation scenarios and flows in the Task Management system. The system supports **4 phases** with **different requirements** for task creation.

## Task Phases

The system has 4 predefined phases (seeded automatically on startup):

1. **R&D** - Research and Development phase
2. **Blending** - Blending phase
3. **Filling & Packing** - Filling and Packing phase ⚠️ **Special Requirements**
4. **Dispatch** - Dispatch phase

---

## Scenario 1: Standard Task Creation (R&D, Blending, Dispatch)

### Use Case
Creating tasks in R&D, Blending, or Dispatch phases follows the standard task creation flow.

### Fields Required

**Required:**
- `task` (string) - Task title/name
- `phaseId` (string) - UUID of the phase
- `status` (enum) - Task status (pending, ongoing, review, completed, failed)

**Optional:**
- `description` (string) - Task description
- `priority` (enum) - Task priority (low, medium, high, urgent)
- `dueDate` (datetime) - Task due date
- `assignedUserId` (string) - User UUID to assign the task to
- `costingId` (string) - Costing UUID (links to costed product)
- `batchSize` (string) - Batch size (e.g., "batch10kg")
- `rawMaterials` (array) - Raw materials array
- `order` (number) - Display order (auto-generated if not provided)
- `taskId` (string) - Custom task ID (auto-generated if not provided)

### Example Flow

```
1. User selects "R&D" phase
2. User fills in standard task form:
   - Task Title: "Develop new formula"
   - Description: "Research and develop new product formula"
   - Priority: "High"
   - Due Date: "2024-12-31"
   - Assign To: "John Doe"
3. User clicks "Create Task"
4. Backend validates standard fields
5. Task created successfully
```

### API Request
```json
POST /tasks
{
  "task": "Develop new formula",
  "description": "Research and develop new product formula",
  "phaseId": "rd-phase-uuid",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59Z",
  "assignedUserId": "user-uuid"
}
```

---

## Scenario 2: Filling & Packing Task Creation (Special Requirements)

### Use Case
Creating tasks in the **Filling & Packing** phase requires additional customer information for order processing and SMS notifications.

### Fields Required

**Standard Fields (Same as Scenario 1):**
- `task` (string) - Task title/name
- `phaseId` (string) - UUID of the Filling & Packing phase
- `status` (enum) - Task status

**Additional REQUIRED Fields:**
- `orderNumber` (string) - Order number/ID
- `customerName` (string) - Customer's full name
- `customerMobile` (string) - Customer's mobile number (**validated for SMS**)
- `customerAddress` (string) - Customer's delivery address

**Optional (Same as Scenario 1):**
- `description`, `priority`, `dueDate`, `assignedUserId`, etc.

### Mobile Number Validation

The `customerMobile` field is **strictly validated** to ensure it can be used for SMS sending:

**Validation Rules:**
1. Must be 9-15 digits (after removing + and spaces)
2. Must contain only digits (and optional + prefix)
3. Sri Lankan format validation:
   - Local: `07XXXXXXXX` (10 digits starting with 0)
   - International: `947XXXXXXXXX` (12 digits starting with 94)
4. International format accepted (country code + number)

**Valid Examples:**
- `0771234567` ✅
- `+94771234567` ✅
- `94771234567` ✅
- `771234567` ✅
- `+1-555-123-4567` ✅ (international)

**Invalid Examples:**
- `abc123` ❌ (contains letters)
- `12345` ❌ (too short)
- `12345678901234567` ❌ (too long)
- `077-123-4567` ❌ (contains dashes - will be rejected)

### Example Flow

```
1. User selects "Filling & Packing" phase
2. Backend/UI detects special phase and shows extended form
3. User fills in standard task fields:
   - Task Title: "Package Product Order #12345"
   - Description: "Package and prepare order for shipping"
   - Priority: "High"
   - Due Date: "2024-12-31"
   - Assign To: "John Doe"
4. User fills in REQUIRED Filling & Packing fields:
   - Order Number: "ORD-2024-001234"
   - Customer Name: "John Doe"
   - Customer Mobile: "0771234567" (validated)
   - Customer Address: "123 Main Street, Colombo 05"
5. User clicks "Create Task"
6. Backend validates:
   - Standard fields ✓
   - Order number present ✓
   - Customer name present ✓
   - Mobile number format valid ✓
   - Customer address present ✓
7. Task created successfully with all customer information
```

### API Request
```json
POST /tasks
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

---

## Scenario 3: Task Update to Filling & Packing Phase

### Use Case
Updating an existing task to move it to the Filling & Packing phase requires providing all the required fields.

### Flow

```
1. User has a task in "R&D" phase
2. User wants to move it to "Filling & Packing"
3. User selects new phase: "Filling & Packing"
4. UI shows required fields that need to be filled:
   - Order Number
   - Customer Name
   - Customer Mobile
   - Customer Address
5. User fills in the required fields
6. User clicks "Update Task"
7. Backend validates all required fields are present
8. Task updated and moved to Filling & Packing phase
```

### API Request
```json
PUT /tasks/TASK-1234567890-ABC
{
  "phaseId": "filling-packing-phase-uuid",
  "orderNumber": "ORD-2024-001234",
  "customerName": "John Doe",
  "customerMobile": "0771234567",
  "customerAddress": "123 Main Street, Colombo 05"
}
```

**Error if Missing Fields:**
```json
{
  "statusCode": 400,
  "message": "orderNumber is required for Filling & Packing phase tasks"
}
```

---

## Scenario 4: Error Handling

### Missing Required Field (Filling & Packing)

**Request:**
```json
POST /tasks
{
  "task": "Package Order",
  "phaseId": "filling-packing-phase-uuid",
  "status": "pending",
  "orderNumber": "ORD-001",
  "customerName": "John Doe"
  // Missing: customerMobile and customerAddress
}
```

**Response:**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/tasks",
  "method": "POST",
  "message": "customerMobile is required for Filling & Packing phase tasks"
}
```

### Invalid Mobile Number Format

**Request:**
```json
POST /tasks
{
  "task": "Package Order",
  "phaseId": "filling-packing-phase-uuid",
  "status": "pending",
  "orderNumber": "ORD-001",
  "customerName": "John Doe",
  "customerMobile": "abc123", // Invalid format
  "customerAddress": "123 Main St"
}
```

**Response:**
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

## Frontend Implementation Recommendations

### 1. Phase Detection

```javascript
// Fetch phases on component mount
const [phases, setPhases] = useState([]);
const [selectedPhaseId, setSelectedPhaseId] = useState(null);

useEffect(() => {
  fetch('/tasks/phases')
    .then(r => r.json())
    .then(data => {
      setPhases(data.data);
      const fillingPackingPhase = data.data.find(
        p => p.name.toLowerCase() === 'filling & packing'
      );
      // Store phase ID for comparison
    });
}, []);
```

### 2. Conditional Field Rendering

```javascript
const isFillingAndPackingPhase = selectedPhaseId === fillingPackingPhaseId;

return (
  <form>
    {/* Standard fields - always shown */}
    <input name="task" required />
    <select name="phaseId" onChange={handlePhaseChange} required>
      {phases.map(phase => (
        <option key={phase.id} value={phase.id}>{phase.name}</option>
      ))}
    </select>
    
    {/* Conditional fields - only for Filling & Packing */}
    {isFillingAndPackingPhase && (
      <div className="filling-packing-fields">
        <h3>Order & Customer Information</h3>
        <input 
          name="orderNumber" 
          required 
          placeholder="Order Number"
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
          placeholder="Mobile Number"
          onChange={validateMobile}
        />
        <textarea 
          name="customerAddress" 
          required 
          placeholder="Customer Address"
        />
      </div>
    )}
  </form>
);
```

### 3. Mobile Number Validation (Client-Side)

```javascript
const validateMobileNumber = (mobile) => {
  const cleaned = mobile.trim().replace(/\s+/g, '');
  const withoutPlus = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
  
  if (!/^\d+$/.test(withoutPlus)) {
    return 'Mobile number must contain only digits';
  }
  
  if (withoutPlus.length < 9 || withoutPlus.length > 15) {
    return 'Mobile number must be between 9 and 15 digits';
  }
  
  return null; // Valid
};
```

---

## Summary Table

| Phase | Special Fields Required | Mobile Validation | Use Case |
|-------|------------------------|-------------------|----------|
| **R&D** | None | No | Research and development tasks |
| **Blending** | None | No | Product blending tasks |
| **Filling & Packing** | orderNumber, customerName, customerMobile, customerAddress | **Yes** | Order packaging with customer details |
| **Dispatch** | None | No | Order dispatch tasks |

---

## Key Points for Frontend Team

1. ✅ **Phase-Based Forms**: Show different forms based on selected phase
2. ✅ **Validation**: Validate mobile number format before submission
3. ✅ **Error Handling**: Handle specific error messages for missing fields
4. ✅ **User Experience**: Clear indication of required fields for Filling & Packing phase
5. ✅ **Update Flow**: When moving task to Filling & Packing, require all fields

---

## Migration Notes

- **Backward Compatible**: Existing tasks in other phases are unaffected
- **No Breaking Changes**: Standard task creation flow remains the same
- **Optional Fields**: Filling & Packing fields are optional in the interface but required when phase is Filling & Packing
- **Database Schema**: New columns added to support Filling & Packing fields (nullable for other phases)
