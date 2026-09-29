'use client';

import { useDashboardStore } from '@/lib/store';
import TaskCard from '../cards/TaskCard';
import ErrorAlert from '../cards/ErrorAlert';
import StatsCard from '../cards/StatsCard';
import { Activity, AlertCircle } from 'lucide-react';

export default function OverviewTab() {
  const { activeTask, tasks, fileOps, commands, errors, sandboxStatus } =
    useDashboardStore();

  const successCount = tasks.filter((t) => t.status === 'success').length;
  const failedCount = tasks.filter((t) => t.status === 'failed').length;
  const runningCount = tasks.filter((t) => t.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          label="Total Tasks"
          value={tasks.length}
          icon={<Activity size={20} />}
        />
        <StatsCard
          label="Successful"
          value={successCount}
          variant="success"
        />
        <StatsCard
          label="Failed"
          value={failedCount}
          variant="error"
        />
        <StatsCard
          label="Running"
          value={runningCount}
          variant="warning"
        />
      </div>

      {/* Active Task */}
      {activeTask && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity size={20} /> Currently Running
          </h2>
          <TaskCard task={activeTask} active />
        </div>
      )}

      {/* Recent Errors */}
      {errors.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" /> Recent Errors
          </h2>
          <div className="space-y-2">
            {errors.slice(0, 3).map((error) => (
              <ErrorAlert key={error.id} error={error} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-bold mb-4">📊 Recent Activity</h2>
        <div className="bg-dark rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-400">
            📁 {fileOps.length} file operations
          </p>
          <p className="text-sm text-gray-400">
            💻 {commands.length} command executions
          </p>
          <p className="text-sm text-gray-400">
            ⚙️ Sandbox: {sandboxStatus?.isActive ? '✅ Active' : '❌ Inactive'}
          </p>
        </div>
      </div>
    </div>
  );
}
