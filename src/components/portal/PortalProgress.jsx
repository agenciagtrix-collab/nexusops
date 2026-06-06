import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

function RingProgress({ value, size = 80, stroke = 8, color = '#6366f1' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth={stroke} className="text-border" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

function SegmentBar({ segments }) {
  return (
    <div className="w-full h-3 rounded-full overflow-hidden flex gap-0.5">
      {segments.map((s, i) => (
        s.pct > 0 && (
          <div
            key={i}
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
          />
        )
      ))}
    </div>
  );
}

export default function PortalProgress({ tasks, project }) {
  const total = tasks.length;
  if (total === 0) return null;

  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t =>
    t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'todo' && t.status !== 'not_started'
  ).length;
  const pending = tasks.filter(t => t.status === 'todo' || t.status === 'not_started').length;

  const pctDone = Math.round((done / total) * 100);
  const pctInProgress = Math.round((inProgress / total) * 100);
  const pctPending = Math.round((pending / total) * 100);
  const accentColor = project.color || '#6366f1';

  const segments = [
    { pct: pctDone, color: '#22c55e' },
    { pct: pctInProgress, color: accentColor },
    { pct: pctPending, color: '#e2e8f0' },
  ];

  const stats = [
    {
      label: 'Concluído',
      value: done,
      pct: pctDone,
      color: '#22c55e',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      icon: CheckCircle2,
    },
    {
      label: 'Em Andamento',
      value: inProgress,
      pct: pctInProgress,
      color: accentColor,
      bgClass: 'bg-primary/5',
      borderClass: 'border-primary/20',
      textClass: 'text-primary',
      icon: Clock,
    },
    {
      label: 'Pendente',
      value: pending,
      pct: pctPending,
      color: '#94a3b8',
      bgClass: 'bg-gray-50 dark:bg-gray-800/40',
      borderClass: 'border-gray-200 dark:border-gray-700',
      textClass: 'text-gray-600 dark:text-gray-400',
      icon: Circle,
    },
  ];

  return (
    <Card className="p-6 overflow-hidden relative">
      {/* Gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}88)` }}
      />

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <RingProgress value={pctDone} size={120} stroke={10} color={accentColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{pctDone}%</span>
            <span className="text-[10px] text-muted-foreground">concluído</span>
          </div>
        </div>

        {/* Stats + bar */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Progresso do Projeto</p>
              <p className="text-xs text-muted-foreground">{total} tarefas no total</p>
            </div>
            <SegmentBar segments={segments} />
            <div className="flex items-center gap-4 mt-2">
              {stats.map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={cn("rounded-xl border p-3 text-center", s.bgClass, s.borderClass)}>
                  <Icon className={cn("w-4 h-4 mx-auto mb-1", s.textClass)} />
                  <p className={cn("text-lg font-bold", s.textClass)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  <p className={cn("text-[10px] font-medium", s.textClass)}>{s.pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}