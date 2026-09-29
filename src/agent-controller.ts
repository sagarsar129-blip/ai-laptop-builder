import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { CommandExecutor, ExecutionResult, ExecutionError } from "./executor";
import { SandboxValidator } from "./sandbox";

/**
 * Represents a single attempt to complete a task
 */
export interface TaskAttempt {
  attemptNumber: number;
  timestamp: number;
  command: string;
  success: boolean;
  error?: string;
  stateHashBefore?: string;
  stateHashAfter?: string;
  stateChanged: boolean;
  durationMs: number;
}

/**
 * Represents the state of the workspace (all files and their hashes)
 */
export interface WorkspaceState {
  timestamp: number;
  files: Array<{
    path: string;
    hash: string;
    size: number;
  }>;
}

/**
 * Configuration for the AI Agent Controller
 */
export interface AgentConfig {
  maxRetriesPerTask: number;
  stateCheckIntervalMs: number;
  errorParsingEnabled: boolean;
  auditLoggingEnabled: boolean;
}

/**
 * AIAgentController: The intelligent loop prevention engine
 * 
 * Prevents infinite loops by:
 * 1. Tracking all attempts and their outcomes
 * 2. Detecting repeated identical errors
 * 3. Monitoring workspace state changes
 * 4. Enforcing retry limits with human intervention fallback
 * 5. Providing clean, parsed error messages to the AI
 */
export class AIAgentController {
  private readonly executor: CommandExecutor;
  private readonly sandbox: SandboxValidator;
  private readonly taskHistory: Map<string, TaskAttempt[]> = new Map();
  private readonly stateHistory: Map<string, WorkspaceState> = new Map();
  private readonly errorPatterns: Map<string, number> = new Map(); // error -> count
  private readonly config: AgentConfig;

  constructor(
    sandbox: SandboxValidator,
    executor: CommandExecutor,
    config: Partial<AgentConfig> = {},
  ) {
    this.sandbox = sandbox;
    this.executor = executor;
    this.config = {
      maxRetriesPerTask: config.maxRetriesPerTask ?? 3,
      stateCheckIntervalMs: config.stateCheckIntervalMs ?? 5000,
      errorParsingEnabled: config.errorParsingEnabled ?? true,
      auditLoggingEnabled: config.auditLoggingEnabled ?? true,
    };
  }

