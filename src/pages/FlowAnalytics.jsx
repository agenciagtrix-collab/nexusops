import { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel
} from 'recharts';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';

export default function FlowAnalytics() {
  const { onMenuToggle } = useOutletContext();
  const { flowId } = useParams();
  const navigate = useNavigate();

  const { data: flow } = useQuery({
    queryKey: ['flow', flowId],
    queryFn: () => base44.entities.Flow.filter({ id: flowId }),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['flow-responses', flowId],
    queryFn: () => base44.entities.FlowResponse.filter({ flow_id: flowId }),
  });

  const { data: analytics } = useQuery({
    queryKey: ['flow-analytics', flowId],
    queryFn: () => base44.entities.FlowAnalytics.filter({ flow_id: flowId }),
  });

  const flowData = flow?.[0];
  const analyticsData = analytics?.[0];

  // Calcular métricas
  const stats = {
    views: responses.length,
    starts: responses.filter(r => r.status !== 'draft').length,
    completions: responses.filter(r => r.status === 'completed').length,
    abandonments: responses.filter(r => r.status === 'in_progress').length,
  };

  stats.conversionRate = stats.views > 0 ? Math.round((stats.completions / stats.views) * 100) : 0;
  stats.abandonmentRate = stats.views > 0 ? Math.round((stats.abandonments / stats.views) * 100) : 0;

  const avgCompletionTime = responses.filter(r => r.completion_time)
    .reduce((sum, r) => sum + r.completion_time, 0) / Math.max(responses.filter(r => r.completion_time).length, 1);

  // Funil de conversão
  const funnelData = [
    { name: 'Visualizações', value: stats.views },
    { name: 'Iniciados', value: stats.starts },
    { name: 'Concluídos', value: stats.completions },
  ].filter(d => d.value > 0);

  // Gráfico temporal
  const timelineData = [];
  const dates = {};
  responses.forEach(r => {
    const date = new Date(r.created_date).toLocaleDateString('pt-BR');
    dates[date] = (dates[date] || 0) + 1;
  });
  Object.entries(dates).forEach(([date, count]) => {
    timelineData.push({ date, respostas: count });
  });

  // Dispositivos
  const deviceData = {};
  responses.forEach(r => {
    const device = r.device_type || 'desktop';
    deviceData[device] = (deviceData[device] || 0) + 1;
  });
  const deviceChartData = Object.entries(deviceData).map(([name, value]) => ({ name, value }));

  // Resultados mais comuns
  const resultData = {};
  responses.forEach(r => {
    if (r.result_title) {
      resultData[r.result_title] = (resultData[r.result_title] || 0) + 1;
    }
  });
  const resultChartData = Object.entries(resultData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Analytics"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" /> Exportar Relatório
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{flowData?.name}</h1>
              <p className="text-muted-foreground mt-1">Análise de respostas e conversão</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/flows/${flowId}/responses`)}>
              ←
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.views}</div>
                <p className="text-sm text-muted-foreground mt-1">Visualizações</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{stats.starts}</div>
                <p className="text-sm text-muted-foreground mt-1">Iniciadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{stats.completions}</div>
                <p className="text-sm text-muted-foreground mt-1">Concluídas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{stats.conversionRate}%</div>
                <p className="text-sm text-muted-foreground mt-1">Taxa Conversão</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="funnel" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="funnel">Funil</TabsTrigger>
              <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="devices">Dispositivos</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            {/* Funnel */}
            <TabsContent value="funnel">
              <Card>
                <CardHeader>
                  <CardTitle>Funil de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  {funnelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <FunnelChart data={funnelData}>
                        <Tooltip formatter={(value) => value.toLocaleString('pt-BR')} />
                        <Funnel shape="linear" dataKey="value" data={funnelData} isAnimationActive>
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Funnel>
                      </FunnelChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline">
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
                        <Line type="monotone" dataKey="respostas" stroke="#6366f1" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Devices */}
            <TabsContent value="devices">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Dispositivo</CardTitle>
                </CardHeader>
                <CardContent>
                  {deviceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={deviceChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => value.toLocaleString('pt-BR')} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results */}
            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <CardTitle>Resultados Mais Comuns</CardTitle>
                </CardHeader>
                <CardContent>
                  {resultChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={resultChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => value.toLocaleString('pt-BR')} />
                        <Bar dataKey="value" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Dados insuficientes</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}