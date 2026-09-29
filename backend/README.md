# AI Laptop Builder Backend Server

## Quick Start

```bash
# Install dependencies
npm install
cd web && npm install

# Start the unified server (backend + dashboard + WebSocket)
npm run dev

# Open in browser
http://localhost:3000
```

## Architecture

The backend server is a unified Node.js/Express/Socket.IO server that:

1. **Hosts the Next.js Dashboard** — The web UI runs on port 3000
2. **Exposes WebSocket Events** — Real-time updates from AIBuilder engine
3. **Bridges AIBuilder Engine** — Direct connection to the secure sandbox

```
Next.js Dashboard (port 3000)
       ↓
   Socket.IO
       ↓
Backend Server (Node.js)
       ↓
AIBuilder Engine (sandbox)
```

## Features

✅ Real-time command execution with progress
✅ Live file operation tracking
✅ Sandbox status monitoring
✅ Error handling and retry logic
✅ Workspace file browsing
✅ Command log history

## Environment Variables

- `NODE_ENV` — `development` or `production`
- `PORT` — Server port (default: 3000)
- `HOSTNAME` — Bind address (default: localhost)
- `PROJECT_ROOT` — Workspace root directory (default: ./demo-project)
- `NEXT_PUBLIC_USE_MOCK_DATA` — Use mock data instead of backend (true/false)

## Socket.IO Events

### Client → Server

- `execute:command` — Execute a command
  ```typescript
  socket.emit('execute:command', {
    taskId: 'task-123',
    program: 'npm',
    args: ['install'],
    description: 'Installing dependencies',
  });
  ```

- `file:read` — Read a file
  ```typescript
  socket.emit('file:read', { filePath: 'package.json' });
  ```

- `file:write` — Write a file
  ```typescript
  socket.emit('file:write', {
    filePath: 'src/index.ts',
    content: 'export default App;',
  });
  ```

- `workspace:list` — List workspace files
  ```typescript
  socket.emit('workspace:list', { dirPath: 'src' });
  ```

### Server → Client

- `task:created` — Task started
- `task:completed` — Task finished
- `file:operation` — File was read/written/deleted
- `command:executed` — Command output logged
- `error:event` — Error occurred
- `sandbox:status` — Sandbox status updated
- `workspace:files` — File list response

## Development with Mock Data

To develop without running the full backend:

```bash
NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev
```

This loads the dashboard with pre-generated mock data for testing UI components.

## Production Deployment

```bash
# Build everything
npm run build

# Start production server
NODE_ENV=production npm start
```

## Debugging

Enable debug logging:

```bash
DEBUG=* npm run dev
```

Watch logs in the terminal to see:
- Client connections
- Command execution
- File operations
- Error events

## Security Notes

⚠️ **Development Only** — This setup is suitable for local development.

For production, add:
- Authentication and authorization
- HTTPS/WSS encryption
- CORS restrictions
- Rate limiting
- Audit logging
- User approval flows for dangerous operations
