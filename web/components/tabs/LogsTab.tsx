'use client';

import { useDashboardStore } from '@/lib/store';
import CommandLogCard from '../cards/CommandLogCard';

export default function LogsTab() {
  const { commands } = useDashboardStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">💻 Command Logs</h2>
        <span className="text-sm text-gray-400">{commands.length} commands</span>
      </div>

      {commands.length > 0 ? (
        <div className="space-y-3">
          {commands.map((cmd) => (
            <CommandLogCard key={cmd.id} command={cmd} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>No command logs yet.</p>
        </div>
      )}
    </div>
  );
}
