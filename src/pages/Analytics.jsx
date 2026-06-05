import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FolderKanban, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { isPast, isToday, differenceInDays } from 'date-fns';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

export default function Analytics() {
  const { onMenuToggle } = useOutletContext();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  // Stats
  const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done');

  const avgCompletionDays = (() => {
    const completed = tasks.filter(t => t.status === 'done' && t.completed_date && t.created_date);
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, t) => {
      return sum + differenceInDays(new Date(t.completed_date), new Date(t.created_date));
    }, 0);
    return Math.round(total / completed.length);
  })();

  // Tasks by status
  const statusCounts = tasks.reduce((acc, t) => {
    const status = t.status || 'todo';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  // Tasks by priority
  const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente', critical: 'Crítica' };
  const priorityCounts = tasks.reduce((acc, t) => {
    const p = t.priority || 'medium';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const priorityData = Object.entries(priorityCounts).map(([key, value]) => ({
    name: priorityLabels[key] || key,
    value,
  }));

  // Productivity by user
  const userProductivity = users.map(u => {
    const userTasks = tasks.filter(t => t.assignee_ids?.includes(u.id));
    const done = userTasks.filter(t => t.status === 'done').length;
    return {
      name: u.full_name?.split(' ')[0] || 'N/A',
      total: userTasks.length,
      concluidas: done,
    };
  }).filter(u => u.total > 0);

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Analytics" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Projetos Ativos" value={activeProjects.length} icon={FolderKanban} color="primary" />
            <StatCard title="Tarefas Concluídas" value={completedTasks.length} icon={CheckSquare} color="success" />
            <StatCard title="Tarefas Atrasadas" value={overdueTasks.length} icon={AlertTriangle} color="destructive" />
            <StatCard title="Tempo Médio (dias)" value={avgCompletionDays} icon={Clock} color="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks by Status */}
            <Card>
              <CardHeader><CardTitle className="text-base font-heading">Tarefas por Status</CardTitle></CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Tasks by Priority */}
            <Card>
              <CardHeader><CardTitle className="text-base font-heading">Tarefas por Prioridade</CardTitle></CardHeader>
              <CardContent>
                {priorityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* User Productivity */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base font-heading">Produtividade por Colaborador</CardTitle></CardHeader>
              <CardContent>
                {userProductivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userProductivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="concluidas" fill="hsl(var(--primary))" name="Concluídas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados de produtividade</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}