  /**
   * Execute a task with loop prevention and error recovery
   */
  async executeTask(
    taskId: string,
    program: string,
    args: string[] = [],
    description: string = "",
  ): Promise<ExecutionResult> {
    const maxAttempts = this.config.maxRetriesPerTask;
    let attempts = this.getAttempts(taskId) || [];

    // LOOP PREVENTION CHECK #1: Have we exceeded max retries?
    if (attempts.length >= maxAttempts) {
      const lastAttempt = attempts[attempts.length - 1];
      const errorMsg = lastAttempt.error || "Unknown error";
      throw new Error(
        `❌ Max retries (${maxAttempts}) reached for task "${taskId}".\n` +
        `Last error: ${errorMsg}\n` +
        `🚫 Pausing for human intervention. Please review the issue and retry.`
      );
    }

    // Capture workspace state BEFORE execution
    const stateHashBefore = await this.captureWorkspaceStateHash();

    const attemptNumber = attempts.length + 1;
    const startTime = Date.now();
    const command = `${program} ${args.join(" ")}`.trim();

    console.log(
      `\n📋 Task: ${taskId} [Attempt ${attemptNumber}/${maxAttempts}]\n` +
      `   Command: ${command}\n` +
      `   Description: ${description || "N/A"}`
    );

    let result: ExecutionResult;
    let executionError: ExecutionError | null = null;

    try {
      result = await this.executor.run(program, args);
    } catch (error) {
      if (error instanceof ExecutionError) {
        executionError = error;
        result = error.result;
      } else {
        throw error;
      }
    }

    // Capture workspace state AFTER execution
    const stateHashAfter = await this.captureWorkspaceStateHash();
    const stateChanged = stateHashBefore !== stateHashAfter;

    const durationMs = Date.now() - startTime;

    // LOOP PREVENTION CHECK #2: Detect repeated identical errors
    if (executionError) {
      const errorKey = this.normalizeError(executionError.message);
      const previousOccurrences = this.errorPatterns.get(errorKey) || 0;

      if (previousOccurrences > 0) {
        console.warn(
          `\n🔄 ERROR LOOP DETECTED: Same error happening repeatedly.\n` +
          `   Error: ${errorKey}\n` +
          `   Occurrences: ${previousOccurrences + 1}\n` +
          `   This suggests the AI is stuck. Pausing for human intervention.`
        );

        throw new Error(
          `❌ Stuck in error loop after ${previousOccurrences + 1} attempts.\n` +
          `Error: ${errorKey}\n` +
          `🚫 Human intervention required. Please adjust the approach and retry.`
        );
      }

      this.errorPatterns.set(errorKey, previousOccurrences + 1);
    } else {
      // Success resets the error pattern tracking
      this.errorPatterns.clear();
    }

    // LOOP PREVENTION CHECK #3: Detect zero-progress executions
    if (!stateChanged && !executionError) {
      console.warn(
        `\n⚠️ WARNING: Execution completed but workspace state unchanged.\n` +
        `   This might indicate the task had no effect.`
      );
    }

    // Store attempt record
    const attempt: TaskAttempt = {
      attemptNumber,
      timestamp: Date.now(),
      command,
      success: !executionError,
      error: executionError?.message,
      stateHashBefore,
      stateHashAfter,
      stateChanged,
      durationMs,
    };

    attempts.push(attempt);
    this.taskHistory.set(taskId, attempts);

    // Audit logging
    if (this.config.auditLoggingEnabled) {
      this.auditTaskExecution(taskId, attempt);
    }

    // If execution failed, provide clean error feedback
    if (executionError) {
      const cleanError = this.config.errorParsingEnabled
        ? this.parseError(result)
        : result.stderr || result.stdout || "Unknown error";

      console.error(
        `\n❌ Execution failed.\n` +
        `📋 Clean Error Summary:\n${cleanError}`
      );

      throw new Error(
        `Task "${taskId}" failed on attempt ${attemptNumber}:\n${cleanError}`
      );
    }

    console.log(
      `\n✅ Task succeeded in ${durationMs}ms\n` +
      `   State Changed: ${stateChanged ? "Yes" : "No"}`
    );

    return result;
  }

