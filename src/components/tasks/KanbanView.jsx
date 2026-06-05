import React from 'react';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const defaultStatuses = [
  { name: 'A Fazer', key: 'todo', color: '#94a3b8' },
  { name: 'Em Andamento', key: 'in_progress', color: '#6366f1' },
  { name: 'Em Revisão', key: 'review', color: '#f59e0b' },
  { name: 'Concluído', key: 'done', color: '#22c55e' },
];

export default function KanbanView({ tasks = [], statuses, onTaskClick, onAddTask, users = [] }) {
  const columns = statuses?.length > 0 
    ? statuses.map(s => ({ name: s.name, key: s.name.toLowerCase().replace(/\s/g, '_'), color: s.color }))
    : defaultStatuses;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {columns.map((col) => {
        const columnTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} className="flex-shrink-0 w-[280px] md:w-[300px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-semibold">{col.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => onAddTask?.(col.key)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="space-y-2.5 min-h-[200px] bg-muted/30 rounded-xl p-2">
              {columnTasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground/50">
                  Nenhuma tarefa
                </div>
              ) : (
                columnTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={onTaskClick} users={users} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}