/**
 * Bridge between Next.js Dashboard and AIBuilder Engine
 * Handles real-time events, task execution, and file monitoring
 */

import type {
  Task,
  FileOperation,
  CommandExecution,
  SandboxStatus,
  ErrorEvent,
  WorkspaceFile,
} from '@/lib/types';

// Event emitter for dashboard state updates
type EventListener = (data: any) => void;

class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: EventListener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((listener) => listener(data));
  }
}

export const eventBus = new EventBus();

/**
 * Simulates AIBuilder engine integration
 * In production, this would connect to a WebSocket server
 * that streams real events from the AIBuilder process
 */
export class AIBuilderBridge {
  private isRunning = false;

  /**
   * Start a simulated task execution
   * In production, this would send a message to the backend
   */
  async executeTask(
    program: string,
    args: string[],
    description: string
  ): Promise<Task> {
    const taskId = `task-${Date.now()}`;
    const task: Task = {
      id: taskId,
      command: program,
      args,
      status: 'running',
      description,
      startedAt: Date.now(),
      attemptNumber: 1,
      maxAttempts: 3,
      stateChanged: false,
    };

    eventBus.emit('task:created', task);

    // Simulate task execution with random events
    this.simulateTaskExecution(taskId, program, args);

    return task;
  }

  private async simulateTaskExecution(
    taskId: string,
    program: string,
    args: string[]
  ) {
    const delays = [100, 500, 1000, 1500, 2000];

    for (const delay of delays) {
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Emit file operations
      if (Math.random() > 0.5) {
        const fileOp: FileOperation = {
          id: `fop-${Date.now()}`,
          timestamp: Date.now(),
          operationType: ['create', 'write', 'read', 'delete'][Math.floor(Math.random() * 4)] as any,
          filePath: `src/file-${Math.floor(Math.random() * 10)}.ts`,
          success: Math.random() > 0.1,
          sizeBytes: Math.floor(Math.random() * 5000),
        };
        eventBus.emit('file:operation', fileOp);
      }
    }

    // Simulate task completion
    const isSuccess = Math.random() > 0.3;
    eventBus.emit('task:completed', {
      taskId,
      status: isSuccess ? 'success' : 'failed',
      stateChanged: true,
      error: isSuccess
        ? undefined
        : `${program} exited with code 1`,
    });

    // Emit command execution
    const cmd: CommandExecution = {
      id: `cmd-${Date.now()}`,
      timestamp: Date.now(),
      command: program,
      args,
      exitCode: isSuccess ? 0 : 1,
      stdoutLines: isSuccess
        ? [`Successfully completed ${program} ${args.join(' ')}`]
        : [],
      stderrLines: isSuccess
        ? []
        : [`Error: ${program} failed with exit code 1`],
      durationMs: Math.random() * 3000,
      timedOut: false,
      success: isSuccess,
    };
    eventBus.emit('command:executed', cmd);
  }

  /**
   * Connect to AIBuilder workspace and monitor files
   */
  async connectWorkspace(projectRoot: string) {
    // In production, this would:
    // 1. Connect to the backend API
    // 2. Get current workspace state
    // 3. Set up WebSocket for real-time updates
    // 4. Start file watcher for changes

    const sandboxStatus: SandboxStatus = {
      isActive: true,
      workspaceRoot: projectRoot,
      fileCount: 42,
      totalSizeBytes: 5 * 1024 * 1024,
      lastActivityAt: Date.now(),
    };

    eventBus.emit('sandbox:status', sandboxStatus);
  }

  /**
   * Get real-time updates from AIBuilder
   * Production version would use WebSocket
   */
  subscribe(
    event: 'task' | 'file' | 'command' | 'error' | 'sandbox',
    callback: (data: any) => void
  ) {
    eventBus.on(`${event}:*`, callback);
  }
}

export const aiBuilderBridge = new AIBuilderBridge();
