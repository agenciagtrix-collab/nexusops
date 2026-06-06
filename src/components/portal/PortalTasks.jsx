import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, LayoutGrid, Calendar, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const defaultStatusMap = {
  todo: { label: 'A Fazer', color: '#94a3b8' },
  in_progress: { label: 'Em Andamento', color: '#6366f1' },
  review: { label: 'Em Revisão', color: '#f59e0b' },
  done: { label: 'Concluído', color: '#22c55e' },
  cancelled: { label: 'Cancelado', color: '#ef4444' },
};

const priorityMap = {
  low: { label: 'Baixa', class: 'bg-gray-100 text-gray-600 border-gray-200' },
  medium: { label: 'Média', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  high: { label: 'Alta', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgente', class: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Crítico', class: 'bg-red-100 text-red-700 border-red-200' },
};

function getStatusInfo(status, customStatuses) {
  if (customStatuses?.length > 0) {
    const cs = customStatuses.find(s => s.name === status);
    if (cs) return { label: cs.name, color: cs.color };
  }
  return defaultStatusMap[status] || { label: status, color: '#94a3b8' };
}

function TaskRowItem({ task, users, settings, customStatuses }) {
  const statusInfo = getStatusInfo(task.status, customStatuses);
  const priority = priorityMap[task.priority] || priorityMap.medium;
  const assignee = settings.show_assignees && task.assignee_ids?.[0]
    ? users.find(u => u.id === task.assignee_ids[0])
    : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusInfo.color }} />
      <p className="flex-1 text-sm font-medium truncate">{task.title}</p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium hidden sm:inline"
          style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}>
          {statusInfo.label}
        </span>
        {task.priority && (
          <Badge className={cn("text-[10px] border hidden md:inline-flex", priority.class)}>{priority.label}</Badge>
        )}
        {assignee && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 hidden md:flex">
            <User className="w-3 h-3" /> {assignee.full_name.split(' ')[0]}
          </span>
        )}
        {task.due_date && settings.show_due_dates && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(parseISO(task.due_date), "dd/MM", { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ task, users, settings, customStatuses }) {
  const priority = priorityMap[task.priority] || priorityMap.medium;
  const assignee = settings.show_assignees && task.assignee_ids?.[0]
    ? users.find(u => u.id === task.assignee_ids[0])
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-3 shadow-sm space-y-2">
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {task.priority && (
          <Badge className={cn("text-[10px] border", priority.class)}>{priority.label}</Badge>
        )}
        {assignee && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" /> {assignee.full_name.split(' ')[0]}
          </span>
        )}
        {task.due_date && settings.show_due_dates && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3" />
            {format(parseISO(task.due_date), "dd/MM", { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanView({ tasks, users, settings, project }) {
  const customStatuses = project?.custom_statuses || [];

  // Build columns
  const columns = customStatuses.length > 0
    ? customStatuses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : Object.entries(defaultStatusMap).map(([key, val]) => ({ name: key, ...val }));

  const getColumnTasks = (col) => {
    const colName = col.name;
    if (customStatuses.length > 0) {
      return tasks.filter(t => t.status === colName);
    }
    return tasks.filter(t => t.status === colName);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map(col => {
        const colTasks = getColumnTasks(col);
        if (colTasks.length === 0 && customStatuses.length === 0) return null;
        return (
          <div key={col.name} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-sm font-semibold">{col.label || col.name}</span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-auto">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map(task => (
                <KanbanCard key={task.id} task={task} users={users} settings={settings} customStatuses={customStatuses} />
              ))}
              {colTasks.length === 0 && (
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PortalTasks({ tasks, users, project, settings }) {
  const [view, setView] = useState('list');
  const activeTasks = tasks.filter(t => t.status !== 'cancelled');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{activeTasks.length} tarefa(s)</p>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setView('list')}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors",
              view === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
          >
            <List className="w-3.5 h-3.5" /> Lista
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors",
              view === 'kanban' ? 'bg-white dark:bg-gray-800 shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground')}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <Card className="overflow-hidden divide-y divide-border">
          {activeTasks.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma tarefa encontrada.</p>
          ) : (
            activeTasks.map(task => (
              <TaskRowItem key={task.id} task={task} users={users} settings={settings} customStatuses={project?.custom_statuses} />
            ))
          )}
        </Card>
      ) : (
        <KanbanView tasks={activeTasks} users={users} settings={settings} project={project} />
      )}
    </div>
  );
}