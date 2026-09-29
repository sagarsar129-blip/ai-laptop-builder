'use client';

import { useDashboardStore } from '@/lib/store';
import FileTree from './FileTree';
import FilePreview from './FilePreview';

export default function RightPanel() {
  const { selectedFile, workspaceFiles } = useDashboardStore();

  return (
    <aside className="w-80 bg-dark border-l border-slate-700 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto border-b border-slate-700">
        <div className="p-4">
          <h3 className="text-sm font-bold text-gray-300 mb-3">📁 Workspace</h3>
          <FileTree files={workspaceFiles} />
        </div>
      </div>

      {selectedFile && (
        <div className="flex-1 overflow-y-auto p-4">
          <FilePreview file={selectedFile} />
        </div>
      )}
    </aside>
  );
}
