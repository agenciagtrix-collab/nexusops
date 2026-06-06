import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function FormResponses() {
  const { id } = useParams();
  const [search, setSearch] = useState('');
  const [selectedResponse, setSelectedResponse] = useState(null);

  const { data: form } = useQuery({
    queryKey: ['form', id],
    queryFn: () => base44.entities.Form.get(id),
  });

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['formResponses', id],
    queryFn: () => base44.entities.FormResponse.filter({ form_id: id }, '-created_date'),
  });

  const { data: fields = [] } = useQuery({
    queryKey: ['formFields', id],
    queryFn: () => base44.entities.FormField.filter({ form_id: id }, 'order'),
    enabled: !!id,
  });

  const filteredResponses = responses.filter(r =>
    r.respondent_email?.toLowerCase().includes(search.toLowerCase()) ||
    r.respondent_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Data', 'Email', 'Nome', ...fields.map(f => f.label), 'Pontuação', 'Status'];
    const rows = responses.map(r => [
      new Date(r.created_date).toLocaleDateString('pt-BR'),
      r.respondent_email || '',
      r.respondent_name || '',
      ...fields.map(f => {
        const value = r.responses?.[f.id];
        return Array.isArray(value) ? value.join('; ') : value || '';
      }),
      r.score || '',
      r.status,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respostas-${form?.title || 'formulario'}.csv`;
    a.click();
  };

  if (isLoading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Respostas</h1>
          <p className="text-muted-foreground mt-1">{form?.title}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Buscar por email ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="secondary">{filteredResponses.length} respostas</Badge>
      </div>

      {filteredResponses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma resposta ainda
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                {fields.slice(0, 3).map(f => (
                  <TableHead key={f.id} className="max-w-xs">{f.label}</TableHead>
                ))}
                <TableHead>Pontuação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResponses.map(response => (
                <TableRow key={response.id}>
                  <TableCell className="text-sm">
                    {new Date(response.created_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-sm">{response.respondent_email}</TableCell>
                  <TableCell className="text-sm">{response.respondent_name}</TableCell>
                  {fields.slice(0, 3).map(f => (
                    <TableCell key={f.id} className="text-sm max-w-xs truncate">
                      {Array.isArray(response.responses?.[f.id])
                        ? response.responses[f.id].join(', ')
                        : String(response.responses?.[f.id] || '')}
                    </TableCell>
                  ))}
                  <TableCell className="text-sm font-medium">{response.score || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={response.status === 'submitted' ? 'default' : 'secondary'}>
                      {response.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedResponse(response)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {selectedResponse && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Resposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map(field => (
              <div key={field.id} className="border-b pb-4 last:border-b-0">
                <p className="font-medium text-sm text-muted-foreground">{field.label}</p>
                <p className="mt-1">
                  {Array.isArray(selectedResponse.responses?.[field.id])
                    ? selectedResponse.responses[field.id].join(', ')
                    : String(selectedResponse.responses?.[field.id] || '-')}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}