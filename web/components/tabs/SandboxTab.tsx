'use client';

import { useDashboardStore } from '@/lib/store';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function SandboxTab() {
  const { sandboxStatus } = useDashboardStore();

  if (!sandboxStatus) {
    return <div className="text-gray-400">No sandbox information available.</div>;
  }

  const formatBytes = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-dark rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-blue-400" />
          <div>
            <h2 className="text-lg font-bold">Sandbox Status</h2>
            <div className="flex items-center gap-2 mt-2">
              {sandboxStatus.isActive ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-green-400">Active & Secure</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-red-500" />
                  <span className="text-red-400">Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Info */}
      <div className="bg-dark rounded-lg p-6 space-y-4">
        <h3 className="font-bold">📁 Workspace Information</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Root Directory</p>
            <p className="font-mono bg-slate-900 p-2 rounded break-words">
              {sandboxStatus.workspaceRoot}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 mb-1">File Count</p>
              <p className="text-xl font-bold">{sandboxStatus.fileCount}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Total Size</p>
              <p className="text-xl font-bold">
                {formatBytes(sandboxStatus.totalSizeBytes)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Last Activity</p>
            <p className="font-mono">{formatDate(sandboxStatus.lastActivityAt)}</p>
          </div>
        </div>
      </div>

      {/* Security Rules */}
      <div className="bg-dark rounded-lg p-6 space-y-4">
        <h3 className="font-bold">🔒 Security Rules</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>File access restricted to workspace directory</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>Path traversal attacks blocked</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>Symlink escapes prevented</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>Command injection blocked</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>Shell-free process execution</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span>Loop prevention with retry limits</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
