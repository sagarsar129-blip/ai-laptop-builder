import * as fs from "node:fs";
import * as path from "node:path";
import { SandboxValidator } from "./sandbox";

export interface FileInfo {
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: number;
}

export interface DirectoryContents {
  path: string;
  files: FileInfo[];
  directories: FileInfo[];
}

/**
 * FileOperationsWrapper: Safe, sandboxed file I/O
 * 
 * All file operations are validated through the SandboxValidator
 * to ensure no access outside the workspace.
 * 
 * Features:
 * - Path validation before every operation
 * - Safe directory creation with permission control
 * - Atomic write operations (write to temp, then rename)
 * - Comprehensive audit logging
 * - Error messages that don't leak system paths
 */
export class FileOperationsWrapper {
  private readonly sandbox: SandboxValidator;
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB limit per file

  constructor(sandbox: SandboxValidator) {
    this.sandbox = sandbox;
  }

  /**
   * Read a file's contents as a string
   * Validates path and enforces size limits
   */
  async readFile(filePath: string, encoding: BufferEncoding = "utf8"): Promise<string> {
    this.sandbox.validatePath(filePath);
    this.sandbox.auditAccess("read", filePath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), filePath);
      const stats = await fs.promises.stat(absolutePath);

      if (stats.isDirectory()) {
        throw new Error(`❌ Path is a directory, not a file: ${path.basename(filePath)}`);
      }

      if (stats.size > this.maxFileSize) {
        throw new Error(
          `❌ File too large (${stats.size} bytes, max ${this.maxFileSize})`
        );
      }

