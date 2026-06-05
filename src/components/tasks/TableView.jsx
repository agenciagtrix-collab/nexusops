import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const priorityConfig = {
  low: { label: 'Baixa', class: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Média', class: 'bg-blue-100 text-blue-700' },
  high: { label: 'Alta', class: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgente', class: 'bg-red-100 text-red-700' },
  critical: { label: 'Crítica', class: 'bg-red-200 text-red-800' },
};

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/40" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
    : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
}

export default function TableView({ tasks = [], statuses = [], onTaskClick, onToggleComplete, onAddTask, users = [] }) {
  const [sortField, setSortField] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');

  const allStatuses = statuses?.length > 0
    ? statuses.map(s => ({ name: s.name, key: s.name.toLowerCase().replace(/\s/g, '_'), color: s.color }))
    : [
        { name: 'A Fazer', key: 'todo', color: '#94a3b8' },
        { name: 'Em Andamento', key: 'in_progress', color: '#6366f1' },
        { name: 'Em Revisão', key: 'review', color: '#f59e0b' },
        { name: 'Concluído', key: 'done', color: '#22c55e' },
      ];

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortField] ?? '';
    let bv = b[sortField] ?? '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusInfo = (statusKey) => {
    return allStatuses.find(s => s.key === statusKey) || { name: statusKey, color: '#94a3b8' };
  };

  const headers = [
    { key: 'title', label: 'Tarefa', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'priority', label: 'Prioridade', sortable: true },
    { key: 'due_date', label: 'Entrega', sortable: true },
    { key: 'assignees', label: 'Responsáveis', sortable: false },
    { key: 'estimated_hours', label: 'H. Est.', sortable: true },
  ];

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Filtrar por status:</span>
        <button
          onClick={() => setFilterStatus('all')}
          className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors",
            filterStatus === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
        >
          Todos ({tasks.length})
        </button>
        {allStatuses.map(s => {
          const count = tasks.filter(t => t.status === s.key).length;
          return (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors",
                filterStatus === s.key ? 'border-primary' : 'border-border hover:bg-muted')}
              style={filterStatus === s.key ? { backgroundColor: s.color + '20', color: s.color, borderColor: s.color } : {}}
            >
              {s.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="w-8 p-3"></th>
              {headers.map(h => (
                <th
                  key={h.key}
                  className={cn("p-3 text-left font-semibold text-muted-foreground text-xs",
                    h.sortable && "cursor-pointer hover:text-foreground select-none")}
                  onClick={() => h.sortable && handleSort(h.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {h.label}
                    {h.sortable && <SortIcon field={h.key} sortField={sortField} sortDir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma tarefa encontrada
                </td>
              </tr>
            ) : sorted.map((task, idx) => {
              const statusInfo = getStatusInfo(task.status);
              const prio = priorityConfig[task.priority] || priorityConfig.medium;
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
              const assignedUsers = (task.assignee_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);
              return (
                <tr
                  key={task.id}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                    idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                  )}
                  onClick={() => onTaskClick?.(task)}
                >
                  <td className="p-3" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() => onToggleComplete?.(task)}
                    />
                  </td>
                  <td className="p-3 max-w-[220px]">
                    <span className={cn("font-medium truncate block", task.status === 'done' && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                    {task.tags?.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {task.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-muted text-muted-foreground px-1.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                    >
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      {statusInfo.name}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn("text-xs px-2 py-1 rounded-md font-medium", prio.class)}>
                      {prio.label}
                    </span>
                  </td>
                  <td className="p-3">
                    {task.due_date ? (
                      <span className={cn("text-xs font-medium", isOverdue ? "text-destructive" : "text-foreground")}>
                        {format(new Date(task.due_date), 'dd/MM/yy', { locale: ptBR })}
                        {isOverdue && <span className="ml-1 text-destructive">⚠</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {assignedUsers.length > 0 ? (
                      <div className="flex -space-x-1">
                        {assignedUsers.slice(0, 3).map(u => (
                          <div key={u.id} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-semibold text-primary" title={u.full_name}>
                            {(u.full_name || u.email || '?')[0].toUpperCase()}
                          </div>
                        ))}
                        {assignedUsers.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs text-muted-foreground">
                            +{assignedUsers.length - 3}
                          </div>
                        )}
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {task.estimated_hours ? `${task.estimated_hours}h` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => onAddTask?.()}>
        <Plus className="w-4 h-4" /> Adicionar tarefa
      </Button>
    </div>
  );
}