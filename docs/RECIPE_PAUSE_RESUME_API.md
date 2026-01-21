# Recipe Execution Pause/Resume API Documentation

## Overview

This document describes the updated pause and resume endpoints for recipe execution, including proper time tracking and remaining time calculation.

## Key Features

- ✅ **Accurate Time Tracking**: Elapsed time is tracked only during active execution (pauses are excluded)
- ✅ **Remaining Time Calculation**: Automatically calculates remaining time for the current step
- ✅ **Multiple Pause/Resume Support**: Correctly handles multiple pause/resume cycles
- ✅ **Real-time Updates**: Returns current elapsed and remaining time in response

---

## Endpoints

### 1. Pause Recipe Execution

Pauses the current recipe execution and saves the current elapsed time for the step.

**Endpoint:** `POST /tasks/:taskId/recipe/pause`

**Path Parameters:**
- `taskId` (string, required) - The task ID

**Request Body:**
None (empty body)

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "id": "execution-uuid",
    "executionId": "execution-uuid",
    "status": "paused",
    "currentStep": {
      "stepId": "step-uuid",
      "stepOrder": 1,
      "instruction": "Heat mixture to 60°C",
      "progress": 45,
      "status": "paused",
      "startedAt": "2024-01-15T10:00:00.000Z",
      "elapsedTime": 25,
      "remainingTime": 35,
      "stepDuration": 60
    },
    "overallProgress": 20,
    "totalSteps": 5,
    "completedSteps": 0,
    "elapsedTime": 25,
    "currentStepElapsedTime": 25,
    "currentStepRemainingTime": 35,
    "startedAt": "2024-01-15T10:00:00.000Z",
    "pausedAt": "2024-01-15T10:25:00.000Z",
    "resumedAt": null,
    "completedAt": null,
    "recipe": { /* recipe details */ },
    "stepExecutions": [ /* all step executions */ ]
  }
}
```

**Response Fields:**
- `currentStep.elapsedTime` - Accumulated elapsed time for current step (in minutes, excludes pause time)
- `currentStep.remainingTime` - Remaining time for current step (in minutes) = `stepDuration - elapsedTime`
- `currentStep.stepDuration` - Original step duration from recipe (in minutes)
- `currentStepElapsedTime` - Same as `currentStep.elapsedTime` (for convenience)
- `currentStepRemainingTime` - Same as `currentStep.remainingTime` (for convenience)
- `elapsedTime` - Total elapsed time across all steps (in minutes)

**Error Responses:**

```json
// Execution not in progress
{
  "statusCode": 400,
  "message": "Cannot pause execution with status: not_started"
}

// No current step
{
  "statusCode": 400,
  "message": "No current step to pause"
}
```

---

### 2. Resume Recipe Execution

Resumes a paused recipe execution and calculates remaining time from saved elapsed time.

**Endpoint:** `POST /tasks/:taskId/recipe/resume`

**Path Parameters:**
- `taskId` (string, required) - The task ID

**Request Body:**
None (empty body)

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "id": "execution-uuid",
    "executionId": "execution-uuid",
    "status": "in_progress",
    "currentStep": {
      "stepId": "step-uuid",
      "stepOrder": 1,
      "instruction": "Heat mixture to 60°C",
      "progress": 45,
      "status": "in_progress",
      "startedAt": "2024-01-15T10:00:00.000Z",
      "elapsedTime": 25,
      "remainingTime": 35,
      "stepDuration": 60
    },
    "overallProgress": 20,
    "totalSteps": 5,
    "completedSteps": 0,
    "elapsedTime": 25,
    "currentStepElapsedTime": 25,
    "currentStepRemainingTime": 35,
    "startedAt": "2024-01-15T10:00:00.000Z",
    "pausedAt": "2024-01-15T10:25:00.000Z",
    "resumedAt": "2024-01-15T10:35:00.000Z",
    "completedAt": null,
    "recipe": { /* recipe details */ },
    "stepExecutions": [ /* all step executions */ ]
  }
}
```

**Key Points:**
- `resumedAt` timestamp is updated when execution resumes
- `elapsedTime` remains the same (time paused is not counted)
- `remainingTime` is calculated as `stepDuration - elapsedTime`
- Timer continues from where it left off

**Error Responses:**

```json
// Execution not paused
{
  "statusCode": 400,
  "message": "Cannot resume execution with status: in_progress"
}

// No current step
{
  "statusCode": 400,
  "message": "No current step to resume"
}
```

---

## Time Tracking Logic

### How It Works

1. **When Starting a Step:**
   - `stepElapsedTime` = 0
   - `startedAt` = current time

2. **During Execution:**
   - Timer runs and accumulates time
   - `elapsedTime` increases only when step is `in_progress`

3. **When Pausing:**
   - Calculate time since last start/resume
   - Add to accumulated `stepElapsedTime`
   - Save `stepElapsedTime` to database
   - Timer stops (pause time is NOT counted)

4. **When Resuming:**
   - Restore saved `stepElapsedTime`
   - Set `resumedAt` timestamp
   - Timer continues from saved elapsed time
   - `remainingTime` = `stepDuration - elapsedTime`

