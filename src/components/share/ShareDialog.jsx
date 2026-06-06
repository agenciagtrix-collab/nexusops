import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Link2, Copy, Trash2, Plus, Check, Globe, Eye, EyeOff,
  Megaphone, Users, Calendar, FileText, BarChart3, GitBranch, ArrowRight, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const DEFAULT_VISIBILITY = {
  show_progress: true,
  show_tasks: true,
  show_assignees: false,
  show_due_dates: true,
  show_files: false,
  show_timeline: true,
  show_next_steps: true,
  show_dashboard: true,
};

const VISIBILITY_OPTIONS = [
  { key: 'show_dashboard', label: 'Dashboard resumido', icon: BarChart3 },
  { key: 'show_progress', label: 'Progresso geral', icon: BarChart3 },
  { key: 'show_tasks', label: 'Visualizar tarefas', icon: Eye },
  { key: 'show_next_steps', label: 'Próximos passos', icon: ArrowRight },
  { key: 'show_timeline', label: 'Timeline do projeto', icon: GitBranch },
  { key: 'show_due_dates', label: 'Datas de entrega', icon: Calendar },
  { key: 'show_assignees', label: 'Responsáveis', icon: Users },
  { key: 'show_files', label: 'Arquivos compartilhados', icon: FileText },
];

function getPortalUrl(token) {
  return `${window.location.origin}/share/${token}`;
}

