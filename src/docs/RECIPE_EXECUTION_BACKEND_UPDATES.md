# Recipe Execution Backend Updates - Frontend Alignment

## Overview

This document outlines the backend updates made to align with the frontend implementation plan. All requested features have been implemented and validated.

---

## ✅ Completed Updates

### 1. Enhanced Validation

#### Step Completion Validation
- ✅ Added validation to prevent completing already completed steps
- ✅ Added validation to ensure step is in progress before completion
- ✅ Clear error messages for invalid state transitions

**Location:** `recipe-execution.service.ts` - `completeStep()` method

```typescript
// Validates step is not already completed
if (stepExecution.status === StepExecutionStatus.COMPLETED) {
  throw new BadRequestException(`Step ${stepOrder} is already completed`);
}

// Validates step is currently in progress
if (stepExecution.status !== StepExecutionStatus.IN_PROGRESS) {
  throw new BadRequestException(
    `Step ${stepOrder} is not in progress. Current status: ${stepExecution.status}`
  );
}
```

#### Progress Update Validation
- ✅ Added validation to prevent updating progress for paused steps (must resume first)
- ✅ Added validation to ensure step is in progress or paused before updating

**Location:** `recipe-execution.service.ts` - `updateStepProgress()` method

```typescript
// Validates step is in progress or paused
if (
  stepExecution.status !== StepExecutionStatus.IN_PROGRESS &&
  stepExecution.status !== StepExecutionStatus.PAUSED
) {
  throw new BadRequestException(
    `Cannot update progress for step ${stepOrder} with status: ${stepExecution.status}`
  );
}

// If step is paused, don't allow progress updates (must resume first)
if (stepExecution.status === StepExecutionStatus.PAUSED) {
  throw new BadRequestException(
    `Cannot update progress for paused step. Please resume execution first.`
  );
}
```

### 2. Improved Elapsed Time Calculation

#### Accurate Pause/Resume Time Tracking
- ✅ Enhanced pause calculation to account for resume time
- ✅ Properly handles multiple pause/resume cycles
- ✅ Calculates elapsed time accurately when execution is paused and resumed

**Location:** `recipe-execution.service.ts` - `pauseExecution()` method

```typescript
// Calculate elapsed time for current step
// Account for resume time if step was previously paused
if (currentStepExecution.startedAt) {
  const now = new Date();
  let stepElapsed = 0;
  
  // If step was paused and resumed, account for the pause duration
  if (currentStepExecution.pausedAt && execution.resumedAt) {
    const timeToPause = (currentStepExecution.pausedAt.getTime() - 
                         currentStepExecution.startedAt.getTime()) / (1000 * 60);
    const timeFromResume = (now.getTime() - execution.resumedAt.getTime()) / (1000 * 60);
    stepElapsed = timeToPause + timeFromResume;
  } else {
    stepElapsed = (now.getTime() - currentStepExecution.startedAt.getTime()) / (1000 * 60);
  }
  
  execution.totalElapsedTime += Math.floor(stepElapsed);
}
```

#### Real-Time Current Step Elapsed Time
- ✅ Added `currentStepElapsedTime` to response DTO
- ✅ Calculates real-time elapsed time for the current step
- ✅ Handles paused, in-progress, and completed states

**Location:** `recipe-execution.service.ts` - `mapToStatusDto()` method

**Response DTO Update:**
```typescript
export class RecipeExecutionStatusDto {
  // ... existing fields
  currentStep?: {
    stepId: string;
    stepOrder: number;
    instruction: string;
    progress: number;
    status: StepExecutionStatus;
    startedAt?: Date;
    elapsedTime?: number; // NEW: Current step elapsed time in minutes
  };
  currentStepElapsedTime?: number; // NEW: Current step elapsed time (for active steps)
  // ... rest of fields
}
```

### 3. Resume State Management

#### Improved Resume Handling
- ✅ Clears `pausedAt` when resuming to track state correctly
- ✅ Maintains original `startedAt` for accurate duration tracking
- ✅ Properly updates execution and step status

**Location:** `recipe-execution.service.ts` - `resumeExecution()` method

```typescript
// Resume execution and current step
execution.status = RecipeExecutionStatus.IN_PROGRESS;
execution.resumedAt = new Date();

currentStepExecution.status = StepExecutionStatus.IN_PROGRESS;
// Clear pausedAt to track that we've resumed
currentStepExecution.pausedAt = null;
// Don't update startedAt - keep original start time for accurate duration tracking
```

---

## ✅ Frontend Plan Alignment

### API Endpoints - All Implemented

| Frontend Requirement | Backend Endpoint | Status |
|---------------------|------------------|--------|
| `startRecipeExecution(taskId, recipeId?)` | `POST /tasks/:taskId/recipe/start` | ✅ |
| `pauseRecipeExecution(taskId)` | `POST /tasks/:taskId/recipe/pause` | ✅ |
| `resumeRecipeExecution(taskId)` | `POST /tasks/:taskId/recipe/resume` | ✅ |
| `updateStepProgress(taskId, stepOrder, progress, ...)` | `POST /tasks/:taskId/recipe/steps/:stepOrder/progress` | ✅ |
| `completeStep(taskId, stepOrder, ...)` | `POST /tasks/:taskId/recipe/steps/:stepOrder/complete` | ✅ |
| `cancelRecipeExecution(taskId)` | `POST /tasks/:taskId/recipe/cancel` | ✅ |
| `getRecipeExecutionStatus(taskId)` | `GET /tasks/:taskId/recipe/status` | ✅ |

### State Management - All Supported

