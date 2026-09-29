'use client';

import { Menu, Circle } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { isConnected, sandboxStatus } = useDashboardStore();

  return (
    <header className="bg-dark border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-700 rounded-lg transition"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-xl font-bold">🔐 AI Laptop Builder</h1>
          <p className="text-sm text-gray-400">
            {sandboxStatus?.workspaceRoot || 'No workspace'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Circle
            size={12}
            className={isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}
          />
          <span className="text-sm">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {sandboxStatus && (
          <div className="text-sm text-gray-400">
            📁 {sandboxStatus.fileCount} files • {(sandboxStatus.totalSizeBytes / 1024 / 1024).toFixed(1)} MB
          </div>
        )}
      </div>
    </header>
  );
}
