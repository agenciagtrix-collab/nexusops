import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ShareLinkCard from '@/components/share/ShareLinkCard';
import CreateShareForm from '@/components/share/CreateShareForm';
import {
  Link2, Plus, Megaphone, Globe, Loader2, Trash2, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ShareDialog({ open, onOpenChange, projectId, projectName }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('links');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '' });
  const [savingUpdate, setSavingUpdate] = useState(false);

  const { data: shares = [], isLoading: loadingShares } = useQuery({
    queryKey: ['project-shares', projectId],
    queryFn: () => base44.entities.ProjectShare.filter({ project_id: projectId }, '-created_date', 50),
    enabled: open && !!projectId,
  });

  const { data: updates = [], isLoading: loadingUpdates } = useQuery({
    queryKey: ['project-updates', projectId],
    queryFn: () => base44.entities.ProjectUpdate.filter({ project_id: projectId }, '-created_date', 50),
    enabled: open && !!projectId,
  });

  const revokeShare = useMutation({
    mutationFn: (id) => base44.entities.ProjectShare.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] });
      toast.success('Link desativado');
    },
  });

  const reactivateShare = useMutation({
    mutationFn: (id) => base44.entities.ProjectShare.update(id, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] });
      toast.success('Link reativado');
    },
  });

  const deleteShare = useMutation({
    mutationFn: (id) => base44.entities.ProjectShare.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] });
      toast.success('Link removido');
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
  const inactiveShares = shares.filter(s => !s.is_active);

  const TABS = [
    { key: 'links', label: 'Links de Acesso', count: activeShares.length, icon: Link2 },
    { key: 'updates', label: 'Comunicados', count: updates.length, icon: Megaphone },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Gerenciar Portal do Cliente</h2>
              {projectName && <p className="text-xs text-muted-foreground">{projectName}</p>}
            </div>
            <a
              href={`/share/${shares[0]?.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`ml-auto flex items-center gap-1.5 text-xs text-primary hover:underline ${!shares[0]?.token ? 'pointer-events-none opacity-40' : ''}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver portal
            </a>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── LINKS TAB ── */}
          {activeTab === 'links' && (
            <>
              {loadingShares ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Active links */}
                  {activeShares.length === 0 && !showCreateForm && (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                        <Link2 className="w-7 h-7 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Nenhum link ativo</p>
                      <p className="text-xs text-muted-foreground">Crie um link para compartilhar o progresso com o cliente</p>
                    </div>
                  )}

                  {activeShares.map(share => (
                    <ShareLinkCard
                      key={share.id}
                      share={share}
                      onRevoke={() => revokeShare.mutate(share.id)}
                      onDelete={() => deleteShare.mutate(share.id)}
                      onUpdate={(data) => {
                        base44.entities.ProjectShare.update(share.id, data).then(() =>
                          queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] })
                        );
                      }}
                    />
                  ))}

                  {/* Create form */}
                  {showCreateForm ? (
                    <div className="border border-primary/30 bg-primary/5 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-foreground">Novo Link de Acesso</p>
                        <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)} className="h-7 text-xs">
                          Cancelar
                        </Button>
                      </div>
                      <CreateShareForm
                        projectId={projectId}
                        onCreated={() => {
                          setShowCreateForm(false);
                          queryClient.invalidateQueries({ queryKey: ['project-shares', projectId] });
                        }}
                      />
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full gap-2 border-dashed" onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4" />
                      Novo Link de Compartilhamento
                    </Button>
                  )}

                  {/* Inactive links */}
                  {inactiveShares.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Links desativados</p>
                      <div className="space-y-2">
                        {inactiveShares.map(share => (
                          <ShareLinkCard
                            key={share.id}
                            share={share}
                            onReactivate={() => reactivateShare.mutate(share.id)}
                            onDelete={() => deleteShare.mutate(share.id)}
                            onUpdate={() => {}}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── UPDATES TAB ── */}
          {activeTab === 'updates' && (
            <>
              {/* Compose form */}
              <div className="border border-primary/20 bg-primary/5 rounded-xl p-5">
                <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">Publicar comunicado</p>
                <div className="space-y-2.5">
                  <Input
                    placeholder="Título do comunicado"
                    value={newUpdate.title}
                    onChange={e => setNewUpdate(u => ({ ...u, title: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Ex: Concluímos a fase de design e iniciaremos o desenvolvimento na próxima semana."
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
              </div>

              {/* List */}
              {loadingUpdates ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : updates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum comunicado publicado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {updates.map(upd => (
                    <div key={upd.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">{upd.title}</p>
                          <Badge variant="success" className="text-[10px]">Publicado</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{upd.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {format(parseISO(upd.created_date), "dd 'de' MMMM, yyyy · HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteUpdate.mutate(upd.id)}
                        className="text-muted-foreground hover:text-red-600 transition-colors p-1.5 rounded opacity-0 group-hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}