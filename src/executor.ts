import { spawn } from "node:child_process";
import * as path from "node:path";
import { SandboxValidator } from "./sandbox";

export interface ExecuteOptions {
  /** Maximum time the child process may run, in milliseconds. */
  timeoutMs?: number;
  /** Maximum combined stdout/stderr retained in memory. */
  maxOutputBytes?: number;
  /** Additional environment variables. The parent environment is not copied wholesale. */
  env?: Record<string, string>;
  /** Directory relative to the sandbox root in which to run. */
  cwd?: string;
}

export interface ExecutionResult {
  command: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  truncated: boolean;
  durationMs: number;
}

export class ExecutionError extends Error {
  constructor(
    message: string,
    public readonly result: ExecutionResult,
  ) {
    super(message);
    this.name = "ExecutionError";
  }
}

/**
 * Executes a program without invoking a shell.
 *
 * Important: this is a policy boundary, not a complete OS sandbox. A process
 * can still access the machine through its own code or child processes. For
 * hostile or untrusted AI-generated code, run this executor inside a locked
 * down container/VM as well.
 */
export class CommandExecutor {
  private readonly root: string;

  constructor(
    private readonly sandbox: SandboxValidator,
    private readonly defaults: Required<Pick<ExecuteOptions, "timeoutMs" | "maxOutputBytes">> = {
      timeoutMs: 120_000,
      maxOutputBytes: 1_048_576,
    },
  ) {
    this.root = path.resolve(sandbox.getSandboxRoot());
  }

  async run(
    program: string,
    args: readonly string[] = [],
    options: ExecuteOptions = {},
  ): Promise<ExecutionResult> {
    this.validateProgram(program);

    const cwd = this.resolveCwd(options.cwd);
    const command = [program, ...args].map(quoteForLog).join(" ");
    const timeoutMs = options.timeoutMs ?? this.defaults.timeoutMs;
    const maxOutputBytes = options.maxOutputBytes ?? this.defaults.maxOutputBytes;

    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error("timeoutMs must be a positive integer");
    }
    if (!Number.isInteger(maxOutputBytes) || maxOutputBytes <= 0) {
      throw new Error("maxOutputBytes must be a positive integer");
    }

    // Keep validation and audit logging immediately before execution.
    this.sandbox.validateCommand(command);
    this.sandbox.auditAccess("execute", command, true);

    const started = Date.now();
    const child = spawn(program, [...args], {
      cwd,
      shell: false,
      windowsHide: true,
      // Do not expose the complete parent environment to AI-launched tools.
      env: {
        PATH: process.env.PATH ?? "",
        SystemRoot: process.env.SystemRoot ?? "",
        TEMP: process.env.TEMP ?? "",
        TMP: process.env.TMP ?? "",
        ...options.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let truncated = false;
    let timedOut = false;

    const append = (target: "stdout" | "stderr", chunk: Buffer): void => {
      if (outputBytes >= maxOutputBytes) {
        truncated = true;
        return;
      }
      const remaining = maxOutputBytes - outputBytes;
      const kept = chunk.subarray(0, remaining);
      outputBytes += kept.length;
      if (target === "stdout") stdout += kept.toString("utf8");
      else stderr += kept.toString("utf8");
      if (kept.length < chunk.length) truncated = true;
    };

    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));

    const result = await new Promise<ExecutionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        timedOut = true;
        // SIGTERM allows normal cleanup; the process-group/container should
        // enforce a hard kill for descendants in production.
        child.kill("SIGTERM");
      }, timeoutMs);

      child.once("error", (error) => {
        clearTimeout(timer);
        reject(new Error(`Could not start ${program}: ${error.message}`));
      });
      child.once("close", (exitCode, signal) => {
        clearTimeout(timer);
        resolve({
          command,
          exitCode,
          signal,
          stdout,
          stderr,
          timedOut,
          truncated,
          durationMs: Date.now() - started,
        });
      });
    });

    if (result.timedOut || result.exitCode !== 0) {
      throw new ExecutionError(formatFailure(result), result);
    }
    return result;
  }

  private resolveCwd(relativeCwd = "."): string {
    this.sandbox.validatePath(relativeCwd);
    const resolved = path.resolve(this.root, relativeCwd);
    this.sandbox.validatePath(resolved);
    return resolved;
  }

  private validateProgram(program: string): void {
    if (!program || program.includes("\0") || /[;&|`$<>\r\n]/.test(program)) {
      throw new Error("Invalid executable name");
    }
    // An absolute executable must itself be inside the workspace. Bare names
    // such as npm, node, and python are resolved using the restricted PATH.
    if (path.isAbsolute(program)) this.sandbox.validatePath(program);
  }
}

function quoteForLog(value: string): string {
  return /[^a-zA-Z0-9_./\\:-]/.test(value) ? JSON.stringify(value) : value;
}

function formatFailure(result: ExecutionResult): string {
  const reason = result.timedOut
    ? "command timed out"
    : `command exited with code ${result.exitCode ?? "unknown"}`;
  const output = [result.stdout, result.stderr]
    .filter(Boolean)
    .join("\n")
    .trim()
    .slice(0, 4_000);
  return `${reason}: ${result.command}${output ? `\n${output}` : ""}`;
}

export default CommandExecutor;
