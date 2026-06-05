import React, { useState } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isWeekend, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertTriangle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: '#94a3b8',
  medium: '#6366f1',
  high: '#f59e0b',
  urgent: '#ef4444',
  critical: '#dc2626',
};

const statusColors = {
  todo: '#94a3b8',
  in_progress: '#6366f1',
  review: '#f59e0b',
  done: '#22c55e',
};

export default function GanttView({ tasks = [], statuses = [], onTaskClick, users = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthSpan, setMonthSpan] = useState(2); // how many months to show

  const months = Array.from({ length: monthSpan }, (_, i) => addMonths(startOfMonth(currentDate), i));
  const rangeStart = startOfMonth(currentDate);
  const rangeEnd = endOfMonth(addMonths(currentDate, monthSpan - 1));
  const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;

  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const getBar = (task) => {
    const start = task.start_date ? parseISO(task.start_date) : (task.due_date ? parseISO(task.due_date) : null);
    const end = task.due_date ? parseISO(task.due_date) : start;
    if (!start || !end) return null;

    const clampedStart = start < rangeStart ? rangeStart : start;
    const clampedEnd = end > rangeEnd ? rangeEnd : end;
    if (clampedStart > rangeEnd || clampedEnd < rangeStart) return null;

    const left = (differenceInDays(clampedStart, rangeStart) / totalDays) * 100;
    const width = ((differenceInDays(clampedEnd, clampedStart) + 1) / totalDays) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  };

  const getStatusColor = (task) => {
    if (statuses?.length) {
      const s = statuses.find(s => s.name.toLowerCase().replace(/\s/g, '_') === task.status);
      if (s?.color) return s.color;
    }
    return statusColors[task.status] || priorityColors[task.priority] || '#6366f1';
  };

  const tasksWithDates = tasks.filter(t => t.start_date || t.due_date);
  const tasksWithout = tasks.filter(t => !t.start_date && !t.due_date);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(d => subMonths(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(d => addMonths(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold ml-2">
            {format(rangeStart, 'MMM yyyy', { locale: ptBR })} – {format(rangeEnd, 'MMM yyyy', { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Período:</span>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setMonthSpan(n)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                monthSpan === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              )}
            >
              {n}M
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div style={{ minWidth: '700px' }}>
          {/* Month headers */}
          <div className="flex border-b border-border bg-muted/30">
            <div className="w-48 shrink-0 border-r border-border" />
            <div className="flex-1 flex">
              {months.map((month, mi) => {
                const monthDays = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
                const clampedStart = startOfMonth(month) < rangeStart ? rangeStart : startOfMonth(month);
                const clampedEnd = endOfMonth(month) > rangeEnd ? rangeEnd : endOfMonth(month);
                const span = differenceInDays(clampedEnd, clampedStart) + 1;
                return (
                  <div
                    key={mi}
                    className="text-center text-xs font-semibold py-1.5 border-r border-border last:border-r-0"
                    style={{ width: `${(span / totalDays) * 100}%` }}
                  >
                    {format(month, 'MMM yyyy', { locale: ptBR })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day headers */}
          <div className="flex border-b border-border bg-muted/20 sticky top-0 z-10">
            <div className="w-48 shrink-0 px-3 py-1.5 text-xs font-semibold text-muted-foreground border-r border-border">
              Tarefa
            </div>
            <div className="flex-1 flex">
              {allDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 text-center text-[10px] py-1 border-r border-border/30 last:border-r-0",
                    isWeekend(day) && "bg-muted/60 text-muted-foreground/50",
                    isToday(day) && "bg-primary/15 text-primary font-bold"
                  )}
                >
                  {totalDays <= 40 ? format(day, 'd') : (parseInt(format(day, 'd')) % 5 === 1 ? format(day, 'd') : '')}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {tasksWithDates.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Nenhuma tarefa com datas definidas neste período
            </div>
          ) : (
            tasksWithDates.map((task) => {
              const bar = getBar(task);
              const isOverdue = task.due_date && parseISO(task.due_date) < new Date() && task.status !== 'done';
              const color = getStatusColor(task);
              const assignedUser = users.find(u => task.assignee_ids?.[0] === u.id);
              const progress = task.estimated_hours && task.logged_hours
                ? Math.min(100, Math.round((task.logged_hours / task.estimated_hours) * 100))
                : task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0;

              return (
                <div key={task.id} className="flex border-b border-border/40 hover:bg-muted/20 transition-colors group min-h-[40px]">
                  {/* Task info */}
                  <div
                    className="w-48 shrink-0 px-3 py-2 border-r border-border cursor-pointer flex items-center gap-2"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{task.title}</div>
                      {assignedUser && (
                        <div className="text-[10px] text-muted-foreground truncate">{assignedUser.full_name}</div>
                      )}
                    </div>
                    {isOverdue && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                    {task.dependencies?.length > 0 && <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />}
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative py-2">
                    {/* Weekend & today backgrounds */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {allDays.map((day, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 h-full",
                            isWeekend(day) && "bg-muted/30",
                            isToday(day) && "bg-primary/10"
                          )}
                        />
                      ))}
                    </div>

                    {/* Today line */}
                    {(() => {
                      const todayIdx = allDays.findIndex(d => isToday(d));
                      if (todayIdx === -1) return null;
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-primary/60 z-10"
                          style={{ left: `${((todayIdx + 0.5) / allDays.length) * 100}%` }}
                        />
                      );
                    })()}

                    {/* Gantt bar */}
                    {bar && (
                      <button
                        className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center overflow-hidden hover:opacity-90 transition-opacity z-20 shadow-sm"
                        style={{
                          left: bar.left,
                          width: bar.width,
                          height: '22px',
                          backgroundColor: color,
                        }}
                        onClick={() => onTaskClick?.(task)}
                        title={`${task.title}${task.due_date ? ' — ' + format(parseISO(task.due_date), 'dd/MM/yy') : ''}`}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute left-0 top-0 bottom-0 opacity-30"
                          style={{ width: `${progress}%`, backgroundColor: '#000' }}
                        />
                        <span className="relative text-[10px] text-white font-medium px-1.5 truncate">
                          {task.title}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Tasks without dates footer */}
          {tasksWithout.length > 0 && (
            <div className="px-3 py-2 bg-muted/10 border-t border-border text-xs text-muted-foreground">
              + {tasksWithout.length} {tasksWithout.length === 1 ? 'tarefa sem data' : 'tarefas sem data'}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="font-medium">Status:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded" style={{ backgroundColor: '#94a3b8' }} />A Fazer</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded" style={{ backgroundColor: '#6366f1' }} />Em Andamento</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded" style={{ backgroundColor: '#f59e0b' }} />Revisão</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded" style={{ backgroundColor: '#22c55e' }} />Concluído</span>
        <span className="flex items-center gap-1 ml-2"><AlertTriangle className="w-3 h-3 text-destructive" /> Atrasada</span>
      </div>
    </div>
  );
}