/**
 * Unified Backend Server for AI Laptop Builder
 * Serves both Next.js dashboard and WebSocket event stream
 * Bridges the secure AIBuilder engine to the web UI
 */

import path from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import AIBuilder from '../src/ai-builder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || 'localhost';
const isDev = process.env.NODE_ENV !== 'production';

// Initialize Next.js
const app = next({ dev: isDev, dir: path.join(__dirname, 'web') });
const handle = app.getRequestHandler();

// Initialize AIBuilder
const projectRoot = process.env.PROJECT_ROOT || path.join(__dirname, 'demo-project');
let builder: AIBuilder | null = null;

// Track active tasks for reconnection
const activeTasks = new Map<string, any>();

async function startServer() {
  try {
    // Prepare Next.js
    await app.prepare();

    // Initialize AIBuilder
    console.log(`\n🔐 Initializing AIBuilder...`);
    builder = new AIBuilder({
      projectRoot,
      maxRetriesPerTask: 3,
      commandTimeoutMs: 120_000,
      enableAuditLogging: true,
      enableErrorParsing: true,
    });

    // Verify sandbox
    const sandboxOk = await builder.verifySandbox();
    if (!sandboxOk) {
      throw new Error('Sandbox verification failed!');
    }

    // Create HTTP server
    const httpServer = createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error('Next.js handler error:', err);
        res.statusCode = 500;
        res.end('Internal server error');
      });
    });

    // Initialize Socket.IO for real-time events
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Handle WebSocket connections
    io.on('connection', (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // Send current workspace status
      const files = builder!.listWorkspaceFiles();
      socket.emit('sandbox:status', {
        isActive: true,
        workspaceRoot: projectRoot,
        fileCount: files.length,
        totalSizeBytes: files.reduce((sum, f) => sum + (f.size || 0), 0),
        lastActivityAt: Date.now(),
      });

      // Send active tasks
      activeTasks.forEach((task) => {
        socket.emit('task:created', task);
      });

      // Handle execute-command events
      socket.on(
        'execute:command',
        async (data: { taskId: string; program: string; args: string[]; description: string }) => {
          try {
            console.log(`\n📋 Executing task: ${data.taskId}`);
            console.log(`   Command: ${data.program} ${data.args.join(' ')}`);
            console.log(`   Description: ${data.description}`);

            // Create task record
            const task = {
              id: data.taskId,
              command: data.program,
              args: data.args,
              status: 'running' as const,
              description: data.description,
              startedAt: Date.now(),
              attemptNumber: 1,
              maxAttempts: 3,
              stateChanged: false,
            };

            activeTasks.set(data.taskId, task);
            io.emit('task:created', task);

            // Execute command
            const result = await builder!.run(
              data.program,
              data.args,
              data.description
            );

            // Emit completion
            io.emit('task:completed', {
              taskId: data.taskId,
              status: result.success ? 'success' : 'failed',
              stateChanged: true,
              error: result.error?.message,
              exitCode: result.exitCode,
              stdoutLines: result.stdout,
              stderrLines: result.stderr,
              durationMs: result.durationMs,
            });

            // Emit command execution log
            io.emit('command:executed', {
              id: `cmd-${Date.now()}`,
              timestamp: Date.now(),
              command: data.program,
              args: data.args,
              exitCode: result.exitCode,
              stdoutLines: result.stdout,
              stderrLines: result.stderr,
              durationMs: result.durationMs,
              timedOut: false,
              success: result.success,
            });

            // Clean up
            activeTasks.delete(data.taskId);
          } catch (error) {
            console.error(`❌ Task failed: ${data.taskId}`, error);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            io.emit('task:completed', {
              taskId: data.taskId,
              status: 'failed',
              stateChanged: false,
              error: errorMessage,
            });

            io.emit('error:event', {
              id: `err-${Date.now()}`,
              timestamp: Date.now(),
              message: errorMessage,
              severity: 'error',
              taskId: data.taskId,
            });

            activeTasks.delete(data.taskId);
          }
        }
      );

      // Handle file operations
      socket.on(
        'file:read',
        async (data: { filePath: string }) => {
          try {
            const content = await builder!.readFile(data.filePath);
            socket.emit('file:read:success', {
              filePath: data.filePath,
              content,
              sizeBytes: content.length,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to read file';
            socket.emit('file:read:error', {
              filePath: data.filePath,
              error: errorMessage,
            });
          }
        }
      );

      socket.on(
        'file:write',
        async (data: { filePath: string; content: string }) => {
          try {
            await builder!.writeFile(data.filePath, data.content);
            io.emit('file:operation', {
              id: `fop-${Date.now()}`,
              timestamp: Date.now(),
              operationType: 'write',
              filePath: data.filePath,
              success: true,
              sizeBytes: data.content.length,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to write file';
            io.emit('file:operation', {
              id: `fop-${Date.now()}`,
              timestamp: Date.now(),
              operationType: 'write',
              filePath: data.filePath,
              success: false,
              error: errorMessage,
            });
          }
        }
      );

      socket.on(
        'workspace:list',
        async (data: { dirPath?: string }) => {
          try {
            const contents = await builder!.listDirectory(data.dirPath);
            socket.emit('workspace:files', {
              files: contents.files,
              directories: contents.directories,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to list directory';
            socket.emit('workspace:error', {
              error: errorMessage,
            });
          }
        }
      );

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    // Start server
    httpServer.listen(port, hostname, () => {
      console.log(`\n🚀 Server running at http://${hostname}:${port}`);
      console.log(`📊 Dashboard: http://${hostname}:${port}`);
      console.log(`🔌 WebSocket: ws://${hostname}:${port}`);
      console.log(`🔐 Sandbox: ${projectRoot}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
