import * as path from "node:path";
import { SandboxValidator } from "./sandbox";
import { CommandExecutor, ExecuteOptions, ExecutionResult } from "./executor";
import { AIAgentController, AgentConfig, TaskAttempt } from "./agent-controller";
import { FileOperationsWrapper, FileInfo, DirectoryContents } from "./file-ops";

export interface AIBuilderConfig {
  projectRoot: string;
  maxRetriesPerTask?: number;
  commandTimeoutMs?: number;
  maxOutputBytes?: number;
  enableAuditLogging?: boolean;
  enableErrorParsing?: boolean;
}

/**
 * AIBuilder: The main integration wrapper
 * 
 * Combines all four security layers into one cohesive API:
 * 1. SandboxValidator - Path/command validation
 * 2. CommandExecutor - Safe command execution
 * 3. AIAgentController - Loop prevention & error parsing
 * 4. FileOperationsWrapper - Safe file I/O
 * 
 * This is the entry point for AI agents to safely build apps.
 */
export class AIBuilder {
  private readonly sandbox: SandboxValidator;
  private readonly executor: CommandExecutor;
  private readonly controller: AIAgentController;
  private readonly fileOps: FileOperationsWrapper;
  private readonly projectRoot: string;

  constructor(config: AIBuilderConfig) {
    // Validate configuration
    if (!config.projectRoot) {
      throw new Error("❌ projectRoot is required");
    }

    this.projectRoot = path.resolve(config.projectRoot);

    // Initialize Layer 1: Sandbox Validator
    this.sandbox = new SandboxValidator(this.projectRoot);

    // Initialize Layer 2: Command Executor
    this.executor = new CommandExecutor(this.sandbox, {
      timeoutMs: config.commandTimeoutMs || 120_000,
      maxOutputBytes: config.maxOutputBytes || 1_048_576,
    });

    // Initialize Layer 3: AI Agent Controller
    this.controller = new AIAgentController(this.sandbox, this.executor, {
      maxRetriesPerTask: config.maxRetriesPerTask || 3,
      errorParsingEnabled: config.enableErrorParsing !== false,
      auditLoggingEnabled: config.enableAuditLogging !== false,
    });

    // Initialize Layer 4: File Operations Wrapper
    this.fileOps = new FileOperationsWrapper(this.sandbox);

    console.log(`\n🚀 AIBuilder initialized`);
    console.log(`   Workspace: ${this.projectRoot}`);
    console.log(`   Max Retries: ${config.maxRetriesPerTask || 3}`);
    console.log(`   Command Timeout: ${config.commandTimeoutMs || 120_000}ms\n`);
  }

  // ============================================================================
  // PUBLIC API: File Operations
  // ============================================================================

  /**
   * Read a file from the workspace
   */
  async readFile(filePath: string): Promise<string> {
    return this.fileOps.readFile(filePath);
  }

