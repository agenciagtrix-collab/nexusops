import React, { useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import KanbanView from '@/components/tasks/KanbanView';
import ListView from '@/components/tasks/ListView';
import TaskDialog from '@/components/tasks/TaskDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Settings, LayoutGrid, List, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusLabels = {
  not_started: 'Não Iniciado', in_progress: 'Em Andamento', on_hold: 'Em Espera',
  completed: 'Concluído', cancelled: 'Cancelado',
};

export default function ProjectDetail() {
  const { onMenuToggle } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');

  const { data: projects = [] } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.filter({ id }),
  });
  const project = projects[0];

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => base44.entities.Task.filter({ project_id: id }, '-created_date', 200),
    enabled: !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      setTaskDialogOpen(false);
      setSelectedTask(null);
      toast.success('Tarefa criada!');
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.Task.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      setTaskDialogOpen(false);
      setSelectedTask(null);
      toast.success('Tarefa atualizada!');
    },
  });

  const handleSaveTask = (data) => {
    if (selectedTask?.id) {
      updateTask.mutate({ taskId: selectedTask.id, data });
    } else {
      createTask.mutate(data);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleAddTask = (status) => {
    setSelectedTask(null);
    setDefaultStatus(status || 'todo');
    setTaskDialogOpen(true);
  };

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask.mutate({
      taskId: task.id,
      data: { ...task, status: newStatus, completed_date: newStatus === 'done' ? new Date().toISOString().split('T')[0] : null }
    });
  };

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (!project) {
    return (
      <>
        <TopBar onMenuToggle={onMenuToggle} title="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title=""
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Projetos</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${id}/edit`)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
          {/* Project Header */}
          <Card className="p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: project.color || '#6366f1' }} />
                  <h1 className="text-xl font-heading font-bold truncate">{project.name}</h1>
                  {project.code && <span className="text-sm text-muted-foreground font-mono">{project.code}</span>}
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 ml-7">{project.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 ml-7 md:ml-0">
                <div className="text-center">
                  <div className="text-2xl font-heading font-bold">{tasks.length}</div>
                  <div className="text-xs text-muted-foreground">Tarefas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading font-bold">{completedCount}</div>
                  <div className="text-xs text-muted-foreground">Concluídas</div>
                </div>
                <div className="w-24">
                  <div className="text-sm font-semibold text-right mb-1">{progress}%</div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            </div>
          </Card>

          {/* View Toggle + Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Tabs value={view} onValueChange={setView}>
              <TabsList className="bg-card">
                <TabsTrigger value="kanban" className="gap-1.5 text-xs">
                  <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5 text-xs">
                  <List className="w-3.5 h-3.5" /> Lista
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button size="sm" className="gap-1.5" onClick={() => handleAddTask()}>
              <Plus className="w-4 h-4" /> Nova Tarefa
            </Button>
          </div>

          {/* Views */}
          <Card className="p-4">
            {view === 'kanban' && (
              <KanbanView
                tasks={tasks}
                statuses={project.custom_statuses}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
                users={users}
              />
            )}
            {view === 'list' && (
              <ListView
                tasks={tasks}
                onTaskClick={handleTaskClick}
                onToggleComplete={handleToggleComplete}
                users={users}
              />
            )}
          </Card>
        </div>
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onClose={setTaskDialogOpen}
        task={selectedTask || { status: defaultStatus }}
        projectId={id}
        statuses={project.custom_statuses}
        onSave={handleSaveTask}
        users={users}
      />
    </>
  );
}