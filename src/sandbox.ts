import * as path from "path";
import * as fs from "fs";

/**
 * SandboxValidator: The security layer that ensures ALL file operations
 * and terminal commands stay within a whitelisted project workspace.
 * 
 * This is the bulletproof lock that prevents the AI from accessing:
 * - Personal photos, videos, documents
 * - System files, config files, sensitive data
 * - Anything outside the designated project folder
 */
export class SandboxValidator {
  private readonly projectRoot: string;
  private readonly MAX_PATH_LENGTH = 260; // Windows MAX_PATH limit
  private readonly DANGEROUS_PATTERNS = [
    /^(\/|[a-z]:\\)(etc|usr|var|sys|windows|program files)/i, // System dirs
    /\.\./, // Path traversal
    /[`$(){}[\]|&;<>\\]/g, // Command injection chars (partial)
  ];

  private readonly BLACKLISTED_COMMANDS = [
    "rm -rf /",
    "format",
    "sudo",
    "dd if=",
    "mkfs",
    "fdisk",
    "deltree",
    ":(){:|:&};:",
    "fork()",
  ];

  constructor(projectRoot: string) {
    // Resolve to absolute path and normalize
    this.projectRoot = path.resolve(projectRoot);

    // Ensure project root exists
    if (!fs.existsSync(this.projectRoot)) {
      throw new Error(
        `❌ Project root does not exist: ${this.projectRoot}`
      );
    }

    console.log(`✅ Sandbox initialized. Workspace: ${this.projectRoot}`);
  }

  /**
   * Validate that a file path is within the sandbox
   * Throws an error if path is outside sandbox or malicious
   */
  validatePath(targetPath: string): boolean {
    if (!targetPath || typeof targetPath !== "string") {
      throw new Error("❌ Invalid path: must be a non-empty string");
    }

    if (targetPath.length > this.MAX_PATH_LENGTH) {
      throw new Error(`❌ Path too long (max ${this.MAX_PATH_LENGTH} chars)`);
    }

    // Resolve the target path to absolute form
    let resolvedPath: string;
    try {
      resolvedPath = path.resolve(this.projectRoot, targetPath);
    } catch (error) {
      throw new Error(`❌ Invalid path format: ${targetPath}`);
    }

    // Normalize to prevent tricks like /path/to/./../../outside
    const normalizedPath = path.normalize(resolvedPath);

    // CRITICAL CHECK: Does resolved path start with projectRoot?
    if (!normalizedPath.startsWith(this.projectRoot)) {
      throw new Error(
        `❌ Access Denied: Path "${targetPath}" resolves to "${normalizedPath}"\n` +
        `   which is outside sandbox: ${this.projectRoot}`
      );
    }

    // Prevent double-dot path traversal even in normalized form
    if (resolvedPath.includes("..")) {
      throw new Error(`❌ Path traversal detected: ${targetPath}`);
    }

    // Warn about symlinks (they can escape sandbox)
    try {
      const stats = fs.lstatSync(normalizedPath);
      if (stats.isSymbolicLink()) {
        const realPath = fs.realpathSync(normalizedPath);
        if (!realPath.startsWith(this.projectRoot)) {
          throw new Error(
            `❌ Symlink escape attempt: ${targetPath} → ${realPath}`
          );
        }
      }
    } catch (error) {
      // File doesn't exist yet (that's ok for write operations)
      if (!(error instanceof Error) || !error.message.includes("ENOENT")) {
        throw error;
      }
    }

    return true;
  }

  /**
   * Validate a terminal command before execution
   * Blocks dangerous commands and ensures all file operations stay in sandbox
   */
  validateCommand(cmd: string): boolean {
    if (!cmd || typeof cmd !== "string") {
      throw new Error("❌ Invalid command: must be a non-empty string");
    }

    // CRITICAL CHECK #1: Blacklisted dangerous commands
    for (const dangerous of this.BLACKLISTED_COMMANDS) {
      if (cmd.includes(dangerous)) {
        throw new Error(
          `❌ Dangerous command blocked: "${dangerous}" detected in: ${cmd}`
        );
      }
    }

    // CRITICAL CHECK #2: Command injection patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(cmd)) {
        throw new Error(
          `❌ Potential command injection detected in: ${cmd}`
        );
      }
    }

    // CRITICAL CHECK #3: Directory changes outside sandbox
    const cdMatch = cmd.match(/cd\s+(['"]?)([^\s'"]+)\1/);
    if (cdMatch) {
      const targetDir = cdMatch[2];
      try {
        this.validatePath(targetDir);
      } catch (error) {
        throw new Error(
          `❌ Cannot cd outside sandbox: ${targetDir}`
        );
      }
    }

    // CRITICAL CHECK #4: File read/write operations must be in sandbox
    const fileOpsPatterns = [
      /cat\s+([^\s|>]+)/g,     // cat filename
      /echo\s+.*>\s*([^\s|]+)/g, // echo > file
      /cp\s+([^\s]+)/g,        // cp source
      /mv\s+([^\s]+)/g,        // mv source
      /rm\s+([^\s]+)/g,        // rm file
    ];

    for (const pattern of fileOpsPatterns) {
      let match;
      while ((match = pattern.exec(cmd)) !== null) {
        const filePath = match[1];
        if (filePath && !filePath.startsWith("|") && !filePath.startsWith(">")) {
          try {
            this.validatePath(filePath);
          } catch (error) {
            throw new Error(
              `❌ File operation on blocked path: ${filePath}`
            );
          }
        }
      }
    }

    return true;
  }

  /**
   * Get the sandbox root path
   */
  getSandboxRoot(): string {
    return this.projectRoot;
  }

  /**
   * Check if a path is within sandbox WITHOUT throwing errors
   * Useful for logging/debugging
   */
  isPathSafe(targetPath: string): boolean {
    try {
      this.validatePath(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a command is safe WITHOUT throwing errors
   * Useful for logging/debugging
   */
  isCommandSafe(cmd: string): boolean {
    try {
      this.validateCommand(cmd);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all files currently in sandbox (for auditing)
   */
  listSandboxFiles(): string[] {
    try {
      const files: string[] = [];
      const walk = (dir: string) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative(this.projectRoot, fullPath);
          files.push(relativePath);

          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            walk(fullPath);
          }
        }
      };
      walk(this.projectRoot);
      return files;
    } catch (error) {
      console.error(`❌ Error listing sandbox files:`, error);
      return [];
    }
  }

  /**
   * Generate audit log of sandbox access attempts
   */
  auditAccess(operation: "read" | "write" | "execute", path: string, allowed: boolean): void {
    const timestamp = new Date().toISOString();
    const status = allowed ? "✅ ALLOWED" : "❌ BLOCKED";
    console.log(`[${timestamp}] ${status} - ${operation.toUpperCase()} - ${path}`);
  }
}

export default SandboxValidator;
