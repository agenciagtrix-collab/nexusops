import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Upload, Download, Edit2, Trash2, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const contractTypes = [
  { key: 'service', label: 'Prestação de Serviços' },
  { key: 'nda', label: 'NDA' },
  { key: 'employment', label: 'Contrato de Trabalho' },
  { key: 'license', label: 'Licença' },
  { key: 'other', label: 'Outro' },
];

const contractStatuses = [
  { key: 'draft', label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
  { key: 'sent', label: 'Enviado', color: 'bg-blue-50 text-blue-600' },
  { key: 'signed', label: 'Assinado', color: 'bg-emerald-50 text-emerald-600' },
  { key: 'active', label: 'Ativo', color: 'bg-primary/10 text-primary' },
  { key: 'expired', label: 'Expirado', color: 'bg-amber-50 text-amber-600' },
  { key: 'cancelled', label: 'Cancelado', color: 'bg-red-50 text-red-600' },
];

const emptyForm = {
  title: '', type: 'service', status: 'draft', value: '',
  start_date: '', end_date: '', description: '', notes: '',
  file_url: '', file_name: '',
};

export default function ClientContractsTab({ clientId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContract, setEditContract] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', clientId],
    queryFn: () => base44.entities.Contract.filter({ client_id: clientId }, '-created_date', 50),
    enabled: !!clientId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editContract?.id) return base44.entities.Contract.update(editContract.id, data);
      return base44.entities.Contract.create({ ...data, client_id: clientId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', clientId] });
      setDialogOpen(false);
      setEditContract(null);
      setForm(emptyForm);
      toast.success('Contrato salvo!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contract.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', clientId] });
      toast.success('Contrato removido.');
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, file_url, file_name: file.name }));
    setUploading(false);
    toast.success('Arquivo enviado!');
  };

  const openNew = () => { setEditContract(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c) => {
    setEditContract(c);
    setForm({ title: c.title || '', type: c.type || 'service', status: c.status || 'draft', value: c.value || '', start_date: c.start_date || '', end_date: c.end_date || '', description: c.description || '', notes: c.notes || '', file_url: c.file_url || '', file_name: c.file_name || '' });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Título é obrigatório'); return; }
    saveMutation.mutate({ ...form, value: form.value ? Number(form.value) : undefined });
  };

  const getStatusInfo = (key) => contractStatuses.find(s => s.key === key) || contractStatuses[0];
  const getTypeLabel = (key) => contractTypes.find(t => t.key === key)?.label || key;

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{contracts.length} contrato(s)</p>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="w-4 h-4" /> Novo Contrato
        </Button>
      </div>

      {contracts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={openNew}><Plus className="w-4 h-4" /> Adicionar Contrato</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map(contract => {
            const statusInfo = getStatusInfo(contract.status);
            return (
              <Card key={contract.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h4 className="font-semibold text-sm">{contract.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{getTypeLabel(contract.type)}</p>
                      </div>
                      <Badge variant="secondary" className={cn("text-xs shrink-0", statusInfo.color)}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                      {contract.value && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}
                        </span>
                      )}
                      {contract.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(contract.start_date), "dd MMM yyyy", { locale: ptBR })}
                          {contract.end_date && ` → ${format(new Date(contract.end_date), "dd MMM yyyy", { locale: ptBR })}`}
                        </span>
                      )}
                    </div>
                    {contract.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{contract.description}</p>}
                    {contract.file_url && (
                      <a href={contract.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline">
                        <Download className="w-3 h-3" />{contract.file_name || 'Arquivo anexado'}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(contract)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteMutation.mutate(contract.id)} disabled={deleteMutation.isPending}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editContract ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Contrato de Desenvolvimento Web" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{contractTypes.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{contractStatuses.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Escopo do contrato..." />
            </div>
            <div className="space-y-2">
              <Label>Anexar Documento</Label>
              <label className="block border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors">
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</div>
                ) : form.file_url ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary"><FileText className="w-4 h-4" /> {form.file_name || 'Arquivo selecionado'}</div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Upload className="w-4 h-4" /> PDF ou DOC</div>
                )}
              </label>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gap-1.5">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}