5. **Multiple Pause/Resume Cycles:**
   - Each pause saves accumulated elapsed time
   - Each resume continues from last saved elapsed time
   - Pause duration is always excluded from elapsed time

### Example Timeline

```
10:00 - Start step (duration: 60 minutes)
10:00 - elapsedTime: 0, remainingTime: 60
10:15 - elapsedTime: 15, remainingTime: 45
10:20 - PAUSE (saves elapsedTime: 20)
10:20 - paused, remainingTime: 40
10:30 - RESUME (continues from elapsedTime: 20)
10:30 - elapsedTime: 20, remainingTime: 40
10:45 - elapsedTime: 35, remainingTime: 25
10:50 - PAUSE (saves elapsedTime: 40)
10:50 - paused, remainingTime: 20
11:00 - RESUME (continues from elapsedTime: 40)
11:00 - elapsedTime: 40, remainingTime: 20
11:20 - elapsedTime: 60, remainingTime: 0 (step complete)
```

---

## Frontend Implementation Guide

### Display Timer

```javascript
// Calculate remaining time from API response
const remainingTime = response.data.currentStepRemainingTime; // in minutes

// Convert to hours:minutes:seconds for display
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes % 1) * 60);
  return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update countdown timer
let countdownInterval;
function startCountdown(remainingMinutes) {
  let remaining = remainingMinutes * 60; // Convert to seconds
  
  countdownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      // Step should be completed
    }
    updateDisplay(remaining);
  }, 1000);
}

// On pause
async function pauseExecution(taskId) {
  const response = await fetch(`/tasks/${taskId}/recipe/pause`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  clearInterval(countdownInterval); // Stop countdown
  displayRemainingTime(data.data.currentStepRemainingTime);
}

// On resume
async function resumeExecution(taskId) {
  const response = await fetch(`/tasks/${taskId}/recipe/resume`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  startCountdown(data.data.currentStepRemainingTime); // Restart countdown
}
```

### Polling for Updates

```javascript
// Poll every 30 seconds for status updates
setInterval(async () => {
  const response = await fetch(`/tasks/${taskId}/recipe/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  updateTimer(data.data.currentStepRemainingTime);
  updateElapsedTime(data.data.currentStepElapsedTime);
}, 30000);
```

---

## Complete Example

### Pause Execution

```bash
curl -X POST http://localhost:3005/tasks/TASK-123/recipe/pause \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "status": "paused",
    "currentStep": {
      "stepOrder": 1,
      "elapsedTime": 25,
      "remainingTime": 35,
      "stepDuration": 60,
      "status": "paused"
    },
    "currentStepElapsedTime": 25,
    "currentStepRemainingTime": 35,
    "elapsedTime": 25,
    "pausedAt": "2024-01-15T10:25:00.000Z"
  }
}
```

### Resume Execution

```bash
curl -X POST http://localhost:3005/tasks/TASK-123/recipe/resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "status": "in_progress",
    "currentStep": {
      "stepOrder": 1,
      "elapsedTime": 25,
      "remainingTime": 35,
      "stepDuration": 60,
      "status": "in_progress"
    },
    "currentStepElapsedTime": 25,
    "currentStepRemainingTime": 35,
    "elapsedTime": 25,
    "pausedAt": "2024-01-15T10:25:00.000Z",
    "resumedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

## Response Field Reference

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `currentStep.elapsedTime` | number | Accumulated elapsed time for current step (minutes) | 25 |
| `currentStep.remainingTime` | number | Remaining time for current step (minutes) | 35 |
| `currentStep.stepDuration` | number | Original step duration from recipe (minutes) | 60 |
| `currentStepElapsedTime` | number | Same as `currentStep.elapsedTime` (convenience) | 25 |
| `currentStepRemainingTime` | number | Same as `currentStep.remainingTime` (convenience) | 35 |
| `elapsedTime` | number | Total elapsed time across all steps (minutes) | 25 |
| `status` | string | Execution status: `in_progress`, `paused`, `completed`, etc. | "paused" |
| `pausedAt` | Date | When execution was paused | "2024-01-15T10:25:00.000Z" |
| `resumedAt` | Date | When execution was last resumed | "2024-01-15T10:35:00.000Z" |

---

## Important Notes

1. **Pause Time Excluded**: Time spent paused is NOT counted in elapsed time
2. **Accurate Tracking**: Elapsed time only increases during active execution
3. **Multiple Cycles**: Supports unlimited pause/resume cycles per step
4. **Real-time Calculation**: Remaining time is calculated on-the-fly: `stepDuration - elapsedTime`
5. **Frontend Sync**: Frontend should use `remainingTime` from API response to sync timer

---

## Migration Notes

### Database Changes

A new column `step_elapsed_time` has been added to `task_recipe_step_executions` table:
- Type: `INT`
- Default: `0`
- Stores accumulated elapsed time for each step (in minutes)

A new column `resumed_at` has been added to `task_recipe_step_executions` table:
- Type: `DATETIME`
- Nullable: `true`
- Tracks when the step was last resumed

### Backward Compatibility

- Existing executions will work with default values (0 for `stepElapsedTime`)
- No data migration needed
- Old executions will calculate elapsed time from timestamps if needed
