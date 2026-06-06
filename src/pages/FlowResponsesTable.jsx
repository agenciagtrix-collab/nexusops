import { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Eye } from 'lucide-react';

export default function FlowResponsesTable() {
  const { onMenuToggle } = useOutletContext();
  const { flowId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: flow } = useQuery({
    queryKey: ['flow', flowId],
    queryFn: () => base44.entities.Flow.filter({ id: flowId }),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['flow-responses-table', flowId],
    queryFn: () => base44.entities.FlowResponse.filter({ flow_id: flowId }, '-created_date', 1000),
  });

  const filteredResponses = responses.filter(r =>
    r.respondent_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.respondent_email?.toLowerCase().includes(search.toLowerCase())
  );

  const f = flow?.[0];

  // Get all unique questions from responses
  const allKeys = new Set();
  responses.forEach(r => {
    if (r.responses) Object.keys(r.responses).forEach(k => allKeys.add(k));
  });
  const columns = Array.from(allKeys);

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Banco de Dados"
        actions={
          <Button variant="outline" size="sm">
            📊 Exportar
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-full mx-auto space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">{f?.name} - Banco de Respostas</h1>
            <p className="text-muted-foreground mt-1">Visualize todas as respostas em formato de planilha</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="border-b border-border bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 md:p-3 font-semibold min-w-32">Nome</th>
                    <th className="text-left p-2 md:p-3 font-semibold min-w-40">E-mail</th>
                    <th className="text-left p-2 md:p-3 font-semibold min-w-24">Data</th>
                    {columns.map(col => (
                      <th key={col} className="text-left p-2 md:p-3 font-semibold min-w-32">
                        {col}
                      </th>
                    ))}
                    <th className="text-left p-2 md:p-3 font-semibold min-w-16">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response) => (
                    <tr key={response.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="p-2 md:p-3">{response.respondent_name || '-'}</td>
                      <td className="p-2 md:p-3 text-muted-foreground">{response.respondent_email || '-'}</td>
                      <td className="p-2 md:p-3 text-muted-foreground text-xs">
                        {new Date(response.created_date).toLocaleDateString('pt-BR')}
                      </td>
                      {columns.map(col => (
                        <td key={`${response.id}-${col}`} className="p-2 md:p-3 text-muted-foreground">
                          <span className="line-clamp-1">
                            {typeof response.responses?.[col] === 'object'
                              ? JSON.stringify(response.responses[col])
                              : response.responses?.[col] || '-'}
                          </span>
                        </td>
                      ))}
                      <td className="p-2 md:p-3">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => navigate(`/flow-response/${response.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredResponses.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {search ? 'Nenhuma resposta encontrada' : 'Ainda não há respostas'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}