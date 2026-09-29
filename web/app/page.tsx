'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/lib/store';
import {
  mockTasks,
  mockFileOps,
  mockCommands,
  mockErrors,
  mockSandboxStatus,
  mockWorkspaceFiles,
} from '@/lib/mockData';
import Dashboard from '@/components/Dashboard';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const {
    setActiveTask,
    addTask,
    addFileOp,
    addCommand,
    addError,
    setSandboxStatus,
    setWorkspaceFiles,
    setConnected,
  } = useDashboardStore();

  useEffect(() => {
    // Initialize dashboard with mock data
    setConnected(true);
    setSandboxStatus(mockSandboxStatus);
    setWorkspaceFiles(mockWorkspaceFiles);

    // Add initial tasks
    mockTasks.forEach((task) => {
      addTask(task);
      if (task.status === 'running') {
        setActiveTask(task);
      }
    });

    // Add file operations
    mockFileOps.forEach((op) => addFileOp(op));

    // Add commands
    mockCommands.forEach((cmd) => addCommand(cmd));

    // Add errors
    mockErrors.forEach((err) => addError(err));

    setMounted(true);
  }, [setActiveTask, addTask, addFileOp, addCommand, addError, setSandboxStatus, setWorkspaceFiles, setConnected]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-darker">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Dashboard...</h1>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
