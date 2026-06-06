import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, FileText, Building2, FolderKanban, Calendar, DollarSign, Eye, Trash2, Edit, Upload, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePermissions } from '@/hooks/usePermissions';

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-600',
  signed: 'bg-emerald-50 text-emerald-600',
  active: 'bg-primary/10 text-primary',
  expired: 'bg-amber-50 text-amber-600',
  cancelled: 'bg-red-50 text-red-600',
};
const STATUS_LABELS = {
  draft: 'Rascunho', sent: 'Enviado', signed: 'Assinado',
  active: 'Ativo', expired: 'Expirado', cancelled: 'Cancelado',
};
const TYPE_LABELS = {
  service: 'Serviço', nda: 'NDA', employment: 'Emprego',
  license: 'Licença', other: 'Outro',
};

const emptyForm = {
  title: '', client_id: '', project_id: '', type: 'service', status: 'draft',
  value: '', start_date: '', end_date: '', description: '', notes: '', file_url: '', file_name: '',
};

export default function Contracts() {
  const { onMenuToggle } = useOutletContext();
  const queryClient = useQueryClient();
  const { isAdmin, canCreate, canDelete } = usePermissions();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name', 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); close(); toast.success('Contrato criado!'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contract.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); close(); toast.success('Contrato salvo!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); toast.success('Contrato excluído'); },
  });

  const close = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  const openNew = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = (c) => {
    setForm({
      title: c.title || '', client_id: c.client_id || '', project_id: c.project_id || '',
      type: c.type || 'service', status: c.status || 'draft', value: c.value || '',
      start_date: c.start_date || '', end_date: c.end_date || '',
      description: c.description || '', notes: c.notes || '',
      file_url: c.file_url || '', file_name: c.file_name || '',
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url, file_name: file.name }));
    setUploading(false);
    toast.success('Arquivo anexado!');
  };

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Título obrigatório'); return; }
    if (!form.client_id) { toast.error('Cliente obrigatório'); return; }
    const data = { ...form, value: form.value ? Number(form.value) : undefined };
    if (editingId) updateMut.mutate({ id: editingId, data });
    else createMut.mutate(data);
  };

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.title?.toLowerCase().includes(q) ||
      clients.find(cl => cl.id === c.client_id)?.name?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchClient = filterClient === 'all' || c.client_id === filterClient;
    return matchSearch && matchStatus && matchClient;
  });

  const totalValue = filtered.reduce((sum, c) => sum + (c.value || 0), 0);
  const activeCount = contracts.filter(c => c.status === 'active' || c.status === 'signed').length;
  const expiredCount = contracts.filter(c =>
    c.end_date && isPast(parseISO(c.end_date)) && c.status !== 'cancelled'
  ).length;

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Contratos"
        actions={
          canCreate && (
            <Button size="sm" className="gap-1.5" onClick={openNew}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Contrato</span>
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold">{contracts.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total de contratos</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-primary">{activeCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Ativos / Assinados</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-amber-600">{expiredCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Expirados</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-emerald-600">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Valor total (filtro)</div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar contratos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-sm">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="font-heading font-semibold mb-1">Nenhum contrato encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {search || filterStatus !== 'all' || filterClient !== 'all' ? 'Tente outros filtros.' : 'Crie o primeiro contrato.'}
              </p>
              {canCreate && !search && filterStatus === 'all' && filterClient === 'all' && (
                <Button size="sm" className="gap-1.5" onClick={openNew}>
                  <Plus className="w-4 h-4" /> Novo Contrato
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(contract => {
                const client = clients.find(c => c.id === contract.client_id);
                const project = projects.find(p => p.id === contract.project_id);
                const isExpired = contract.end_date && isPast(parseISO(contract.end_date)) && contract.status !== 'cancelled';
                return (
                  <Card key={contract.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{contract.title}</h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="secondary" className={cn("text-xs", STATUS_COLORS[contract.status])}>
                              {STATUS_LABELS[contract.status] || contract.status}
                            </Badge>
                            {isExpired && contract.status !== 'cancelled' && (
                              <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-600">Expirado</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {client && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {client.name}
                            </span>
                          )}
                          {project && (
                            <Link to={`/projects/${project.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                              <FolderKanban className="w-3 h-3" /> {project.name}
                            </Link>
                          )}
                          {contract.value > 0 && (
                            <span className="flex items-center gap-1 font-medium text-emerald-600">
                              <DollarSign className="w-3 h-3" />
                              {Number(contract.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          )}
                          {contract.type && (
                            <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[contract.type]}</Badge>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          {contract.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Início: {format(parseISO(contract.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                          {contract.end_date && (
                            <span className={cn("flex items-center gap-1", isExpired && "text-amber-600")}>
                              <Calendar className="w-3 h-3" />
                              Vence: {format(parseISO(contract.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                        {contract.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{contract.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {contract.file_url && (
                          <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver arquivo">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(contract)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            {canDelete && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteMut.mutate(contract.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={close}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Contrato de Desenvolvimento 2024" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Projeto</Label>
                <Select value={form.project_id || 'none'} onValueChange={v => setForm(f => ({ ...f, project_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem projeto</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input type="number" placeholder="0,00" value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Data Início</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Data Vencimento</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição / Escopo</Label>
              <Textarea rows={3} placeholder="Descreva o escopo do contrato..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Arquivo do Contrato</Label>
              {form.file_url ? (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate flex-1">{form.file_name || 'Arquivo'}</span>
                  <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">Abrir</a>
                  <button onClick={() => setForm(f => ({ ...f, file_url: '', file_name: '' }))} className="text-muted-foreground hover:text-destructive">
                    <span className="text-xs">Remover</span>
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? 'Enviando...' : 'Clique para anexar PDF ou documento'}</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx" disabled={uploading} />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={2} placeholder="Notas internas..." value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={close}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
                {editingId ? 'Salvar' : 'Criar Contrato'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}