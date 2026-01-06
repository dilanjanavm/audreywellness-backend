# Recipe Execution API Documentation

## Overview

This API allows you to track and manage recipe execution progress for tasks. When a task is created with a costed product, the system automatically binds the active recipe to the task. You can then start, pause, resume, and track progress through recipe steps.

## Base URL

All endpoints are prefixed with: `/tasks/:taskId/recipe`

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Enums

### RecipeExecutionStatus
- `not_started` - Execution has not been started
- `in_progress` - Execution is currently active
- `paused` - Execution is paused
- `completed` - All steps have been completed
- `cancelled` - Execution was cancelled

### StepExecutionStatus
- `pending` - Step has not been started
- `in_progress` - Step is currently being executed
- `paused` - Step execution is paused
- `completed` - Step has been completed
- `skipped` - Step was skipped

---

## Endpoints

### 1. Start Recipe Execution

Start executing the recipe for a task.

**Endpoint:** `POST /tasks/:taskId/recipe/start`

**Path Parameters:**
- `taskId` (string, required) - The task ID

**Request Body:**
```json
{
  "recipeId": "optional-recipe-uuid"  // Optional - will auto-find from costed product if not provided
}
```

**Response:** `200 OK`
```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "step-uuid",
    "stepOrder": 1,
    "instruction": "Add DI Water 50% and boil it",
    "progress": 0,
    "status": "in_progress",
    "startedAt": "2025-01-15T10:00:00.000Z"
  },
  "overallProgress": 0,
  "totalSteps": 4,
  "completedSteps": 0,
  "elapsedTime": 0,
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": null,
  "resumedAt": null,
  "completedAt": null,
  "recipe": {
    "id": "recipe-uuid",
    "name": "Product A - batch10kg Recipe",
    "productId": "product-uuid",
    "itemId": "item-uuid",
    "batchSize": "batch10kg",
    "totalTime": 15,
    "status": "active",
    "version": 1,
    "isActiveVersion": true,
    "steps": [
      {
        "id": "step-uuid-1",
        "order": 1,
        "instruction": "Add DI Water 50% and boil it",
        "temperature": 100,
        "duration": 5
      },
      {
        "id": "step-uuid-2",
        "order": 2,
        "instruction": "Add Vitamin E and mix well",
        "temperature": null,
        "duration": 10
      }
    ],
    "ingredients": [...]
  },
  "stepExecutions": [
    {
      "id": "step-execution-uuid-1",
      "stepId": "step-uuid-1",
      "stepOrder": 1,
      "instruction": "Add DI Water 50% and boil it",
      "status": "in_progress",
      "progress": 0,
      "startedAt": "2025-01-15T10:00:00.000Z",
      "completedAt": null,
      "notes": null
    },
    {
      "id": "step-execution-uuid-2",
      "stepId": "step-uuid-2",
      "stepOrder": 2,
      "instruction": "Add Vitamin E and mix well",
      "status": "pending",
      "progress": 0,
      "startedAt": null,
      "completedAt": null,
      "notes": null
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Execution already in progress or completed
- `404 Not Found` - Task not found or no recipe available
- `401 Unauthorized` - Invalid or missing JWT token

---

### 2. Pause Recipe Execution

Pause the current recipe execution. This saves the current progress and allows resuming later.

**Endpoint:** `POST /tasks/:taskId/recipe/pause`

**Path Parameters:**
- `taskId` (string, required) - The task ID

**Request Body:** None

**Response:** `200 OK`
```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "paused",
  "currentStep": {
    "stepId": "step-uuid",
    "stepOrder": 1,
    "instruction": "Add DI Water 50% and boil it",
    "progress": 45,
    "status": "paused",
    "startedAt": "2025-01-15T10:00:00.000Z"
  },
  "overallProgress": 0,
  "totalSteps": 4,
  "completedSteps": 0,
  "elapsedTime": 2,
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": "2025-01-15T10:02:00.000Z",
  "resumedAt": null,
  "completedAt": null,
  "recipe": {...},
  "stepExecutions": [...]
}
```

**Error Responses:**
- `400 Bad Request` - Execution is not in progress
- `404 Not Found` - Task or execution not found
- `401 Unauthorized` - Invalid or missing JWT token

---

### 3. Resume Recipe Execution

Resume a paused recipe execution from where it was left off.

**Endpoint:** `POST /tasks/:taskId/recipe/resume`

**Path Parameters:**
- `taskId` (string, required) - The task ID

**Request Body:** None

**Response:** `200 OK`
```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "step-uuid",
    "stepOrder": 1,
    "instruction": "Add DI Water 50% and boil it",
    "progress": 45,
    "status": "in_progress",
    "startedAt": "2025-01-15T10:00:00.000Z"
  },
  "overallProgress": 0,
  "totalSteps": 4,
  "completedSteps": 0,
  "elapsedTime": 2,
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": "2025-01-15T10:02:00.000Z",
  "resumedAt": "2025-01-15T10:15:00.000Z",
  "completedAt": null,
  "recipe": {...},
  "stepExecutions": [...]
}
```

**Error Responses:**
- `400 Bad Request` - Execution is not paused
- `404 Not Found` - Task or execution not found
- `401 Unauthorized` - Invalid or missing JWT token

---

### 4. Update Step Progress

Update the progress of a specific step (0-100%). This can be called periodically to track real-time progress.

**Endpoint:** `POST /tasks/:taskId/recipe/steps/:stepOrder/progress`

**Path Parameters:**
- `taskId` (string, required) - The task ID
- `stepOrder` (number, required) - The step order (1, 2, 3, ...)

**Request Body:**
```json
{
  "progress": 75,                    // Required: 0-100
  "actualTemperature": 98.5,        // Optional: Actual temperature recorded
  "notes": "Temperature slightly below target"  // Optional: Notes or observations
}
```

**Response:** `200 OK`
```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "step-uuid",
    "stepOrder": 1,
    "instruction": "Add DI Water 50% and boil it",
    "progress": 75,
    "status": "in_progress",
    "startedAt": "2025-01-15T10:00:00.000Z"
  },
  "overallProgress": 0,
  "totalSteps": 4,
  "completedSteps": 0,
  "elapsedTime": 3,
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": null,
  "resumedAt": null,
  "completedAt": null,
  "recipe": {...},
  "stepExecutions": [
    {
      "id": "step-execution-uuid-1",
      "stepId": "step-uuid-1",
      "stepOrder": 1,
      "instruction": "Add DI Water 50% and boil it",
      "status": "in_progress",
      "progress": 75,
      "actualTemperature": 98.5,
      "startedAt": "2025-01-15T10:00:00.000Z",
      "completedAt": null,
      "notes": "Temperature slightly below target"
    },
    ...
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid progress value or execution not in progress
- `404 Not Found` - Task, execution, or step not found
- `401 Unauthorized` - Invalid or missing JWT token

---

### 5. Complete a Step

Mark a step as completed and automatically move to the next step (if available).

**Endpoint:** `POST /tasks/:taskId/recipe/steps/:stepOrder/complete`

**Path Parameters:**
- `taskId` (string, required) - The task ID
- `stepOrder` (number, required) - The step order (1, 2, 3, ...)

**Request Body:**
```json
{
  "actualDuration": 5,              // Optional: Actual duration in minutes
  "actualTemperature": 100,          // Optional: Final temperature recorded
  "notes": "Step completed successfully"  // Optional: Completion notes
}
```

**Response:** `200 OK`
```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "step-uuid-2",
    "stepOrder": 2,
    "instruction": "Add Vitamin E and mix well",
    "progress": 0,
    "status": "in_progress",
    "startedAt": "2025-01-15T10:05:00.000Z"
  },
  "overallProgress": 25,
  "totalSteps": 4,
  "completedSteps": 1,
  "elapsedTime": 5,
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": null,
  "resumedAt": null,
  "completedAt": null,
  "recipe": {...},
  "stepExecutions": [
    {
      "id": "step-execution-uuid-1",
      "stepId": "step-uuid-1",
      "stepOrder": 1,
      "instruction": "Add DI Water 50% and boil it",
      "status": "completed",
      "progress": 100,
      "actualTemperature": 100,
      "actualDuration": 5,
      "startedAt": "2025-01-15T10:00:00.000Z",
      "completedAt": "2025-01-15T10:05:00.000Z",
      "notes": "Step completed successfully"
    },
    {
      "id": "step-execution-uuid-2",
      "stepId": "step-uuid-2",
      "stepOrder": 2,
      "instruction": "Add Vitamin E and mix well",
      "status": "in_progress",
      "progress": 0,
      "startedAt": "2025-01-15T10:05:00.000Z",
      "completedAt": null,
      "notes": null
    },
    ...
  ]
}
```

**Note:** When the last step is completed, the execution status automatically changes to `completed` and `completedAt` is set.

**Error Responses:**
- `400 Bad Request` - Execution not in progress or step already completed
- `404 Not Found` - Task, execution, or step not found
- `401 Unauthorized` - Invalid or missing JWT token

---

### 6. Get Execution Status

Get the current status of recipe execution for a task.

**Endpoint:** `GET /tasks/:taskId/recipe/status`

**Path Parameters:**
- `taskId` (string, required) - The task ID

**Request Body:** None

**Response:** `200 OK`
```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "step-uuid",
    "stepOrder": 2,
    "instruction": "Add Vitamin E and mix well",
    "progress": 50,
    "status": "in_progress",
    "startedAt": "2025-01-15T10:05:00.000Z"
  },
  "overallProgress": 37.5,
  "totalSteps": 4,
  "completedSteps": 1,
  "elapsedTime": 7,
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": null,
  "resumedAt": null,
  "completedAt": null,
  "recipe": {...},
  "stepExecutions": [...]
}
```

**Error Responses:**
- `404 Not Found` - Task or execution not found
- `401 Unauthorized` - Invalid or missing JWT token

---

### 7. Cancel Recipe Execution

Cancel the recipe execution. This resets the execution state.

**Endpoint:** `POST /tasks/:taskId/recipe/cancel`

**Path Parameters:**
- `taskId` (string, required) - The task ID

**Request Body:** None

**Response:** `200 OK`
```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "cancelled",
  "currentStep": null,
  "overallProgress": 25,
  "totalSteps": 4,
  "completedSteps": 1,
  "elapsedTime": 5,
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": null,
  "resumedAt": null,
  "completedAt": null,
  "recipe": {...},
  "stepExecutions": [...]
}
```

**Error Responses:**
- `400 Bad Request` - Execution already completed
- `404 Not Found` - Task or execution not found
- `401 Unauthorized` - Invalid or missing JWT token

---

## Task Detail Response Enhancement

The existing `GET /tasks/:taskId` endpoint now includes recipe execution status in the response:

**Endpoint:** `GET /tasks/:taskId`

**Response includes:**
```json
{
  "task": {...},
  "comments": [...],
  "costedProduct": {...},
  "recipe": {...},
  "recipeExecution": {
    "id": "execution-uuid",
    "executionId": "execution-uuid",
    "status": "in_progress",
    "currentStep": {...},
    "overallProgress": 50,
    "totalSteps": 4,
    "completedSteps": 2,
    "elapsedTime": 10,
    "startedAt": "2025-01-15T10:00:00.000Z",
    "recipe": {...},
    "stepExecutions": [...]
  }
}
```

---

## Auto-Binding

When a task is created with a `costingId`, the system automatically:
1. Finds the active recipe for the costed product
2. Creates a recipe execution record with status `not_started`
3. Pre-creates step execution records for all recipe steps (status `pending`)

The recipe execution is ready to be started via the `POST /tasks/:taskId/recipe/start` endpoint.

---

## Workflow Example

### Complete Recipe Execution Flow

1. **Create Task with Costing**
   ```http
   POST /tasks
   {
     "task": "Produce Product A",
     "costingId": "costing-uuid",
     "batchSize": "batch10kg",
     ...
   }
   ```
   → Recipe execution is automatically created with status `not_started`

2. **Start Execution**
   ```http
   POST /tasks/TASK-123/recipe/start
   ```
   → Status changes to `in_progress`, first step starts

3. **Update Progress (Periodically)**
   ```http
   POST /tasks/TASK-123/recipe/steps/1/progress
   {
     "progress": 50,
     "actualTemperature": 95
   }
   ```

4. **Pause (if needed)**
   ```http
   POST /tasks/TASK-123/recipe/pause
   ```
   → Status changes to `paused`, progress is saved

5. **Resume**
   ```http
   POST /tasks/TASK-123/recipe/resume
   ```
   → Status changes back to `in_progress`, continues from saved progress

6. **Complete Step**
   ```http
   POST /tasks/TASK-123/recipe/steps/1/complete
   {
     "actualDuration": 5,
     "actualTemperature": 100,
     "notes": "Boiled successfully"
   }
   ```
   → Step 1 marked as completed, Step 2 automatically starts

7. **Repeat for remaining steps**

8. **Final Step Completion**
   ```http
   POST /tasks/TASK-123/recipe/steps/4/complete
   ```
   → All steps completed, execution status changes to `completed`

---

## Data Models

### RecipeExecutionStatusDto
```typescript
{
  id: string;
  executionId: string;
  status: RecipeExecutionStatus;
  currentStep?: {
    stepId: string;
    stepOrder: number;
    instruction: string;
    progress: number;
    status: StepExecutionStatus;
    startedAt?: Date;
  };
  overallProgress: number;        // 0-100
  totalSteps: number;
  completedSteps: number;
  elapsedTime: number;             // in minutes
  startedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;
  recipe: RecipeResponseDto;
  stepExecutions: StepExecutionStatusDto[];
}
```

### StepExecutionStatusDto
```typescript
{
  id: string;
  stepId: string;
  stepOrder: number;
  instruction: string;
  status: StepExecutionStatus;
  progress: number;                // 0-100
  actualTemperature?: number;
  actualDuration?: number;          // in minutes
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:
- `200 OK` - Success
- `400 Bad Request` - Invalid request or business logic error
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

---

## Notes for Frontend Implementation

1. **Progress Tracking**: Call `updateStepProgress` periodically (e.g., every 30 seconds) to track real-time progress.

2. **State Management**: Use the `getExecutionStatus` endpoint to refresh the UI state, especially after page reloads.

3. **Pause/Resume**: Always check the execution status before allowing pause/resume actions.

4. **Step Completion**: When completing a step, the next step automatically starts. Update your UI accordingly.

5. **Auto-binding**: Recipe execution is created automatically when a task with costing is created. You can check if it exists by looking for `recipeExecution` in the task detail response.

6. **Timer Display**: Use `elapsedTime` to show total elapsed time. For current step duration, calculate from `currentStep.startedAt` to current time.

7. **Progress Calculation**: 
   - Overall progress = (completedSteps / totalSteps) * 100
   - Current step progress = `currentStep.progress` (0-100)

---

## Support

For questions or issues, please contact the backend development team.

