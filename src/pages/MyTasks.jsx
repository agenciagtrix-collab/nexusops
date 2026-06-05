import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import ListView from '@/components/tasks/ListView';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, AlertTriangle, Clock, Filter } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente', critical: 'Crítica' };

export default function MyTasks() {
  const { onMenuToggle } = useOutletContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('active');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 300),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name', 100),
  });

  const myTasks = allTasks.filter(t =>
    t.assignee_ids?.includes(user?.id) || t.created_by_id === user?.id
  );

  const overdueTasks = myTasks.filter(t =>
    t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done'
  );
  const dueTodayTasks = myTasks.filter(t =>
    t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done'
  );

  const filteredTasks = myTasks.filter(t => {
    const statusMatch =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? t.status !== 'done' :
      statusFilter === 'done' ? t.status === 'done' :
      statusFilter === 'overdue' ? (t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done') :
      true;
    const priorityMatch = priorityFilter === 'all' || t.priority === priorityFilter;
    const projectMatch = projectFilter === 'all' || t.project_id === projectFilter;
    return statusMatch && priorityMatch && projectMatch;
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.Task.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      toast.success('Tarefa atualizada!');
    },
  });

  const handleToggle = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask.mutate({ taskId: task.id, data: { status: newStatus } });
  };

  const handleTaskClick = (task) => {
    const project = projects.find(p => p.id === task.project_id);
    if (project) window.location.href = `/projects/${project.id}`;
  };

  const activeCount = myTasks.filter(t => t.status !== 'done').length;
  const doneCount = myTasks.filter(t => t.status === 'done').length;

  const hasFilters = priorityFilter !== 'all' || projectFilter !== 'all';

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Minhas Tarefas" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className={cn("p-4 cursor-pointer transition-all hover:shadow-md", statusFilter === 'all' && "ring-2 ring-primary")}
              onClick={() => setStatusFilter('all')}>
              <div className="text-2xl font-bold">{myTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total</div>
            </Card>
            <Card className={cn("p-4 cursor-pointer transition-all hover:shadow-md", statusFilter === 'active' && "ring-2 ring-primary")}
              onClick={() => setStatusFilter('active')}>
              <div className="text-2xl font-bold text-primary">{activeCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Ativas</div>
            </Card>
            <Card className={cn("p-4 cursor-pointer transition-all hover:shadow-md", statusFilter === 'overdue' && "ring-2 ring-destructive")}
              onClick={() => setStatusFilter('overdue')}>
              <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-destructive" />Atrasadas</div>
            </Card>
            <Card className={cn("p-4 cursor-pointer transition-all hover:shadow-md", statusFilter === 'done' && "ring-2 ring-emerald-500")}
              onClick={() => setStatusFilter('done')}>
              <div className="text-2xl font-bold text-emerald-600">{doneCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Concluídas</div>
            </Card>
          </div>

          {dueTodayTasks.length > 0 && (
            <Card className="p-3 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <Clock className="w-4 h-4 shrink-0" />
                <span><strong>{dueTodayTasks.length}</strong> tarefa(s) vencem hoje</span>
              </div>
            </Card>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 text-xs w-auto min-w-[130px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {Object.entries(priorityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-8 text-xs w-auto min-w-[130px]">
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <button
                onClick={() => { setPriorityFilter('all'); setProjectFilter('all'); }}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Limpar filtros
              </button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{filteredTasks.length} tarefas</span>
          </div>

          <Card className="p-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-heading font-semibold mb-1">Nenhuma tarefa</h3>
                <p className="text-sm text-muted-foreground">
                  {statusFilter === 'done' ? 'Nenhuma tarefa concluída' :
                   statusFilter === 'overdue' ? 'Nenhuma tarefa atrasada 🎉' :
                   'Você não tem tarefas com esses filtros'}
                </p>
              </div>
            ) : (
              <ListView
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                onToggleComplete={handleToggle}
                users={users}
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}