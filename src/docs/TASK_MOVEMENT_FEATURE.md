# Task Movement & Phase Transition Feature

## Overview

This feature allows tasks to be moved between phases (e.g., from "Manufacturing" to "Packing") with complete history tracking. This is essential for Kanban board workflows where tasks flow through different phases as they progress.

---

## Database Changes

### New Entity: `TaskMovementHistoryEntity`

**Table:** `task_movement_history`

**Fields:**
- `id` (UUID, Primary Key)
- `task_id` (UUID, Foreign Key to tasks)
- `from_phase_id` (UUID, Foreign Key to phases)
- `to_phase_id` (UUID, Foreign Key to phases)
- `from_status` (string, nullable)
- `to_status` (string, nullable)
- `moved_by_user_id` (UUID, nullable, Foreign Key to users)
- `moved_by_name` (string, nullable)
- `moved_at` (timestamp)
- `reason` (text, nullable) - Optional reason/notes for the movement

**Relations:**
- Many-to-One with `TaskEntity`
- Many-to-One with `TaskPhaseEntity` (fromPhase)
- Many-to-One with `TaskPhaseEntity` (toPhase)
- Many-to-One with `User` (movedByUser)

---

## API Endpoints

### 1. Move Task to Another Phase

**Endpoint:** `POST /tasks/:taskId/move`

**Purpose:** Move a task from its current phase to another phase.

**Request Body:**
```json
{
  "toPhaseId": "phase-uuid-5678",     // Required - Target phase UUID
  "toStatus": "pending",               // Optional - Target status (defaults to first status of target phase)
  "order": 0,                          // Optional - Target order position (defaults to next available)
  "reason": "Task completed in Manufacturing, moving to Packing",  // Optional
  "movedBy": "user-uuid-1234"         // Optional - User ID or name
}
```

**What It Does:**
1. Validates task exists
2. Validates target phase exists
3. Validates target status is allowed in target phase
4. Creates movement history record
5. Updates task phase, status, and order
6. Adjusts task orders in target phase/status
7. Returns updated task with all relations

---

### 2. Get Task Movement History

**Endpoint:** `GET /tasks/:taskId/movement-history`

**Purpose:** Retrieve complete movement history for a task.

**Response:** Array of movement records, sorted by most recent first.

**Use Cases:**
- Track task lifecycle through phases
- Audit trail for task movements
- Understand task progression
- Debugging phase transitions

---

## Business Logic

### Movement Process

1. **Validation:**
   - Task must exist
   - Target phase must exist
   - Cannot move to the same phase
   - Target status must be valid for target phase

2. **History Recording:**
   - Records source phase and status
   - Records target phase and status
   - Records who initiated the movement
   - Records optional reason/notes
   - Records timestamp

3. **Task Update:**
   - Updates task phase
   - Updates task status (or uses default)
   - Updates task order (or calculates next available)
   - Maintains all other task data

4. **Order Management:**
   - Shifts existing tasks in target phase/status
   - Ensures no order conflicts

---

## Use Case Example: Kanban Board Workflow

### Scenario: Manufacturing → Packing

**Step 1: Task in Manufacturing Phase**
```
Task: "Manufacturing Gel -100ml pack"
Phase: "Manufacturing"
Status: "ongoing"
```

**Step 2: Mark Task as Completed**
```
Update task status to "completed"
```

**Step 3: Move to Packing Phase**
```
POST /tasks/{taskId}/move
{
  "toPhaseId": "packing-phase-uuid",
  "toStatus": "pending",
  "reason": "Task completed in Manufacturing, moving to Packing phase",
  "movedBy": "current-user-uuid"
}
```

**Step 4: Result**
```
Task now appears in "Packing" phase
Status changed to "pending"
Movement history recorded
```

**Step 5: View History**
```
GET /tasks/{taskId}/movement-history
Returns all phase transitions
```

---

## Integration with Frontend

### Kanban Board Integration

When a task status changes to "completed" in a phase:

