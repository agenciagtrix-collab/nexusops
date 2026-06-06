import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Download, Trash2, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FormResponses() {
  const { id } = useParams();
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: form } = useQuery({
    queryKey: ['form', id],
    queryFn: () => base44.entities.Form.get(id),
    enabled: !!id,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['formResponses', id],
    queryFn: () => base44.entities.FormResponse.filter({ form_id: id }, '-created_date'),
    enabled: !!id,
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['formFields', id],
    queryFn: () => base44.entities.FormField.filter({ form_id: id }, 'order'),
    enabled: !!id,
  });

  const filteredResponses = responses.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const stats = {
    total: responses.length,
    completed: responses.filter(r => r.status === 'submitted').length,
    avgTime: responses.length > 0
      ? Math.round(responses.reduce((sum, r) => sum + (r.completionTime || 0), 0) / responses.length)
      : 0,
  };

  const handleDeleteResponse = async (id) => {
    if (confirm('Deletar esta resposta?')) {
      await base44.entities.FormResponse.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Respostas: {form?.title}</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todas as respostas do formulário
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Respostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed} completadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.total === 0 ? '0' : Math.round((stats.completed / stats.total) * 100)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgTime}s</div>
          </CardContent>
        </Card>
      </div>

      {/* Responses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Respostas</CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </CardHeader>
        <CardContent>
          {filteredResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma resposta ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-muted-foreground font-medium">
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Data</th>
                    <th className="text-left py-2 px-2">Tempo</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response) => (
                    <tr key={response.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">{response.respondent_email || 'Anônimo'}</td>
                      <td className="py-3 px-2">
                        {new Date(response.created_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-2">{response.completionTime || 0}s</td>
                      <td className="py-3 px-2">
                        <Badge variant={response.status === 'submitted' ? 'default' : 'secondary'}>
                          {response.status === 'submitted' ? 'Completo' : 'Rascunho'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteResponse(response.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}