# Recipe Execution Frontend Implementation

This directory contains the frontend implementation for recipe execution functionality with pause/resume capabilities.

## Files

1. **recipeExecutionService.js** - API service functions for all recipe execution endpoints
2. **RecipeExecutionComponent.jsx** - React component for recipe execution UI

## Setup Instructions

### 1. Install Dependencies

Make sure you have the required dependencies in your project:
- React
- Axios (or your HTTP client)
- Your existing API configuration

### 2. API Service Setup

Update the import in `recipeExecutionService.js` to match your API instance:

```javascript
import api from './api'; // Update this path to your API instance
```

Your API instance should:
- Include JWT token in Authorization header
- Handle errors appropriately
- Return response data in the expected format

### 3. Component Integration

Import and use the component in your task detail page:

```javascript
import RecipeExecutionComponent from './components/RecipeExecutionComponent';

function TaskDetailPage({ taskId }) {
  return (
    <div>
      {/* Other task details */}
      <RecipeExecutionComponent 
        taskId={taskId}
        onComplete={(executionStatus) => {
          console.log('Execution completed:', executionStatus);
          // Handle completion
        }}
        onError={(error) => {
          console.error('Execution error:', error);
          // Handle error
        }}
      />
    </div>
  );
}
```

## Features

### ✅ Implemented Features

1. **Auto-load Execution Status**
   - Loads execution status from backend on component mount
   - Restores state from backend (paused, in-progress, etc.)
   - Handles page refresh gracefully

2. **Start/Pause/Resume**
   - Start recipe execution
   - Pause execution (saves progress)
   - Resume from where left off

3. **Progress Tracking**
   - Real-time progress updates (every 30 seconds)
   - Visual progress bars
   - Elapsed time tracking

4. **Step Management**
   - Display all steps with status
   - Highlight current step
   - Complete steps (auto-advances to next)

5. **State Persistence**
   - All state saved to backend
   - Survives page refresh
   - Multi-tab support (refreshes on focus)

6. **Error Handling**
   - Displays errors to user
   - Retry functionality
   - Graceful error recovery

## Usage Examples

### Basic Usage

```javascript
<RecipeExecutionComponent taskId="TASK-123" />
```

### With Callbacks

```javascript
<RecipeExecutionComponent 
  taskId="TASK-123"
  onComplete={(status) => {
    // Handle completion
    showSuccessMessage('Recipe execution completed!');
    navigateToNextPage();
  }}
  onError={(error) => {
    // Handle errors
    showErrorMessage(error.message);
  }}
/>
```

## API Integration

The component uses the following API endpoints:

- `POST /tasks/:taskId/recipe/start` - Start execution
- `POST /tasks/:taskId/recipe/pause` - Pause execution
- `POST /tasks/:taskId/recipe/resume` - Resume execution
- `POST /tasks/:taskId/recipe/steps/:stepOrder/progress` - Update progress
- `POST /tasks/:taskId/recipe/steps/:stepOrder/complete` - Complete step
- `GET /tasks/:taskId/recipe/status` - Get status
- `POST /tasks/:taskId/recipe/cancel` - Cancel execution
- `GET /tasks/:taskId` - Get task details (includes recipeExecution)

## State Management

The component manages the following state:

- `executionStatus` - Current execution status from backend
- `loading` - Loading state for API calls
- `error` - Error messages
- `isPaused` - Pause state
- `currentStepElapsed` - Current step elapsed time
- `totalElapsed` - Total elapsed time

## Timer Management

The component uses two timers:

1. **Step Timer** - Updates current step elapsed time every second
2. **Progress Update Timer** - Updates progress on backend every 30 seconds

Timers are automatically:
- Started when execution is in progress
- Stopped when execution is paused
- Cleared on component unmount

## Styling

The component uses Tailwind CSS classes. If you're not using Tailwind, you'll need to:

1. Install Tailwind CSS, or
2. Replace Tailwind classes with your CSS framework classes, or
3. Add custom CSS for the component

### Custom Styling

You can customize the styling by modifying the className attributes in the component.

## Edge Cases Handled

1. **Page Refresh** - State restored from backend
2. **Multiple Tabs** - Refreshes status when window regains focus
3. **Network Errors** - Displays error with retry option
4. **Concurrent Updates** - Backend validates state transitions
5. **Execution Already Started** - Prevents duplicate starts
6. **Step Already Completed** - Prevents duplicate completions
7. **Execution Completed** - Shows completion state
8. **Execution Cancelled** - Allows restart

## Testing

### Manual Testing Checklist

- [ ] Start execution
- [ ] Pause execution
- [ ] Resume execution
- [ ] Complete step (auto-advances)
- [ ] Page refresh (state restored)
- [ ] Multiple tabs (syncs correctly)
- [ ] Network error handling
- [ ] Progress updates (every 30s)
- [ ] Timer accuracy
- [ ] Cancel execution

## Troubleshooting

### Issue: API calls failing

**Solution:** Check that:
- API base URL is correct
- JWT token is included in requests
- CORS is configured correctly

### Issue: State not restoring on refresh

**Solution:** Ensure:
- `getTaskDetails` includes `recipeExecution` in response
- Backend auto-binding is working
- Task has a costed product with recipe

### Issue: Timers not working

**Solution:** Check:
- Component is not unmounting unexpectedly
- `mountedRef` is set correctly
- Intervals are cleared properly

## Next Steps

1. **Customize Styling** - Adjust to match your design system
2. **Add Features** - Temperature input, notes, etc.
3. **Add Tests** - Unit and integration tests
4. **Optimize** - Performance optimizations if needed

## Support

For issues or questions, refer to:
- Backend API Documentation: `RECIPE_EXECUTION_API.md`
- Backend Updates: `RECIPE_EXECUTION_BACKEND_UPDATES.md`

