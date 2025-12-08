import React from 'react';
import { Loader2, CheckCircle2, XCircle, FileIcon } from 'lucide-react';
import { TaskStatus } from '../types';

interface ProcessingQueueProps {
  tasks: TaskStatus[];
}

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ tasks }) => {
  if (tasks.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 animate-in slide-in-from-top-2 fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-lg">
        <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Queue</h3>
            <span className="text-[10px] text-zinc-600 font-mono">{tasks.filter(t => t.status === 'success' || t.status === 'error').length} / {tasks.length}</span>
        </div>
        <div className="divide-y divide-zinc-800/50 max-h-40 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`
                  p-1.5 rounded-md shrink-0
                  ${task.status === 'processing' ? 'text-blue-400 bg-blue-400/10' : ''}
                  ${task.status === 'success' ? 'text-green-400 bg-green-400/10' : ''}
                  ${task.status === 'error' ? 'text-red-400 bg-red-400/10' : ''}
                  ${task.status === 'pending' ? 'text-zinc-500 bg-zinc-800' : ''}
                `}>
                  {task.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {task.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {task.status === 'error' && <XCircle className="w-3.5 h-3.5" />}
                  {task.status === 'pending' && <FileIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-zinc-300 truncate pr-4" title={task.name}>{task.name}</span>
                  {task.message && (
                    <span className="text-[10px] text-zinc-500 truncate">{task.message}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessingQueue;