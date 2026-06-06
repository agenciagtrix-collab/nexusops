import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Calendar, Zap, ChevronRight, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, addDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function computeInsights(projects, tasks) {
  const insights = [];
  const now = new Date();

  // --- Projetos em atraso ---
  const overdueProjects = projects.filter(p => {
    if (!p.due_date || p.status === 'completed' || p.status === 'cancelled') return false;
    return differenceInDays(parseISO(p.due_date), now) < 0;
  });
  if (overdueProjects.length > 0) {
    insights.push({
      type: 'alert',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      title: `${overdueProjects.length} projeto(s) em atraso`,
      description: overdueProjects.slice(0, 2).map(p => p.name).join(', ') + (overdueProjects.length > 2 ? ` e mais ${overdueProjects.length - 2}` : ''),
      priority: 1,
    });
  }

  // --- Tarefas vencendo em 3 dias ---
  const urgentTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
    const diff = differenceInDays(parseISO(t.due_date), now);
    return diff >= 0 && diff <= 3;
  });
  if (urgentTasks.length > 0) {
    insights.push({
      type: 'warning',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      title: `${urgentTasks.length} tarefa(s) vencem em até 3 dias`,
      description: urgentTasks.slice(0, 2).map(t => t.title).join(', '),
      priority: 2,
    });
  }

  // --- Previsão de conclusão de projetos ---
  const activeProjects = projects.filter(p => p.status === 'in_progress');
  activeProjects.forEach(p => {
    const pTasks = tasks.filter(t => t.project_id === p.id);
    const done = pTasks.filter(t => t.status === 'done').length;
    const total = pTasks.length;
    if (total < 3) return;

    const progress = total > 0 ? done / total : 0;
    const dueDate = p.due_date ? parseISO(p.due_date) : null;
    if (!dueDate) return;

    const startDate = p.start_date ? parseISO(p.start_date) : addDays(now, -14);
    const elapsed = differenceInDays(now, startDate);
    const totalDuration = differenceInDays(dueDate, startDate);

    if (elapsed > 0 && totalDuration > 0) {
      const velocity = done / elapsed; // tasks per day
      const remaining = total - done;
      const estimatedDays = velocity > 0 ? remaining / velocity : null;

      if (estimatedDays !== null) {
        const predictedEnd = addDays(now, Math.ceil(estimatedDays));
        const diff = differenceInDays(dueDate, predictedEnd);

        if (diff < -3) {
          insights.push({
            type: 'prediction',
            icon: TrendingUp,
            color: 'text-orange-600',
            bg: 'bg-orange-50 border-orange-200',
            title: `"${p.name}" pode atrasar`,
            description: `No ritmo atual, previsão de conclusão: ${format(predictedEnd, "dd/MM/yyyy", { locale: ptBR })}. Prazo: ${format(dueDate, "dd/MM/yyyy", { locale: ptBR })}.`,
            priority: 3,
          });
        } else if (diff >= 0) {
          insights.push({
            type: 'good',
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-200',
            title: `"${p.name}" no prazo`,
            description: `${Math.round(progress * 100)}% concluído. Previsão de término: ${format(predictedEnd, "dd/MM/yyyy", { locale: ptBR })}.`,
            priority: 5,
          });
        }
      }
    }
  });

  // --- Tarefas sem responsável ---
  const unassigned = tasks.filter(t => !t.assignee_ids?.length && t.status !== 'done');
  if (unassigned.length > 5) {
    insights.push({
      type: 'info',
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
      title: `${unassigned.length} tarefas sem responsável`,
      description: 'Atribuir responsáveis aumenta a taxa de conclusão em até 40%.',
      priority: 4,
    });
  }

  // --- Taxa de conclusão saudável ---
  const completedLastWeek = tasks.filter(t => {
    if (t.status !== 'done' || !t.completed_date) return false;
    return differenceInDays(now, parseISO(t.completed_date)) <= 7;
  }).length;
  if (completedLastWeek >= 5) {
    insights.push({
      type: 'good',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      title: `Ótimo ritmo! ${completedLastWeek} tarefas concluídas esta semana`,
      description: 'Sua equipe está acima da média de produtividade.',
      priority: 6,
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export default function AIInsightsPanel({ compact = false }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: projects = [] } = useQuery({
    queryKey: ['ai-projects', refreshKey],
    queryFn: () => base44.entities.Project.list('-updated_date', 50),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['ai-tasks', refreshKey],
    queryFn: () => base44.entities.Task.list('-updated_date', 300),
  });

  const insights = computeInsights(projects, tasks);

  if (compact) {
    return (
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analisando dados...
          </div>
        ) : insights.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 p-3 bg-emerald-50 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            Tudo em ordem! Nenhum alerta no momento.
          </div>
        ) : (
          insights.slice(0, 3).map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className={cn("flex items-start gap-2.5 p-3 rounded-lg border text-sm", insight.bg)}>
                <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", insight.color)} />
                <div>
                  <p className={cn("font-medium text-xs", insight.color)}>{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{insight.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Previsões de IA</h3>
            <p className="text-xs text-muted-foreground">{insights.length} insight(s) detectados</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setRefreshKey(k => k + 1)}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Analisando dados do projeto...</p>
        </div>
      ) : insights.length === 0 ? (
        <Card className="p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-sm">Tudo em ordem!</p>
          <p className="text-xs text-muted-foreground mt-1">Nenhum alerta ou desvio detectado no momento.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl border", insight.bg)}>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", 
                  insight.type === 'alert' ? 'bg-red-100' :
                  insight.type === 'warning' ? 'bg-amber-100' :
                  insight.type === 'good' ? 'bg-emerald-100' :
                  insight.type === 'prediction' ? 'bg-orange-100' : 'bg-blue-100'
                )}>
                  <Icon className={cn("w-5 h-5", insight.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm", insight.color)}>{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] shrink-0 mt-0.5",
                    insight.type === 'alert' ? 'bg-red-100 text-red-700' :
                    insight.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                    insight.type === 'good' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-orange-100 text-orange-700'
                  )}
                >
                  {insight.type === 'alert' ? 'Crítico' :
                   insight.type === 'warning' ? 'Atenção' :
                   insight.type === 'good' ? 'Ótimo' :
                   insight.type === 'prediction' ? 'Previsão' : 'Info'}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}