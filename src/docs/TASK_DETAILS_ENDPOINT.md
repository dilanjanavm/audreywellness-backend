# Task Details Endpoint Documentation

## Endpoint

```
GET /tasks/:taskId/details
```

## Description

Returns comprehensive task details including task information, recipe, costed product, recipe execution status, comments, and phases. This endpoint is specifically designed for the frontend task detail page.

## Authentication

Requires JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Path Parameters

- `taskId` (string, required) - The task ID (can be UUID or taskId string like "TASK-123")

## Response Structure

```json
{
  "statusCode": 200,
  "data": {
    "task": {
      // Complete task object
    },
    "recipe": {
      // Active recipe object (if available)
    },
    "costedProduct": {
      // Costed product information (if available)
    },
    "recipeExecution": {
      // Recipe execution status (if available)
    },
    "comments": [
      // Array of comments
    ],
    "phases": [
      // Array of all phases
    ]
  }
}
```

## Response Fields

### `task` Object

Complete task object with all fields including:
- `id` - Task UUID
- `taskId` - Task identifier string (e.g., "TASK-1766432275840-5LNZ9O84E")
- `phaseId` - Phase UUID
- `status` - Task status
- `order` - Order index
- `task` - Task title
- `description` - Task description
- `priority` - Task priority
- `dueDate` - Due date
- `assignee` - Legacy assignee object
- `assignedUserId` - Assigned user UUID
- `assignedUser` - Assigned user object
- `costingId` - Costing UUID
- `costing` - Costing summary object
- `batchSize` - Batch size string
- `rawMaterials` - Array of raw materials
- `comments` - Comment count
- `commentList` - Empty array (for frontend compatibility)
- `views` - View count
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp
- `updatedBy` - Updated by user ID

### `recipe` Object (Optional)

Active recipe associated with the task's costed product:
- `id` - Recipe UUID
- `name` - Recipe name
- `productId` - Product UUID
- `itemId` - Item UUID
- `batchSize` - Batch size
- `totalTime` - Total time in minutes
- `status` - Recipe status
- `version` - Recipe version
- `isActiveVersion` - Is active version flag
- `steps` - Array of recipe steps (sorted by order)
- `ingredients` - Array of ingredients
- `allVersions` - Array of all recipe versions
- `countOfVersions` - Total version count
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### `costedProduct` Object (Optional)

Costed product information:
- `itemId` - Item UUID
- `itemCode` - Item code
- `itemName` - Item name
- `category` - Category name
- `categoryId` - Category UUID
- `units` - Units
- `price` - Price
- `currency` - Currency code
- `status` - Status
- `hasActiveCosting` - Has active costing flag
- `activeCostingVersion` - Active costing version
- `totalCostingVersions` - Total costing versions
- `latestCosting` - Latest costing object
- `allCostingVersions` - All costing versions
- `lastCostUpdate` - Last cost update timestamp
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### `recipeExecution` Object (Optional)

Recipe execution status. If execution exists, returns full execution details. If no execution but recipe exists, returns `not_started` execution with all steps in `pending` status.

**When execution exists:**
- `id` - Execution UUID
- `taskId` - Task UUID
- `recipeId` - Recipe UUID
- `status` - Execution status: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
- `currentStep` - Current step object (or null)
- `overallProgress` - Overall progress (0-100)
- `elapsedTime` - Total elapsed time in minutes
- `startedAt` - Start timestamp (or null)
- `pausedAt` - Pause timestamp (or null)
- `resumedAt` - Resume timestamp (or null)
- `completedAt` - Completion timestamp (or null)
- `cancelledAt` - Cancellation timestamp (or null)
- `stepExecutions` - Array of step execution statuses
- `recipe` - Full recipe object with all steps and durations
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

**When execution doesn't exist but recipe exists:**
- `id` - null
- `status` - "not_started"
- `currentStep` - null
- `overallProgress` - 0
- `elapsedTime` - 0
- `stepExecutions` - Array with all recipe steps in "pending" status
- `recipe` - Full recipe object

### `comments` Array

Array of comment objects:
- `id` - Comment UUID
- `taskId` - Task UUID
- `userId` - User UUID
- `user` - User object (or undefined)
- `content` - Comment content
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### `phases` Array

Array of all phase objects:
- `id` - Phase UUID
- `name` - Phase name
- `description` - Phase description (or null)
- `order` - Phase order
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

## Example Response

