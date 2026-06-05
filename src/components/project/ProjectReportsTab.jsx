import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { isPast, isToday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export default function ProjectReportsTab({ project, tasks = [], users = [] }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t =>
    t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done'
  ).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
  const totalLogged = tasks.reduce((sum, t) => sum + (t.logged_hours || 0), 0);

  // By status
  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status || 'todo'] = (acc[t.status || 'todo'] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // By priority
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

  // By assignee
  const assigneeData = users.map(u => {
    const userTasks = tasks.filter(t => t.assignee_ids?.includes(u.id));
    const userDone = userTasks.filter(t => t.status === 'done').length;
    return {
      name: u.full_name?.split(' ')[0] || 'N/A',
      total: userTasks.length,
      concluidas: userDone,
    };
  }).filter(u => u.total > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold">{progress}%</div>
              <div className="text-xs text-muted-foreground">Progresso Geral</div>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-1.5" />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold">{done}/{total}</div>
              <div className="text-xs text-muted-foreground">Tarefas Concluídas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold">{overdue}</div>
              <div className="text-xs text-muted-foreground">Tarefas Atrasadas</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold">{totalLogged}h</div>
              <div className="text-xs text-muted-foreground">de {totalEstimated}h estimadas</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Card>
          <CardHeader><CardTitle className="text-base font-heading">Tarefas por Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
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
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Tarefas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Productivity by assignee */}
        {assigneeData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base font-heading">Carga por Responsável</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={assigneeData}>
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
  );
}