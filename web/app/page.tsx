'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/lib/store';
import { useAIBuilderConnection } from '@/lib/hooks/useAIBuilderConnection';
import Dashboard from '@/components/Dashboard';
import { mockTasks, mockFileOps, mockCommands, mockErrors, mockSandboxStatus, mockWorkspaceFiles } from '@/lib/mockData';

const PROJECT_ROOT = process.env.NEXT_PUBLIC_PROJECT_ROOT || './demo-project';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export default function Page() {
  const [mounted, setMounted] = React.useState(false);
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

  // Connect to real AIBuilder backend via WebSocket
  useAIBuilderConnection(PROJECT_ROOT);

  useEffect(() => {
    // If mock data is enabled (development), initialize with mock data
    if (USE_MOCK_DATA) {
      console.log('📊 Loading mock data for development');
      setSandboxStatus(mockSandboxStatus);
      setWorkspaceFiles(mockWorkspaceFiles);

      mockTasks.forEach((task) => {
        addTask(task);
        if (task.status === 'running') {
          setActiveTask(task);
        }
      });

      mockFileOps.forEach((op) => addFileOp(op));
      mockCommands.forEach((cmd) => addCommand(cmd));
      mockErrors.forEach((err) => addError(err));
    }

    setMounted(true);
  }, [
    setActiveTask,
    addTask,
    addFileOp,
    addCommand,
    addError,
    setSandboxStatus,
    setWorkspaceFiles,
    setConnected,
  ]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-darker">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">🚀 AI Laptop Builder</h1>
          <p className="text-gray-400">Connecting to secure backend...</p>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
