# Task Template Management System - API Documentation

## Overview

The Task Template Management System allows users to create flexible, reusable Task Templates that can be dynamically assigned to specific project Phases. This system supports a "Core + Extension" model, where every task has a mandatory set of fields, but can be customized with optional business-specific data points.

## Base URL

```
/api/tasks/templates
```

## Authentication

All endpoints require authentication. Include the authentication token in the request headers.

---

## 1. Get All Templates

Retrieve all task templates in the system.

### Endpoint

```
GET /api/tasks/templates
```

### Request

No request body required.

### Response

**Success (200 OK)**

```json
{
  "is_success": true,
  "data": [
    {
      "id": "uuid-template-id",
      "name": "Standard Production Template",
      "description": "Default template for production tasks",
      "isDefault": false,
      "assignedPhaseId": "uuid-phase-id",
      "mandatoryFields": {
        "taskName": true,
        "taskDescription": true,
        "assignTo": true,
        "priority": true,
        "startDate": true,
        "endDate": true,
        "status": true
      },
      "optionalFields": [
        "orderNumber",
        "customerName",
        "customerAddress",
        "customerContact"
      ],
      "optionalFieldConfig": {
        "orderNumber": {
          "inputType": "text"
        },
        "customerContact": {
          "inputType": "text"
        },
        "costedProduct": {
          "inputType": "select"
        },
        "batchSizeRatio": {
          "inputType": "ratios"
        }
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdBy": "uuid-user-id"
    }
  ],
  "message": "Templates retrieved successfully"
}
```

---

## 2. Get Template by ID

Retrieve a specific template by its ID.

### Endpoint

```
GET /api/tasks/templates/:templateId
```

### Path Parameters

- `templateId` (UUID, required) - The ID of the template to retrieve

### Response

**Success (200 OK)**