  /**
   * Parse raw error output into clean, AI-friendly summaries
   */
  private parseError(result: ExecutionResult): string {
    const output = `${result.stdout}\n${result.stderr}`.trim();
    const lines = output.split("\n");

    // Pattern matching for common errors
    if (output.includes("ENOENT") || output.includes("No such file")) {
      return "📄 File or directory not found. Check the file path.";
    }

    if (output.includes("EACCES") || output.includes("Permission denied")) {
      return "🔒 Permission denied. Check file/directory permissions.";
    }

    if (output.includes("SyntaxError") || output.includes("Parse error")) {
      const match = output.match(/(?:line|at)\s+(\d+)/i);
      const lineNum = match?.[1] || "unknown";
      return `❌ Syntax error at line ${lineNum}. Review the code for typos.`;
    }

    if (
      output.includes("cannot find module") ||
      output.includes("MODULE_NOT_FOUND")
    ) {
      const match = output.match(/(?:module|package)?\s+['"]([@\w/-]+)['"]/i);
      const pkg = match?.[1] || "dependency";
      return `📦 Missing dependency: "${pkg}". Run npm install or check package.json.`;
    }

    if (output.includes("ECONNREFUSED")) {
      return "🔌 Connection refused. Check that the required service is running.";
    }

    if (output.includes("timeout") || result.timedOut) {
      return `⏱️ Command timed out after ${result.durationMs}ms. Task might be too slow or stuck.`;
    }

    if (output.includes("exit code") || result.exitCode !== 0) {
      return `Process exited with code ${result.exitCode}. ${
        lines[lines.length - 1] || "See output above for details."
      }`;
    }

    // Fallback: return first non-empty line
    const firstError = lines.find((line) =>
      /error|failed|exception|fatal/i.test(line)
    );
    if (firstError) return firstError.slice(0, 200);

    return "Unknown error. Check the output above.";
  }

  /**
   * Normalize error messages for comparison
   */
  private normalizeError(error: string): string {
    return error
      .split("\n")[0] // First line only
      .replace(/\d+/g, "N") // Replace numbers with "N" for pattern matching
      .toLowerCase()
      .slice(0, 100); // Cap length
  }

  /**
   * Capture the current workspace state as a hash
   */
  private async captureWorkspaceStateHash(): Promise<string> {
    const root = this.sandbox.getSandboxRoot();
    const files = await this.captureWorkspaceState(root);

    const stateJson = JSON.stringify(files, null, 2);
    return crypto
      .createHash("sha256")
      .update(stateJson)
      .digest("hex");
  }

  /**
   * Capture full workspace state with file hashes
   */
  private async captureWorkspaceState(root: string): Promise<WorkspaceState> {
    const files: WorkspaceState["files"] = [];

    const walk = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(root, fullPath);

          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile()) {
            try {
              const content = await fs.promises.readFile(fullPath);
              const hash = crypto
                .createHash("sha256")
                .update(content)
                .digest("hex");

              files.push({
                path: relativePath,
                hash,
                size: content.length,
              });
            } catch (error) {
              console.warn(`⚠️ Could not read file: ${fullPath}`);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not read directory: ${dir}`);
      }
    };

    await walk(root);
    return {
      timestamp: Date.now(),
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
    };
  }

  /**
   * Get all attempts for a task
   */
  getAttempts(taskId: string): TaskAttempt[] | undefined {
    return this.taskHistory.get(taskId);
  }

  /**
   * Get task history summary
   */
  getTaskSummary(taskId: string): string {
    const attempts = this.getAttempts(taskId);
    if (!attempts) return `❌ No record found for task "${taskId}"`;

    const successful = attempts.filter((a) => a.success).length;
    const failed = attempts.filter((a) => !a.success).length;
    const totalTime = attempts.reduce((sum, a) => sum + a.durationMs, 0);

    let summary = `📊 Task Summary: ${taskId}\n`;
    summary += `   Total Attempts: ${attempts.length}\n`;
    summary += `   ✅ Successful: ${successful}\n`;
    summary += `   ❌ Failed: ${failed}\n`;
    summary += `   ⏱️ Total Time: ${totalTime}ms\n\n`;

    summary += `   Attempts:\n`;
    for (const attempt of attempts) {
      const status = attempt.success ? "✅" : "❌";
      const stateStatus = attempt.stateChanged ? "(state changed)" : "(no state change)";
      summary += `   ${status} Attempt ${attempt.attemptNumber}: ${attempt.command} - ${attempt.durationMs}ms ${stateStatus}\n`;
      if (attempt.error) {
        summary += `      Error: ${attempt.error.split("\n")[0]}\n`;
      }
    }

    return summary;
  }

  /**
   * Audit log a task execution
   */
  private auditTaskExecution(taskId: string, attempt: TaskAttempt): void {
    const timestamp = new Date(attempt.timestamp).toISOString();
    const status = attempt.success ? "✅ SUCCESS" : "❌ FAILED";
    console.log(
      `[AUDIT] ${timestamp} - ${status} - Task: ${taskId} - ` +
      `Attempt ${attempt.attemptNumber} - ${attempt.durationMs}ms`
    );
  }

  /**
   * Clear task history (for testing or cleanup)
   */
  clearHistory(): void {
    this.taskHistory.clear();
    this.stateHistory.clear();
    this.errorPatterns.clear();
  }
}

export default AIAgentController;
