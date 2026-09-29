'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import type { WorkspaceFile } from '@/lib/types';

interface FileTreeProps {
  files: WorkspaceFile[];
}

export default function FileTree({ files }: FileTreeProps) {
  const { expandedDirs, toggleDirExpanded, setSelectedFile } = useDashboardStore();

  const renderTree = (items: WorkspaceFile[], depth = 0) => {
    return items
      .filter((item) => {
        // Only show top-level items or children of expanded dirs
        const parts = item.path.split('/');
        if (parts.length === 1) return true;
        const parentPath = parts.slice(0, -1).join('/');
        return expandedDirs.has(parentPath);
      })
      .map((item) => {
        const isDir = item.isDirectory;
        const isExpanded = expandedDirs.has(item.path);

        return (
          <div key={item.path}>
            <button
              onClick={() => {
                if (isDir) {
                  toggleDirExpanded(item.path);
                } else {
                  setSelectedFile(item);
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1 hover:bg-slate-700 rounded text-left text-sm"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isDir ? (
                <>
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <Folder size={14} className="text-blue-400" />
                </>
              ) : (
                <>
                  <div className="w-3" />
                  <File size={14} className="text-gray-400" />
                </>
              )}
              <span className="truncate">{item.path.split('/').pop()}</span>
            </button>
          </div>
        );
      });
  };

  return <div className="space-y-1">{renderTree(files)}</div>;
}
