import React, { useState, useRef, useEffect } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isWeekend, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertTriangle, Link2, GitBranch } from 'lucide-react';
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

const ROW_H = 40; // px per row
const LABEL_W = 192; // px — left column

export default function GanttView({ tasks = [], statuses = [], onTaskClick, users = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthSpan, setMonthSpan] = useState(2);
  const [showDeps, setShowDeps] = useState(true);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const months = Array.from({ length: monthSpan }, (_, i) => addMonths(startOfMonth(currentDate), i));
  const rangeStart = startOfMonth(currentDate);
  const rangeEnd = endOfMonth(addMonths(currentDate, monthSpan - 1));
  const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const tasksWithDates = tasks.filter(t => t.start_date || t.due_date);
  const tasksWithout = tasks.filter(t => !t.start_date && !t.due_date);

  const getBar = (task) => {
    const start = task.start_date ? parseISO(task.start_date) : (task.due_date ? parseISO(task.due_date) : null);
    const end = task.due_date ? parseISO(task.due_date) : start;
    if (!start || !end) return null;
    const clampedStart = start < rangeStart ? rangeStart : start;
    const clampedEnd = end > rangeEnd ? rangeEnd : end;
    if (clampedStart > rangeEnd || clampedEnd < rangeStart) return null;
    const leftPct = (differenceInDays(clampedStart, rangeStart) / totalDays) * 100;
    const widthPct = ((differenceInDays(clampedEnd, clampedStart) + 1) / totalDays) * 100;
    return { leftPct, widthPct };
  };

  const getStatusColor = (task) => {
    if (statuses?.length) {
      const s = statuses.find(s => s.name.toLowerCase().replace(/\s/g, '_') === task.status);
      if (s?.color) return s.color;
    }
    return statusColors[task.status] || priorityColors[task.priority] || '#6366f1';
  };

  // Build dependency arrows
  const buildArrows = (containerWidth) => {
    if (!showDeps || !containerWidth) return [];
    const barAreaW = containerWidth - LABEL_W;
    const arrows = [];

    tasksWithDates.forEach((task, toIdx) => {
      if (!task.dependencies?.length) return;
      const toBar = getBar(task);
      if (!toBar) return;
      const toX = LABEL_W + (toBar.leftPct / 100) * barAreaW;
      const toY = toIdx * ROW_H + ROW_H / 2;

      task.dependencies.forEach(depId => {
        const fromIdx = tasksWithDates.findIndex(t => t.id === depId);
        if (fromIdx === -1) return;
        const fromTask = tasksWithDates[fromIdx];
        const fromBar = getBar(fromTask);
        if (!fromBar) return;

        const fromX = LABEL_W + ((fromBar.leftPct + fromBar.widthPct) / 100) * barAreaW;
        const fromY = fromIdx * ROW_H + ROW_H / 2;

        const isBlocking = fromTask.status !== 'done';

        arrows.push({
          fromX, fromY, toX, toY,
          isBlocking,
          key: `${depId}->${task.id}`,
        });
      });
    });

    return arrows;
  };

  const [arrows, setArrows] = useState([]);
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observe = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setContainerW(w);
    });
    observe.observe(containerRef.current);
    return () => observe.disconnect();
  }, []);

  useEffect(() => {
    setArrows(buildArrows(containerW));
  }, [containerW, tasks, currentDate, monthSpan, showDeps]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeps(v => !v)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors",
              showDeps ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted text-muted-foreground'
            )}
          >
            <GitBranch className="w-3 h-3" /> Dependências
          </button>
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
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div style={{ minWidth: '700px' }} ref={containerRef}>

          {/* Month headers */}
          <div className="flex border-b border-border bg-muted/30">
            <div className="shrink-0 border-r border-border" style={{ width: LABEL_W }} />
            <div className="flex-1 flex">
              {months.map((month, mi) => {
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
            <div className="shrink-0 px-3 py-1.5 text-xs font-semibold text-muted-foreground border-r border-border" style={{ width: LABEL_W }}>
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

          {/* Task rows + SVG overlay */}
          <div className="relative">
            {tasksWithDates.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Nenhuma tarefa com datas definidas neste período
              </div>
            ) : (
              <>
                {tasksWithDates.map((task, rowIdx) => {
                  const bar = getBar(task);
                  const isOverdue = task.due_date && parseISO(task.due_date) < new Date() && task.status !== 'done';
                  const color = getStatusColor(task);
                  const assignedUser = users.find(u => task.assignee_ids?.[0] === u.id);
                  const progress = task.estimated_hours && task.logged_hours
                    ? Math.min(100, Math.round((task.logged_hours / task.estimated_hours) * 100))
                    : task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0;
                  const hasBlockingDep = task.dependencies?.some(depId => {
                    const dep = tasks.find(t => t.id === depId);
                    return dep && dep.status !== 'done';
                  });

                  return (
                    <div
                      key={task.id}
                      className="flex border-b border-border/40 hover:bg-muted/20 transition-colors"
                      style={{ height: ROW_H }}
                    >
                      {/* Task label */}
                      <div
                        className="shrink-0 px-3 border-r border-border cursor-pointer flex items-center gap-2"
                        style={{ width: LABEL_W }}
                        onClick={() => onTaskClick?.(task)}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-xs font-medium truncate", hasBlockingDep && "text-amber-600")}>
                            {task.title}
                          </div>
                          {assignedUser && (
                            <div className="text-[10px] text-muted-foreground truncate">{assignedUser.full_name}</div>
                          )}
                        </div>
                        {isOverdue && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                        {task.dependencies?.length > 0 && <Link2 className="w-3 h-3 text-muted-foreground/60 shrink-0" />}
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
                            className={cn(
                              "absolute top-1/2 -translate-y-1/2 rounded-md flex items-center overflow-hidden hover:opacity-90 transition-opacity z-20 shadow-sm",
                              hasBlockingDep && "ring-2 ring-amber-400 ring-offset-0"
                            )}
                            style={{
                              left: `${bar.leftPct}%`,
                              width: `${Math.max(bar.widthPct, 0.5)}%`,
                              height: '22px',
                              backgroundColor: color,
                            }}
                            onClick={() => onTaskClick?.(task)}
                            title={`${task.title}${task.due_date ? ' — ' + format(parseISO(task.due_date), 'dd/MM/yy') : ''}${hasBlockingDep ? '\n⚠ Dependência não concluída' : ''}`}
                          >
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
                })}

                {/* SVG dependency arrows overlay */}
                {showDeps && arrows.length > 0 && (
                  <svg
                    ref={svgRef}
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{ width: '100%', height: tasksWithDates.length * ROW_H }}
                    overflow="visible"
                  >
                    <defs>
                      <marker id="arrow-ok" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#22c55e" opacity="0.8" />
                      </marker>
                      <marker id="arrow-block" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" opacity="0.9" />
                      </marker>
                    </defs>
                    {arrows.map(({ fromX, fromY, toX, toY, isBlocking, key }) => {
                      const color = isBlocking ? '#f59e0b' : '#22c55e';
                      const markerId = isBlocking ? 'arrow-block' : 'arrow-ok';
                      // Bezier curve
                      const midX = (fromX + toX) / 2;
                      const d = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
                      return (
                        <path
                          key={key}
                          d={d}
                          fill="none"
                          stroke={color}
                          strokeWidth="1.5"
                          strokeDasharray={isBlocking ? '5,3' : 'none'}
                          opacity="0.75"
                          markerEnd={`url(#${markerId})`}
                        />
                      );
                    })}
                  </svg>
                )}
              </>
            )}
          </div>

          {/* Tasks without dates */}
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
        {showDeps && (
          <>
            <span className="w-px h-4 bg-border mx-1" />
            <span className="flex items-center gap-1">
              <svg width="20" height="8"><path d="M0,4 C10,4 10,4 20,4" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,2" /><polygon points="16,1 20,4 16,7" fill="#f59e0b" /></svg>
              Dep. bloqueante
            </span>
            <span className="flex items-center gap-1">
              <svg width="20" height="8"><path d="M0,4 C10,4 10,4 20,4" fill="none" stroke="#22c55e" strokeWidth="1.5" /><polygon points="16,1 20,4 16,7" fill="#22c55e" /></svg>
              Dep. concluída
            </span>
          </>
        )}
      </div>
    </div>
  );
}