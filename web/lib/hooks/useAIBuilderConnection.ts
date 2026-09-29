'use client';

import { useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/lib/store';
import { eventBus } from '@/lib/engine-bridge';
import type {
  Task,
  FileOperation,
  CommandExecution,
  ErrorEvent,
  SandboxStatus,
} from '@/lib/types';

/**
 * Hook to connect dashboard to real AIBuilder events
 * In production, this would connect to WebSocket or SSE
 */
export function useAIBuilderConnection(projectRoot?: string) {
  const {
    addTask,
    updateTask,
    addFileOp,
    addCommand,
    addError,
    setSandboxStatus,
    setWorkspaceFiles,
    setConnected,
  } = useDashboardStore();

  // Handle task events
  const handleTaskCreated = useCallback(
    (task: Task) => {
      addTask(task);
    },
    [addTask]
  );

  const handleTaskCompleted = useCallback(
    (data: { taskId: string; status: Task['status']; stateChanged: boolean; error?: string }) => {
      updateTask(data.taskId, {
        status: data.status,
        completedAt: Date.now(),
        stateChanged: data.stateChanged,
        error: data.error,
      });

      if (data.error) {
        const error: ErrorEvent = {
          id: `err-${Date.now()}`,
          timestamp: Date.now(),
          message: data.error,
          severity: 'error',
          taskId: data.taskId,
        };
        addError(error);
      }
    },
    [updateTask, addError]
  );

  // Handle file operations
  const handleFileOperation = useCallback(
    (op: FileOperation) => {
      addFileOp(op);
    },
    [addFileOp]
  );

  // Handle command execution
  const handleCommandExecuted = useCallback(
    (cmd: CommandExecution) => {
      addCommand(cmd);
    },
    [addCommand]
  );

  // Handle sandbox status
  const handleSandboxStatus = useCallback(
    (status: SandboxStatus) => {
      setSandboxStatus(status);
    },
    [setSandboxStatus]
  );

  // Subscribe to events
  useEffect(() => {
    eventBus.on('task:created', handleTaskCreated);
    eventBus.on('task:completed', handleTaskCompleted);
    eventBus.on('file:operation', handleFileOperation);
    eventBus.on('command:executed', handleCommandExecuted);
    eventBus.on('sandbox:status', handleSandboxStatus);

    setConnected(true);

    return () => {
      // Cleanup listeners
      eventBus.off('task:created', handleTaskCreated);
      eventBus.off('task:completed', handleTaskCompleted);
      eventBus.off('file:operation', handleFileOperation);
      eventBus.off('command:executed', handleCommandExecuted);
      eventBus.off('sandbox:status', handleSandboxStatus);
    };
  }, [
    handleTaskCreated,
    handleTaskCompleted,
    handleFileOperation,
    handleCommandExecuted,
    handleSandboxStatus,
    setConnected,
  ]);
}
