/**
 * Recipe Execution API Service
 * 
 * This service handles all API calls related to recipe execution for tasks.
 * All endpoints require JWT authentication.
 * 
 * Base URL: /tasks/:taskId/recipe
 */

import api from './api'; // Your existing API instance

/**
 * Start recipe execution for a task
 * @param {string} taskId - The task ID
 * @param {string} [recipeId] - Optional recipe ID (will auto-find from costed product if not provided)
 * @returns {Promise<RecipeExecutionStatus>}
 */
export const startRecipeExecution = async (taskId, recipeId = null) => {
  try {
    const response = await api.post(`/tasks/${taskId}/recipe/start`, {
      recipeId: recipeId || undefined,
    });
    return response.data;
  } catch (error) {
    console.error('Error starting recipe execution:', error);
    throw error;
  }
};

/**
 * Pause recipe execution
 * @param {string} taskId - The task ID
 * @returns {Promise<RecipeExecutionStatus>}
 */
export const pauseRecipeExecution = async (taskId) => {
  try {
    const response = await api.post(`/tasks/${taskId}/recipe/pause`);
    return response.data;
  } catch (error) {
    console.error('Error pausing recipe execution:', error);
    throw error;
  }
};

/**
 * Resume recipe execution
 * @param {string} taskId - The task ID
 * @returns {Promise<RecipeExecutionStatus>}
 */
export const resumeRecipeExecution = async (taskId) => {
  try {
    const response = await api.post(`/tasks/${taskId}/recipe/resume`);
    return response.data;
  } catch (error) {
    console.error('Error resuming recipe execution:', error);
    throw error;
  }
};

/**
 * Update step progress
 * @param {string} taskId - The task ID
 * @param {number} stepOrder - The step order (1, 2, 3, ...)
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} [actualTemperature] - Optional actual temperature recorded
 * @param {string} [notes] - Optional notes or observations
 * @returns {Promise<RecipeExecutionStatus>}
 */
export const updateStepProgress = async (
  taskId,
  stepOrder,
  progress,
  actualTemperature = null,
  notes = null
) => {
  try {
    const response = await api.post(
      `/tasks/${taskId}/recipe/steps/${stepOrder}/progress`,
      {
        progress,
        actualTemperature: actualTemperature || undefined,
        notes: notes || undefined,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating step progress:', error);
    throw error;
  }
};

/**
 * Complete a step
 * @param {string} taskId - The task ID
 * @param {number} stepOrder - The step order (1, 2, 3, ...)
 * @param {number} [actualDuration] - Optional actual duration in minutes
 * @param {number} [actualTemperature] - Optional final temperature recorded
 * @param {string} [notes] - Optional completion notes
 * @returns {Promise<RecipeExecutionStatus>}
 */
export const completeStep = async (
  taskId,
  stepOrder,
  actualDuration = null,
  actualTemperature = null,
  notes = null
) => {
  try {
    const response = await api.post(
      `/tasks/${taskId}/recipe/steps/${stepOrder}/complete`,
      {
        actualDuration: actualDuration || undefined,
        actualTemperature: actualTemperature || undefined,
        notes: notes || undefined,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error completing step:', error);
    throw error;
  }
};

/**
 * Get recipe execution status
 * @param {string} taskId - The task ID
 * @returns {Promise<RecipeExecutionStatus>}
 */
export const getRecipeExecutionStatus = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}/recipe/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting recipe execution status:', error);
    throw error;
  }
};

/**
 * Cancel recipe execution
 * @param {string} taskId - The task ID
 * @returns {Promise<RecipeExecutionStatus>}
 */
export const cancelRecipeExecution = async (taskId) => {
  try {
    const response = await api.post(`/tasks/${taskId}/recipe/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling recipe execution:', error);
    throw error;
  }
};

/**
 * Get task details (includes recipeExecution if available)
 * @param {string} taskId - The task ID
 * @returns {Promise<TaskDetailResponse>}
 */
export const getTaskDetails = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting task details:', error);
    throw error;
  }
};

/**
 * Recipe Execution Status Types
 * 
 * @typedef {Object} RecipeExecutionStatus
 * @property {string} id - Execution ID
 * @property {string} executionId - Execution ID (same as id)
 * @property {string} status - Execution status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
 * @property {Object} [currentStep] - Current step being executed
 * @property {string} currentStep.stepId - Step ID
 * @property {number} currentStep.stepOrder - Step order (1, 2, 3, ...)
 * @property {string} currentStep.instruction - Step instruction
 * @property {number} currentStep.progress - Step progress (0-100)
 * @property {string} currentStep.status - Step status
 * @property {Date} currentStep.startedAt - Step start time
 * @property {number} [currentStep.elapsedTime] - Current step elapsed time in minutes
 * @property {number} overallProgress - Overall progress (0-100)
 * @property {number} totalSteps - Total number of steps
 * @property {number} completedSteps - Number of completed steps
 * @property {number} elapsedTime - Total elapsed time in minutes
 * @property {number} [currentStepElapsedTime] - Current step elapsed time in minutes
 * @property {Date} [startedAt] - Execution start time
 * @property {Date} [pausedAt] - Execution pause time
 * @property {Date} [resumedAt] - Execution resume time
 * @property {Date} [completedAt] - Execution completion time
 * @property {Object} recipe - Recipe details
 * @property {Array<StepExecutionStatus>} stepExecutions - Array of step execution statuses
 */

/**
 * Step Execution Status Type
 * 
 * @typedef {Object} StepExecutionStatus
 * @property {string} id - Step execution ID
 * @property {string} stepId - Recipe step ID
 * @property {number} stepOrder - Step order (1, 2, 3, ...)
 * @property {string} instruction - Step instruction
 * @property {string} status - Step status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'skipped'
 * @property {number} progress - Step progress (0-100)
 * @property {number} [actualTemperature] - Actual temperature recorded
 * @property {number} [actualDuration] - Actual duration in minutes
 * @property {Date} [startedAt] - Step start time
 * @property {Date} [completedAt] - Step completion time
 * @property {string} [notes] - Step notes
 */

export default {
  startRecipeExecution,
  pauseRecipeExecution,
  resumeRecipeExecution,
  updateStepProgress,
  completeStep,
  getRecipeExecutionStatus,
  cancelRecipeExecution,
  getTaskDetails,
};

