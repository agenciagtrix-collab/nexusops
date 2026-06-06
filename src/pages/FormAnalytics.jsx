import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FormAnalytics() {
  const { id } = useParams();

  const { data: form } = useQuery({
    queryKey: ['form', id],
    queryFn: () => base44.entities.Form.get(id),
    enabled: !!id,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['formResponses', id],
    queryFn: () => base44.entities.FormResponse.filter({ form_id: id }),
    enabled: !!id,
  });

  // Calcular dados para gráficos
  const stats = {
    views: form?.stats?.views || 0,
    responses: responses.length,
    conversionRate: form?.stats?.conversionRate || 0,
    avgCompletionTime: form?.stats?.avgCompletionTime || 0,
  };

  // Dados ao longo do tempo
  const timelineData = responses.reduce((acc, r) => {
    const date = new Date(r.created_date).toLocaleDateString('pt-BR', {
      month: '2-digit',
      day: '2-digit',
    });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.respostas += 1;
    } else {
      acc.push({ date, respostas: 1 });
    }
    return acc;
  }, []);

  // Status distribution
  const statusData = [
    { name: 'Completo', value: responses.filter(r => r.status === 'submitted').length },
    { name: 'Rascunho', value: responses.filter(r => r.status === 'draft').length },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics: {form?.title}</h1>
        <p className="text-muted-foreground mt-1">Visualize dados e métricas do seu formulário</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.views}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.responses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgCompletionTime}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Respostas ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="respostas" stroke="#6366f1" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Respostas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}