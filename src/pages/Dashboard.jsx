import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import StatCard from '@/components/dashboard/StatCard';
import ProjectsOverview from '@/components/dashboard/ProjectsOverview';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingDeadlines from '@/components/dashboard/UpcomingDeadlines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderKanban, CheckSquare, AlertTriangle, Users, Plus, TrendingUp, Clock, Calendar } from 'lucide-react';
import { isPast, isToday, isThisWeek, isThisMonth, format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const statusColors = { not_started: 'bg-slate-100 text-slate-600', in_progress: 'bg-primary/10 text-primary', on_hold: 'bg-amber-50 text-amber-600', completed: 'bg-emerald-50 text-emerald-600', cancelled: 'bg-red-50 text-red-600' };
const statusLabels = { not_started: 'Não Iniciado', in_progress: 'Em Andamento', on_hold: 'Em Espera', completed: 'Concluído', cancelled: 'Cancelado' };

export default function Dashboard() {
  const { onMenuToggle } = useOutletContext();
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 20),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  // Apply filters
  const filteredProjects = projects.filter(p => {
    if (filterClient !== 'all' && p.client_id !== filterClient) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterUser !== 'all' && p.owner_id !== filterUser && !p.team_ids?.includes(filterUser)) return false;
    if (filterPeriod === 'month' && p.due_date) {
      const due = parseISO(p.due_date);
      if (!isWithinInterval(due, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })) return false;
    }
    return true;
  });

  const filteredTasks = tasks.filter(t => {
    const proj = projects.find(p => p.id === t.project_id);
    if (filterClient !== 'all' && proj?.client_id !== filterClient) return false;
    if (filterUser !== 'all' && !t.assignee_ids?.includes(filterUser)) return false;
    return true;
  });

  const activeProjects = filteredProjects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');
  const overdueTasks = filteredTasks.filter(t =>
    t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done'
  );
  const weekDeliveries = filteredTasks.filter(t => t.due_date && isThisWeek(new Date(t.due_date)));
  const monthDeliveries = filteredTasks.filter(t => t.due_date && isThisMonth(new Date(t.due_date)));

  // Workload per user
  const workloadData = users.map(u => {
    const userTasks = filteredTasks.filter(t => t.assignee_ids?.includes(u.id) && t.status !== 'done');
    return { name: u.full_name?.split(' ')[0] || 'N/A', pendentes: userTasks.length };
  }).filter(u => u.pendentes > 0).sort((a, b) => b.pendentes - a.pendentes).slice(0, 8);

  // Monthly completion trend (last 4 months)
  const trendData = Array.from({ length: 4 }, (_, i) => {
    const monthDate = subMonths(new Date(), 3 - i);
    const monthTasks = filteredTasks.filter(t => {
      if (!t.completed_date) return false;
      const d = parseISO(t.completed_date);
      return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
    });
    return {
      name: format(monthDate, 'MMM', { locale: ptBR }),
      concluidas: monthTasks.length,
    };
  });

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
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="not_started">Não Iniciado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="on_hold">Em Espera</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os membros</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterClient !== 'all' || filterStatus !== 'all' || filterPeriod !== 'all' || filterUser !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => { setFilterClient('all'); setFilterStatus('all'); setFilterPeriod('all'); setFilterUser('all'); }}
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Projetos Ativos" value={activeProjects.length} icon={FolderKanban} color="primary" />
            <StatCard title="Tarefas Concluídas" value={completedTasks.length} icon={CheckSquare} color="success" />
            <StatCard title="Tarefas Atrasadas" value={overdueTasks.length} icon={AlertTriangle} color="destructive" />
            <StatCard title="Entregas esta Semana" value={weekDeliveries.length} icon={Calendar} color="warning" />
          </div>

          {/* Deliveries summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Entregas da Semana</div>
                  <div className="text-xs text-muted-foreground">{weekDeliveries.length} tarefa(s) com vencimento</div>
                </div>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {weekDeliveries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma entrega essa semana</p>
                ) : (
                  weekDeliveries.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-foreground/80">{t.title}</span>
                      <span className="text-muted-foreground shrink-0 ml-2">
                        {format(new Date(t.due_date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Entregas do Mês</div>
                  <div className="text-xs text-muted-foreground">{monthDeliveries.length} tarefa(s) este mês</div>
                </div>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {monthDeliveries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma entrega este mês</p>
                ) : (
                  monthDeliveries.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-foreground/80">{t.title}</span>
                      <span className={cn("shrink-0 ml-2", isPast(new Date(t.due_date)) && t.status !== 'done' ? "text-red-500" : "text-muted-foreground")}>
                        {format(new Date(t.due_date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ProjectsOverview projects={activeProjects} />

              {/* Workload */}
              {workloadData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><Users className="w-4 h-4" /> Carga de Trabalho (tarefas pendentes)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={workloadData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                        <Tooltip />
                        <Bar dataKey="pendentes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Pendentes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Trend */}
              <Card>
                <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Tendência de Conclusão</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="concluidas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} name="Concluídas" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <UpcomingDeadlines tasks={filteredTasks} />
              <RecentActivity activities={activities} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}