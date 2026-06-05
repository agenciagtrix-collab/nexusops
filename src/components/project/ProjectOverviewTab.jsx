import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, Tag, AlertCircle, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusLabels = {
  not_started: { label: 'Não Iniciado', class: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'Em Andamento', class: 'bg-blue-100 text-blue-700' },
  on_hold: { label: 'Em Espera', class: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Concluído', class: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', class: 'bg-red-100 text-red-700' },
};

const priorityLabels = {
  low: { label: 'Baixa', class: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Média', class: 'bg-blue-100 text-blue-700' },
  high: { label: 'Alta', class: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', class: 'bg-red-100 text-red-700' },
  critical: { label: 'Crítica', class: 'bg-red-200 text-red-800' },
};

function InfoRow({ icon: RowIcon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <RowIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function ProjectOverviewTab({ project, tasks = [], users = [], client }) {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  ).length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const statusInfo = statusLabels[project.status] || statusLabels.not_started;
  const priorityInfo = priorityLabels[project.priority] || priorityLabels.medium;
  const owner = users.find(u => u.id === project.owner_id);
  const teamMembers = (project.team_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Stats */}
      <div className="md:col-span-2 space-y-5">
        {/* Progress */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Progresso Geral
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Conclusão</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/40 rounded-lg">
                <div className="text-xl font-bold">{tasks.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-700">{completedTasks}</div>
                <div className="text-xs text-green-600 mt-0.5">Concluídas</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: overdueTasks > 0 ? '#fee2e2' : '#f0fdf4' }}>
                <div className={cn("text-xl font-bold", overdueTasks > 0 ? "text-red-700" : "text-green-700")}>
                  {overdueTasks}
                </div>
                <div className={cn("text-xs mt-0.5", overdueTasks > 0 ? "text-red-600" : "text-green-600")}>
                  Atrasadas
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        {project.description && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
          </Card>
        )}

        {/* Notes */}
        {project.notes && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Observações</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{project.notes}</p>
          </Card>
        )}

        {/* Custom Statuses */}
        {project.custom_statuses?.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Status Personalizados</h3>
            <div className="flex flex-wrap gap-2">
              {project.custom_statuses.map((s, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ backgroundColor: s.color + '20', color: s.color, border: `1px solid ${s.color}40` }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Info sidebar */}
      <Card className="p-5 h-fit">
        <h3 className="text-sm font-semibold mb-3">Informações</h3>

        <InfoRow icon={AlertCircle} label="Status">
          <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", statusInfo.class)}>
            {statusInfo.label}
          </span>
        </InfoRow>

        <InfoRow icon={AlertCircle} label="Prioridade">
          <span className={cn("text-xs px-2 py-0.5 rounded-md font-medium", priorityInfo.class)}>
            {priorityInfo.label}
          </span>
        </InfoRow>

        {project.start_date && (
          <InfoRow icon={Calendar} label="Data de Início">
            {format(new Date(project.start_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
          </InfoRow>
        )}

        {project.due_date && (
          <InfoRow icon={Calendar} label="Prazo de Entrega">
            <span className={cn(
              new Date(project.due_date) < new Date() && project.status !== 'completed' ? "text-destructive" : ""
            )}>
              {format(new Date(project.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
            </span>
          </InfoRow>
        )}

        {client && (
          <InfoRow icon={Users} label="Cliente">
            {client.name} {client.company ? `(${client.company})` : ''}
          </InfoRow>
        )}

        {owner && (
          <InfoRow icon={Users} label="Responsável">
            {owner.full_name || owner.email}
          </InfoRow>
        )}

        {teamMembers.length > 0 && (
          <InfoRow icon={Users} label="Equipe">
            <div className="flex flex-col gap-1">
              {teamMembers.map(m => (
                <span key={m.id} className="text-sm">{m.full_name || m.email}</span>
              ))}
            </div>
          </InfoRow>
        )}

        {project.tags?.length > 0 && (
          <InfoRow icon={Tag} label="Tags">
            <div className="flex flex-wrap gap-1">
              {project.tags.map(tag => (
                <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          </InfoRow>
        )}

        {project.code && (
          <InfoRow icon={FileText} label="Código">
            <span className="font-mono">{project.code}</span>
          </InfoRow>
        )}
      </Card>
    </div>
  );
}