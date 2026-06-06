import React, { useState, useMemo } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import KanbanView from '@/components/tasks/KanbanView';
import ListView from '@/components/tasks/ListView';
import TableView from '@/components/tasks/TableView';
import CalendarView from '@/components/tasks/CalendarView';
import TimelineView from '@/components/tasks/TimelineView';
import GanttView from '@/components/tasks/GanttView';
import TaskDialog from '@/components/tasks/TaskDialog';
import ProjectOverviewTab from '@/components/project/ProjectOverviewTab';
import ProjectTeamTab from '@/components/project/ProjectTeamTab';
import ProjectFilesTab from '@/components/project/ProjectFilesTab';
import ProjectHistoryTab from '@/components/project/ProjectHistoryTab';
import ProjectReportsTab from '@/components/project/ProjectReportsTab';
import ProjectClientsTab from '@/components/project/ProjectClientsTab';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Plus, Settings, LayoutGrid, List, CalendarDays,
  GitBranch, Table2, Users, FileText, Activity, Eye, BarChart2, GanttChart, Building2, Search, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import TaskGroupManager from '@/components/tasks/TaskGroupManager';
import AdvancedFilters, { applyFilters } from '@/components/tasks/AdvancedFilters';

const moduleTabItems = [
  { key: 'overview', label: 'Visão Geral', icon: Eye },
  { key: 'tasks', label: 'Tarefas', icon: List },
  { key: 'team', label: 'Equipe', icon: Users },
  { key: 'files', label: 'Arquivos', icon: FileText },
  { key: 'clients', label: 'Cliente', icon: Building2 },
  { key: 'reports', label: 'Relatórios', icon: BarChart2 },
  { key: 'history', label: 'Histórico', icon: Activity },
];

