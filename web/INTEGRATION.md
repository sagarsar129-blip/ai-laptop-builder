/**
 * README: Connecting the Dashboard to AIBuilder Engine
 *
 * This document explains how to integrate the web dashboard with the real
 * secure AIBuilder engine.
 *
 * ## Architecture
 *
 * ```
 * AI Model (Gemini/ChatGPT)
 *     ↓
 * AIBuilder Engine (src/ai-builder.ts)
 *     ↓
 * Backend Server (next.js api routes)
 *     ↓
 * WebSocket / EventBus
 *     ↓
 * Dashboard UI (web/)
 * ```
 *
 * ## Current State
 *
 * The dashboard currently uses:
 * - Mock data for initial load
 * - EventBus for simulated real-time updates
 * - API routes stubbed but not connected
 *
 * ## To Connect Real Engine
 *
 * ### Step 1: Create Backend Service
 *
 * Create `backend/server.ts`:
 *
 * ```typescript
 * import AIBuilder from '../src/ai-builder';
 * import express from 'express';
 * import { Server } from 'socket.io';
 *
 * const app = express();
 * const io = new Server(app, { cors: { origin: '*' } });
 * const builder = new AIBuilder({ projectRoot: './demo-project' });
 *
 * io.on('connection', (socket) => {
 *   socket.on('execute-task', async (data) => {
 *     try {
 *       const result = await builder.executeCommand(data.program, data.args);
 *       socket.emit('task-completed', result);
 *     } catch (error) {
 *       socket.emit('task-error', error);
 *     }
 *   });
 * });
 *
 * app.listen(3001);
 * ```
 *
 * ### Step 2: Update Web API Routes
 *
 * In `web/app/api/execute/route.ts`:
 *
 * ```typescript
 * import AIBuilder from '@/../../src/ai-builder';
 *
 * const builder = new AIBuilder({ projectRoot: process.env.PROJECT_ROOT });
 *
 * export async function POST(request: NextRequest) {
 *   const { program, args } = await request.json();
 *   const result = await builder.executeCommand(program, args);
 *   return NextResponse.json(result);
 * }
 * ```
 *
 * ### Step 3: Update useAIBuilderConnection Hook
 *
 * Replace EventBus with real WebSocket:
 *
 * ```typescript
 * useEffect(() => {
 *   const socket = io(process.env.NEXT_PUBLIC_BUILDER_API);
 *
 *   socket.on('task:created', handleTaskCreated);
 *   socket.on('file:operation', handleFileOperation);
 *   // etc...
 * }, []);
 * ```
 *
 * ### Step 4: Environment Variables
 *
 * Add to `.env.local`:
 *
 * ```
 * NEXT_PUBLIC_PROJECT_ROOT=./demo-project
 * NEXT_PUBLIC_BUILDER_API=http://localhost:3001
 * PROJECT_ROOT=./demo-project
 * ```
 *
 * ## Security Considerations
 *
 * ✅ Only expose whitelisted operations through API
 * ✅ Validate all paths through SandboxValidator
 * ✅ Require user approval for dangerous operations
 * ✅ Log all operations for audit
 * ✅ Enforce rate limiting
 * ✅ Use HTTPS/WSS in production
 *
 * ## Testing
 *
 * 1. Start AIBuilder backend: `npm run dev:backend`
 * 2. Start web dashboard: `cd web && npm run dev`
 * 3. Open http://localhost:3000
 * 4. Execute commands and watch real-time updates
 *
 */

export const INTEGRATION_README = true;
