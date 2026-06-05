import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2, Plus, MessageSquare, Upload, RefreshCw, UserPlus, FolderOpen, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const activityConfig = {
  task_created: { icon: Plus, color: 'text-blue-600', bg: 'bg-blue-50' },
  task_updated: { icon: RefreshCw, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  task_completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  comment_added: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
  file_uploaded: { icon: Upload, color: 'text-orange-600', bg: 'bg-orange-50' },
  status_changed: { icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  member_added: { icon: UserPlus, color: 'text-teal-600', bg: 'bg-teal-50' },
  project_created: { icon: FolderOpen, color: 'text-primary', bg: 'bg-primary/10' },
};

export default function ProjectHistoryTab({ projectId }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', projectId],
    queryFn: () => base44.entities.Activity.filter({ project_id: projectId }, '-created_date', 50),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Activity className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-1">
      <h3 className="text-base font-heading font-semibold mb-4">Histórico de Atividades</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-1">
          {activities.map((activity) => {
            const config = activityConfig[activity.type] || activityConfig.task_updated;
            const Icon = config.icon;
            return (
              <div key={activity.id} className="flex gap-4 py-3 pl-0 group">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-card",
                  config.bg
                )}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0 pt-2">
                  <p className="text-sm text-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}