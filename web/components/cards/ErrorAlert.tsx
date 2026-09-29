'use client';

import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import type { ErrorEvent } from '@/lib/types';

interface ErrorAlertProps {
  error: ErrorEvent;
}

export default function ErrorAlert({ error }: ErrorAlertProps) {
  const { dismissError } = useDashboardStore();

  const icon = {
    error: <AlertCircle size={18} className="text-red-500" />,
    warning: <AlertTriangle size={18} className="text-yellow-500" />,
    info: <Info size={18} className="text-blue-500" />,
  }[error.severity];

  const bgColor = {
    error: 'bg-red-900 bg-opacity-20 border border-red-700',
    warning: 'bg-yellow-900 bg-opacity-20 border border-yellow-700',
    info: 'bg-blue-900 bg-opacity-20 border border-blue-700',
  }[error.severity];

  return (
    <div className={`rounded-lg p-4 space-y-2 ${bgColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {icon}
          <div className="flex-1">
            <p className="text-sm font-medium">{error.message}</p>
            {error.taskId && (
              <p className="text-xs text-gray-400 mt-1">Task: {error.taskId}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => dismissError(error.id)}
          className="p-1 hover:bg-white hover:bg-opacity-10 rounded"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
