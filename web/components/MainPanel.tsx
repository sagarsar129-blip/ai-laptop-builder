'use client';

import { useDashboardStore } from '@/lib/store';
import OverviewTab from './tabs/OverviewTab';
import TasksTab from './tabs/TasksTab';
import FilesTab from './tabs/FilesTab';
import LogsTab from './tabs/LogsTab';
import SandboxTab from './tabs/SandboxTab';

type TabType = 'overview' | 'tasks' | 'files' | 'logs' | 'sandbox';

interface MainPanelProps {
  activeTab: TabType;
}

export default function MainPanel({ activeTab }: MainPanelProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-darker p-6">
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'files' && <FilesTab />}
      {activeTab === 'logs' && <LogsTab />}
      {activeTab === 'sandbox' && <SandboxTab />}
    </main>
  );
}
