'use client';

import { Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  active?: boolean;
}

export default function TaskCard({ task, active }: TaskCardProps) {
  const formatDuration = (startMs: number, endMs?: number) => {
    const end = endMs || Date.now();
    const durationMs = end - startMs;
    const seconds = Math.round(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  const statusIcon = {
    success: <CheckCircle size={18} className="text-green-500" />,
    failed: <AlertCircle size={18} className="text-red-500" />,
    running: <Loader size={18} className="text-yellow-500 animate-spin" />,
    queued: <Clock size={18} className="text-gray-400" />,
    waiting: <Clock size={18} className="text-blue-400" />,
  }[task.status];

  const progressPercent = (task.attemptNumber / task.maxAttempts) * 100;

  return (
    <div
      className={`rounded-lg p-4 space-y-3 ${
        active
          ? 'bg-blue-900 border border-blue-500'
          : 'bg-dark border border-slate-700 hover:border-slate-600'
      } transition`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          {statusIcon}
          <div className="flex-1">
            <h3 className="font-bold">
              {task.command} {task.args.join(' ')}
            </h3>
            <p className="text-sm text-gray-400">{task.description}</p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${
            task.status === 'success'
              ? 'bg-green-900 text-green-300'
              : task.status === 'failed'
              ? 'bg-red-900 text-red-300'
              : task.status === 'running'
              ? 'bg-yellow-900 text-yellow-300'
              : 'bg-slate-700 text-gray-300'
          }`}
        >
          {task.status}
        </span>
      </div>

      {task.error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-2 text-xs text-red-200">
          {task.error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div>
          <p>Duration</p>
          <p className="text-gray-200 font-mono">
            {formatDuration(task.startedAt, task.completedAt)}
          </p>
        </div>
        <div>
          <p>Attempt</p>
          <p className="text-gray-200 font-mono">
            {task.attemptNumber} / {task.maxAttempts}
          </p>
        </div>
        <div>
          <p>State Changed</p>
          <p className="text-gray-200">{task.stateChanged ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-1">
        <div
          className="bg-blue-500 h-1 rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
