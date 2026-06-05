import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, MessageSquare, FileUp, UserPlus, FolderPlus, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const iconMap = {
  task_created: CheckCircle2,
  task_updated: RefreshCw,
  task_completed: CheckCircle2,
  comment_added: MessageSquare,
  file_uploaded: FileUp,
  member_added: UserPlus,
  project_created: FolderPlus,
  status_changed: RefreshCw,
};

const colorMap = {
  task_created: 'bg-primary/10 text-primary',
  task_completed: 'bg-emerald-50 text-emerald-600',
  comment_added: 'bg-blue-50 text-blue-600',
  file_uploaded: 'bg-violet-50 text-violet-600',
  member_added: 'bg-amber-50 text-amber-600',
  project_created: 'bg-primary/10 text-primary',
  task_updated: 'bg-slate-100 text-slate-600',
  status_changed: 'bg-amber-50 text-amber-600',
};

export default function RecentActivity({ activities = [] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 8).map((activity) => {
              const Icon = iconMap[activity.type] || RefreshCw;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorMap[activity.type] || 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}