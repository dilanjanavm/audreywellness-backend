# Recipe Execution Timing API Documentation

## Overview

This document describes the Recipe Execution timing API endpoints that allow the frontend to sync timer values with the backend. The frontend can send the current remaining time when pausing, resuming, or completing a step, and the backend will calculate and return the updated timing information.

## Base URL

```
/tasks/:taskId/recipe
```

All endpoints require authentication (JWT Bearer token).

---

## Endpoints

### 1. Pause Recipe Execution

Pause the execution of a recipe and sync remaining time from the frontend timer.

#### Endpoint

```
POST /tasks/:taskId/recipe/pause
```

#### Request Body

```typescript
{
  reason?: string;           // Optional reason for pausing
  remainingTime?: number;    // Optional remaining time in minutes (from frontend timer)
}
```

#### Request Example

```json
{
  "reason": "Waiting for materials",
  "remainingTime": 25.5
}
```

#### Response

Returns `RecipeExecutionStatusDto` with updated timing information.

```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "paused",
  "currentStep": {
    "stepId": "step-uuid",
    "stepOrder": 2,
    "instruction": "Heat to 80°C",
    "progress": 45,
    "status": "paused",
    "startedAt": "2026-01-15T10:30:00Z",
    "elapsedTime": 14.5,
    "remainingTime": 25.5,
    "stepDuration": 40
  },
  "currentStepElapsedTime": 14.5,
  "currentStepRemainingTime": 25.5,
  "overallProgress": 35,
  "totalSteps": 5,
  "completedSteps": 1,
  "elapsedTime": 75,
  "startedAt": "2026-01-15T10:00:00Z",
  "pausedAt": "2026-01-15T10:44:30Z",
  "recipe": { ... },
  "stepExecutions": [ ... ]
}
```

#### Behavior

- **If `remainingTime` is provided:**
  - Backend calculates: `elapsedTime = stepDuration - remainingTime`
  - Updates `stepElapsedTime` and `totalElapsedTime` accordingly
  - More accurate as it uses the frontend timer value

- **If `remainingTime` is NOT provided:**
  - Backend calculates elapsed time from timestamps
  - Uses `resumedAt` or `startedAt` as reference point

#### Status Codes

- `200 OK` - Execution paused successfully
- `400 Bad Request` - Execution is not in progress
- `404 Not Found` - Task or execution not found

---

### 2. Resume Recipe Execution

Resume a paused recipe execution and optionally sync remaining time from the frontend timer.

#### Endpoint

```
POST /tasks/:taskId/recipe/resume
```

#### Request Body

```typescript
{
  notes?: string;            // Optional notes about resuming
  remainingTime?: number;    // Optional remaining time in minutes (from frontend timer)
}
```

#### Request Example

```json
{
  "notes": "Materials arrived, resuming",
  "remainingTime": 25.3
}
```

#### Response

Returns `RecipeExecutionStatusDto` with updated timing information.

```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "step-uuid",
    "stepOrder": 2,
    "instruction": "Heat to 80°C",
    "progress": 45,
    "status": "in_progress",
    "startedAt": "2026-01-15T10:30:00Z",
    "elapsedTime": 14.7,
    "remainingTime": 25.3,
    "stepDuration": 40
  },
  "currentStepElapsedTime": 14.7,
  "currentStepRemainingTime": 25.3,
  "overallProgress": 35,
  "totalSteps": 5,
  "completedSteps": 1,
  "elapsedTime": 75.2,
  "startedAt": "2026-01-15T10:00:00Z",
  "pausedAt": "2026-01-15T10:44:30Z",
  "resumedAt": "2026-01-15T11:00:00Z",
  "recipe": { ... },
  "stepExecutions": [ ... ]
}
```

#### Behavior

- **If `remainingTime` is provided:**
  - Backend calculates: `elapsedTime = stepDuration - remainingTime`
  - Updates `stepElapsedTime` if different from saved value
  - Adjusts `totalElapsedTime` accordingly
  - Useful for syncing timer after long pauses

