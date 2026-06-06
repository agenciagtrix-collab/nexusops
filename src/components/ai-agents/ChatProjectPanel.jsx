import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FolderOpen, CheckCircle2, Clock, AlertTriangle, Brain, Bot,
  Calendar, Users, TrendingUp, X, ChevronDown, ChevronRight, Zap,
  MemoryStick,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_MAP = {
  not_started: { label: 'Não iniciado', cls: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'Em andamento', cls: 'bg-blue-100 text-blue-700' },
  on_hold: { label: 'Pausado', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
};

const SEVERITY_COLORS = {
  low: 'text-blue-600',
  medium: 'text-amber-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

function Section({ title, icon: SectionIcon, children, defaultOpen = true, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(s => !s)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <SectionIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{count}</span>
        )}
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export default function ChatProjectPanel({
  project, tasks = [], memories = [], alerts = [], agents = [],
  projects = [], selectedProjectId, onSelectProject, onClose,
}) {
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
  const todo = tasks.filter(t => t.status === 'todo').length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const statusCfg = STATUS_MAP[project?.status] || STATUS_MAP.not_started;

  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-foreground">Contexto do Projeto</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Project Selector */}
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Projeto Ativo</p>
          <select
            value={selectedProjectId}
            onChange={e => onSelectProject(e.target.value)}
            className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-2 text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Nenhum projeto selecionado</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {!project ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">Selecione um projeto para ver o contexto em tempo real</p>
          </div>
        ) : (
          <>
            {/* Project Overview */}
            <Section title="Visão Geral" icon={FolderOpen} defaultOpen={true}>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{project.name}</p>
                  {project.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[10px] border-0", statusCfg.cls)}>{statusCfg.label}</Badge>
                  {project.priority && (
                    <Badge className="text-[10px] bg-muted text-muted-foreground border-0">{project.priority}</Badge>
                  )}
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">Progresso</span>
                    <span className="text-xs font-bold text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {project.due_date && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Entrega:</span>
                    <span className={cn("font-medium",
                      new Date(project.due_date) < new Date() ? "text-red-600" : "text-foreground"
                    )}>
                      {format(parseISO(project.due_date), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </Section>

            {/* Task Stats */}
            <Section title="Tarefas" icon={CheckCircle2} defaultOpen={true} count={tasks.length}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total', value: tasks.length, cls: 'text-foreground' },
                  { label: 'Concluídas', value: done, cls: 'text-emerald-600' },
                  { label: 'Em andamento', value: inProgress, cls: 'text-blue-600' },
                  { label: 'A fazer', value: todo, cls: 'text-muted-foreground' },
                ].map(stat => (
                  <div key={stat.label} className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <p className={cn("text-lg font-bold", stat.cls)}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {overdue.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-1.5 text-red-700 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">{overdue.length} tarefa(s) atrasada(s)</span>
                  </div>
                  <div className="space-y-1">
                    {overdue.slice(0, 3).map(t => (
                      <p key={t.id} className="text-[10px] text-red-600 truncate">• {t.title}</p>
                    ))}
                    {overdue.length > 3 && <p className="text-[10px] text-red-500">+{overdue.length - 3} mais...</p>}
                  </div>
                </div>
              )}
            </Section>

            {/* Alerts */}
            {alerts.length > 0 && (
              <Section title="Alertas Ativos" icon={Zap} defaultOpen={true} count={alerts.length}>
                <div className="space-y-2">
                  {alerts.slice(0, 4).map(alert => (
                    <div key={alert.id} className="flex items-start gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                        alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400'
                      )} />
                      <div>
                        <p className="text-[11px] font-medium text-foreground">{alert.title}</p>
                        {alert.suggested_action && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">💡 {alert.suggested_action}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Memories */}
            {memories.length > 0 && (
              <Section title="Memórias do Projeto" icon={Brain} defaultOpen={false} count={memories.length}>
                <div className="space-y-2">
                  {memories.slice(0, 5).map(mem => (
                    <div key={mem.id} className="flex items-start gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                        mem.importance === 'high' ? 'bg-red-400' : mem.importance === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                      )} />
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground">{mem.memory_type}</p>
                        <p className="text-[11px] text-foreground">{mem.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Active Agents */}
            {agents.length > 0 && (
              <Section title="Especialistas Ativos" icon={Bot} defaultOpen={false} count={agents.length}>
                <div className="space-y-2">
                  {agents.map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: a.avatar_color || '#6366f1' }}>
                        {a.avatar_emoji || '🤖'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{a.speciality}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Context indicator */}
            <Section title="Contexto Carregado" icon={TrendingUp} defaultOpen={false}>
              <div className="space-y-1.5">
                {[
                  { label: 'Projeto', active: !!project },
                  { label: 'Tarefas', active: tasks.length > 0, count: tasks.length },
                  { label: 'Cronograma', active: !!project?.due_date },
                  { label: 'Memórias', active: memories.length > 0, count: memories.length },
                  { label: 'Alertas', active: alerts.length > 0, count: alerts.length },
                  { label: 'Especialistas', active: agents.length > 0, count: agents.length },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <CheckCircle2 className={cn("w-3.5 h-3.5", item.active ? "text-emerald-500" : "text-muted-foreground/30")} />
                    <span className={cn("text-[11px]", item.active ? "text-foreground" : "text-muted-foreground/50")}>
                      {item.label}
                    </span>
                    {item.count !== undefined && item.active && (
                      <span className="ml-auto text-[10px] text-muted-foreground">{item.count}</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}