// ── Share Link Card ───────────────────────────────────────────────────────────
function ShareCard({ share, onRevoke }) {
  const [copied, setCopied] = useState(false);
  const url = getPortalUrl(share.token);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{share.label || 'Link do Cliente'}</p>
          {share.client_name && (
            <p className="text-xs text-muted-foreground mt-0.5">Para: {share.client_name}</p>
          )}
        </div>
        <Badge variant={share.is_active ? 'default' : 'secondary'} className="text-[10px]">
          {share.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>
      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
        <button onClick={copy} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{share.access_count || 0} acesso(s)</span>
        {share.last_accessed && (
          <span>Último: {format(parseISO(share.last_accessed), "dd/MM/yyyy", { locale: ptBR })}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 ml-auto gap-1"
          onClick={() => onRevoke(share.id)}
        >
          <Trash2 className="w-3 h-3" /> Revogar
        </Button>
      </div>
    </Card>
  );
}

// ── Create Link Form ──────────────────────────────────────────────────────────
function CreateLinkForm({ projectId, onCreated }) {
  const [form, setForm] = useState({
    label: '',
    client_name: '',
    client_email: '',
    visibility_settings: { ...DEFAULT_VISIBILITY },
  });
  const [loading, setLoading] = useState(false);

  const toggleVis = (key) => {
    setForm(f => ({
      ...f,
      visibility_settings: { ...f.visibility_settings, [key]: !f.visibility_settings[key] },
    }));
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateShareToken', {
        project_id: projectId,
        label: form.label || 'Link do Cliente',
        client_name: form.client_name,
        client_email: form.client_email,
        visibility_settings: form.visibility_settings,
      });
      const token = res.data?.token;
      if (token) {
        navigator.clipboard.writeText(getPortalUrl(token));
        toast.success('Link criado e copiado!');
      }
      onCreated();
    } catch (e) {
      toast.error('Erro ao gerar link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs mb-1 block">Rótulo do link</Label>
          <Input placeholder="Ex: Link para João Silva" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Nome do cliente</Label>
          <Input placeholder="Nome" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Email do cliente</Label>
          <Input placeholder="email@cliente.com" type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">O que o cliente pode visualizar?</p>
        <div className="grid grid-cols-2 gap-2">
          {VISIBILITY_OPTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => toggleVis(key)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left",
                form.visibility_settings[key]
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {form.visibility_settings[key] ? (
                <Eye className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full gap-2" onClick={handleCreate} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
        Gerar e Copiar Link
      </Button>
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────
export default function ShareDialog({ open, onOpenChange, projectId, projectName }) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '' });
  const [savingUpdate, setSavingUpdate] = useState(false);

  const { data: shares = [], isLoading: loadingShares } = useQuery({
    queryKey: ['project-shares', projectId],
    queryFn: () => base44.entities.ProjectShare.filter({ project_id: projectId }),
    enabled: open && !!projectId,
  });

  const { data: updates = [], isLoading: loadingUpdates } = useQuery({
    queryKey: ['project-updates', projectId],
    queryFn: () => base44.entities.ProjectUpdate.filter({ project_id: projectId }),
    enabled: open && !!projectId,
  });

  const revokeShare = useMutation({
    mutationFn: (id) => base44.entities.ProjectShare.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] });
      toast.success('Link revogado');
    },
  });

  const deleteUpdate = useMutation({
    mutationFn: (id) => base44.entities.ProjectUpdate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] }),
  });

  const handlePublishUpdate = async () => {
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) {
      toast.error('Preencha o título e o conteúdo');
      return;
    }
    setSavingUpdate(true);
    try {
      await base44.entities.ProjectUpdate.create({
        project_id: projectId,
        title: newUpdate.title,
        content: newUpdate.content,
        is_public: true,
      });
      setNewUpdate({ title: '', content: '' });
      queryClient.invalidateQueries({ queryKey: ['project-updates', projectId] });
      toast.success('Atualização publicada!');
    } catch {
      toast.error('Erro ao publicar');
    } finally {
      setSavingUpdate(false);
    }
  };

  const activeShares = shares.filter(s => s.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            Portal do Cliente
            {projectName && <span className="text-muted-foreground font-normal text-sm">— {projectName}</span>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="links" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="links" className="flex-1">
              <Link2 className="w-3.5 h-3.5 mr-1.5" />
              Links ({activeShares.length})
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex-1">
              <Megaphone className="w-3.5 h-3.5 mr-1.5" />
              Atualizações ({updates.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Links Tab ── */}
          <TabsContent value="links" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {loadingShares ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <>
                {activeShares.map(share => (
                  <ShareCard key={share.id} share={share} onRevoke={(id) => revokeShare.mutate(id)} />
                ))}

                {!showCreateForm ? (
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4" /> Novo Link de Compartilhamento
                  </Button>
                ) : (
                  <Card className="p-4 border-primary/30 bg-primary/5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold">Novo link</p>
                      <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="h-7 text-xs">Cancelar</Button>
                    </div>
                    <CreateLinkForm
                      projectId={projectId}
                      onCreated={() => {
                        setShowCreateForm(false);
                        queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] });
                      }}
                    />
                  </Card>
                )}

                {shares.filter(s => !s.is_active).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Links revogados</p>
                    {shares.filter(s => !s.is_active).map(share => (
                      <ShareCard key={share.id} share={share} onRevoke={() => {}} />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Updates Tab ── */}
          <TabsContent value="updates" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Create update form */}
            <Card className="p-4 border-primary/20 bg-primary/5">
              <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">Publicar atualização</p>
              <div className="space-y-2">
                <Input
                  placeholder="Título da atualização"
                  value={newUpdate.title}
                  onChange={e => setNewUpdate(u => ({ ...u, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Ex: Concluímos a fase de design e iniciaremos o desenvolvimento em 12/08."
                  rows={3}
                  value={newUpdate.content}
                  onChange={e => setNewUpdate(u => ({ ...u, content: e.target.value }))}
                  className="resize-none"
                />
                <Button size="sm" className="w-full gap-2" onClick={handlePublishUpdate} disabled={savingUpdate}>
                  {savingUpdate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
                  Publicar para Clientes
                </Button>
              </div>
            </Card>

            {loadingUpdates ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : updates.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">Nenhuma atualização publicada ainda.</p>
            ) : (
              updates
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .map(upd => (
                  <Card key={upd.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{upd.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{upd.content}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{format(parseISO(upd.created_date), "dd/MM", { locale: ptBR })}</span>
                        <button onClick={() => deleteUpdate.mutate(upd.id)} className="text-muted-foreground hover:text-red-600 transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}