- **If `remainingTime` is NOT provided:**
  - Backend uses saved `stepElapsedTime` value
  - Timer continues from where it left off

#### Status Codes

- `200 OK` - Execution resumed successfully
- `400 Bad Request` - Execution is not paused
- `404 Not Found` - Task or execution not found

---

### 3. Complete Step

Complete a recipe step and optionally sync remaining time from the frontend timer.

#### Endpoint

```
POST /tasks/:taskId/recipe/steps/:stepOrder/complete
```

#### Request Body

```typescript
{
  actualDuration?: number;   // Optional actual duration in minutes (alternative to remainingTime)
  remainingTime?: number;    // Optional remaining time in minutes (alternative to actualDuration)
  actualTemperature?: number; // Optional actual temperature achieved
  notes?: string;            // Optional notes about completion
}
```

#### Request Example

```json
{
  "remainingTime": 0,
  "actualTemperature": 82,
  "notes": "Completed successfully"
}
```

#### Response

Returns `RecipeExecutionStatusDto` with updated timing information.

```json
{
  "id": "execution-uuid",
  "executionId": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "stepId": "next-step-uuid",
    "stepOrder": 3,
    "instruction": "Cool to room temperature",
    "progress": 0,
    "status": "in_progress",
    "startedAt": "2026-01-15T11:15:00Z",
    "elapsedTime": 0,
    "remainingTime": 30,
    "stepDuration": 30
  },
  "currentStepElapsedTime": 0,
  "currentStepRemainingTime": 30,
  "overallProgress": 40,
  "totalSteps": 5,
  "completedSteps": 2,
  "elapsedTime": 90,
  "startedAt": "2026-01-15T10:00:00Z",
  "recipe": { ... },
  "stepExecutions": [ ... ]
}
```

#### Behavior

- **If `remainingTime` is provided:**
  - Backend calculates: `elapsedTime = stepDuration - remainingTime`
  - Sets `stepElapsedTime` and `actualDuration` to calculated value

- **If `actualDuration` is provided (and `remainingTime` is not):**
  - Uses `actualDuration` directly
  - Sets `stepElapsedTime` to match

- **If neither is provided:**
  - Calculates from timestamps
  - Uses accumulated `stepElapsedTime` plus time since last start/resume

#### Priority Order

1. `remainingTime` (if provided)
2. `actualDuration` (if provided and `remainingTime` is not)
3. Timestamp calculation (fallback)

#### Status Codes

- `200 OK` - Step completed successfully
- `400 Bad Request` - Execution is not in progress or step is not in progress
- `404 Not Found` - Task, execution, or step not found

---

## Response DTO Structure

### RecipeExecutionStatusDto

```typescript
{
  id: string;                          // Execution ID
  executionId: string;                 // Same as id
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  currentStep?: {
    stepId: string;                    // Current step ID
    stepOrder: number;                 // Step order number (1, 2, 3, ...)
    instruction: string;               // Step instruction text
    progress: number;                  // Progress percentage (0-100)
    status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed';
    startedAt?: Date;                  // When step started
    elapsedTime?: number;              // Elapsed time in minutes (accumulated)
    remainingTime?: number;            // Remaining time in minutes
    stepDuration?: number;             // Original step duration in minutes
  };
  overallProgress: number;             // Overall progress percentage (0-100)
  totalSteps: number;                  // Total number of steps
  completedSteps: number;              // Number of completed steps
  elapsedTime: number;                 // Total elapsed time in minutes (accumulated)
  currentStepElapsedTime?: number;     // Current step elapsed time (for convenience)
  currentStepRemainingTime?: number;   // Current step remaining time (for convenience)
  startedAt?: Date;                    // When execution started
  pausedAt?: Date;                     // When execution was paused
  resumedAt?: Date;                    // When execution was resumed
  completedAt?: Date;                  // When execution completed
  recipe?: RecipeResponseDto;          // Recipe details
  stepExecutions: StepExecutionStatusDto[]; // All step executions
}
```

