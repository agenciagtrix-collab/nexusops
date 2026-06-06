import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Search, Edit, Trash2, Copy, Eye,
} from 'lucide-react';

export default function Flows() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: flows = [] } = useQuery({
    queryKey: ['flows'],
    queryFn: () => base44.entities.Flow.list('-updated_date'),
  });

  const filteredFlows = flows.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este fluxo?')) {
      await base44.entities.Flow.delete(id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Construtor de Fluxos Visuais</h1>
          <p className="text-muted-foreground mt-1">Crie jornadas inteligentes com blocos visuais</p>
        </div>
        <Button onClick={() => navigate('/flows/new')} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Novo Fluxo
        </Button>
      </div>

      <div className="flex-1 min-w-64">
        <Input
          placeholder="Buscar fluxos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredFlows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum fluxo encontrado</p>
            <Button onClick={() => navigate('/flows/new')} variant="outline">
              Criar Primeiro Fluxo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFlows.map((flow) => (
            <Card key={flow.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-lg">{flow.name}</CardTitle>
                    {flow.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {flow.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{flow.type}</Badge>
                    <Badge className={flow.status === 'active' ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20'}>
                      {flow.status}
                    </Badge>
                    <Badge variant="outline">{flow.nodes?.length || 0} blocos</Badge>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/flows/${flow.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(flow.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}