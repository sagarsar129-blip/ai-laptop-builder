'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDashboardStore } from '@/lib/store';
import type {
  Task,
  FileOperation,
  CommandExecution,
  ErrorEvent,
  SandboxStatus,
} from '@/lib/types';

let socket: Socket | null = null;

/**
 * Hook to connect dashboard to real AIBuilder backend via WebSocket
 */
export function useAIBuilderConnection(projectRoot?: string) {
  const socketRef = useRef<Socket | null>(null);
  const {
    addTask,
    updateTask,
    addFileOp,
    addCommand,
    addError,
    setSandboxStatus,
    setConnected,
  } = useDashboardStore();

  // Handle task creation
  const handleTaskCreated = useCallback(
    (task: Task) => {
      console.log('📋 Task created:', task.id);
      addTask(task);
    },
    [addTask]
  );

  // Handle task completion
  const handleTaskCompleted = useCallback(
    (data: {
      taskId: string;
      status: Task['status'];
      stateChanged: boolean;
      error?: string;
      exitCode?: number;
      stdoutLines?: string[];
      stderrLines?: string[];
      durationMs?: number;
    }) => {
      console.log('✅ Task completed:', data.taskId, data.status);
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
      console.log('📁 File operation:', op.operationType, op.filePath);
      addFileOp(op);
    },
    [addFileOp]
  );

  // Handle command execution
  const handleCommandExecuted = useCallback(
    (cmd: CommandExecution) => {
      console.log('💻 Command executed:', cmd.command, cmd.exitCode ? '❌' : '✅');
      addCommand(cmd);
    },
    [addCommand]
  );

  // Handle error events
  const handleErrorEvent = useCallback(
    (error: ErrorEvent) => {
      console.log('⚠️  Error event:', error.message);
      addError(error);
    },
    [addError]
  );

  // Handle sandbox status
  const handleSandboxStatus = useCallback(
    (status: SandboxStatus) => {
      console.log('🔐 Sandbox status:', status.isActive ? 'Active' : 'Inactive');
      setSandboxStatus(status);
    },
    [setSandboxStatus]
  );

  // Initialize Socket.IO connection
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_BUILDER_API || window.location.origin;
    console.log('🔌 Connecting to:', apiUrl);

    socketRef.current = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    const s = socketRef.current;

    // Connection events
    s.on('connect', () => {
      console.log('✅ Connected to AIBuilder backend');
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('❌ Disconnected from AIBuilder backend');
      setConnected(false);
    });

    // Task events
    s.on('task:created', handleTaskCreated);
    s.on('task:completed', handleTaskCompleted);

    // File events
    s.on('file:operation', handleFileOperation);

    // Command events
    s.on('command:executed', handleCommandExecuted);

    // Error events
    s.on('error:event', handleErrorEvent);

    // Sandbox events
    s.on('sandbox:status', handleSandboxStatus);

    // Store global reference
    socket = s;

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('task:created', handleTaskCreated);
      s.off('task:completed', handleTaskCompleted);
      s.off('file:operation', handleFileOperation);
      s.off('command:executed', handleCommandExecuted);
      s.off('error:event', handleErrorEvent);
      s.off('sandbox:status', handleSandboxStatus);
      s.disconnect();
    };
  }, [
    handleTaskCreated,
    handleTaskCompleted,
    handleFileOperation,
    handleCommandExecuted,
    handleErrorEvent,
    handleSandboxStatus,
    setConnected,
  ]);

  return socketRef.current;
}

/**
 * Helper to execute a command via WebSocket
 */
export function executeCommandViaSocket(
  program: string,
  args: string[],
  description: string
) {
  if (!socket) {
    throw new Error('Socket.IO not connected');
  }

  const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  socket.emit('execute:command', {
    taskId,
    program,
    args,
    description,
  });

  return taskId;
}

/**
 * Helper to read a file via WebSocket
 */
export function readFileViaSocket(filePath: string): Promise<string> {
  if (!socket) {
    return Promise.reject(new Error('Socket.IO not connected'));
  }

  return new Promise((resolve, reject) => {
    socket!.emit('file:read', { filePath });
    socket!.once('file:read:success', (data) => resolve(data.content));
    socket!.once('file:read:error', (data) => reject(new Error(data.error)));

    // Timeout after 10 seconds
    setTimeout(() => reject(new Error('File read timeout')), 10000);
  });
}

/**
 * Helper to write a file via WebSocket
 */
export function writeFileViaSocket(filePath: string, content: string): void {
  if (!socket) {
    throw new Error('Socket.IO not connected');
  }

  socket.emit('file:write', { filePath, content });
}

/**
 * Helper to list workspace files via WebSocket
 */
export function listWorkspaceFilesViaSocket(dirPath?: string): Promise<any> {
  if (!socket) {
    return Promise.reject(new Error('Socket.IO not connected'));
  }

  return new Promise((resolve, reject) => {
    socket!.emit('workspace:list', { dirPath });
    socket!.once('workspace:files', resolve);
    socket!.once('workspace:error', (data) => reject(new Error(data.error)));

    setTimeout(() => reject(new Error('Workspace list timeout')), 10000);
  });
}