      const content = await fs.promises.readFile(absolutePath, encoding);
      return content;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ File not found: ${path.basename(filePath)}`);
        }
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied reading: ${path.basename(filePath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error reading file: ${filePath}`);
    }
  }

  /**
   * Read a file as a Buffer (for binary files)
   */
  async readFileBuffer(filePath: string): Promise<Buffer> {
    this.sandbox.validatePath(filePath);
    this.sandbox.auditAccess("read", filePath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), filePath);
      const stats = await fs.promises.stat(absolutePath);

      if (stats.isDirectory()) {
        throw new Error(`❌ Path is a directory, not a file: ${path.basename(filePath)}`);
      }

      if (stats.size > this.maxFileSize) {
        throw new Error(
          `❌ File too large (${stats.size} bytes, max ${this.maxFileSize})`
        );
      }

      return await fs.promises.readFile(absolutePath);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ File not found: ${path.basename(filePath)}`);
        }
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied reading: ${path.basename(filePath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error reading file: ${filePath}`);
    }
  }

  /**
   * Write content to a file (creates or overwrites)
   * Uses atomic write pattern: write to temp file, then rename
   */
  async writeFile(
    filePath: string,
    content: string | Buffer,
    encoding: BufferEncoding = "utf8"
  ): Promise<void> {
    this.sandbox.validatePath(filePath);
    this.sandbox.auditAccess("write", filePath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), filePath);
      const dirPath = path.dirname(absolutePath);

      // Ensure parent directory exists
      await fs.promises.mkdir(dirPath, { recursive: true });

      // Atomic write: write to temp file first, then rename
      const tempPath = `${absolutePath}.tmp-${Date.now()}`;
      const contentBuffer = typeof content === "string"
        ? Buffer.from(content, encoding)
        : content;

      if (contentBuffer.length > this.maxFileSize) {
        throw new Error(
          `❌ Content too large (${contentBuffer.length} bytes, max ${this.maxFileSize})`
        );
      }

      await fs.promises.writeFile(tempPath, contentBuffer);
      await fs.promises.rename(tempPath, absolutePath);

      console.log(`✅ File written: ${path.basename(filePath)} (${contentBuffer.length} bytes)`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied writing: ${path.basename(filePath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error writing file: ${filePath}`);
    }
  }

  /**
   * Append content to a file (creates if doesn't exist)
   */
  async appendFile(
    filePath: string,
    content: string | Buffer,
    encoding: BufferEncoding = "utf8"
  ): Promise<void> {
    this.sandbox.validatePath(filePath);
    this.sandbox.auditAccess("write", filePath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), filePath);
      const dirPath = path.dirname(absolutePath);

      // Ensure parent directory exists
      await fs.promises.mkdir(dirPath, { recursive: true });

      const contentBuffer = typeof content === "string"
        ? Buffer.from(content, encoding)
        : content;

      if (contentBuffer.length > this.maxFileSize) {
        throw new Error(
          `❌ Content too large (${contentBuffer.length} bytes, max ${this.maxFileSize})`
        );
      }

      await fs.promises.appendFile(absolutePath, contentBuffer);
      console.log(`✅ File appended: ${path.basename(filePath)} (${contentBuffer.length} bytes)`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied appending: ${path.basename(filePath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error appending file: ${filePath}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    this.sandbox.validatePath(filePath);
    this.sandbox.auditAccess("write", filePath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), filePath);
      const stats = await fs.promises.stat(absolutePath);

      if (stats.isDirectory()) {
        throw new Error(
          `❌ Cannot delete directory with deleteFile(). Use deleteDirectory() instead: ${path.basename(filePath)}`
        );
      }

      await fs.promises.unlink(absolutePath);
      console.log(`✅ File deleted: ${path.basename(filePath)}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ File not found: ${path.basename(filePath)}`);
        }
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied deleting: ${path.basename(filePath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error deleting file: ${filePath}`);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    this.sandbox.validatePath(filePath);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), filePath);
      await fs.promises.access(absolutePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    this.sandbox.validatePath(filePath);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), filePath);
      const stats = await fs.promises.stat(absolutePath);

      return {
        path: path.basename(filePath),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modifiedAt: stats.mtime.getTime(),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ Path not found: ${path.basename(filePath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error getting file info: ${filePath}`);
    }
  }

  /**
   * List contents of a directory
   */
  async listDirectory(dirPath: string = "."): Promise<DirectoryContents> {
    this.sandbox.validatePath(dirPath);
    this.sandbox.auditAccess("read", dirPath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), dirPath);
      const stats = await fs.promises.stat(absolutePath);

      if (!stats.isDirectory()) {
        throw new Error(
          `❌ Path is not a directory: ${path.basename(dirPath)}`
        );
      }

      const entries = await fs.promises.readdir(absolutePath, {
        withFileTypes: true,
      });

      const files: FileInfo[] = [];
      const directories: FileInfo[] = [];

      for (const entry of entries) {
        const fullPath = path.join(absolutePath, entry.name);
        const stats = await fs.promises.stat(fullPath);

        const info: FileInfo = {
          path: entry.name,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          modifiedAt: stats.mtime.getTime(),
        };

        if (entry.isDirectory()) {
          directories.push(info);
        } else {
          files.push(info);
        }
      }

      return {
        path: dirPath,
        files: files.sort((a, b) => a.path.localeCompare(b.path)),
        directories: directories.sort((a, b) => a.path.localeCompare(b.path)),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ Directory not found: ${path.basename(dirPath)}`);
        }
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied accessing: ${path.basename(dirPath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error listing directory: ${dirPath}`);
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    this.sandbox.validatePath(dirPath);
    this.sandbox.auditAccess("write", dirPath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), dirPath);
      await fs.promises.mkdir(absolutePath, { recursive: true, mode: 0o755 });
      console.log(`✅ Directory created: ${path.basename(dirPath)}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied creating: ${path.basename(dirPath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error creating directory: ${dirPath}`);
    }
  }

  /**
   * Delete a directory (empty or with contents)
   */
  async deleteDirectory(dirPath: string, recursive: boolean = false): Promise<void> {
    this.sandbox.validatePath(dirPath);
    this.sandbox.auditAccess("write", dirPath, true);

    try {
      const absolutePath = path.resolve(this.sandbox.getSandboxRoot(), dirPath);
      const stats = await fs.promises.stat(absolutePath);

      if (!stats.isDirectory()) {
        throw new Error(
          `❌ Path is not a directory: ${path.basename(dirPath)}`
        );
      }

      if (recursive) {
        await fs.promises.rm(absolutePath, { recursive: true, force: true });
      } else {
        // Check if directory is empty
        const entries = await fs.promises.readdir(absolutePath);
        if (entries.length > 0) {
          throw new Error(
            `❌ Directory not empty: ${path.basename(dirPath)}. Use recursive: true to delete with contents.`
          );
        }
        await fs.promises.rmdir(absolutePath);
      }

      console.log(`✅ Directory deleted: ${path.basename(dirPath)}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ Directory not found: ${path.basename(dirPath)}`);
        }
        if (error.message.includes("EACCES")) {
          throw new Error(`❌ Permission denied deleting: ${path.basename(dirPath)}`);
        }
        throw error;
      }
      throw new Error(`❌ Error deleting directory: ${dirPath}`);
    }
  }

  /**
   * Copy a file
   */
  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    this.sandbox.validatePath(sourcePath);
    this.sandbox.validatePath(destPath);
    this.sandbox.auditAccess("read", sourcePath, true);
    this.sandbox.auditAccess("write", destPath, true);

    try {
      const absoluteSource = path.resolve(this.sandbox.getSandboxRoot(), sourcePath);
      const absoluteDest = path.resolve(this.sandbox.getSandboxRoot(), destPath);

      const stats = await fs.promises.stat(absoluteSource);
      if (stats.isDirectory()) {
        throw new Error(
          `❌ Source is a directory: ${path.basename(sourcePath)}. Use copyDirectory() instead.`
        );
      }

      const destDir = path.dirname(absoluteDest);
      await fs.promises.mkdir(destDir, { recursive: true });
      await fs.promises.copyFile(absoluteSource, absoluteDest);

      console.log(
        `✅ File copied: ${path.basename(sourcePath)} → ${path.basename(destPath)}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ Source file not found: ${path.basename(sourcePath)}`);
        }
        throw error;
      }
      throw new Error(
        `❌ Error copying file: ${sourcePath} → ${destPath}`
      );
    }
  }

  /**
   * Move/rename a file
   */
  async moveFile(sourcePath: string, destPath: string): Promise<void> {
    this.sandbox.validatePath(sourcePath);
    this.sandbox.validatePath(destPath);
    this.sandbox.auditAccess("write", sourcePath, true);
    this.sandbox.auditAccess("write", destPath, true);

    try {
      const absoluteSource = path.resolve(this.sandbox.getSandboxRoot(), sourcePath);
      const absoluteDest = path.resolve(this.sandbox.getSandboxRoot(), destPath);

      const stats = await fs.promises.stat(absoluteSource);
      if (stats.isDirectory()) {
        throw new Error(
          `❌ Source is a directory: ${path.basename(sourcePath)}`
        );
      }

      const destDir = path.dirname(absoluteDest);
      await fs.promises.mkdir(destDir, { recursive: true });
      await fs.promises.rename(absoluteSource, absoluteDest);

      console.log(
        `✅ File moved: ${path.basename(sourcePath)} → ${path.basename(destPath)}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ENOENT")) {
          throw new Error(`❌ Source file not found: ${path.basename(sourcePath)}`);
        }
        throw error;
      }
      throw new Error(
        `❌ Error moving file: ${sourcePath} → ${destPath}`
      );
    }
  }

  /**
   * Get the sandbox root path
   */
  getSandboxRoot(): string {
    return this.sandbox.getSandboxRoot();
  }
}

export default FileOperationsWrapper;
