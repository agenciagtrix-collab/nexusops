import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Zap, RefreshCw, Loader2, Lightbulb, Target, BarChart3, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO } from 'date-fns';

// ── Local heuristic insights (instant, no API call) ──────────────────────────
function computeLocalInsights(projects, tasks) {
  const insights = [];
  const now = new Date();

  const overdueProjects = projects.filter(p => {
    if (!p.due_date || p.status === 'completed' || p.status === 'cancelled') return false;
    return differenceInDays(parseISO(p.due_date), now) < 0;
  });
  if (overdueProjects.length > 0) {
    insights.push({
      type: 'alert', icon: AlertTriangle, color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
      title: `${overdueProjects.length} projeto(s) em atraso`,
      description: overdueProjects.slice(0, 2).map(p => p.name).join(', ') + (overdueProjects.length > 2 ? ` e mais ${overdueProjects.length - 2}` : ''),
      badge: 'Crítico', badgeClass: 'bg-red-100 text-red-700',
    });
  }

  const urgentTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
    const diff = differenceInDays(parseISO(t.due_date), now);
    return diff >= 0 && diff <= 3;
  });
  if (urgentTasks.length > 0) {
    insights.push({
      type: 'warning', icon: Clock, color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      title: `${urgentTasks.length} tarefa(s) vencem em até 3 dias`,
      description: urgentTasks.slice(0, 2).map(t => t.title).join(', '),
      badge: 'Atenção', badgeClass: 'bg-amber-100 text-amber-700',
    });
  }

  const unassigned = tasks.filter(t => !t.assignee_ids?.length && t.status !== 'done');
  if (unassigned.length > 5) {
    insights.push({
      type: 'info', icon: Zap, color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      title: `${unassigned.length} tarefas sem responsável`,
      description: 'Atribuir responsáveis aumenta a taxa de conclusão significativamente.',
      badge: 'Info', badgeClass: 'bg-blue-100 text-blue-700',
    });
  }

  const completedLastWeek = tasks.filter(t => {
    if (t.status !== 'done' || !t.completed_date) return false;
    return differenceInDays(now, parseISO(t.completed_date)) <= 7;
  }).length;
  if (completedLastWeek >= 5) {
    insights.push({
      type: 'good', icon: CheckCircle2, color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      title: `${completedLastWeek} tarefas concluídas esta semana`,
      description: 'Sua equipe está acima da média de produtividade.',
      badge: 'Ótimo', badgeClass: 'bg-emerald-100 text-emerald-700',
    });
  }

  return insights;
}