const taskViewItems = [
  { key: 'groups', label: 'Grupos', icon: List },
  { key: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { key: 'list', label: 'Lista', icon: List },
  { key: 'table', label: 'Tabela', icon: Table2 },
  { key: 'calendar', label: 'Calendário', icon: CalendarDays },
  { key: 'timeline', label: 'Timeline', icon: GitBranch },
  { key: 'gantt', label: 'Gantt', icon: GanttChart },
];

export default function ProjectDetail() {
  const { onMenuToggle } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canCreate, canDelete } = usePermissions();
  const [moduleTab, setModuleTab] = useState('overview');
  const [taskView, setTaskView] = useState('groups');
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

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 50),
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
    },
  });

  const handleSaveTask = (data) => {
    if (selectedTask?.id) {
      updateTask.mutate({ taskId: selectedTask.id, data });
    } else {
      createTask.mutate({ ...data, project_id: id, group_id: defaultGroupId || data.group_id });
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const [defaultGroupId, setDefaultGroupId] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState('and');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddTask = (status, groupId) => {
    setSelectedTask(null);
    setDefaultStatus(status || 'todo');
    setDefaultGroupId(groupId || null);
    setTaskDialogOpen(true);
  };

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask.mutate({
      taskId: task.id,
      data: { ...task, status: newStatus, completed_date: newStatus === 'done' ? new Date().toISOString().split('T')[0] : null }
    });
  };

  const handleTaskStatusChange = (task, newStatus) => {
    updateTask.mutate({
      taskId: task.id,
      data: { ...task, status: newStatus, completed_date: newStatus === 'done' ? new Date().toISOString().split('T')[0] : null }
    });
  };

  const deleteTask = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', id] }),
  });

  const handleBulkUpdate = (taskId, data) => {
    updateTask.mutate({ taskId, data });
  };

  const handleBulkDelete = (taskIds) => {
    if (!canDelete) { toast.error('Sem permissão para excluir tarefas'); return; }
    taskIds.forEach(taskId => deleteTask.mutate(taskId));
    toast.success(`${taskIds.length} tarefa(s) excluída(s)`);
  };

  const filteredTasks = React.useMemo(() => {
    let result = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (activeFilters.length > 0) {
      result = applyFilters(result, activeFilters, filterLogic);
    }
    return result;
  }, [tasks, searchQuery, activeFilters, filterLogic]);

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const client = clients.find(c => c.id === project?.client_id);

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

          {/* Module Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-0">
            {moduleTabItems.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setModuleTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                    moduleTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Module Content */}
          {moduleTab === 'overview' && (
            <ProjectOverviewTab project={project} tasks={tasks} users={users} client={client} />
          )}

          {moduleTab === 'team' && (
            <ProjectTeamTab project={project} users={users} tasks={tasks} />
          )}

          {moduleTab === 'files' && (
            <ProjectFilesTab project={project} tasks={tasks} />
          )}

          {moduleTab === 'reports' && (
            <ProjectReportsTab project={project} tasks={tasks} users={users} />
          )}

          {moduleTab === 'clients' && (
            <ProjectClientsTab project={project} />
          )}

          {moduleTab === 'history' && (
            <ProjectHistoryTab projectId={id} />
          )}

          {moduleTab === 'tasks' && (
            <div className="space-y-4">
              {/* Task view selector + actions */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {taskViewItems.map(v => {
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.key}
                        onClick={() => setTaskView(v.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors",
                          taskView === v.key
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
                <Button size="sm" className="gap-1.5 shrink-0" onClick={() => handleAddTask()}>
                  <Plus className="w-4 h-4" /> Nova Tarefa
                </Button>
              </div>

              {/* Search + Filters bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <AdvancedFilters
                  filters={activeFilters}
                  onChange={setActiveFilters}
                  logic={filterLogic}
                  onLogicChange={setFilterLogic}
                  users={users}
                  statuses={project.custom_statuses}
                />
                {(activeFilters.length > 0 || searchQuery) && (
                  <span className="text-xs text-muted-foreground">
                    {filteredTasks.length} de {tasks.length} tarefas
                  </span>
                )}
              </div>

              <Card className="p-4">
                {taskView === 'groups' && (
                  <TaskGroupManager
                    projectId={id}
                    tasks={filteredTasks}
                    users={users}
                    onTaskClick={handleTaskClick}
                    onAddTask={handleAddTask}
                  />
                )}
                {taskView === 'kanban' && (
                  <KanbanView
                    tasks={filteredTasks}
                    statuses={project.custom_statuses}
                    onTaskClick={handleTaskClick}
                    onAddTask={handleAddTask}
                    onTaskStatusChange={handleTaskStatusChange}
                    users={users}
                  />
                )}
                {taskView === 'list' && (
                  <ListView
                    tasks={filteredTasks}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    users={users}
                  />
                )}
                {taskView === 'table' && (
                  <TableView
                    tasks={filteredTasks}
                    statuses={project.custom_statuses}
                    onTaskClick={handleTaskClick}
                    onToggleComplete={handleToggleComplete}
                    onAddTask={handleAddTask}
                    onBulkUpdate={handleBulkUpdate}
                    onBulkDelete={canDelete ? handleBulkDelete : undefined}
                    users={users}
                  />
                )}
                {taskView === 'calendar' && (
                  <CalendarView
                    tasks={filteredTasks}
                    statuses={project.custom_statuses}
                    onTaskClick={handleTaskClick}
                  />
                )}
                {taskView === 'timeline' && (
                  <TimelineView
                    tasks={filteredTasks}
                    statuses={project.custom_statuses}
                    onTaskClick={handleTaskClick}
                  />
                )}
                {taskView === 'gantt' && (
                  <GanttView
                    tasks={filteredTasks}
                    statuses={project.custom_statuses}
                    onTaskClick={handleTaskClick}
                    users={users}
                  />
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      <TaskDialog
        open={taskDialogOpen}
        onClose={setTaskDialogOpen}
        task={selectedTask || { status: defaultStatus, group_id: defaultGroupId }}
        projectId={id}
        statuses={project.custom_statuses}
        onSave={handleSaveTask}
        users={users}
      />
    </>
  );
}