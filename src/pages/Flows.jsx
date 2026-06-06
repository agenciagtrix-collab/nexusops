import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus, Search, Edit, Trash2, Globe, BarChart3, Pause, Play, Archive, X, MoreVertical
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
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TopBar from '@/components/layout/TopBar';
import FlowPublishDialog from '@/components/flows/FlowPublishDialog';

export default function Flows() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);

  const { data: flows = [] } = useQuery({
    queryKey: ['flows'],
    queryFn: () => base44.entities.Flow.list('-updated_date'),
  });

  const deleteFlow = useMutation({
    mutationFn: (id) => base44.entities.Flow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      toast.success('Fluxo excluído');
    },
  });

  const updateFlow = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Flow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      toast.success('Status atualizado');
    },
  });

  const filteredFlows = flows.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Rascunho', className: 'bg-gray-500/20 text-gray-700' },
      active: { label: 'Publicado', className: 'bg-green-500/20 text-green-700' },
      paused: { label: 'Pausado', className: 'bg-yellow-500/20 text-yellow-700' },
      archived: { label: 'Arquivado', className: 'bg-red-500/20 text-red-700' },
    };
    const info = config[status] || config.draft;
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Fluxos"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/flows/dashboard')}
              size="sm"
            >
              📊 Dashboard
            </Button>
            <Button onClick={() => navigate('/flows/new')} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Novo Fluxo
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Meus Fluxos</h1>
            <p className="text-muted-foreground mt-1">Crie, publique e analise suas jornadas inteligentes</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fluxos..."
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

          {/* Flows Grid */}
          {filteredFlows.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  {search ? 'Nenhum fluxo encontrado' : 'Crie seu primeiro fluxo'}
                </p>
                <Button onClick={() => navigate('/flows/new')} variant="outline">
                  Novo Fluxo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFlows.map((flow) => (
                <Card key={flow.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/flows/${flow.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          {flow.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFlow(flow);
                                setPublishDialogOpen(true);
                              }}
                            >
                              <Globe className="w-4 h-4 mr-2" /> Publicar
                            </DropdownMenuItem>
                          )}
                          {flow.status === 'active' && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(`/flows/${flow.id}/responses`)}>
                                <BarChart3 className="w-4 h-4 mr-2" /> Ver Respostas
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateFlow.mutate({
                                  id: flow.id,
                                  data: { ...flow, status: 'paused' }
                                })}
                              >
                                <Pause className="w-4 h-4 mr-2" /> Pausar
                              </DropdownMenuItem>
                            </>
                          )}
                          {flow.status === 'paused' && (
                            <DropdownMenuItem
                              onClick={() => updateFlow.mutate({
                                id: flow.id,
                                data: { ...flow, status: 'active' }
                              })}
                            >
                              <Play className="w-4 h-4 mr-2" /> Reativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => updateFlow.mutate({
                              id: flow.id,
                              data: { ...flow, status: flow.status === 'archived' ? 'draft' : 'archived' }
                            })}
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            {flow.status === 'archived' ? 'Restaurar' : 'Arquivar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(flow.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-3 flex-1">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{flow.type || 'journey'}</Badge>
                        {getStatusBadge(flow.status)}
                        <Badge variant="outline" className="text-xs">{flow.nodes?.length || 0} blocos</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Criado: {new Date(flow.created_date).toLocaleDateString('pt-BR')}</p>
                        <p>Modificado: {new Date(flow.updated_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => navigate(`/flows/${flow.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Excluir fluxo?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteFlow.mutate(deleteConfirm);
                setDeleteConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Dialog */}
      <FlowPublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        flow={selectedFlow}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['flows'] });
          setPublishDialogOpen(false);
        }}
      />
    </>
  );
}