// ── Severity/risk colors ──────────────────────────────────────────────────────
const severityMap = {
  critical: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800', badge: 'bg-red-100 text-red-700', label: 'Crítico' },
  high:     { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700', label: 'Alto' },
  medium:   { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700', label: 'Médio' },
  low:      { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', badge: 'bg-blue-100 text-blue-700', label: 'Baixo' },
};

// ── Section component ─────────────────────────────────────────────────────────
function AISection({ icon: Icon, iconBg, title, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", iconBg)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIInsightsPanel({ compact = false }) {
  const [aiRefreshKey, setAiRefreshKey] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['ai-projects'],
    queryFn: () => base44.entities.Project.list('-updated_date', 50),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['ai-tasks'],
    queryFn: () => base44.entities.Task.list('-updated_date', 300),
  });

  // Local heuristic insights (always computed)
  const localInsights = computeLocalInsights(projects, tasks);

  // AI deep analysis (on demand)
  const { data: aiData, isLoading: aiLoading, error: aiError } = useQuery({
    queryKey: ['ai-analysis', aiRefreshKey],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateAIInsights', { projects, tasks });
      return res.data?.analysis || null;
    },
    enabled: aiEnabled && !tasksLoading && (projects.length > 0 || tasks.length > 0),
    staleTime: 1000 * 60 * 10, // 10 min cache
  });

  const handleRunAI = () => {
    setAiEnabled(true);
    setAiRefreshKey(k => k + 1);
  };

  // ── COMPACT mode ─────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="space-y-2">
        {tasksLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
            <Loader2 className="w-4 h-4 animate-spin" /> Analisando dados...
          </div>
        ) : localInsights.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
            <CheckCircle2 className="w-4 h-4" /> Tudo em ordem! Nenhum alerta no momento.
          </div>
        ) : (
          localInsights.slice(0, 3).map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div key={i} className={cn("flex items-start gap-2.5 p-3 rounded-lg border text-sm", ins.bg)}>
                <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", ins.color)} />
                <div>
                  <p className={cn("font-medium text-xs", ins.color)}>{ins.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ins.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ── FULL mode ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Inteligência Artificial</h3>
            <p className="text-xs text-muted-foreground">Análise automática do portfólio</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={handleRunAI}
          disabled={aiLoading || tasksLoading}
        >
          {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
          {aiLoading ? 'Analisando...' : aiEnabled ? 'Atualizar IA' : 'Analisar com IA'}
        </Button>
      </div>

      {/* Local heuristic alerts */}
      {tasksLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados...
        </div>
      ) : localInsights.length > 0 ? (
        <div className="space-y-2">
          {localInsights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div key={i} className={cn("flex items-start gap-3 p-3.5 rounded-xl border", ins.bg)}>
                <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", ins.color)} />
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm", ins.color)}>{ins.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ins.description}</p>
                </div>
                <Badge className={cn("text-[10px] shrink-0", ins.badgeClass)}>{ins.badge}</Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-emerald-600 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <CheckCircle2 className="w-4 h-4" />
          <span>Nenhum alerta detectado. Tudo em ordem!</span>
        </div>
      )}

      {/* AI deep analysis */}
      {aiLoading && (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="relative">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">IA analisando seu portfólio...</p>
              <p className="text-xs mt-1">Identificando gargalos, previsões e sugestões</p>
            </div>
          </div>
        </Card>
      )}

      {aiError && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 text-sm text-red-600">
          Erro ao gerar análise de IA. Tente novamente.
        </div>
      )}

      {aiData && !aiLoading && (
        <div className="space-y-5">
          {/* Executive summary */}
          {aiData.summary && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Resumo Executivo</p>
                  <p className="text-sm text-foreground leading-relaxed">{aiData.summary}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Bottlenecks */}
          {aiData.bottlenecks?.length > 0 && (
            <AISection icon={AlertTriangle} iconBg="bg-red-100 text-red-600" title="Gargalos Identificados">
              <div className="space-y-2">
                {aiData.bottlenecks.map((b, i) => {
                  const s = severityMap[b.severity] || severityMap.medium;
                  return (
                    <div key={i} className={cn("p-3 rounded-lg border text-sm", s.bg)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-medium text-sm", s.color)}>{b.title}</p>
                        <Badge className={cn("text-[10px] shrink-0", s.badge)}>{s.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                    </div>
                  );
                })}
              </div>
            </AISection>
          )}

          {/* Deadline predictions */}
          {aiData.deadline_predictions?.length > 0 && (
            <AISection icon={TrendingUp} iconBg="bg-orange-100 text-orange-600" title="Previsões de Prazo">
              <div className="space-y-2">
                {aiData.deadline_predictions.map((d, i) => {
                  const s = severityMap[d.risk_level] || severityMap.medium;
                  return (
                    <div key={i} className={cn("p-3 rounded-lg border text-sm", s.bg)}>
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-medium text-sm", s.color)}>{d.project_name}</p>
                        <Badge className={cn("text-[10px] shrink-0", s.badge)}>
                          Risco {s.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                    </div>
                  );
                })}
              </div>
            </AISection>
          )}

          {/* Priority suggestions */}
          {aiData.priority_suggestions?.length > 0 && (
            <AISection icon={Target} iconBg="bg-purple-100 text-purple-600" title="Sugestões de Prioridade">
              <div className="space-y-2">
                {aiData.priority_suggestions.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-800">
                    <p className="font-medium text-sm text-purple-700 dark:text-purple-400">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    {s.action && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 font-medium">→ {s.action}</p>
                    )}
                  </div>
                ))}
              </div>
            </AISection>
          )}

          {/* Productivity tips */}
          {aiData.productivity_tips?.length > 0 && (
            <AISection icon={Lightbulb} iconBg="bg-yellow-100 text-yellow-600" title="Dicas de Produtividade">
              <div className="space-y-2">
                {aiData.productivity_tips.map((t, i) => (
                  <div key={i} className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/40 dark:border-yellow-800 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground">{t.tip}</p>
                      {t.impact && <p className="text-xs text-muted-foreground mt-0.5">Impacto: {t.impact}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </AISection>
          )}
        </div>
      )}

      {/* CTA when AI not yet run */}
      {!aiEnabled && !aiLoading && (
        <Card className="p-5 border-dashed">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Análise Profunda com IA</p>
              <p className="text-xs text-muted-foreground mt-1">
                Identifique gargalos, riscos de atraso, sugestões de prioridade e dicas de produtividade personalizadas para seus projetos.
              </p>
            </div>
            <Button size="sm" onClick={handleRunAI} className="gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Iniciar Análise com IA
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}