### StepExecutionStatusDto

```typescript
{
  id: string;                          // Step execution ID
  stepId: string;                      // Recipe step ID
  stepOrder: number;                   // Step order number
  instruction: string;                 // Step instruction text
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed';
  progress: number;                    // Progress percentage (0-100)
  actualTemperature?: number;          // Actual temperature achieved
  actualDuration?: number;             // Actual duration in minutes
  startedAt?: Date;                    // When step started
  completedAt?: Date;                  // When step completed
  notes?: string;                      // Step notes
}
```

---

## Timing Calculation Logic

### Elapsed Time Calculation

The backend calculates elapsed time using the following priority:

1. **From `remainingTime` (if provided):**
   ```typescript
   elapsedTime = stepDuration - remainingTime
   ```

2. **From timestamps (fallback):**
   ```typescript
   elapsedTime = accumulatedElapsedTime + timeSinceLastStartOrResume
   ```

### Remaining Time Calculation

```typescript
remainingTime = Math.max(0, stepDuration - elapsedTime)
```

### Total Elapsed Time

Total elapsed time accumulates across all steps:
```typescript
totalElapsedTime = sum of all step elapsed times
```

---

## Frontend Integration Guidelines

### Recommended Approach

1. **Maintain a local timer** on the frontend for better UX
2. **Sync with backend** when pausing/resuming/completing
3. **Use `remainingTime`** in API requests for accuracy
4. **Update local timer** based on backend response

### Example Frontend Flow

```typescript
// Start timer when step starts
let timerInterval: NodeJS.Timeout;
let remainingTime = stepDuration; // in minutes

timerInterval = setInterval(() => {
  remainingTime -= 0.1 / 60; // Decrease by 0.1 seconds
  updateUI(remainingTime);
}, 100);

// When pausing
const pauseResponse = await fetch(`/tasks/${taskId}/recipe/pause`, {
  method: 'POST',
  body: JSON.stringify({
    reason: 'Waiting for materials',
    remainingTime: remainingTime, // Sync with backend
  }),
});

clearInterval(timerInterval);
const data = await pauseResponse.json();
remainingTime = data.currentStepRemainingTime; // Use backend value

// When resuming
const resumeResponse = await fetch(`/tasks/${taskId}/recipe/resume`, {
  method: 'POST',
  body: JSON.stringify({
    remainingTime: remainingTime, // Sync with backend
  }),
});

const resumeData = await resumeResponse.json();
remainingTime = resumeData.currentStepRemainingTime; // Use backend value

// Restart timer
timerInterval = setInterval(() => {
  remainingTime -= 0.1 / 60;
  updateUI(remainingTime);
}, 100);
```

---

## Error Handling

### Common Errors

| Status Code | Error | Description |
|------------|-------|-------------|
| 400 | Bad Request | Execution/step is not in the correct state |
| 404 | Not Found | Task, execution, or step not found |
| 401 | Unauthorized | Missing or invalid JWT token |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Cannot pause execution with status: completed",
  "error": "Bad Request"
}
```

---

## Notes

- All time values are in **minutes** (not seconds or milliseconds)
- `remainingTime` is optional - backend will calculate from timestamps if not provided
- Backend always returns updated timing information in the response
- Frontend should update its local timer based on backend response for consistency
- Elapsed time accumulates only when steps are actually running (excludes pause time)

---

## Summary

- ✅ Frontend can send `remainingTime` when pausing/resuming/completing
- ✅ Backend calculates accurate `elapsedTime` from `remainingTime`
- ✅ Backend returns updated timing information
- ✅ Supports fallback to timestamp-based calculation if `remainingTime` not provided
- ✅ All timing data is in minutes
- ✅ Response always includes current `remainingTime` for frontend sync
