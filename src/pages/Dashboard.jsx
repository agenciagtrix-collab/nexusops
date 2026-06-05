import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import StatCard from '@/components/dashboard/StatCard';
import ProjectsOverview from '@/components/dashboard/ProjectsOverview';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import { FolderKanban, CheckSquare, AlertTriangle, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { isPast, isToday } from 'date-fns';

export default function Dashboard() {
  const { onMenuToggle } = useOutletContext();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 50),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 20),
  });

  const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(t =>
    t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done'
  );

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Dashboard"
        actions={
          <Link to="/projects/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Projeto</span>
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Projetos Ativos"
              value={activeProjects.length}
              icon={FolderKanban}
              color="primary"
            />
            <StatCard
              title="Tarefas Totais"
              value={tasks.length}
              icon={CheckSquare}
              color="success"
            />
            <StatCard
              title="Concluídas"
              value={completedTasks.length}
              icon={CheckSquare}
              color="purple"
            />
            <StatCard
              title="Atrasadas"
              value={overdueTasks.length}
              icon={AlertTriangle}
              color="destructive"
            />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ProjectsOverview projects={activeProjects} />
            </div>
            <div className="space-y-6">
              <UpcomingDeadlines tasks={tasks} />
              <RecentActivity activities={activities} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}