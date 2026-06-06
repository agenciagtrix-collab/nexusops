import React from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUp, Users, TrendingUp, Clock } from 'lucide-react';

export default function FormAnalytics() {
  const { id } = useParams();

  const { data: form } = useQuery({
    queryKey: ['form', id],
    queryFn: () => base44.entities.Form.get(id),
    enabled: !!id,
  });

  const { data: responses } = useQuery({
    queryKey: ['formResponses', id],
    queryFn: () => base44.entities.FormResponse.filter({ form_id: id }),
    enabled: !!id,
  });

  const stats = {
    views: form?.stats?.views || 0,
    responses: responses?.length || 0,
    conversionRate: form?.stats?.conversionRate || 0,
    avgCompletionTime: form?.stats?.avgCompletionTime || 0,
  };

  const chartData = [
    { name: 'Semana 1', respostas: 12 },
    { name: 'Semana 2', respostas: 19 },
    { name: 'Semana 3', respostas: 15 },
    { name: 'Semana 4', respostas: 22 },
  ];

  const resultData = [
    { name: 'Resultado A', value: 35 },
    { name: 'Resultado B', value: 25 },
    { name: 'Resultado C', value: 40 },
  ];

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">{form?.title}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views}</div>
            <p className="text-xs text-muted-foreground">Pessoas acessaram</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responses}</div>
            <p className="text-xs text-muted-foreground">Formulários preenchidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <ArrowUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.conversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">De visitantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgCompletionTime / 60).toFixed(1)}m</div>
            <p className="text-xs text-muted-foreground">Para preenchimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="respostas" className="w-full">
        <TabsList>
          <TabsTrigger value="respostas">Respostas ao Longo do Tempo</TabsTrigger>
          <TabsTrigger value="resultados">Distribuição de Resultados</TabsTrigger>
          <TabsTrigger value="campos">Por Campo</TabsTrigger>
        </TabsList>

        <TabsContent value="respostas">
          <Card>
            <CardHeader>
              <CardTitle>Respostas ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="respostas" stroke="#6366f1" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultados">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={resultData} cx="50%" cy="50%" labelLine={false} label dataKey="value">
                    {resultData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campos">
          <Card>
            <CardHeader>
              <CardTitle>Respostas por Campo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="respostas" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}