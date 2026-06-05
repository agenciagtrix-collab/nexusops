import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, Mail, Phone, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Clients() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', document: '', email: '', phone: '', address: '', notes: '', status: 'active' });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editClient?.id) return base44.entities.Client.update(editClient.id, data);
      return base44.entities.Client.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDialogOpen(false);
      setEditClient(null);
      toast.success('Cliente salvo!');
    },
  });

  const openNew = () => {
    setEditClient(null);
    setForm({ name: '', company: '', document: '', email: '', phone: '', address: '', notes: '', status: 'active' });
    setDialogOpen(true);
  };

  const openEdit = (client) => {
    setEditClient(client);
    setForm({ name: client.name || '', company: client.company || '', document: client.document || '', email: client.email || '', phone: client.phone || '', address: client.address || '', notes: client.notes || '', status: client.status || 'active' });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    saveMutation.mutate(form);
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabels = { active: 'Ativo', inactive: 'Inativo', prospect: 'Prospect' };
  const statusColors = { active: 'bg-emerald-50 text-emerald-600', inactive: 'bg-slate-100 text-slate-500', prospect: 'bg-amber-50 text-amber-600' };

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Clientes"
        actions={
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Cliente</span>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-heading font-semibold mb-1">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">Cadastre seu primeiro cliente</p>
              <Button size="sm" onClick={openNew} className="gap-1.5"><Plus className="w-4 h-4" /> Cadastrar</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(client => {
                const clientProjects = projects.filter(p => p.client_id === client.id);
                return (
                  <Card key={client.id} className="p-5 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex justify-end -mt-1 -mr-1 mb-1 gap-1">
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Ver detalhes"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div onClick={() => openEdit(client)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold text-sm truncate group-hover:text-primary transition-colors">{client.name}</h3>
                        {client.company && <p className="text-xs text-muted-foreground truncate">{client.company}</p>}
                      </div>
                      <Badge variant="secondary" className={`text-xs shrink-0 ${statusColors[client.status]}`}>
                        {statusLabels[client.status]}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {client.email && (
                        <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{client.email}</div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{client.phone}</div>
                      )}
                    </div>
                    {clientProjects.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">{clientProjects.length} projeto(s)</span>
                      </div>
                    )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Empresa</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Documento</Label><Input value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} placeholder="CPF/CNPJ" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="gap-1.5">
                <Save className="w-4 h-4" />{saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}