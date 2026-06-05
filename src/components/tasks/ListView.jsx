import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Média', color: 'bg-blue-50 text-blue-600' },
  high: { label: 'Alta', color: 'bg-amber-50 text-amber-600' },
  urgent: { label: 'Urgente', color: 'bg-orange-50 text-orange-600' },
  critical: { label: 'Crítica', color: 'bg-red-50 text-red-600' },
};

export default function ListView({ tasks = [], onTaskClick, onToggleComplete, users = [] }) {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div className="col-span-5 md:col-span-5">Tarefa</div>
        <div className="col-span-2 hidden md:block">Status</div>
        <div className="col-span-2 hidden md:block">Prioridade</div>
        <div className="col-span-2 hidden md:block">Entrega</div>
        <div className="col-span-1 hidden md:block">Resp.</div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Nenhuma tarefa encontrada
        </div>
      ) : (
        tasks.map((task) => {
          const priority = priorityConfig[task.priority] || priorityConfig.medium;
          const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'done';
          const isDone = task.status === 'done';

          return (
            <div
              key={task.id}
              className="grid grid-cols-12 gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors items-center group"
              onClick={() => onTaskClick?.(task)}
            >
              <div className="col-span-10 md:col-span-5 flex items-center gap-3">
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => onToggleComplete?.(task)}
                  onClick={e => e.stopPropagation()}
                  className="shrink-0"
                />
                <span className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
              </div>
              <div className="col-span-2 hidden md:block">
                <Badge variant="secondary" className="text-[10px]">
                  {task.status?.replace(/_/g, ' ') || 'A Fazer'}
                </Badge>
              </div>
              <div className="col-span-2 hidden md:block">
                <Badge variant="secondary" className={cn("text-[10px]", priority.color)}>
                  {priority.label}
                </Badge>
              </div>
              <div className="col-span-2 hidden md:block">
                {task.due_date ? (
                  <span className={cn("text-xs flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                {task.assignee_ids?.length > 0 && (
                  <div className="flex -space-x-1">
                    {task.assignee_ids.slice(0, 2).map((uid, i) => {
                      const user = users.find(u => u.id === uid);
                      return (
                        <Avatar key={i} className="w-6 h-6 border-2 border-card">
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                            {user?.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}