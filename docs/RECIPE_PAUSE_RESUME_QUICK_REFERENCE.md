# Recipe Pause/Resume API - Quick Reference

## Endpoints

### Pause Recipe Execution
```
POST /tasks/:taskId/recipe/pause
```

**Request:** Empty body

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "status": "paused",
    "currentStep": {
      "elapsedTime": 25,        // Minutes elapsed (accumulated)
      "remainingTime": 35,       // Minutes remaining
      "stepDuration": 60         // Original step duration
    },
    "currentStepElapsedTime": 25,
    "currentStepRemainingTime": 35,
    "pausedAt": "2024-01-15T10:25:00.000Z"
  }
}
```

---

### Resume Recipe Execution
```
POST /tasks/:taskId/recipe/resume
```

**Request:** Empty body

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "status": "in_progress",
    "currentStep": {
      "elapsedTime": 25,        // Continues from saved value
      "remainingTime": 35,       // Calculated: duration - elapsed
      "stepDuration": 60
    },
    "currentStepElapsedTime": 25,
    "currentStepRemainingTime": 35,
    "resumedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

## Key Response Fields

| Field | Description | Usage |
|-------|-------------|-------|
| `currentStep.elapsedTime` | Time spent on step (minutes, excludes pause) | Display elapsed timer |
| `currentStep.remainingTime` | Time left for step (minutes) | Display countdown timer |
| `currentStep.stepDuration` | Original step duration (minutes) | Calculate percentage |
| `currentStepElapsedTime` | Same as above (convenience) | Use this for timer |
| `currentStepRemainingTime` | Same as above (convenience) | Use this for countdown |

---

## Frontend Timer Example

```javascript
// Get remaining time from API
const remainingTime = response.data.currentStepRemainingTime; // minutes

// Convert to seconds for countdown
let remainingSeconds = remainingTime * 60;

// Start countdown
const timer = setInterval(() => {
  remainingSeconds--;
  
  if (remainingSeconds <= 0) {
    clearInterval(timer);
    // Step should be completed
  }
  
  // Update UI
  displayTime(remainingSeconds);
}, 1000);

// On pause - stop timer
async function pause() {
  const response = await fetch(`/tasks/${taskId}/recipe/pause`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  clearInterval(timer);
  // Update UI with paused state
}

// On resume - restart timer with new remaining time
async function resume() {
  const response = await fetch(`/tasks/${taskId}/recipe/resume`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  remainingSeconds = data.data.currentStepRemainingTime * 60;
  // Restart timer
}
```

---

## Important Points

1. ✅ **Pause saves elapsed time** - Current running time is saved
2. ✅ **Resume continues from saved time** - Timer resumes where it left off
3. ✅ **Pause time excluded** - Only active execution time is counted
4. ✅ **Remaining time calculated** - `remainingTime = stepDuration - elapsedTime`
5. ✅ **Multiple pause/resume supported** - Works correctly for any number of cycles

---

**Full Documentation:** See `docs/RECIPE_PAUSE_RESUME_API.md`
