# Task Role-Based Filtering Implementation

## Overview

This document describes the role-based task filtering implementation that restricts task visibility based on user roles.

## Business Logic

### Role-Based Access Control

1. **Super Admin, Admin, or Manager**
   - Can view **ALL tasks** across all phases
   - No filtering applied

2. **Staff or Other Users**
   - Can view **ONLY tasks assigned to them**
   - Tasks are filtered by `assignedUserId = current user's ID`

## Implementation Details

### 1. Authentication

All task endpoints now require JWT authentication:
- `@UseGuards(JwtAuthGuard)` is applied at the controller level
- User information is extracted from the JWT token using `@CurrentUser()` decorator

### 2. Modified Endpoints

#### `GET /tasks/phases/:phaseId/tasks`
- **Before**: Returned all tasks for the specified phase
- **After**: Returns filtered tasks based on user role
  - Super Admin/Admin/Manager: All tasks
  - Staff/Other: Only assigned tasks

#### `GET /tasks/phases?includeTasks=true`
- **Before**: Returned all tasks when `includeTasks=true`
- **After**: Returns filtered tasks based on user role
  - Super Admin/Admin/Manager: All tasks
  - Staff/Other: Only assigned tasks

### 3. Service Layer Changes

#### `TasksService.getPhaseTasks()`
- Added `currentUser` parameter
- Implements role-based filtering in the database query
- Uses `canUserViewAllTasks()` helper method to determine access level

#### `TasksService.listPhases()`
- Added `currentUser` parameter
- Applies role-based filtering to tasks when `includeTasks=true`
- Filters tasks in memory after fetching from database

#### `TasksService.canUserViewAllTasks()`
- **New helper method** to check if user can view all tasks
- Checks if user role is one of: `super_admin`, `admin`, or `manager` (case-insensitive)
- Returns `true` for elevated roles, `false` otherwise

## Role Detection

The system checks user roles from the JWT token:
- Role is extracted from `currentUser.role` or `currentUser.roles[0]`
- Role codes are normalized to lowercase for comparison
- Supported elevated roles:
  - `super_admin` (from database role code `SUPER_ADMIN`)
  - `admin` (from database role code `ADMIN`)
  - `manager` (from database role code `MANAGER`)

## Code Changes

### Controller (`tasks.controller.ts`)

```typescript
@Controller('tasks')
@UseGuards(JwtAuthGuard) // Added authentication guard
export class TasksController {
  @Get('phases/:phaseId/tasks')
  async listPhaseTasks(
    @Param('phaseId') phaseId: string,
    @Query('status') status?: string | string[],
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: any, // Added current user
  ) {
    // ... passes currentUser to service
  }

  @Get('phases')
  async listPhases(
    @Query('includeTasks') includeTasks?: string,
    @CurrentUser() currentUser?: any, // Added current user
  ) {
    // ... passes currentUser to service
  }
}
```

### Service (`tasks.service.ts`)

```typescript
async getPhaseTasks(
  phaseId: string,
  filters: PhaseTaskFilters,
  currentUser?: any, // Added current user parameter
): Promise<{...}> {
  const canViewAllTasks = this.canUserViewAllTasks(currentUser);
  const userId = currentUser?.userId || currentUser?.sub;

  const qb = this.taskRepository
    .createQueryBuilder('task')
    .where('task.phase_id = :phaseId', { phaseId });

  // Apply role-based filtering
  if (!canViewAllTasks && userId) {
    qb.andWhere('task.assigned_user_id = :userId', { userId });
  }

  // ... rest of query building
}

private canUserViewAllTasks(currentUser?: any): boolean {
  const userRole = currentUser?.role || (currentUser?.roles && currentUser?.roles[0]) || '';
  const normalizedRole = typeof userRole === 'string' ? userRole.toLowerCase() : '';
  const elevatedRoles = ['super_admin', 'admin', 'manager'];
  return elevatedRoles.includes(normalizedRole);
}
```

## Database Query Impact

### For Staff/Other Users
```sql
SELECT * FROM tasks
WHERE phase_id = :phaseId
  AND assigned_user_id = :userId  -- Added filter
  AND status IN (:...status)
  AND due_date >= :dateFrom
  AND due_date <= :dateTo
  ...
```

### For Super Admin/Admin/Manager
```sql
SELECT * FROM tasks
WHERE phase_id = :phaseId
  -- No assigned_user_id filter
  AND status IN (:...status)
  AND due_date >= :dateFrom
  AND due_date <= :dateTo
  ...
```

## Logging

Comprehensive logging has been added to track:
- User ID and role for each request
- Whether user can view all tasks
- Number of tasks returned after filtering
- Filtering decisions made

Example log output:
```
getPhaseTasks - User ID: abc-123, Role: staff, Can view all tasks: false
getPhaseTasks - Filtering tasks for user: abc-123
getPhaseTasks - Found 5 tasks for phase xyz-789
```

## Testing

### Test Cases

1. **Super Admin User**
   - Login as Super Admin
   - Request: `GET /tasks/phases/:phaseId/tasks`
   - Expected: All tasks in the phase

2. **Admin User**
   - Login as Admin
   - Request: `GET /tasks/phases/:phaseId/tasks`
   - Expected: All tasks in the phase

3. **Manager User**
   - Login as Manager
   - Request: `GET /tasks/phases/:phaseId/tasks`
   - Expected: All tasks in the phase

4. **Staff User**
   - Login as Staff
   - Request: `GET /tasks/phases/:phaseId/tasks`
   - Expected: Only tasks where `assignedUserId = staff user's ID`

5. **Staff User with No Assigned Tasks**
   - Login as Staff
   - Request: `GET /tasks/phases/:phaseId/tasks`
   - Expected: Empty array `[]`

6. **Unauthenticated Request**
   - Request: `GET /tasks/phases/:phaseId/tasks` (no token)
   - Expected: 401 Unauthorized

## Security Considerations

1. **Authentication Required**: All task endpoints now require valid JWT token
2. **Role-Based Access**: Access is determined by user role from JWT token
3. **User ID Validation**: User ID is extracted from JWT token (cannot be spoofed)
4. **Database-Level Filtering**: Filtering is applied at the database query level for better performance and security

## Backward Compatibility

- If `currentUser` is not provided (e.g., in tests or legacy code), the system falls back to showing all tasks
- This ensures backward compatibility but should be avoided in production

## Future Enhancements

Potential improvements:
1. Add role-based filtering to other task endpoints (e.g., task details, task updates)
2. Support for custom role permissions (e.g., "View All Tasks" permission)
3. Audit logging for task access
4. Support for team-based task visibility

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-16  
**Implemented By:** Development Team

