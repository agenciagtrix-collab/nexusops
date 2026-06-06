import React from 'react';
import { CheckCircle2, Clock, Circle, AlertCircle, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StatCard({ icon: IconComp, iconColor, iconBg, label, value, sub }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <IconComp className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

export default function PortalDashboard({ project, tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress' || (!['done', 'cancelled', 'todo'].includes(t.status) && t.status !== 'done' && t.status !== 'cancelled')).length;
  const pending = tasks.filter(t => t.status === 'todo').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : (project.progress || 0);

  // Next delivery
  const upcoming = tasks
    .filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const nextTask = upcoming[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Circle}
          iconColor="text-slate-600"
          iconBg="bg-slate-100"
          label="Total de tarefas"
          value={total}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
          label="Concluídas"
          value={completed}
          sub={`${progress}% do projeto`}
        />
        <StatCard
          icon={Clock}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          label="Em andamento"
          value={inProgress}
        />
        <StatCard
          icon={AlertCircle}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          label="Pendentes"
          value={pending}
        />
      </div>

      {nextTask && (
        <Card className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Próxima entrega</p>
            <p className="font-semibold text-sm">{nextTask.title}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(nextTask.due_date), "dd 'de' MMMM", { locale: ptBR })}
              {' '}
              ({differenceInDays(parseISO(nextTask.due_date), new Date())} dias)
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}