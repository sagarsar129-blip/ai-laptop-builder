'use client';

import { FileText, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import type { FileOperation } from '@/lib/types';

interface FileOpCardProps {
  op: FileOperation;
}

export default function FileOpCard({ op }: FileOpCardProps) {
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const opIcon = {
    create: <Plus size={16} className="text-blue-400" />,
    write: <Edit2 size={16} className="text-yellow-400" />,
    read: <Eye size={16} className="text-green-400" />,
    delete: <Trash2 size={16} className="text-red-400" />,
    execute: <FileText size={16} className="text-purple-400" />,
    append: <Edit2 size={16} className="text-orange-400" />,
  }[op.operationType];

  return (
    <div className="flex items-start gap-3 bg-dark p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition">
      {opIcon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono truncate text-gray-300">{op.filePath}</p>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(op.timestamp).toLocaleTimeString()}
          {op.sizeBytes && ` • ${formatBytes(op.sizeBytes)}`}
        </p>
      </div>
      {!op.success && (
        <div className="text-xs text-red-400 ml-2">❌</div>
      )}
    </div>
  );
}
