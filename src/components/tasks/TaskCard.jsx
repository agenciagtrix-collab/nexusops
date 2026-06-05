import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Paperclip, MessageSquare, CheckSquare } from 'lucide-react';
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

export default function TaskCard({ task, onClick, users = [] }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'done';
  const checklistDone = task.checklist?.filter(c => c.done).length || 0;
  const checklistTotal = task.checklist?.length || 0;

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-all hover:border-primary/20 group"
      onClick={() => onClick?.(task)}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {task.title}
          </h4>
          <Badge variant="secondary" className={cn("text-[10px] shrink-0 px-1.5", priority.color)}>
            {priority.label}
          </Badge>
        </div>

        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {task.due_date && (
              <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
              </span>
            )}
            {checklistTotal > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                {checklistDone}/{checklistTotal}
              </span>
            )}
            {task.attachments?.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {task.attachments.length}
              </span>
            )}
          </div>
          {task.assignee_ids?.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assignee_ids.slice(0, 3).map((uid, i) => {
                const user = users.find(u => u.id === uid);
                return (
                  <Avatar key={i} className="w-5 h-5 border border-card">
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                      {user?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}