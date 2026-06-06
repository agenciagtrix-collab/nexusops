import React from 'react';
import { CheckCircle2, Clock, Circle, AlertCircle, CalendarDays, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function StatCard({ icon: IconComp, iconColor, iconBg, label, value, sub, accent }) {
  return (
    <Card className={cn("p-5 relative overflow-hidden border", accent && "border-l-4")}
      style={accent ? { borderLeftColor: accent } : {}}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
          <IconComp className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

export default function PortalDashboard({ project, tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t =>
    t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'todo' && t.status !== 'not_started'
  ).length;
  const pending = tasks.filter(t => t.status === 'todo' || t.status === 'not_started').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : (project.progress || 0);

  const upcoming = tasks
    .filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const nextTask = upcoming[0];

  const overdue = tasks.filter(t => {
    if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
    return differenceInDays(parseISO(t.due_date), new Date()) < 0;
  }).length;

  const accentColor = project.color || '#6366f1';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Resumo do Projeto</h3>
        <span className="text-xs text-muted-foreground">{total} tarefas no total</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-950/50"
          label="Concluídas"
          value={completed}
          sub={`${progress}% do projeto`}
          accent="#22c55e"
        />
        <StatCard
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-950/50"
          label="Em Andamento"
          value={inProgress}
          accent={accentColor}
        />
        <StatCard
          icon={Circle}
          iconColor="text-gray-500"
          iconBg="bg-gray-100 dark:bg-gray-800"
          label="Pendentes"
          value={pending}
          accent="#94a3b8"
        />
        <StatCard
          icon={overdue > 0 ? AlertCircle : TrendingUp}
          iconColor={overdue > 0 ? "text-red-600" : "text-violet-600"}
          iconBg={overdue > 0 ? "bg-red-100 dark:bg-red-950/50" : "bg-violet-100 dark:bg-violet-950/50"}
          label={overdue > 0 ? "Atrasadas" : "No Prazo"}
          value={overdue > 0 ? overdue : `${progress}%`}
          sub={overdue > 0 ? "requerem atenção" : "concluído"}
          accent={overdue > 0 ? "#ef4444" : "#8b5cf6"}
        />
      </div>

      {nextTask && (
        <Card className="p-5 border-l-4" style={{ borderLeftColor: accentColor }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: accentColor + '20' }}>
              <CalendarDays className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Próxima entrega</p>
              <p className="font-semibold text-sm text-foreground">{nextTask.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(parseISO(nextTask.due_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                {' · '}
                {differenceInDays(parseISO(nextTask.due_date), new Date())} dia(s)
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}