  /**
   * Write a file to the workspace (atomic operation)
   */
  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    return this.fileOps.writeFile(filePath, content);
  }

  /**
   * Append to a file
   */
  async appendFile(filePath: string, content: string): Promise<void> {
    return this.fileOps.appendFile(filePath, content);
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    return this.fileOps.deleteFile(filePath);
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    return this.fileOps.fileExists(filePath);
  }

  /**
   * Get file metadata
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    return this.fileOps.getFileInfo(filePath);
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath?: string): Promise<DirectoryContents> {
    return this.fileOps.listDirectory(dirPath);
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    return this.fileOps.createDirectory(dirPath);
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(dirPath: string, recursive?: boolean): Promise<void> {
    return this.fileOps.deleteDirectory(dirPath, recursive);
  }

  /**
   * Copy a file
   */
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    return this.fileOps.copyFile(sourcePath, destPath);
  }

  /**
   * Move/rename a file
   */
  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    return this.fileOps.moveFile(sourcePath, destPath);
  }

  // ============================================================================
  // PUBLIC API: Command Execution
  // ============================================================================

  /**
   * Execute a command with loop prevention
   * This is the main entry point for AI to run terminal commands
   */
  async executeCommand(
    program: string,
    args: string[] = [],
    description: string = "",
  ): Promise<ExecutionResult> {
    const taskId = `${program}-${Date.now()}`;
    return this.controller.executeTask(taskId, program, args, description);
  }

  /**
   * Run a terminal command with auto-retry and error recovery
   * Chainable for building sequences of commands
   */
  async run(
    program: string,
    args: string[] = [],
    description?: string,
  ): Promise<ExecutionResult> {
    return this.executeCommand(program, args, description);
  }

  // ============================================================================
  // PUBLIC API: Introspection & Debugging
  // ============================================================================

  /**
   * Get the workspace root path
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Get all files in the workspace (for auditing)
   */
  listWorkspaceFiles(): string[] {
    return this.sandbox.listSandboxFiles();
  }

  /**
   * Check if a path is safe (returns boolean instead of throwing)
   */
  isPathSafe(targetPath: string): boolean {
    return this.sandbox.isPathSafe(targetPath);
  }

  /**
   * Check if a command is safe (returns boolean instead of throwing)
   */
  isCommandSafe(cmd: string): boolean {
    return this.sandbox.isCommandSafe(cmd);
  }

  /**
   * Get task history and summary
   */
  getTaskSummary(taskId: string): string {
    return this.controller.getTaskSummary(taskId);
  }

  // ============================================================================
  // CONVENIENCE METHODS: Common Build Tasks
  // ============================================================================

  /**
   * Install dependencies (npm, yarn, pnpm, etc.)
   */
  async installDependencies(packageManager: "npm" | "yarn" | "pnpm" = "npm"): Promise<ExecutionResult> {
    return this.executeCommand(packageManager, ["install"], `Installing dependencies with ${packageManager}`);
  }

  /**
   * Run a build script
   */
  async build(): Promise<ExecutionResult> {
    return this.executeCommand("npm", ["run", "build"], "Running build script");
  }

  /**
   * Run tests
   */
  async runTests(): Promise<ExecutionResult> {
    return this.executeCommand("npm", ["test"], "Running tests");
  }

  /**
   * Create a new file with content
   */
  async createFile(filePath: string, content: string): Promise<void> {
    await this.writeFile(filePath, content);
  }

  /**
   * Create a new directory
   */
  async createDir(dirPath: string): Promise<void> {
    await this.createDirectory(dirPath);
  }

  /**
   * Initialize a new Node.js project
   */
  async initProject(
    name: string = "app",
    description: string = "AI-built application",
  ): Promise<void> {
    // Create project structure
    await this.createDir("src");
    await this.createDir("public");
    await this.createDir("tests");

    // Create package.json
    const packageJson = {
      name,
      version: "1.0.0",
      description,
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node dist/index.js",
        test: "jest",
        dev: "ts-node src/index.ts",
      },
      keywords: [],
      author: "AI Builder",
      license: "MIT",
      dependencies: {},
      devDependencies: {
        typescript: "^5.3.2",
        "@types/node": "^20.10.0",
      },
    };

    await this.writeFile("package.json", JSON.stringify(packageJson, null, 2));

    // Create TypeScript config
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };

    await this.writeFile("tsconfig.json", JSON.stringify(tsConfig, null, 2));

    // Create a basic README
    const readme = `# ${name}

${description}

## Getting Started

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`
`;

    await this.writeFile("README.md", readme);

    console.log(`\n✅ Project initialized: ${name}`);
  }

  // ============================================================================
  // ERROR HANDLING & RECOVERY
  // ============================================================================

  /**
   * Format and display an error with context
   */
  formatError(error: Error): string {
    return `\n❌ Error: ${error.message}\n`;
  }

  /**
   * Check if a path escape attempt was detected
   */
  detectEscapeAttempt(targetPath: string): boolean {
    return !this.isPathSafe(targetPath);
  }

  // ============================================================================
  // STATUS & INTROSPECTION
  // ============================================================================

  /**
   * Print a status report
   */
  printStatus(): void {
    const files = this.listWorkspaceFiles();
    console.log(`\n📊 AIBuilder Status Report`);
    console.log(`   Workspace: ${this.projectRoot}`);
    console.log(`   Files: ${files.length}`);
    console.log(`   Sandbox Active: ✅`);
    console.log(`   All operations isolated to workspace\n`);
  }

  /**
   * Verify the sandbox is working correctly
   */
  async verifySandbox(): Promise<boolean> {
    try {
      // Test 1: Write a file
      await this.writeFile(".sandbox-test", "test");

      // Test 2: Read it back
      const content = await this.readFile(".sandbox-test");
      if (content !== "test") return false;

      // Test 3: Delete it
      await this.deleteFile(".sandbox-test");

      // Test 4: Try to escape sandbox (should fail)
      try {
        this.sandbox.validatePath("../../../etc/passwd");
        return false; // Should have thrown
      } catch {
        // Expected
      }

      console.log(`✅ Sandbox verification passed`);
      return true;
    } catch (error) {
      console.error(`❌ Sandbox verification failed:`, error);
      return false;
    }
  }
}

export default AIBuilder;
