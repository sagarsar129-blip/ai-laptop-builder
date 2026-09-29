'use client';

import { useState } from 'react';
import { useDashboardStore } from '@/lib/store';
import Header from './Header';
import Sidebar from './Sidebar';
import MainPanel from './MainPanel';
import RightPanel from './RightPanel';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'files' | 'logs' | 'sandbox'>('overview');

  return (
    <div className="flex flex-col h-screen bg-darker">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} />

        <MainPanel activeTab={activeTab} />

        <RightPanel />
      </div>
    </div>
  );
}
