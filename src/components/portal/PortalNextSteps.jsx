import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronRight } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusLabels = {
  todo: { label: 'A Fazer', class: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_progress: { label: 'Em Andamento', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  review: { label: 'Em Revisão', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  done: { label: 'Concluído', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const getStatusInfo = (status, customStatuses) => {
  if (customStatuses?.length > 0) {
    const cs = customStatuses.find(s => s.name === status);
    if (cs) return { label: cs.name, color: cs.color };
  }
  return statusLabels[status] || { label: status, class: 'bg-gray-100 text-gray-700 border-gray-200' };
};

export default function PortalNextSteps({ tasks, settings, project }) {
  const upcoming = tasks
    .filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 10);

  if (upcoming.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground text-sm">
        Nenhuma tarefa com prazo definido no momento.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">Próximos Passos</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Atividades planejadas em ordem cronológica</p>
      </div>
      <div className="divide-y divide-border">
        {upcoming.map((task, i) => {
          const days = differenceInDays(parseISO(task.due_date), new Date());
          const isOverdue = days < 0;
          const statusInfo = getStatusInfo(task.status, project?.custom_statuses);

          return (
            <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white",
                isOverdue ? 'bg-red-500' : i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {statusInfo.color ? (
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                  ) : (
                    <Badge className={cn("text-[10px] border", statusInfo.class)}>{statusInfo.label}</Badge>
                  )}
                  {settings.show_due_dates && (
                    <span className={cn("text-xs flex items-center gap-1", isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground')}>
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                      {isOverdue ? ' (atrasada)' : days === 0 ? ' (hoje)' : ` (${days}d)`}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}