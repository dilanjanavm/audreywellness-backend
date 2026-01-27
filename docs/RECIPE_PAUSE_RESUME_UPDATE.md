# Recipe Pause/Resume Update - Database Changes & API Updates

## Overview

Updated the pause/resume endpoints to:
1. Save `reason` and `remainingTime` when pausing
2. Validate that `remainingTime` is less than step duration
3. Return `remainingTimeForTask` in all responses
4. Store pause information in the database

---

## Database Changes

### New Columns in `task_recipe_executions` Table

Two new columns have been added to the `task_recipe_executions` entity:

1. **`pause_reason`** (TEXT, nullable)
   - Stores the reason for pausing the recipe execution
   - Set when pausing, cleared when resuming

2. **`remaining_time_at_pause`** (DECIMAL(10,2), nullable)
   - Stores the remaining time (in minutes) when the execution was paused
   - Used to calculate `remainingTimeForTask` in responses
   - Set when pausing, cleared when resuming

### Migration SQL

```sql
ALTER TABLE `task_recipe_executions`
ADD COLUMN `pause_reason` TEXT NULL AFTER `total_elapsed_time`,
ADD COLUMN `remaining_time_at_pause` DECIMAL(10,2) NULL AFTER `pause_reason`;
```

---

## API Changes

### 1. Pause Endpoint

**Endpoint:** `POST /tasks/:taskId/recipe/pause`

**Request Body:**
```json
{
  "reason": "Waiting for materials",
  "remainingTime": 12.0
}
```

**Validation:**
- `remainingTime` must be less than or equal to the current step duration
- If `remainingTime > stepDuration`, returns 400 Bad Request error

**Response:**
```json
{
  "id": "execution-uuid",
  "status": "paused",
  "currentStep": {
    "remainingTime": 12.0,
    "stepDuration": 40
  },
  "remainingTimeForTask": 52.0,
  "pauseReason": "Waiting for materials",
  "remainingTimeAtPause": 12.0,
  ...
}
```

**Behavior:**
- Saves `reason` to `pause_reason` column
- Saves `remainingTime` to `remaining_time_at_pause` column
- If `remainingTime` not provided, calculates it from elapsed time
- Validates `remainingTime <= stepDuration`

---

### 2. Resume Endpoint

**Endpoint:** `POST /tasks/:taskId/recipe/resume`

**Request Body:**
```json
{
  "notes": "Materials arrived",
  "remainingTime": 11.5
}
```

**Response:**
```json
{
  "id": "execution-uuid",
  "status": "in_progress",
  "currentStep": {
    "remainingTime": 11.5,
    "stepDuration": 40
  },
  "remainingTimeForTask": 51.5,
  "pauseReason": null,
  "remainingTimeAtPause": null,
  ...
}
```

**Behavior:**
- Clears `pause_reason` and `remaining_time_at_pause` when resuming
- Returns `remainingTimeForTask` in response
- Updates elapsed time if `remainingTime` is provided

---

## Response DTO Updates

### RecipeExecutionStatusDto

New fields added:

```typescript
{
  // ... existing fields ...
  remainingTimeForTask?: number;      // Remaining time for entire task (in minutes)
  pauseReason?: string;                // Reason for pausing (if paused)
  remainingTimeAtPause?: number;      // Remaining time when paused (in minutes)
}
```

### remainingTimeForTask Calculation

The `remainingTimeForTask` is calculated as:
- **Sum of remaining times for all incomplete steps**
- For current step: Uses `remainingTimeAtPause` if paused, otherwise calculates from elapsed time
- For future steps: Uses full step duration (not started yet)
- For completed steps: 0 (already done)

**Example:**
- Step 1: Completed (0 remaining)
- Step 2: In progress, 12 minutes remaining
- Step 3: Not started, 30 minutes duration
- Step 4: Not started, 20 minutes duration
- **remainingTimeForTask = 0 + 12 + 30 + 20 = 62 minutes**

---

## Error Handling

### Invalid Remaining Time

If `remainingTime > stepDuration` when pausing:

```json
{
  "statusCode": 400,
  "message": "Invalid remaining time: 50 minutes. Remaining time cannot be greater than step duration (40 minutes).",
  "error": "Bad Request"
}
```

---

## Frontend Integration

### Pause Flow

```typescript
// Pause with reason and remaining time
const response = await fetch(`/tasks/${taskId}/recipe/pause`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reason: 'Waiting for materials',
    remainingTime: 12.0  // Must be <= stepDuration
  })
});

const data = await response.json();
// data.remainingTimeForTask - total remaining time for task
// data.pauseReason - saved pause reason
// data.remainingTimeAtPause - saved remaining time
```

### Resume Flow

```typescript
// Resume execution
const response = await fetch(`/tasks/${taskId}/recipe/resume`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    notes: 'Materials arrived'
  })
});

const data = await response.json();
// data.remainingTimeForTask - updated remaining time for task
// data.pauseReason - null (cleared)
// data.remainingTimeAtPause - null (cleared)
```

---

## Summary of Changes

✅ **Database:**
- Added `pause_reason` column to `task_recipe_executions`
- Added `remaining_time_at_pause` column to `task_recipe_executions`

✅ **Pause Endpoint:**
- Validates `remainingTime <= stepDuration`
- Saves `reason` and `remainingTime` to database
- Returns `remainingTimeForTask` in response

✅ **Resume Endpoint:**
- Clears `pause_reason` and `remaining_time_at_pause`
- Returns `remainingTimeForTask` in response

✅ **Response DTO:**
- Added `remainingTimeForTask` field
- Added `pauseReason` field
- Added `remainingTimeAtPause` field

✅ **Calculation:**
- `remainingTimeForTask` = sum of remaining times for all incomplete steps

---

## Migration Instructions

1. **Run the SQL migration** to add the new columns:
   ```sql
   ALTER TABLE `task_recipe_executions`
   ADD COLUMN `pause_reason` TEXT NULL AFTER `total_elapsed_time`,
   ADD COLUMN `remaining_time_at_pause` DECIMAL(10,2) NULL AFTER `pause_reason`;
   ```

2. **Restart the backend** to apply code changes

3. **Test the endpoints:**
   - Pause with `reason` and `remainingTime`
   - Verify validation (remainingTime > stepDuration should fail)
   - Resume and verify `remainingTimeForTask` is returned

---

## Notes

- All time values are in **minutes** (not seconds or milliseconds)
- `remainingTime` is validated against current step duration, not total recipe time
- `remainingTimeForTask` is calculated dynamically based on all incomplete steps
- Pause information is cleared when resuming (not kept for history)
