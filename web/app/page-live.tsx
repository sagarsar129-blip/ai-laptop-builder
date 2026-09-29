'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/lib/store';
import { aiBuilderBridge } from '@/lib/engine-bridge';
import { useAIBuilderConnection } from '@/lib/hooks/useAIBuilderConnection';
import Dashboard from '@/components/Dashboard';

const PROJECT_ROOT = process.env.NEXT_PUBLIC_PROJECT_ROOT || './demo-project';

export default function Page() {
  const [mounted, setMounted] = React.useState(false);
  const { setConnected } = useDashboardStore();

  // Connect to AIBuilder engine
  useAIBuilderConnection(PROJECT_ROOT);

  useEffect(() => {
    // Initialize connection to AIBuilder workspace
    aiBuilderBridge.connectWorkspace(PROJECT_ROOT);
    setMounted(true);
  }, [setConnected]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-darker">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🚀 Initializing AI Builder...</h1>
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
