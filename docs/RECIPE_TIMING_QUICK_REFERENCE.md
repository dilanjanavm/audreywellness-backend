# Recipe Execution Timing API - Quick Reference

## Overview

Frontend can now send `remainingTime` when pausing/resuming/completing steps. Backend calculates elapsed time and returns updated timing information.

---

## Endpoints Summary

| Endpoint | Method | Purpose | Key Field |
|----------|--------|---------|-----------|
| `/tasks/:taskId/recipe/pause` | POST | Pause execution | `remainingTime?` |
| `/tasks/:taskId/recipe/resume` | POST | Resume execution | `remainingTime?` |
| `/tasks/:taskId/recipe/steps/:stepOrder/complete` | POST | Complete step | `remainingTime?` or `actualDuration?` |

---

## Request Examples

### Pause

```json
POST /tasks/TASK-123/recipe/pause
{
  "reason": "Waiting for materials",
  "remainingTime": 25.5
}
```

### Resume

```json
POST /tasks/TASK-123/recipe/resume
{
  "notes": "Materials arrived",
  "remainingTime": 25.3
}
```

### Complete Step

```json
POST /tasks/TASK-123/recipe/steps/2/complete
{
  "remainingTime": 0,
  "actualTemperature": 82,
  "notes": "Completed"
}
```

---

## Response Structure

All endpoints return `RecipeExecutionStatusDto` with timing info:

```json
{
  "currentStep": {
    "elapsedTime": 14.5,      // Minutes elapsed
    "remainingTime": 25.5,     // Minutes remaining
    "stepDuration": 40         // Original duration
  },
  "currentStepElapsedTime": 14.5,
  "currentStepRemainingTime": 25.5,
  "elapsedTime": 75            // Total elapsed time
}
```

---

## Key Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `remainingTime` | number | No | Remaining time in minutes (from frontend timer) |
| `actualDuration` | number | No | Actual duration in minutes (alternative to remainingTime) |
| `reason` | string | No | Reason for pausing |
| `notes` | string | No | Notes about resuming/completing |

---

## Frontend Integration

### Best Practice Flow

1. **Maintain local timer** on frontend
2. **Send `remainingTime`** when pausing/resuming/completing
3. **Update local timer** from backend response

### Example

```typescript
// Pause with remaining time
const response = await api.pause(taskId, {
  remainingTime: localTimer.getRemainingMinutes()
});

// Update from backend
localTimer.setRemainingTime(response.currentStepRemainingTime);
```

---

## Calculation Logic

### If `remainingTime` Provided:
```typescript
elapsedTime = stepDuration - remainingTime
```

### If Not Provided:
Backend calculates from timestamps (fallback)

---

## Important Notes

- ⏱️ All time values are in **minutes**
- ✅ `remainingTime` is **optional** - backend will calculate if not provided
- 🔄 Always update frontend timer from backend response
- 📊 Response includes `currentStepRemainingTime` for easy access

---

## Status Codes

- `200` - Success
- `400` - Bad Request (wrong status)
- `404` - Not Found

---

## Quick Checklist

- [ ] Send `remainingTime` when pausing
- [ ] Send `remainingTime` when resuming (optional)
- [ ] Send `remainingTime` or `actualDuration` when completing
- [ ] Update local timer from backend `currentStepRemainingTime`
- [ ] All time values in minutes