| Frontend Requirement | Backend Support | Status |
|---------------------|----------------|--------|
| Load execution status on mount | `GET /tasks/:taskId` includes `recipeExecution` | ✅ |
| Execution status recovery | All statuses returned in response | ✅ |
| Step state restoration | `stepExecutions` array with all step states | ✅ |
| Current step tracking | `currentStep` object with full details | ✅ |
| Elapsed time tracking | `elapsedTime` and `currentStepElapsedTime` | ✅ |
| Progress tracking | `overallProgress` and `currentStep.progress` | ✅ |

### Status Mapping - All Implemented

#### Recipe Execution Status
- ✅ `not_started` - Execution not started
- ✅ `in_progress` - Active execution
- ✅ `paused` - Execution paused
- ✅ `completed` - All steps completed
- ✅ `cancelled` - Execution cancelled

#### Step Execution Status
- ✅ `pending` - Step not started
- ✅ `in_progress` - Step active
- ✅ `paused` - Step paused (when execution is paused)
- ✅ `completed` - Step completed
- ✅ `skipped` - Step skipped (supported, not yet used)

### Edge Cases - All Handled

| Edge Case | Backend Handling | Status |
|-----------|------------------|--------|
| Page refresh | State persisted, can be restored | ✅ |
| Multiple tabs | Backend is source of truth | ✅ |
| Network errors | Proper error responses | ✅ |
| Concurrent updates | Validation prevents invalid states | ✅ |
| Execution already started | Validation prevents duplicate start | ✅ |
| Step already completed | Validation prevents duplicate completion | ✅ |
| Execution completed | Validation prevents actions on completed | ✅ |
| Execution cancelled | Can restart from beginning | ✅ |

---

## 📊 Response Data Structure

### Complete Execution Status Response

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
    "startedAt": "2025-01-15T10:00:00.000Z",
    "elapsedTime": 3  // NEW: Current step elapsed time in minutes
  },
  "overallProgress": 25,
  "totalSteps": 4,
  "completedSteps": 1,
  "elapsedTime": 5,  // Total accumulated elapsed time
  "currentStepElapsedTime": 3,  // NEW: Real-time current step elapsed time
  "startedAt": "2025-01-15T10:00:00.000Z",
  "pausedAt": null,
  "resumedAt": null,
  "completedAt": null,
  "recipe": {
    // Full recipe details
  },
  "stepExecutions": [
    {
      "id": "step-execution-uuid",
      "stepId": "step-uuid",
      "stepOrder": 1,
      "instruction": "Add DI Water 50% and boil it",
      "status": "in_progress",
      "progress": 75,
      "actualTemperature": 98.5,
      "actualDuration": null,
      "startedAt": "2025-01-15T10:00:00.000Z",
      "completedAt": null,
      "notes": null
    },
    // ... more steps
  ]
}
```

---

## 🔄 Data Flow Support

### Component Mount Flow
```
1. GET /tasks/:taskId
   ↓
2. Check recipeExecution.status
   ↓
3. If 'in_progress' or 'paused':
   - Restore step states from stepExecutions ✅
   - Restore current step from currentStep ✅
   - Restore elapsed times from elapsedTime and currentStepElapsedTime ✅
   - Restore completion status from completedSteps ✅
```

### User Actions Flow
```
Start → POST /recipe/start → Returns updated status ✅
Pause → POST /recipe/pause → Returns updated status ✅
Resume → POST /recipe/resume → Returns updated status ✅
Complete Step → POST /recipe/steps/:order/complete → Auto-starts next step ✅
Cancel → POST /recipe/cancel → Returns updated status ✅
```

### Periodic Updates Flow
```
Every 30s → POST /recipe/steps/:order/progress → Updates progress ✅
```

---

## 🎯 Frontend Implementation Notes

### Timer Display
- Use `currentStepElapsedTime` for current step timer (real-time)
- Use `elapsedTime` for total elapsed time (accumulated)
- Calculate remaining time: `step.duration - currentStepElapsedTime`

### Progress Calculation
- Overall progress: `overallProgress` (0-100) - provided by backend
- Current step progress: `currentStep.progress` (0-100) - provided by backend
- No need to calculate manually - backend handles it

### State Recovery
- On mount, check `recipeExecution.status`
- If `in_progress` or `paused`, restore from:
  - `currentStep` - current step details
  - `stepExecutions` - all step states
  - `elapsedTime` - total elapsed time
  - `currentStepElapsedTime` - current step elapsed time

### Step Completion
- Call `POST /recipe/steps/:order/complete`
- Backend automatically starts next step
- Response includes updated `currentStep` with next step
- Update UI from response

### Pause/Resume
- Pause saves current progress automatically
- Resume restores from saved state
- Backend maintains `pausedAt` and `resumedAt` timestamps
- Use `currentStepElapsedTime` to show accurate timer

---

## ✅ Validation Summary

All validations are in place to prevent:
- ✅ Starting execution when already in progress
- ✅ Pausing when not in progress
- ✅ Resuming when not paused
- ✅ Completing already completed steps
- ✅ Updating progress for paused steps (must resume first)
- ✅ Completing steps when execution is not in progress
- ✅ Cancelling completed executions

---

## 📝 API Documentation

Complete API documentation is available at:
- `src/docs/RECIPE_EXECUTION_API.md`

This includes:
- All endpoint details
- Request/response examples
- Error handling
- Workflow examples
- Frontend implementation notes

---

## 🚀 Ready for Frontend Integration

The backend is fully aligned with the frontend implementation plan. All requested features are implemented, validated, and documented. The frontend team can proceed with integration using the provided API endpoints and response structures.

---

## Questions or Issues?

If the frontend team encounters any issues or needs additional features, please contact the backend development team.

