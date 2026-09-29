'use client';

import { useDashboardStore } from '@/lib/store';
import FileOpCard from '../cards/FileOpCard';

export default function FilesTab() {
  const { fileOps } = useDashboardStore();

  const groupedOps = {
    create: fileOps.filter((op) => op.operationType === 'create'),
    write: fileOps.filter((op) => op.operationType === 'write'),
    read: fileOps.filter((op) => op.operationType === 'read'),
    delete: fileOps.filter((op) => op.operationType === 'delete'),
  };

  return (
    <div className="space-y-6">
      {groupedOps.create.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-blue-400">✨ Created</h2>
          <div className="space-y-2">
            {groupedOps.create.map((op) => (
              <FileOpCard key={op.id} op={op} />
            ))}
          </div>
        </div>
      )}

      {groupedOps.write.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-yellow-400">✏️ Modified</h2>
          <div className="space-y-2">
            {groupedOps.write.map((op) => (
              <FileOpCard key={op.id} op={op} />
            ))}
          </div>
        </div>
      )}

      {groupedOps.read.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-green-400">👁️ Read</h2>
          <div className="space-y-2">
            {groupedOps.read.map((op) => (
              <FileOpCard key={op.id} op={op} />
            ))}
          </div>
        </div>
      )}

      {groupedOps.delete.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-red-400">🗑️ Deleted</h2>
          <div className="space-y-2">
            {groupedOps.delete.map((op) => (
              <FileOpCard key={op.id} op={op} />
            ))}
          </div>
        </div>
      )}

      {fileOps.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No file operations yet.</p>
        </div>
      )}
    </div>
  );
}
