import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { FolderKanban, CheckSquare, Clock, AlertTriangle, TrendingUp, Users, Zap, Filter } from 'lucide-react';
import { isPast, isToday, differenceInDays, format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

export default function Analytics() {
  const { onMenuToggle } = useOutletContext();
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

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

  // Filters
  const filteredTasks = tasks.filter(t => {
    if (filterProject !== 'all' && t.project_id !== filterProject) return false;
    if (filterUser !== 'all' && !t.assignee_ids?.includes(filterUser)) return false;
    if (filterPeriod === 'month') {
      if (!t.created_date) return true;
      const d = parseISO(t.created_date);
      return d >= subMonths(new Date(), 1);
    }
    if (filterPeriod === 'quarter') {
      if (!t.created_date) return true;
      const d = parseISO(t.created_date);
      return d >= subMonths(new Date(), 3);
    }
    return true;
  });

  // Stats
  const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');
  const overdueTasks = filteredTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done');

  const avgCompletionDays = (() => {
    const completed = filteredTasks.filter(t => t.status === 'done' && t.completed_date && t.created_date);
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, t) => sum + Math.max(0, differenceInDays(new Date(t.completed_date), new Date(t.created_date))), 0);
    return Math.round(total / completed.length);
  })();

  // Status data
  const statusCounts = filteredTasks.reduce((acc, t) => {
    const s = t.status || 'todo';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Priority data
  const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente', critical: 'Crítica' };
  const priorityCounts = filteredTasks.reduce((acc, t) => {
    const p = t.priority || 'medium';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.entries(priorityCounts).map(([key, value]) => ({
    name: priorityLabels[key] || key, value,
  }));

  // User productivity
  const userProductivity = users.map(u => {
    const userTasks = filteredTasks.filter(t => t.assignee_ids?.includes(u.id));
    const done = userTasks.filter(t => t.status === 'done').length;
    const overdue = userTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'done').length;
    return {
      name: u.full_name?.split(' ')[0] || 'N/A',
      total: userTasks.length,
      concluidas: done,
      atrasadas: overdue,
      taxa: userTasks.length > 0 ? Math.round((done / userTasks.length) * 100) : 0,
    };
  }).filter(u => u.total > 0).sort((a, b) => b.total - a.total);

  // Monthly trend (last 6 months)
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = subMonths(new Date(), 5 - i);
    const created = filteredTasks.filter(t => {
      if (!t.created_date) return false;
      const d = parseISO(t.created_date);
      return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
    });
    const done = filteredTasks.filter(t => {
      if (!t.completed_date) return false;
      const d = parseISO(t.completed_date);
      return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
    });
    return {
      name: format(monthDate, 'MMM', { locale: ptBR }),
      criadas: created.length,
      concluidas: done.length,
    };
  });

  // Project status distribution
  const projStatusData = Object.entries(
    projects.reduce((acc, p) => { acc[p.status || 'not_started'] = (acc[p.status || 'not_started'] || 0) + 1; return acc; }, {})
  ).map(([key, value]) => ({ name: key, value }));

  // Bottleneck analysis: projects with most overdue tasks
  const projectBottlenecks = projects.map(p => {
    const pTasks = filteredTasks.filter(t => t.project_id === p.id);
    const overdueCount = pTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'done').length;
    return { name: p.name?.slice(0, 20), atrasadas: overdueCount, total: pTasks.length };
  }).filter(p => p.atrasadas > 0).sort((a, b) => b.atrasadas - a.atrasadas).slice(0, 6);

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Analytics" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <div className="flex gap-1.5">
                {[
                  { value: 'all', label: 'Tudo' },
                  { value: 'month', label: 'Último mês' },
                  { value: 'quarter', label: 'Último trimestre' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterPeriod(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      filterPeriod === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs">
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projetos</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs">
                <SelectValue placeholder="Colaborador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os membros</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterProject !== 'all' || filterUser !== 'all') && (
              <button
                onClick={() => { setFilterProject('all'); setFilterUser('all'); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Projetos Ativos" value={activeProjects.length} icon={FolderKanban} color="primary" />
            <StatCard title="Tarefas Concluídas" value={completedTasks.length} icon={CheckSquare} color="success" />
            <StatCard title="Tarefas Atrasadas" value={overdueTasks.length} icon={AlertTriangle} color="destructive" />
            <StatCard title="Tempo Médio (dias)" value={avgCompletionDays} icon={Clock} color="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Tendência de Tarefas (últimos 6 meses)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="criadas" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} name="Criadas" />
                    <Line type="monotone" dataKey="concluidas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Concluídas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tasks by Status */}
            <Card>
              <CardHeader><CardTitle className="text-base font-heading">Tarefas por Status</CardTitle></CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>}
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
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tarefas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>}
              </CardContent>
            </Card>

            {/* User Productivity Table */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><Users className="w-4 h-4" /> Produtividade por Colaborador</CardTitle></CardHeader>
              <CardContent>
                {userProductivity.length > 0 ? (
                  <div className="space-y-3">
                    {userProductivity.map((u, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-24 truncate text-sm font-medium">{u.name}</div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{u.concluidas}/{u.total} concluídas</span>
                            <span>{u.taxa}%</span>
                          </div>
                          <Progress value={u.taxa} className="h-2" />
                        </div>
                        {u.atrasadas > 0 && (
                          <Badge variant="secondary" className="bg-red-50 text-red-600 text-xs shrink-0">
                            {u.atrasadas} atrasada(s)
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados de produtividade</p>}
              </CardContent>
            </Card>

            {/* Bottlenecks */}
            {projectBottlenecks.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base font-heading flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Gargalos Operacionais (projetos com mais atrasos)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={projectBottlenecks}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" radius={[4, 4, 0, 0]} opacity={0.4} />
                      <Bar dataKey="atrasadas" fill="#ef4444" name="Atrasadas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Project status breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base font-heading">Projetos por Status</CardTitle></CardHeader>
              <CardContent>
                {projStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={projStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${value}`}>
                        {projStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>}
              </CardContent>
            </Card>

            {/* Productivity bar chart */}
            {userProductivity.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base font-heading">Comparativo de Equipe</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={userProductivity.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" radius={[4, 4, 0, 0]} opacity={0.5} />
                      <Bar dataKey="concluidas" fill="hsl(var(--primary))" name="Concluídas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}