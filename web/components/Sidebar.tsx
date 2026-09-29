'use client';

import { LayoutGrid, CheckSquare, FileText, Terminal, Shield } from 'lucide-react';

type TabType = 'overview' | 'tasks' | 'files' | 'logs' | 'sandbox';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
}

const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid size={18} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
  { id: 'files', label: 'Files', icon: <FileText size={18} /> },
  { id: 'logs', label: 'Logs', icon: <Terminal size={18} /> },
  { id: 'sandbox', label: 'Sandbox', icon: <Shield size={18} /> },
];

export default function Sidebar({ activeTab, onTabChange, isOpen }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-dark border-r border-slate-700 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700 text-gray-300'
            }`}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