```json
{
  "statusCode": 200,
  "data": {
    "task": {
      "id": "0c5e9668-7c3e-4869-b922-7dec7a4008cc",
      "taskId": "TASK-1766432275840-5LNZ9O84E",
      "phaseId": "b83469d7-ec05-42a3-af5b-71881514874e",
      "status": "pending",
      "order": 0,
      "task": "Costed Product task",
      "description": "Costed Product task",
      "priority": "medium",
      "dueDate": "2025-12-25T18:30:00.000Z",
      "assignee": {
        "id": "53f5f6e7-bbfe-4ccc-802e-2b49088759d4",
        "name": "Dilanjaan",
        "role": "Collaborator"
      },
      "assignedUserId": "53f5f6e7-bbfe-4ccc-802e-2b49088759d4",
      "assignedUser": {
        "id": "53f5f6e7-bbfe-4ccc-802e-2b49088759d4",
        "userName": "Dilanjaan",
        "email": "dilanjana@webmotech.com"
      },
      "costingId": "2b606d60-a8b0-4680-8bb4-6503bb1dc4a5",
      "costing": {
        "id": "2b606d60-a8b0-4680-8bb4-6503bb1dc4a5",
        "itemName": "4E Alovera Gel with Lavender Frg - 5L (95%)",
        "itemCode": "10007",
        "version": 1,
        "isActive": true
      },
      "batchSize": "batch10kg",
      "rawMaterials": [
        {
          "kg": 1,
          "cost": 500,
          "units": "Kg",
          "category": "Raw Material",
          "supplier": "",
          "unitPrice": "500.00",
          "percentage": "10.0000",
          "rawMaterialId": "e3b76593-14ab-40ec-a49b-0e8a07781e36",
          "rawMaterialName": "Vitamin E"
        }
      ],
      "comments": 0,
      "commentList": [],
      "views": 0,
      "createdAt": "2025-12-22T19:37:56.080Z",
      "updatedAt": "2025-12-22T19:37:56.080Z",
      "updatedBy": null
    },
    "recipe": {
      "id": "9fe68d97-74d5-4cee-b267-7ec9070d12b7",
      "name": "4E Alovera Gel with Lavender Frg",
      "productId": "a50b16cf-db22-48ae-8bd6-68eab1111a17",
      "itemId": "a50b16cf-db22-48ae-8bd6-68eab1111a17",
      "batchSize": "batch10kg",
      "totalTime": 55,
      "status": "active",
      "version": 1,
      "isActiveVersion": true,
      "steps": [
        {
          "id": "a5242047-afa4-4f4b-b6e5-a2e89c82e1ad",
          "order": 1,
          "instruction": "@DI Water add 50% e",
          "temperature": 100,
          "duration": 10
        }
      ],
      "ingredients": [],
      "allVersions": [],
      "countOfVersions": 2
    },
    "costedProduct": {
      "itemId": "a50b16cf-db22-48ae-8bd6-68eab1111a17",
      "itemCode": "10007",
      "itemName": "4E Alovera Gel with Lavender Frg - 5L (95%)",
      "category": "Horeka Range",
      "categoryId": "00565f16-205b-40b8-9c39-29ea8d63de31",
      "units": "pcs",
      "price": "0.00",
      "currency": "LKR",
      "status": "Active",
      "hasActiveCosting": true,
      "activeCostingVersion": 1,
      "totalCostingVersions": 1,
      "latestCosting": {},
      "allCostingVersions": []
    },
    "recipeExecution": {
      "id": null,
      "taskId": "0c5e9668-7c3e-4869-b922-7dec7a4008cc",
      "recipeId": "9fe68d97-74d5-4cee-b267-7ec9070d12b7",
      "status": "not_started",
      "currentStep": null,
      "overallProgress": 0,
      "elapsedTime": 0,
      "startedAt": null,
      "pausedAt": null,
      "resumedAt": null,
      "completedAt": null,
      "cancelledAt": null,
      "stepExecutions": [
        {
          "id": null,
          "stepOrder": 1,
          "status": "pending",
          "startedAt": null,
          "completedAt": null,
          "progress": 0,
          "elapsedTime": null,
          "actualDuration": null,
          "actualTemperature": null,
          "notes": null
        }
      ],
      "recipe": {
        "id": "9fe68d97-74d5-4cee-b267-7ec9070d12b7",
        "name": "4E Alovera Gel with Lavender Frg",
        "steps": [
          {
            "id": "a5242047-afa4-4f4b-b6e5-a2e89c82e1ad",
            "order": 1,
            "instruction": "@DI Water add 50% e",
            "temperature": 100,
            "duration": 10
          }
        ],
        "totalTime": 55
      },
      "createdAt": "2025-12-22T19:37:56.080Z",
      "updatedAt": "2025-12-22T19:37:56.080Z"
    },
    "comments": [],
    "phases": [
      {
        "id": "b83469d7-ec05-42a3-af5b-71881514874e",
        "name": "To Do",
        "description": null,
        "order": 0,
        "createdAt": "2025-12-22T19:37:56.080Z",
        "updatedAt": "2025-12-22T19:37:56.080Z"
      }
    ]
  }
}
```

## Error Responses

### Task Not Found (404)

```json
{
  "statusCode": 404,
  "message": "Task with ID {taskId} not found"
}
```

### Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Internal Server Error (500)

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Notes

1. **Response Wrapper**: The response is wrapped in `{ statusCode: 200, data: {...} }` structure as required by the frontend.

2. **Recipe Execution**: 
   - If execution exists, returns full execution details with `recipeExecution.recipe` containing the full recipe object.
   - If no execution but recipe exists, returns `not_started` execution with all steps in `pending` status.
   - If no recipe exists, `recipeExecution` is `null`.

3. **Steps Sorting**: All recipe steps are sorted by `order` field in ascending order.

4. **Null vs Omitted**: Optional fields can be `null` or omitted - the frontend handles both cases.

5. **Date Formats**: All dates are in ISO 8601 format (e.g., "2025-12-22T19:37:56.080Z").

6. **Task ID**: Both `task.id` (UUID) and `task.taskId` (string) are present. `task.taskId` is used for API calls.

## Frontend Integration

The frontend can use this endpoint to:
1. Load complete task details on page mount
2. Display task information, recipe, and execution status
3. Show all phases for phase selection
4. Display comments
5. Initialize recipe execution UI with current state

## Related Endpoints

- `GET /tasks/:taskId` - Original task details endpoint (backward compatible)
- `POST /tasks/:taskId/recipe/start` - Start recipe execution
- `GET /tasks/:taskId/recipe/status` - Get recipe execution status

