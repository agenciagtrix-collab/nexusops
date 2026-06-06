import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, CheckSquare, MessageSquare, RefreshCw, Users, Clock, PlusCircle } from 'lucide-react';

const activityConfig = {
  task_created: { icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  task_updated: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
  task_completed: { icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  comment_added: { icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
  status_changed: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50' },
  member_added: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
};

const fieldLabels = {
  title: 'Título', description: 'Descrição', status: 'Status', priority: 'Prioridade',
  due_date: 'Data de entrega', start_date: 'Data de início', assignee_ids: 'Responsáveis',
  estimated_hours: 'Horas estimadas', logged_hours: 'Horas executadas', tags: 'Tags',
  checklist: 'Checklist', is_recurring: 'Recorrência',
};

export default function TaskHistoryTab({ taskId }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['task-activities', taskId],
    queryFn: () => base44.entities.Activity.filter({ task_id: taskId }, '-created_date', 50),
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
        <p className="text-xs text-muted-foreground mt-1">As alterações desta tarefa aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="relative max-h-64 overflow-y-auto">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-3 pb-2">
        {activities.map(act => {
          const cfg = activityConfig[act.type] || { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' };
          const Icon = cfg.icon;
          const changedFields = act.metadata?.changed_fields || [];
          return (
            <div key={act.id} className="flex items-start gap-3 pl-10 relative">
              <div className={`absolute left-2 top-2 w-5 h-5 rounded-full flex items-center justify-center ${cfg.bg} border-2 border-background shrink-0`}>
                <Icon className={`w-2.5 h-2.5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{act.description}</p>
                {changedFields.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {changedFields.map(f => (
                      <span key={f} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {fieldLabels[f] || f}
                      </span>
                    ))}
                  </div>
                )}
                {act.metadata?.old_status && act.metadata?.new_status && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">{act.metadata.old_status}</span>
                    <span>→</span>
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{act.metadata.new_status}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(act.created_date), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}