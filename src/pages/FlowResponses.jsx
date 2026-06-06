import { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search, Eye, Download, Trash2, Archive, X, MoreVertical, ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function FlowResponses() {
  const { onMenuToggle } = useOutletContext();
  const { flowId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: flow } = useQuery({
    queryKey: ['flow', flowId],
    queryFn: () => base44.entities.Flow.filter({ id: flowId }),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['flow-responses', flowId],
    queryFn: () => base44.entities.FlowResponse.filter({ flow_id: flowId }, '-created_date', 100),
  });

  const deleteResponse = useMutation({
    mutationFn: (id) => base44.entities.FlowResponse.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-responses', flowId] });
      toast.success('Resposta excluída');
    },
  });

  const filteredResponses = responses.filter(r =>
    r.respondent_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.respondent_email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: responses.length,
    completed: responses.filter(r => r.status === 'completed').length,
    inProgress: responses.filter(r => r.status === 'in_progress').length,
    conversionRate: responses.length > 0 
      ? Math.round((responses.filter(r => r.status === 'completed').length / responses.length) * 100)
      : 0,
  };

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Respostas"
        actions={
          <div className="flex gap-2 flex-wrap">
          <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(`/flows/${flowId}/analytics`)}
          >
          📊 Analytics
          </Button>
          <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate(`/flows/${flowId}/table`)}
          >
          📋 Planilha
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-4 h-4" /> Exportar
          </Button>
          </div>
          }
          />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{flow?.[0]?.name}</h1>
              <p className="text-muted-foreground mt-1">Respostas recebidas</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/flows/${flowId}/edit`)}>
              ←
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Respostas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Em Progresso</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">Taxa Conversão</p>
              </CardContent>
            </Card>
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

          {/* Responses Table */}
          {filteredResponses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {search ? 'Nenhuma resposta encontrada' : 'Ainda não há respostas'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Respondente</th>
                      <th className="text-left p-3 font-semibold">E-mail</th>
                      <th className="text-left p-3 font-semibold">Data</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Tempo</th>
                      <th className="text-right p-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResponses.map((response) => (
                      <tr key={response.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-3">{response.respondent_name || '-'}</td>
                        <td className="p-3 text-muted-foreground">{response.respondent_email || '-'}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(response.created_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <Badge variant={response.status === 'completed' ? 'default' : 'secondary'}>
                            {response.status === 'completed' ? 'Concluída' : 'Em Progresso'}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {response.completion_time ? `${Math.round(response.completion_time / 60)}s` : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled>
                                <Eye className="w-4 h-4 mr-2" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <Download className="w-4 h-4 mr-2" /> Exportar
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <Archive className="w-4 h-4 mr-2" /> Arquivar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirm(response.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Excluir resposta?</AlertDialogTitle>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteResponse.mutate(deleteConfirm);
                setDeleteConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}