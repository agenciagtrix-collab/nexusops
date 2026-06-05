import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: '#94a3b8', medium: '#6366f1', high: '#f59e0b', urgent: '#ef4444', critical: '#dc2626',
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarView({ tasks = [], statuses = [], onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const getTasksForDay = (day) =>
    tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day));

  const allStatuses = statuses?.length > 0
    ? statuses.map(s => ({ key: s.name.toLowerCase().replace(/\s/g, '_'), color: s.color }))
    : [];

  const getStatusColor = (statusKey) => {
    const found = allStatuses.find(s => s.key === statusKey);
    return found?.color || '#6366f1';
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

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {/* Day labels */}
        {weekDays.map(d => (
          <div key={d} className="bg-muted/50 text-center py-2 text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}

        {/* Empty pads */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-card min-h-[90px] p-1.5" />
        ))}

        {/* Days */}
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-card min-h-[90px] p-1.5 transition-colors",
                !isCurrentMonth && "opacity-40",
                today && "bg-primary/5"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 mx-auto",
                today ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="w-full text-left"
                  >
                    <div
                      className="text-xs px-1.5 py-0.5 rounded truncate font-medium hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: (getStatusColor(task.status)) + '20',
                        color: getStatusColor(task.status),
                        borderLeft: `2px solid ${priorityColors[task.priority] || '#6366f1'}`
                      }}
                    >
                      {task.title}
                    </div>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayTasks.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="font-medium">Prioridade:</span>
        {Object.entries(priorityColors).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {{ low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente', critical: 'Crítica' }[key]}
          </span>
        ))}
      </div>
    </div>
  );
}