# Recipe Execution Frontend Integration Guide

This guide will help you integrate the recipe execution functionality into your existing frontend application.

## Prerequisites

1. Backend API is running and accessible
2. JWT authentication is configured
3. Task detail page exists
4. React application setup

## Step-by-Step Integration

### Step 1: Add API Service File

1. Copy `recipeExecutionService.js` to your services directory:
   ```
   src/services/recipeExecutionService.js
   ```

2. Update the import to match your API instance:
   ```javascript
   // If you use axios
   import axios from 'axios';
   const api = axios.create({
     baseURL: process.env.REACT_APP_API_URL,
     headers: {
       'Authorization': `Bearer ${localStorage.getItem('token')}`
     }
   });
   
   // Or if you have an existing API instance
   import api from './api';
   ```

### Step 2: Add Component File

1. Copy `RecipeExecutionComponent.jsx` to your components directory:
   ```
   src/components/RecipeExecutionComponent.jsx
   ```

2. Update imports if needed:
   ```javascript
   import { ... } from '../services/recipeExecutionService';
   ```

### Step 3: Integrate into Task Detail Page

Update your task detail page to include the recipe execution component:

```javascript
import React, { useState, useEffect } from 'react';
import RecipeExecutionComponent from '../components/RecipeExecutionComponent';
import { getTaskDetails } from '../services/taskService'; // Your existing task service

function TaskDetailPage({ taskId }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      const taskData = await getTaskDetails(taskId);
      setTask(taskData);
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="task-detail-page">
      {/* Existing task details */}
      <div className="task-info">
        <h1>{task.task}</h1>
        <p>{task.description}</p>
        {/* ... other task fields ... */}
      </div>

      {/* Recipe Execution Component */}
      {task.costingId && (
        <div className="recipe-execution-section mt-6">
          <RecipeExecutionComponent
            taskId={task.taskId}
            onComplete={(executionStatus) => {
              console.log('Recipe execution completed!', executionStatus);
              // Show success message
              // Update task status
              // Navigate or refresh
            }}
            onError={(error) => {
              console.error('Recipe execution error:', error);
              // Show error message
            }}
          />
        </div>
      )}
    </div>
  );
}

export default TaskDetailPage;
```

### Step 4: Styling Setup

#### Option A: Using Tailwind CSS (Recommended)

If you're using Tailwind CSS, the component should work out of the box.

#### Option B: Using Custom CSS

If you're not using Tailwind, create a CSS file:

```css
/* RecipeExecutionComponent.css */
.recipe-execution-container {
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-not-started { background-color: #6b7280; }
.status-in-progress { background-color: #3b82f6; }
.status-paused { background-color: #eab308; }
.status-completed { background-color: #22c55e; }
.status-cancelled { background-color: #ef4444; }

.progress-bar {
  width: 100%;
  height: 0.75rem;
  background-color: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #2563eb;
  transition: width 0.3s ease;
}

/* Add more styles as needed */
```

Then import it in the component:
```javascript
import './RecipeExecutionComponent.css';
```

### Step 5: Environment Configuration

Make sure your API base URL is configured:

```javascript
// .env file
REACT_APP_API_URL=http://localhost:3005
```

Or in your API service:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';
```

## Customization

### Customizing Button Styles

Modify the button className attributes:

```javascript
// Example: Using your design system
<button
  onClick={handleStart}
  className="btn btn-primary" // Your button class
>
  Start Recipe
</button>
```

### Adding Custom Fields

To add temperature input or notes:

```javascript
// In RecipeExecutionComponent.jsx, add state:
const [stepNotes, setStepNotes] = useState({});
const [stepTemperature, setStepTemperature] = useState({});

// Update completeStep call:
const handleCompleteStep = async (stepOrder) => {
  await completeStep(
    taskId,
    stepOrder,
    null, // actualDuration
    stepTemperature[stepOrder] || null, // actualTemperature
    stepNotes[stepOrder] || null // notes
  );
};
```

### Customizing Progress Calculation

If you want to calculate progress differently:

```javascript
// In startProgressUpdates function
const updateProgress = async () => {
  // Your custom progress calculation
  const customProgress = calculateCustomProgress();
  
  await updateStepProgress(taskId, stepOrder, customProgress);
};
```

## Testing the Integration

### 1. Test Auto-Binding

1. Create a task with a costed product
2. Check that recipe execution is automatically created
3. Verify `recipeExecution` appears in task details

### 2. Test Start Execution

1. Click "Start Recipe" button
2. Verify first step starts
3. Check timer is running
4. Verify progress bar updates

### 3. Test Pause/Resume

1. Start execution
2. Click "Pause"
3. Verify state is saved
4. Refresh page
5. Verify state is restored
6. Click "Resume"
7. Verify execution continues

### 4. Test Step Completion

1. Complete a step
2. Verify next step starts automatically
3. Check progress updates
4. Complete all steps
5. Verify completion state

### 5. Test Error Handling

1. Disconnect network
2. Try to start execution
3. Verify error is displayed
4. Reconnect network
5. Verify retry works

## Common Issues and Solutions

### Issue: Component not showing

**Solution:**
- Check that task has `costingId`
- Verify recipe exists for the costed product
- Check browser console for errors

### Issue: API calls failing with 401

**Solution:**
- Verify JWT token is included in requests
- Check token expiration
- Ensure token is stored correctly

### Issue: State not persisting

**Solution:**
- Verify backend auto-binding is working
- Check that `recipeExecution` is in task details response
- Ensure backend endpoints are accessible

### Issue: Timers not accurate

**Solution:**
- Check that `currentStepElapsedTime` is returned from backend
- Verify timer intervals are set correctly
- Check for timezone issues

## Advanced Features

### Adding Real-time Updates

To add WebSocket support for real-time updates:

```javascript
useEffect(() => {
  if (executionStatus?.status === 'in_progress') {
    const ws = new WebSocket(`ws://localhost:3005/tasks/${taskId}/recipe/ws`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setExecutionStatus(update);
    };
    
    return () => ws.close();
  }
}, [taskId, executionStatus]);
```

### Adding Offline Support

To queue actions when offline:

```javascript
const queueAction = (action, params) => {
  if (navigator.onLine) {
    // Execute immediately
    action(...params);
  } else {
    // Queue for later
    const queue = JSON.parse(localStorage.getItem('actionQueue') || '[]');
    queue.push({ action, params, timestamp: Date.now() });
    localStorage.setItem('actionQueue', JSON.stringify(queue));
  }
};
```

## Performance Optimization

### Memoization

Add React.memo and useMemo for performance:

```javascript
const RecipeExecutionComponent = React.memo(({ taskId, onComplete, onError }) => {
  // Component code
});

// Memoize expensive calculations
const formattedTime = useMemo(() => formatTime(currentStepElapsed), [currentStepElapsed]);
```

### Debouncing Progress Updates

Debounce progress updates to reduce API calls:

```javascript
import { debounce } from 'lodash';

const debouncedUpdateProgress = useMemo(
  () => debounce(updateProgress, 5000), // 5 second debounce
  []
);
```

## Support

For additional help:
- Check backend API documentation
- Review component code comments
- Test with backend team
- Check browser console for errors

