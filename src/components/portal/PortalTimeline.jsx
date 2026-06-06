import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function PortalTimeline({ tasks, settings }) {
  // Build events from tasks that have dates
  const events = [];

  tasks.forEach(t => {
    if (t.completed_date && t.status === 'done') {
      events.push({ date: t.completed_date, title: t.title, type: 'completed', id: t.id + '_c' });
    } else if (t.due_date && t.status !== 'cancelled') {
      events.push({ date: t.due_date, title: t.title, type: t.status === 'done' ? 'completed' : 'upcoming', id: t.id + '_d' });
    } else if (t.created_date) {
      events.push({ date: t.created_date, title: t.title, type: 'created', id: t.id + '_cr' });
    }
  });

  const sorted = events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

  // Group by month
  const grouped = {};
  sorted.forEach(ev => {
    const key = format(parseISO(ev.date), "MMMM 'de' yyyy", { locale: ptBR });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  if (sorted.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Nenhum evento na timeline ainda.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, evs]) => (
        <div key={month}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{month}</p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-3">
              {evs.map((ev) => {
                const isCompleted = ev.type === 'completed';
                const isUpcoming = ev.type === 'upcoming';
                const Icon = isCompleted ? CheckCircle2 : isUpcoming ? Clock : Circle;
                const iconColor = isCompleted ? 'text-emerald-600' : isUpcoming ? 'text-blue-600' : 'text-muted-foreground';
                const iconBg = isCompleted ? 'bg-emerald-100' : isUpcoming ? 'bg-blue-100' : 'bg-muted';

                return (
                  <div key={ev.id} className="flex items-start gap-4 pl-2">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-background", iconBg)}>
                      <Icon className={cn("w-3.5 h-3.5", iconColor)} />
                    </div>
                    <div className="flex-1 bg-white dark:bg-gray-800 border border-border rounded-xl px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{ev.title}</p>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium",
                          isCompleted ? 'bg-emerald-100 text-emerald-700' :
                          isUpcoming ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {isCompleted ? 'Concluído' : isUpcoming ? 'Previsto' : 'Criado'}
                        </span>
                      </div>
                      {settings.show_due_dates && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(ev.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}