```json
{
  "is_success": true,
  "data": {
    "id": "uuid-template-id",
    "name": "Standard Production Template",
    "description": "Default template for production tasks",
    "isDefault": false,
    "assignedPhaseId": "uuid-phase-id",
    "mandatoryFields": {
      "taskName": true,
      "taskDescription": true,
      "assignTo": true,
      "priority": true,
      "startDate": true,
      "endDate": true,
      "status": true
    },
    "optionalFields": ["orderNumber", "customerName"],
    "optionalFieldConfig": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error (404 Not Found)**

```json
{
  "is_success": false,
  "message": "Template not found"
}
```

---

## 3. Get Template by Phase ID

Retrieve the template assigned to a specific phase. If no template is assigned, returns the default template.

### Endpoint

```
GET /api/tasks/templates/by-phase/:phaseId
```

### Path Parameters

- `phaseId` (UUID, required) - The ID of the phase

### Response

**Success (200 OK)**

```json
{
  "is_success": true,
  "data": {
    "id": "uuid-template-id",
    "name": "Filling & Packing Template",
    "description": "Template for filling and packing phase",
    "isDefault": false,
    "assignedPhaseId": "uuid-phase-id",
    "mandatoryFields": {
      "taskName": true,
      "taskDescription": true,
      "assignTo": true,
      "priority": true,
      "startDate": true,
      "endDate": true,
      "status": true
    },
    "optionalFields": ["orderNumber", "customerName", "customerAddress", "customerContact"],
    "optionalFieldConfig": {}
  }
}
```

---

## 4. Get Default Template

Retrieve the default template that is used when no custom template is assigned to a phase.

### Endpoint

```
GET /api/tasks/templates/default
```

### Response

**Success (200 OK)**

```json
{
  "is_success": true,
  "data": {
    "id": "uuid-default-template-id",
    "name": "Default Task Template",
    "description": "Default template for all phases",
    "isDefault": true,
    "assignedPhaseId": null,
    "mandatoryFields": {
      "taskName": true,
      "taskDescription": true,
      "assignTo": true,
      "priority": true,
      "startDate": true,
      "endDate": true,
      "status": true
    },
    "optionalFields": [],
    "optionalFieldConfig": {}
  }
}
```

---

## 5. Create Template

Create a new task template with mandatory and optional fields.

### Endpoint

```
POST /api/tasks/templates
```

### Request Body

```json
{
  "name": "Filling & Packing Template",
  "description": "Template for filling and packing phase with customer details",
  "isDefault": false,
  "assignedPhaseId": "uuid-phase-id",
  "mandatoryFields": {
    "taskName": true,
    "taskDescription": true,
    "assignTo": true,
    "priority": "medium",
    "startDate": true,
    "endDate": true,
    "status": "pending"
  },
  "optionalFields": [
    "orderNumber",
    "customerName",
    "customerAddress",
    "customerContact"
  ],
  "optionalFieldConfig": {
    "orderNumber": {
      "inputType": "text"
    },
    "customerName": {
      "inputType": "text"
    },
    "customerAddress": {
      "inputType": "text"
    },
    "customerContact": {
      "inputType": "text"
    }
  }
}
```

### Field Descriptions

#### Mandatory Fields (Required)

- `mandatoryFields.taskName` (boolean, required) - Task name field (must be `true`)
- `mandatoryFields.taskDescription` (boolean, optional) - Task description
- `mandatoryFields.assignTo` (boolean, required) - Default user assignment (must be `true`)
- `mandatoryFields.priority` (boolean, required) - Priority level (must be `true`)
- `mandatoryFields.startDate` (boolean, required) - Start date (must be `true`)
- `mandatoryFields.endDate` (boolean, required) - End date (must be `true`)
- `mandatoryFields.status` (boolean, required) - Status field (must be `true`)

#### Optional Fields (Selectable)

- `optionalFields` (array) - List of optional field keys to include:
  - `"orderNumber"` - Order Number
  - `"customerName"` - Customer Name
  - `"customerAddress"` - Customer Address
  - `"customerContact"` - Customer Contact
  - `"costedProduct"` - Costed Product
  - `"batchSizeRatio"` - Batch Size Ratio
  - `"courierNumber"` - Courier Number
  - `"courierService"` - Courier Service

- `optionalFieldConfig` (object, required when optionalFields are present) - Configuration for each optional field:
  ```json
  {
    "fieldKey": {
      "inputType": "text|number|select|ratios|check|radio|checkboxGroup"
    }
  }
  ```

#### Input Types

Each optional field must have an `inputType` specified in `optionalFieldConfig`. Available input types:

1. **`text`** - Text Input
   - Single-line text input field
   - Use for: names, addresses, order numbers, tracking numbers

2. **`number`** - Number Input
   - Numeric input field
   - Use for: quantities, amounts, numeric IDs

3. **`select`** - Dropdown/Select
   - Single selection from a dropdown list
   - Use for: product selection, service selection, category selection

4. **`ratios`** - Ratio Selector
   - Special selector for batch size ratios or ratio-based selections
   - Use for: batch size selection, ratio-based configurations

5. **`check`** - Single Checkbox
   - Boolean checkbox (checked/unchecked)
   - Use for: yes/no options, flags, toggles

6. **`radio`** - Radio Button Group
   - Single selection from multiple radio button options
   - Use for: mutually exclusive choices (e.g., priority levels, status options)

7. **`checkboxGroup`** - Checkbox Group
   - Multiple selections from checkbox options
   - Use for: multiple selections (e.g., multiple products, multiple services)

**Example `optionalFieldConfig`:**
```json
{
  "orderNumber": {
    "inputType": "text"
  },
  "customerName": {
    "inputType": "text"
  },
  "costedProduct": {
    "inputType": "select"
  },
  "batchSizeRatio": {
    "inputType": "ratios"
  },
  "courierService": {
    "inputType": "radio"
  }
}
```

#### Template Metadata

- `name` (string, required) - Template name
- `description` (string, optional) - Template description
- `isDefault` (boolean, optional) - Whether this is the default template
- `assignedPhaseId` (UUID, optional) - Phase ID to which this template is assigned. If `null`, template is available as default.

### Response

**Success (201 Created)**

```json
{
  "is_success": true,
  "data": {
    "id": "uuid-new-template-id",
    "name": "Filling & Packing Template",
    "description": "Template for filling and packing phase with customer details",
    "isDefault": false,
    "assignedPhaseId": "uuid-phase-id",
    "mandatoryFields": {
      "taskName": true,
      "taskDescription": true,
      "assignTo": true,
      "priority": true,
      "startDate": true,
      "endDate": true,
      "status": true
    },
    "optionalFields": [
      "orderNumber",
      "customerName",
      "customerAddress",
      "customerContact"
    ],
    "optionalFieldConfig": {
      "orderNumber": {
        "inputType": "text"
      },
      "customerName": {
        "inputType": "text"
      },
      "customerAddress": {
        "inputType": "text"
      },
      "customerContact": {
        "inputType": "text"
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "createdBy": "uuid-user-id"
  },
  "message": "Template created successfully"
}
```

**Error (400 Bad Request)**

```json
{
  "is_success": false,
  "message": "Validation error",
  "errors": {
    "name": "Template name is required",
    "mandatoryFields.taskName": "Task name is required",
    "mandatoryFields.assignTo": "Assign to is required"
  }
}
```

---

## 6. Update Template

Update an existing template.

### Endpoint

```
PUT /api/tasks/templates/:templateId
```

### Path Parameters

- `templateId` (UUID, required) - The ID of the template to update

### Request Body

Same structure as Create Template (all fields optional except those being updated).

### Response

**Success (200 OK)**

```json
{
  "is_success": true,
  "data": {
    "id": "uuid-template-id",
    "name": "Updated Template Name",
    "description": "Updated description",
    "isDefault": false,
    "assignedPhaseId": "uuid-phase-id",
    "mandatoryFields": {
      "taskName": true,
      "taskDescription": true,
      "assignTo": true,
      "priority": true,
      "startDate": true,
      "endDate": true,
      "status": true
    },
    "optionalFields": ["orderNumber", "customerName"],
    "optionalFieldConfig": {},
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Template updated successfully"
}
```

---

## 7. Delete Template

Delete a template. Cannot delete the default template.

### Endpoint

```
DELETE /api/tasks/templates/:templateId
```

### Path Parameters

- `templateId` (UUID, required) - The ID of the template to delete

### Response

**Success (200 OK)**

```json
{
  "is_success": true,
  "message": "Template deleted successfully"
}
```

**Error (400 Bad Request)**

```json
{
  "is_success": false,
  "message": "Cannot delete default template"
}
```

**Error (404 Not Found)**

```json
{
  "is_success": false,
  "message": "Template not found"
}
```

---

## 8. Get All Phases (Master Data)

Retrieve all available phases for template assignment.

### Endpoint

```
GET /api/tasks/phases
```

### Response

**Success (200 OK)**

```json
{
  "is_success": true,
  "data": [
    {
      "id": "uuid-phase-id",
      "name": "Filling and Packing",
      "description": "Filling, packing and fulfillment tasks",
      "color": "#52c41a",
      "order": 1,
      "statuses": ["pending", "ongoing", "review", "completed", "failed"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Logic Flow

### Template Resolution at Runtime

When creating a task in a phase:

1. **Check Phase Assignment**: Look for template with `assignedPhaseId` matching the phase ID
2. **Fallback to Default**: If no custom template found, use template with `isDefault: true`
3. **Render Form**: Display form fields based on template configuration:
   - All mandatory fields (always shown)
   - Selected optional fields (shown if in `optionalFields` array)
   - Each optional field is rendered using the `inputType` specified in `optionalFieldConfig`

### Example Scenario

**Phase: "Filling and Packing" (ID: `phase-123`)**

1. System checks for template with `assignedPhaseId = "phase-123"`
2. If found, uses that template
3. If not found, uses default template (`isDefault: true`)
4. Form renders with:
   - **Mandatory fields**: Task Name (text input), Description (text area), Assign To (user selector), Priority (dropdown), Start Date (date picker), End Date (date picker), Status (dropdown)
   - **Optional fields** (if in template): 
     - Order Number (rendered as `text` input based on `optionalFieldConfig.orderNumber.inputType`)
     - Customer Name (rendered as `text` input)
     - Customer Address (rendered as `text` input)
     - Customer Contact (rendered as `text` input)
     - Costed Product (rendered as `select` dropdown)
     - Courier Service (rendered as `radio` button group)

**Example Template Response:**
```json
{
  "id": "template-uuid-123",
  "name": "Filling & Packing Template",
  "assignedPhaseId": "phase-123",
  "mandatoryFields": {
    "taskName": true,
    "taskDescription": true,
    "assignTo": true,
    "priority": true,
    "startDate": true,
    "endDate": true,
    "status": true
  },
  "optionalFields": [
    "orderNumber",
    "customerName",
    "customerAddress",
    "customerContact",
    "costedProduct",
    "courierService"
  ],
  "optionalFieldConfig": {
    "orderNumber": { "inputType": "text" },
    "customerName": { "inputType": "text" },
    "customerAddress": { "inputType": "text" },
    "customerContact": { "inputType": "text" },
    "costedProduct": { "inputType": "select" },
    "courierService": { "inputType": "radio" }
  }
}
```

---

## Database Schema

### Template Table

```sql
CREATE TABLE `task_templates` (
    `id` CHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_default` BOOLEAN DEFAULT FALSE,
    `assigned_phase_id` CHAR(36) NULL,
    `mandatory_fields` JSON NOT NULL,
    `optional_fields` JSON DEFAULT '[]',
    `optional_field_config` JSON DEFAULT '{}',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` CHAR(36) NULL,
    CONSTRAINT `fk_template_phase` FOREIGN KEY (`assigned_phase_id`) REFERENCES `task_phases` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_template_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_template_phase` (`assigned_phase_id`),
    INDEX `idx_template_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### JSONB Structure Examples

#### mandatoryFields Structure
```json
{
  "taskName": true,
  "taskDescription": true,
  "assignTo": true,
  "priority": true,
  "startDate": true,
  "endDate": true,
  "status": true
}
```
All mandatory fields are boolean `true` values indicating they are always included in the form.

#### optionalFields Structure
```json
["orderNumber", "customerName", "customerAddress", "customerContact"]
```
Array of field keys that should be included in the form.

#### optionalFieldConfig Structure
```json
{
  "orderNumber": {
    "inputType": "text"
  },
  "customerName": {
    "inputType": "text"
  },
  "costedProduct": {
    "inputType": "select"
  },
  "batchSizeRatio": {
    "inputType": "ratios"
  },
  "courierService": {
    "inputType": "radio"
  },
  "someCheckboxField": {
    "inputType": "check"
  },
  "multipleServices": {
    "inputType": "checkboxGroup"
  }
}
```

Each field in `optionalFieldConfig` must have an `inputType` property with one of the following values:
- `"text"` - Text Input
- `"number"` - Number Input
- `"select"` - Dropdown/Select
- `"ratios"` - Ratio Selector
- `"check"` - Single Checkbox
- `"radio"` - Radio Button Group
- `"checkboxGroup"` - Checkbox Group

**Important**: When a field is included in `optionalFields`, it MUST have a corresponding entry in `optionalFieldConfig` with a valid `inputType`.

---

## Error Codes

| HTTP Status | Error Code | Description |
|------------|-----------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 400 | CANNOT_DELETE_DEFAULT | Cannot delete default template |
| 401 | UNAUTHORIZED | Authentication required |
| 404 | TEMPLATE_NOT_FOUND | Template not found |
| 404 | PHASE_NOT_FOUND | Phase not found |
| 409 | DUPLICATE_DEFAULT | Default template already exists |
| 500 | INTERNAL_ERROR | Internal server error |

---

## Notes

1. **Default Template**: Only one template can have `isDefault: true` at a time. Setting a new template as default will unset the previous default.

2. **Phase Association**: A template can be assigned to only one phase. If `assignedPhaseId` is set, the template is specific to that phase.

3. **Optional Fields**: The `optionalFields` array determines which optional fields are shown in the task creation form when using this template. Each optional field must have a corresponding entry in `optionalFieldConfig` with an `inputType` specified.

4. **Input Types**: The `inputType` in `optionalFieldConfig` determines how the field is rendered in the task creation form:
   - `text` - Renders as a text input
   - `number` - Renders as a number input
   - `select` - Renders as a dropdown/select
   - `ratios` - Renders as a ratio selector
   - `check` - Renders as a single checkbox
   - `radio` - Renders as a radio button group
   - `checkboxGroup` - Renders as a checkbox group

5. **Mandatory Fields**: All mandatory fields are always required and cannot be disabled. They are represented as boolean `true` values in `mandatoryFields`.

6. **Template Updates**: When updating a template, only provided fields are updated. Omitted fields remain unchanged.

7. **Validation**: When creating or updating a template:
   - If `optionalFields` array contains field keys, each field must have a corresponding entry in `optionalFieldConfig` with an `inputType`
   - The `inputType` must be one of the valid types: `text`, `number`, `select`, `ratios`, `check`, `radio`, or `checkboxGroup`

---

## Migration

Run the migration SQL file to create the table and initial templates:

```bash
# Run the migration
mysql -u your_user -p your_database < docs/migrations/create_task_templates_table.sql
```

Or execute the SQL directly in your database management tool.

---

**Last Updated:** December 2024  
**Version:** 1.0