1. **Option 1: Manual Movement**
   - Show "Move to Next Phase" button
   - User selects target phase
   - Call `POST /tasks/:taskId/move`

2. **Option 2: Automatic Movement**
   - Frontend detects "completed" status
   - Automatically calls move endpoint to next phase
   - Show confirmation dialog

3. **Display Movement History**
   - Add "History" tab/modal to task details
   - Call `GET /tasks/:taskId/movement-history`
   - Display timeline of phase transitions

### Frontend Flow

```javascript
// When task status becomes "completed"
if (task.status === 'completed') {
  // Show phase selection modal
  const targetPhase = await selectPhase();
  
  // Move task to selected phase
  const response = await fetch(`/tasks/${task.id}/move`, {
    method: 'POST',
    body: JSON.stringify({
      toPhaseId: targetPhase.id,
      toStatus: targetPhase.statuses[0], // First status of target phase
      reason: `Task completed in ${currentPhase.name}`,
      movedBy: currentUser.id
    })
  });
  
  // Refresh kanban board
  refreshBoard();
}

// View history
const history = await fetch(`/tasks/${task.id}/movement-history`);
// Display timeline view
```

---

## Files Modified/Created

### New Files
1. `src/modules/tasks/entities/task-movement-history.entity.ts`
2. `src/docs/TASK_MOVEMENT_FEATURE.md` (this file)

### Modified Files
1. `src/common/interfaces/task.interface.ts`
   - Added `MoveTaskDto`
   - Added `TaskMovementHistoryResponseDto`

2. `src/modules/tasks/tasks.module.ts`
   - Added `TaskMovementHistoryEntity` to TypeORM imports

3. `src/modules/tasks/tasks.service.ts`
   - Added `moveTaskToPhase()` method
   - Added `getTaskMovementHistory()` method
   - Added `mapMovementHistoryToResponseDto()` helper

4. `src/modules/tasks/tasks.controller.ts`
   - Added `POST /tasks/:taskId/move` endpoint
   - Added `GET /tasks/:taskId/movement-history` endpoint

5. `src/docs/TASK_API.md`
   - Added Task Movement & Phase Management APIs section

---

## Migration Required

When deploying this feature, you'll need to create a database migration:

```sql
CREATE TABLE `task_movement_history` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `task_id` VARCHAR(36) NOT NULL,
  `from_phase_id` VARCHAR(36) NOT NULL,
  `to_phase_id` VARCHAR(36) NOT NULL,
  `from_status` VARCHAR(50) NULL,
  `to_status` VARCHAR(50) NULL,
  `moved_by_user_id` VARCHAR(36) NULL,
  `moved_by_name` VARCHAR(255) NULL,
  `reason` TEXT NULL,
  `moved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_from_phase_id` (`from_phase_id`),
  INDEX `idx_to_phase_id` (`to_phase_id`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_phase_id`) REFERENCES `task_phases`(`id`),
  FOREIGN KEY (`to_phase_id`) REFERENCES `task_phases`(`id`),
  FOREIGN KEY (`moved_by_user_id`) REFERENCES `users`(`id`)
);
```

---

## Testing Checklist

- [ ] Move task from Phase A to Phase B
- [ ] Verify movement history is created
- [ ] Verify task phase/status/order is updated
- [ ] Verify cannot move to same phase
- [ ] Verify target status validation
- [ ] Verify order adjustment in target phase
- [ ] Retrieve movement history for task
- [ ] Test with user ID in movedBy
- [ ] Test with user name in movedBy
- [ ] Test with reason field
- [ ] Verify history ordering (most recent first)

---

## Best Practices

1. **Always Provide Reason**: Include a reason when moving tasks to document why the movement occurred
2. **Track User**: Always include `movedBy` to track who initiated the movement
3. **Status Selection**: Use appropriate status for target phase (usually first status)
4. **Order Management**: Let the system auto-calculate order unless specific positioning is needed
5. **History Review**: Regularly review movement history to understand workflow patterns

---

**Document Version:** 1.0  
**Created:** 2025-12-13  
**Related Documents:** TASK_API.md

