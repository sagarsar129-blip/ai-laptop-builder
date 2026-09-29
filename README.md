# AI Laptop Builder

A Node.js + TypeScript foundation for an AI-assisted development workspace. It combines workspace path validation, shell-free command execution, bounded retries, state hashing, error summarization, and file-operation helpers.

> **Security status:** This is a development foundation, not a complete security boundary. Do not give it untrusted AI-generated code or access to sensitive data until it has been reviewed and hardened. For strong isolation, run the executor inside a locked-down container or VM with least-privilege credentials and no host secrets.

## Features

- **Workspace validation** through `SandboxValidator`.
- **Shell-free process execution** through `CommandExecutor` (`spawn(..., { shell: false })`).
- **Timeout and output limits** to reduce runaway processes and memory usage.
- **Retry and loop controls** through `AIAgentController`.
- **Workspace state hashing** before and after commands.
- **Clean error summaries** for common command failures.
- **Safe file helpers** for reads, writes, copies, moves, and directory operations.
- **Audit logging** for file and command operations.

## Requirements

- Node.js 18 or newer
- npm
- A writable project workspace directory

## Install and build

```bash
npm install
npm run build
```

Run the demonstration:

```bash
npm start
```

For development:

```bash
npm run dev
```

The demo creates `demo-project/` in the current working directory. That directory is the only workspace used by the demo.

## Basic usage

```typescript
import AIBuilder from "./ai-builder";

const builder = new AIBuilder({
  projectRoot: "/absolute/path/to/project",
  maxRetriesPerTask: 3,
  commandTimeoutMs: 120_000,
  maxOutputBytes: 1_048_576,
});

await builder.writeFile("src/index.ts", "console.log('hello');\n");
await builder.run("npm", ["install"], "Install dependencies");
await builder.build();
```

Pass commands as an executable plus an argument array. Do not concatenate untrusted AI text into a shell command.

## Project structure

```text
src/
├── sandbox.ts           # Path and command policy checks
├── executor.ts          # Shell-free child-process execution
├── agent-controller.ts  # Retry, state, and error-loop controls
├── file-ops.ts          # Validated file-system operations
├── ai-builder.ts        # Public integration API
└── index.ts             # Demonstration entry point
```

## Important security limitations

This project intentionally treats its current controls as defense-in-depth rather than a perfect sandbox:

1. **A working-directory restriction is not OS isolation.** A process launched in the workspace can still attempt to read the host, spawn children, use interpreters, access the network, or exploit a vulnerable dependency. Use a container/VM, a non-privileged account, filesystem permissions, resource limits, and network isolation for untrusted code.
2. **Command inspection is not a safe substitute for a command allowlist.** Prefer an explicit executable allowlist and structured tool APIs. Review package-manager scripts before running them.
3. **Symlink, junction, mount, and race-condition handling must be hardened.** Validate real paths and use OS-level restrictions for production use; path checks alone can be bypassed by changes between validation and use.
4. **Do not pass secrets to child processes.** The executor intentionally uses a minimal environment, but review any variables supplied through `options.env`.
5. **The current retry controller records history in memory.** Persist audit records and require explicit user approval for destructive or high-impact actions in a production application.
6. **The demo is not a test suite.** Add automated security and integration tests before connecting Gemini, ChatGPT, or another model.

## Recommended next steps

- Add unit tests for traversal, sibling-prefix paths, symlinks, junctions, and concurrent file changes.
- Replace command blacklists with a small, explicit command/tool policy.
- Add Docker or VM isolation with a read-only base image, a writable workspace mount, dropped capabilities, a non-root user, CPU/memory/process limits, and disabled network by default.
- Add human approval gates for installs, deletes, network access, and commands that modify many files.
- Add model-provider adapters that return structured actions rather than raw shell strings.
- Add persistent audit logs and redaction of secrets and personal paths.

## License

MIT
