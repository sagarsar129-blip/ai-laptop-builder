'use client';

import { X, Download } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import type { WorkspaceFile } from '@/lib/types';

interface FilePreviewProps {
  file: WorkspaceFile;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const { setSelectedFile } = useDashboardStore();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-300">📄 File Info</h3>
        <button
          onClick={() => setSelectedFile(null)}
          className="p-1 hover:bg-slate-700 rounded"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <p className="text-gray-400 mb-1">Path</p>
          <p className="font-mono bg-slate-900 p-2 rounded break-words">{file.path}</p>
        </div>

        <div>
          <p className="text-gray-400 mb-1">Size</p>
          <p className="font-mono">{formatSize(file.sizeBytes)}</p>
        </div>

        <div>
          <p className="text-gray-400 mb-1">Modified</p>
          <p className="font-mono">{formatDate(file.modifiedAt)}</p>
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium transition">
          <Download size={14} />
          Download
        </button>
      </div>
    </div>
  );
}
