'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { CommandExecution } from '@/lib/types';

interface CommandLogCardProps {
  command: CommandExecution;
}

export default function CommandLogCard({ command }: CommandLogCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = command.success
    ? 'text-green-400 bg-green-900 bg-opacity-20'
    : 'text-red-400 bg-red-900 bg-opacity-20';

  const cmd = `${command.command} ${command.args.join(' ')}`;

  return (
    <div className="bg-dark border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`px-2 py-1 rounded text-xs font-mono ${statusColor}`}>
            {command.exitCode === 0 ? 'SUCCESS' : `EXIT ${command.exitCode}`}
          </div>
          <p className="text-sm font-mono truncate">{cmd}</p>
          <p className="text-xs text-gray-500 whitespace-nowrap ml-auto">
            {command.durationMs}ms
          </p>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="border-t border-slate-700 p-4 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-2">Output</p>
            <div className="bg-slate-900 rounded p-2 max-h-48 overflow-y-auto">
              {command.stdoutLines.length > 0 ? (
                command.stdoutLines.map((line, i) => (
                  <p key={i} className="text-xs font-mono text-green-400">
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-xs text-gray-500">(no output)</p>
              )}
            </div>
          </div>

          {command.stderrLines.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Errors</p>
              <div className="bg-slate-900 rounded p-2 max-h-48 overflow-y-auto">
                {command.stderrLines.map((line, i) => (
                  <p key={i} className="text-xs font-mono text-red-400">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
