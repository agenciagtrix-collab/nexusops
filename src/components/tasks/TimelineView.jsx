import React, { useState } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: '#94a3b8', medium: '#6366f1', high: '#f59e0b', urgent: '#ef4444', critical: '#dc2626',
};

export default function TimelineView({ tasks = [], statuses = [], onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Tasks that have at least a due_date
  const timelineTasks = tasks.filter(t => t.due_date || t.start_date);

  const getTaskBar = (task) => {
    const start = task.start_date ? new Date(task.start_date) : (task.due_date ? new Date(task.due_date) : null);
    const end = task.due_date ? new Date(task.due_date) : start;
    if (!start || !end) return null;

    const rangeStart = monthStart;
    const rangeEnd = monthEnd;

    const barStart = start < rangeStart ? rangeStart : start;
    const barEnd = end > rangeEnd ? rangeEnd : end;

    if (barStart > rangeEnd || barEnd < rangeStart) return null;

    const leftOffset = differenceInDays(barStart, rangeStart);
    const width = differenceInDays(barEnd, barStart) + 1;
    const totalDays = days.length;

    return {
      left: `${(leftOffset / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`,
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-heading font-semibold">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div style={{ minWidth: '700px' }}>
          {/* Day headers */}
          <div className="flex border-b border-border bg-muted/40 sticky top-0">
            <div className="w-48 shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
              Tarefa
            </div>
            <div className="flex-1 flex">
              {days.map(day => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 text-center py-2 text-xs font-medium border-r border-border/50 last:border-r-0",
                    isWeekend(day) && "bg-muted/60",
                    isToday(day) && "bg-primary/10 text-primary font-bold"
                  )}
                >
                  {format(day, 'd')}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {timelineTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhuma tarefa com data definida
            </div>
          ) : (
            timelineTasks.map(task => {
              const bar = getTaskBar(task);
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
              const color = priorityColors[task.priority] || '#6366f1';

              return (
                <div key={task.id} className="flex border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  {/* Task name */}
                  <div
                    className="w-48 shrink-0 px-3 py-3 border-r border-border cursor-pointer flex items-center gap-2"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-medium truncate">{task.title}</span>
                    {isOverdue && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative py-3 px-0">
                    <div className="relative h-6 flex">
                      {/* Weekend backgrounds */}
                      {days.map((day, idx) => isWeekend(day) && (
                        <div
                          key={day.toISOString()}
                          className="absolute top-0 bottom-0 bg-muted/40"
                          style={{ left: `${(idx / days.length) * 100}%`, width: `${(1 / days.length) * 100}%` }}
                        />
                      ))}
                      {/* Today line */}
                      {(() => {
                        const todayIdx = days.findIndex(d => isToday(d));
                        if (todayIdx === -1) return null;
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-primary/50 z-10"
                            style={{ left: `${((todayIdx + 0.5) / days.length) * 100}%` }}
                          />
                        );
                      })()}
                      {/* Task bar */}
                      {bar && (
                        <button
                          className="absolute top-0.5 bottom-0.5 rounded-md flex items-center px-2 text-xs text-white font-medium truncate hover:opacity-90 transition-opacity z-20"
                          style={{
                            left: bar.left,
                            width: bar.width,
                            backgroundColor: color,
                            minWidth: '20px',
                          }}
                          onClick={() => onTaskClick?.(task)}
                          title={task.title}
                        >
                          <span className="truncate hidden sm:block">{task.title}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="font-medium">Prioridade (cor):</span>
        {Object.entries(priorityColors).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded" style={{ backgroundColor: color }} />
            {{ low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente', critical: 'Crítica' }[key]}
          </span>
        ))}
      </div>
    </div>
  );
}