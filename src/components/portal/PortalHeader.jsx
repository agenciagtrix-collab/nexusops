import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Building2, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  not_started: { label: 'Não Iniciado', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  in_progress:  { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  on_hold:      { label: 'Em Pausa',    className: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed:    { label: 'Concluído',   className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:    { label: 'Cancelado',   className: 'bg-red-100 text-red-700 border-red-200' },
};

function InfoCard({ icon: IconComp, label, value }) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3 border border-border backdrop-blur-sm">
      <div className="flex items-center gap-1.5 mb-1">
        <IconComp className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

export default function PortalHeader({ project, client, tasks, settings }) {
  const completed = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : (project.progress || 0);
  const status = statusConfig[project.status] || statusConfig.not_started;
  const fmtDate = (d) => d ? format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }) : '—';

  return (
    <div
      className="border-b border-border"
      style={{ background: `linear-gradient(135deg, ${(project.color || '#6366f1')}18 0%, ${(project.color || '#6366f1')}08 100%)`, borderBottom: `3px solid ${project.color || '#6366f1'}` }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Title row */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
            style={{ backgroundColor: project.color || '#6366f1' }}
          >
            {project.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              {project.code && (
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">{project.code}</span>
              )}
              <Badge className={cn("text-xs border", status.className)}>{status.label}</Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {client && (
            <InfoCard icon={Building2} label="Cliente" value={client.company || client.name} />
          )}
          {project.due_date && settings.show_due_dates && (
            <InfoCard icon={Calendar} label="Previsão de entrega" value={fmtDate(project.due_date)} />
          )}
          <InfoCard icon={CheckCircle2} label="Progresso" value={`${completed} / ${tasks.length} tarefas`} />
          <InfoCard icon={Clock} label="Atualizado em" value={fmtDate(project.updated_date)} />
        </div>

        {/* Progress bar */}
        {settings.show_progress && tasks.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-border backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-foreground">Progresso geral</span>
              <span className="text-xl font-bold" style={{ color: project.color || '#6366f1' }}>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-emerald-600 font-medium">{completed} concluídas</span>
              <span className="text-muted-foreground">{tasks.length - completed} em aberto</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}