import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FlowDashboard() {
  const { onMenuToggle } = useOutletContext();

  const { data: flows = [] } = useQuery({
    queryKey: ['flows'],
    queryFn: () => base44.entities.Flow.list('-updated_date'),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['all-flow-responses'],
    queryFn: async () => {
      const allResponses = [];
      for (const flow of flows) {
        const res = await base44.entities.FlowResponse.filter({ flow_id: flow.id });
        allResponses.push(...res);
      }
      return allResponses;
    },
    enabled: flows.length > 0,
  });

  const stats = {
    totalFlows: flows.length,
    activeFlows: flows.filter(f => f.status === 'active').length,
    totalResponses: responses.length,
    avgConversion: flows.length > 0
      ? Math.round(
          flows.reduce((sum, f) => {
            const flowResponses = responses.filter(r => r.flow_id === f.id);
            const completed = flowResponses.filter(r => r.status === 'completed').length;
            return sum + (flowResponses.length > 0 ? (completed / flowResponses.length) * 100 : 0);
          }, 0) / flows.length
        )
      : 0,
  };

  // Top flows por respostas
  const topFlows = flows.map(f => ({
    name: f.name,
    responses: responses.filter(r => r.flow_id === f.id).length,
    completed: responses.filter(r => r.flow_id === f.id && r.status === 'completed').length,
  }))
    .sort((a, b) => b.responses - a.responses)
    .slice(0, 5);

  // Respostas por dia
  const dateMap = {};
  responses.forEach(r => {
    const date = new Date(r.created_date).toLocaleDateString('pt-BR');
    dateMap[date] = (dateMap[date] || 0) + 1;
  });
  const timelineData = Object.entries(dateMap).map(([date, count]) => ({ date, respostas: count }));

  // Distribuição de status
  const statusData = [
    { name: 'Concluídas', value: responses.filter(r => r.status === 'completed').length },
    { name: 'Em Progresso', value: responses.filter(r => r.status === 'in_progress').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Dashboard" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Fluxos</h1>
            <p className="text-muted-foreground mt-1">Visão geral do desempenho dos seus fluxos</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.totalFlows}</div>
                <p className="text-sm text-muted-foreground mt-1">Total de Fluxos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{stats.activeFlows}</div>
                <p className="text-sm text-muted-foreground mt-1">Fluxos Publicados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.totalResponses}</div>
                <p className="text-sm text-muted-foreground mt-1">Respostas Recebidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{stats.avgConversion}%</div>
                <p className="text-sm text-muted-foreground mt-1">Taxa Média</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Flows */}
            <Card>
              <CardHeader>
                <CardTitle>Fluxos Mais Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                {topFlows.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topFlows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="responses" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Respostas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="respostas" stroke="#6366f1" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}