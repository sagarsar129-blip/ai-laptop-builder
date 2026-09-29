'use client';

import { useDashboardStore } from '@/lib/store';
import TaskCard from '../cards/TaskCard';

export default function TasksTab() {
  const { tasks } = useDashboardStore();

  const groupedTasks = {
    running: tasks.filter((t) => t.status === 'running'),
    success: tasks.filter((t) => t.status === 'success'),
    failed: tasks.filter((t) => t.status === 'failed'),
    queued: tasks.filter((t) => t.status === 'queued'),
    waiting: tasks.filter((t) => t.status === 'waiting'),
  };

  return (
    <div className="space-y-6">
      {groupedTasks.running.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-yellow-400">🔄 Running</h2>
          <div className="space-y-3">
            {groupedTasks.running.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {groupedTasks.success.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-green-400">✅ Successful</h2>
          <div className="space-y-3">
            {groupedTasks.success.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {groupedTasks.failed.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-red-400">❌ Failed</h2>
          <div className="space-y-3">
            {groupedTasks.failed.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No tasks yet. AI will create tasks when building.</p>
        </div>
      )}
    </div>
  );
}
