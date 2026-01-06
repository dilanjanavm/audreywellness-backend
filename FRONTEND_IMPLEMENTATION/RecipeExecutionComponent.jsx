/**
 * Recipe Execution Component
 * 
 * This component handles recipe execution for tasks with pause/resume functionality.
 * It integrates with the backend API to persist state and allow resuming from where left off.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  startRecipeExecution,
  pauseRecipeExecution,
  resumeRecipeExecution,
  updateStepProgress,
  completeStep,
  getRecipeExecutionStatus,
  cancelRecipeExecution,
  getTaskDetails,
} from '../services/recipeExecutionService';

const RecipeExecutionComponent = ({ taskId, onComplete, onError }) => {
  // State management
  const [executionStatus, setExecutionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepElapsed, setCurrentStepElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  // Refs for timers and intervals
  const progressUpdateIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  /**
   * Load execution status from backend
   */
  const loadExecutionStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get from task details (includes recipeExecution)
      const taskDetails = await getTaskDetails(taskId);
      
      if (taskDetails.recipeExecution) {
        // Execution exists, use it
        setExecutionStatus(taskDetails.recipeExecution);
        restoreStateFromBackend(taskDetails.recipeExecution);
      } else {
        // No execution yet, check if recipe exists
        if (taskDetails.recipe) {
          // Recipe exists but execution not started
          setExecutionStatus({
            status: 'not_started',
            recipe: taskDetails.recipe,
            stepExecutions: [],
          });
        } else {
          setError('No recipe found for this task');
        }
      }
    } catch (err) {
      console.error('Error loading execution status:', err);
      setError(err.response?.data?.message || 'Failed to load execution status');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [taskId, onError]);

  /**
   * Restore state from backend data
   */
  const restoreStateFromBackend = (executionData) => {
    if (!executionData) return;

    // Restore execution status
    setExecutionStatus(executionData);

    // Restore pause state
    setIsPaused(executionData.status === 'paused');

    // Restore elapsed times
    if (executionData.currentStepElapsedTime !== undefined) {
      setCurrentStepElapsed(executionData.currentStepElapsedTime);
    }
    if (executionData.elapsedTime !== undefined) {
      setTotalElapsed(executionData.elapsedTime);
    }

    // If in progress or paused, start timers
    if (executionData.status === 'in_progress') {
      startTimers(executionData);
      startProgressUpdates(executionData);
    } else if (executionData.status === 'paused') {
      // Don't start timers for paused state
      clearTimers();
    }
  };

  /**
   * Start execution
   */
  const handleStart = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await startRecipeExecution(taskId);
      setExecutionStatus(response);
      setIsPaused(false);
      
      // Start timers and progress updates
      startTimers(response);
      startProgressUpdates(response);
    } catch (err) {
      console.error('Error starting execution:', err);
      setError(err.response?.data?.message || 'Failed to start execution');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pause execution
   */
  const handlePause = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await pauseRecipeExecution(taskId);
      setExecutionStatus(response);
      setIsPaused(true);
      
      // Stop timers
      clearTimers();
    } catch (err) {
      console.error('Error pausing execution:', err);
      setError(err.response?.data?.message || 'Failed to pause execution');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resume execution
   */
  const handleResume = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await resumeRecipeExecution(taskId);
      setExecutionStatus(response);
      setIsPaused(false);
      
      // Restart timers and progress updates
      startTimers(response);
      startProgressUpdates(response);
    } catch (err) {
      console.error('Error resuming execution:', err);
      setError(err.response?.data?.message || 'Failed to resume execution');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Complete current step
   */
  const handleCompleteStep = async (stepOrder, actualDuration = null, actualTemperature = null, notes = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await completeStep(taskId, stepOrder, actualDuration, actualTemperature, notes);
      setExecutionStatus(response);

      // If execution completed, stop timers
      if (response.status === 'completed') {
        clearTimers();
        if (onComplete) onComplete(response);
      } else {
        // Next step started automatically, update timers
        startTimers(response);
        startProgressUpdates(response);
      }
    } catch (err) {
      console.error('Error completing step:', err);
      setError(err.response?.data?.message || 'Failed to complete step');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel execution
   */
  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this execution?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await cancelRecipeExecution(taskId);
      setExecutionStatus(response);
      clearTimers();
    } catch (err) {
      console.error('Error cancelling execution:', err);
      setError(err.response?.data?.message || 'Failed to cancel execution');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start timers for elapsed time tracking
   */
  const startTimers = (executionData) => {
    clearTimers();

    // Timer for current step elapsed time
    if (executionData.currentStep?.startedAt) {
      const startTime = new Date(executionData.currentStep.startedAt).getTime();
      const baseElapsed = executionData.currentStepElapsedTime || 0;

      timerIntervalRef.current = setInterval(() => {
        if (!mountedRef.current || isPaused) return;

        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / (1000 * 60)) + baseElapsed;
        setCurrentStepElapsed(elapsed);
      }, 1000); // Update every second
    }

    // Timer for total elapsed time
    if (executionData.startedAt) {
      const startTime = new Date(executionData.startedAt).getTime();
      const baseElapsed = executionData.elapsedTime || 0;

      // Note: Total elapsed time is accumulated by backend, so we just display it
      setTotalElapsed(baseElapsed);
    }
  };

  /**
   * Start periodic progress updates (every 30 seconds)
   */
  const startProgressUpdates = (executionData) => {
    clearProgressUpdates();

    if (!executionData.currentStep) return;

    const currentStep = executionData.currentStep;
    const stepOrder = currentStep.stepOrder;

    // Calculate progress based on elapsed time and step duration
    const updateProgress = async () => {
      if (!mountedRef.current || isPaused) return;

      try {
        // Get recipe step to find duration
        const recipeStep = executionData.recipe?.steps?.find(
          (s) => s.order === stepOrder
        );

        if (recipeStep && recipeStep.duration) {
          // Calculate progress based on elapsed time
          const elapsedMinutes = currentStepElapsed;
          const progress = Math.min(
            Math.round((elapsedMinutes / recipeStep.duration) * 100),
            100
          );

          // Update progress on backend
          await updateStepProgress(taskId, stepOrder, progress);
        }
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    };

    // Update immediately
    updateProgress();

    // Then update every 30 seconds
    progressUpdateIntervalRef.current = setInterval(updateProgress, 30000);
  };

  /**
   * Clear all timers
   */
  const clearTimers = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  /**
   * Clear progress update interval
   */
  const clearProgressUpdates = () => {
    if (progressUpdateIntervalRef.current) {
      clearInterval(progressUpdateIntervalRef.current);
      progressUpdateIntervalRef.current = null;
    }
  };

  /**
   * Format time in MM:SS format
   */
  const formatTime = (minutes) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get step status badge color
   */
  const getStepStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  /**
   * Get execution status badge
   */
  const getExecutionStatusBadge = () => {
    if (!executionStatus) return null;

    const status = executionStatus.status;
    const statusConfig = {
      not_started: { label: 'Not Started', color: 'bg-gray-500' },
      in_progress: { label: 'In Progress', color: 'bg-blue-500' },
      paused: { label: 'Paused', color: 'bg-yellow-500' },
      completed: { label: 'Completed', color: 'bg-green-500' },
      cancelled: { label: 'Cancelled', color: 'bg-red-500' },
    };

    const config = statusConfig[status] || statusConfig.not_started;

    return (
      <span
        className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Load execution status on mount
  useEffect(() => {
    mountedRef.current = true;
    loadExecutionStatus();

    return () => {
      mountedRef.current = false;
      clearTimers();
      clearProgressUpdates();
    };
  }, [taskId, loadExecutionStatus]);

  // Refresh status when window regains focus (for multi-tab support)
  useEffect(() => {
    const handleFocus = () => {
      if (executionStatus?.status === 'in_progress' || executionStatus?.status === 'paused') {
        loadExecutionStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [executionStatus, loadExecutionStatus]);

  if (loading && !executionStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading execution status...</div>
      </div>
    );
  }

  if (error && !executionStatus) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadExecutionStatus}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!executionStatus || !executionStatus.recipe) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">No recipe found for this task.</p>
      </div>
    );
  }

  const { recipe, currentStep, stepExecutions, overallProgress, totalSteps, completedSteps } = executionStatus;

  return (
    <div className="recipe-execution-container p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800">{recipe.name}</h2>
          {getExecutionStatusBadge()}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Batch Size: {recipe.batchSize}</span>
          <span>Total Time: {recipe.totalTime} minutes</span>
          <span>Steps: {completedSteps}/{totalSteps} completed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mb-6 flex gap-2">
        {executionStatus.status === 'not_started' && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Start Recipe
          </button>
        )}

        {executionStatus.status === 'in_progress' && (
          <>
            <button
              onClick={handlePause}
              disabled={loading}
              className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Pause
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}

        {executionStatus.status === 'paused' && (
          <>
            <button
              onClick={handleResume}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Resume
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}

        {executionStatus.status === 'completed' && (
          <div className="px-6 py-2 bg-green-100 text-green-800 rounded">
            Recipe execution completed successfully!
          </div>
        )}
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-800">
              Step {currentStep.stepOrder}: {currentStep.instruction}
            </h3>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStepStatusColor(currentStep.status)} text-white`}>
              {currentStep.status}
            </span>
          </div>
          
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{currentStep.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentStep.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Elapsed: {formatTime(currentStepElapsed)}</span>
            {recipe.steps?.find(s => s.order === currentStep.stepOrder)?.duration && (
              <span>
                Duration: {recipe.steps.find(s => s.order === currentStep.stepOrder).duration} min
              </span>
            )}
          </div>

          {executionStatus.status === 'in_progress' && (
            <button
              onClick={() => handleCompleteStep(currentStep.stepOrder)}
              disabled={loading}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Complete Step
            </button>
          )}
        </div>
      )}

      {/* All Steps */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">All Steps</h3>
        {stepExecutions.map((stepExecution) => {
          const recipeStep = recipe.steps?.find(s => s.order === stepExecution.stepOrder);
          const isCurrentStep = currentStep?.stepOrder === stepExecution.stepOrder;

          return (
            <div
              key={stepExecution.id}
              className={`p-4 border rounded ${
                isCurrentStep
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${getStepStatusColor(
                      stepExecution.status
                    )}`}
                  >
                    {stepExecution.stepOrder}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {stepExecution.instruction}
                    </p>
                    {recipeStep && (
                      <p className="text-sm text-gray-600">
                        Duration: {recipeStep.duration} min
                        {recipeStep.temperature && ` • Temp: ${recipeStep.temperature}°C`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStepStatusColor(
                    stepExecution.status
                  )} text-white`}>
                    {stepExecution.status}
                  </span>
                  {stepExecution.progress > 0 && (
                    <span className="text-sm text-gray-600">
                      {stepExecution.progress}%
                    </span>
                  )}
                </div>
              </div>

              {stepExecution.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                  <strong>Notes:</strong> {stepExecution.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default RecipeExecutionComponent;

