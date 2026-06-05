import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import ListView from '@/components/tasks/ListView';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckSquare } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

export default function MyTasks() {
  const { onMenuToggle } = useOutletContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: allTasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
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

  const filteredTasks = filter === 'all'
    ? myTasks
    : filter === 'active'
      ? myTasks.filter(t => t.status !== 'done')
      : myTasks.filter(t => t.status === 'done');

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
    if (project) {
      window.location.href = `/projects/${project.id}`;
    }
  };

  const activeCount = myTasks.filter(t => t.status !== 'done').length;
  const doneCount = myTasks.filter(t => t.status === 'done').length;

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Minhas Tarefas" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-primary/10 text-primary">
              {myTasks.length} total
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-amber-50 text-amber-600">
              {activeCount} ativas
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-emerald-50 text-emerald-600">
              {doneCount} concluídas
            </Badge>
          </div>

          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-card">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="active">Ativas</TabsTrigger>
              <TabsTrigger value="done">Concluídas</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="p-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-heading font-semibold mb-1">Nenhuma tarefa</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'done' ? 'Nenhuma tarefa concluída ainda' : 'Você não tem tarefas atribuídas'}
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