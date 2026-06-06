import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Building2, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig = {
  not_started: { label: 'Não Iniciado', dot: 'bg-gray-400' },
  in_progress:  { label: 'Em Andamento', dot: 'bg-blue-500' },
  on_hold:      { label: 'Em Pausa',    dot: 'bg-amber-500' },
  completed:    { label: 'Concluído',   dot: 'bg-emerald-500' },
  cancelled:    { label: 'Cancelado',   dot: 'bg-red-500' },
};

const priorityConfig = {
  low:      { label: 'Baixa',    class: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium:   { label: 'Média',    class: 'bg-blue-50 text-blue-600 border-blue-200' },
  high:     { label: 'Alta',     class: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent:   { label: 'Urgente',  class: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Crítica',  class: 'bg-red-50 text-red-700 border-red-200' },
};

function MetaChip({ icon: IconComp, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 text-sm text-white/90">
      <IconComp className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
      <span className="text-white/60 text-xs">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function PortalHeader({ project, client, tasks, settings }) {
  const accentColor = project.color || '#6366f1';
  const fmtDate = (d) => d ? format(parseISO(d), "dd 'de' MMMM, yyyy", { locale: ptBR }) : null;
  const status = statusConfig[project.status] || statusConfig.not_started;
  const priority = priorityConfig[project.priority];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accentColor}ee 0%, ${accentColor}99 60%, ${accentColor}cc 100%)`,
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Soft blob */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.3)', filter: 'blur(40px)' }} />

      <div className="relative max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Project icon */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-3xl">
                {project.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Project info */}
          <div className="flex-1 min-w-0">
            {/* Status + priority badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/20">
                <div className={cn("w-2 h-2 rounded-full", status.dot)} />
                <span className="text-xs text-white font-medium">{status.label}</span>
              </div>
              {priority && (
                <Badge className={cn("text-xs border", priority.class)}>{priority.label}</Badge>
              )}
              {project.code && (
                <span className="text-xs font-mono bg-white/15 text-white/80 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/20">
                  {project.code}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
              {project.name}
            </h1>

            {/* Description */}
            {project.description && (
              <p className="text-white/75 text-sm leading-relaxed mb-4 max-w-2xl line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {client && (
                <MetaChip icon={Building2} label="Cliente" value={client.company || client.name} />
              )}
              {settings.show_due_dates && project.due_date && (
                <MetaChip icon={Calendar} label="Entrega" value={fmtDate(project.due_date)} />
              )}
              <MetaChip
                icon={Clock}
                label="Atualizado"
                value={project.updated_date ? format(parseISO(project.updated_date), "dd/MM/yyyy", { locale: ptBR }) : null}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <svg viewBox="0 0 1440 32" className="absolute bottom-0 left-0 right-0 w-full" preserveAspectRatio="none" style={{ height: 32 }}>
        <path d="M0,32L1440,0L1440,32L0,32Z" fill="rgb(249 250 251)" className="dark:fill-gray-950" />
      </svg>
    </div>
  );
}