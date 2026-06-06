import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Plus, Play, Pause, Trash2, Edit, ChevronRight, Bell, RefreshCw, Mail, UserCheck, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const TRIGGERS = [
  { key: 'task_created', label: 'Tarefa criada', icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'task_status_changed', label: 'Status alterado', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'task_due_date', label: 'Tarefa vencendo', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'task_assigned', label: 'Tarefa atribuída', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'project_created', label: 'Projeto criado', icon: FolderPlus, color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'project_status_changed', label: 'Status do projeto alterado', icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const ACTIONS = [
  { key: 'send_notification', label: 'Enviar notificação', icon: Bell },
  { key: 'send_email', label: 'Enviar e-mail', icon: Mail },
  { key: 'change_status', label: 'Alterar status', icon: RefreshCw },
  { key: 'assign_user', label: 'Atribuir usuário', icon: UserCheck },
];

const ACTION_VALUE_LABEL = {
  send_email: 'E-mail destino',
  send_notification: 'Mensagem',
  change_status: 'Novo status',
  assign_user: 'Usuário',
};

const TRIGGER_VALUE_LABEL = {
  task_status_changed: 'Quando status for',
  project_status_changed: 'Quando status for',
  task_due_date: 'Dias antes',
};

const STATUS_OPTIONS = [
  { key: 'todo', label: 'A Fazer' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'review', label: 'Em Revisão' },
  { key: 'done', label: 'Concluído' },
  { key: 'cancelled', label: 'Cancelado' },
];

const emptyForm = { name: '', trigger: 'task_status_changed', trigger_value: '', action: 'send_notification', action_value: '', project_id: '', active: true };

export default function Automations() {
  const { onMenuToggle } = useOutletContext();
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: () => base44.entities.Automation.list('-created_date', 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name', 50),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('full_name', 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Automation.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); close(); toast.success('Automação criada!'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Automation.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); close(); toast.success('Automação salva!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Automation.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); toast.success('Automação excluída'); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => base44.entities.Automation.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  });

  const close = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  const openNew = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = (a) => {
    setForm({ name: a.name, trigger: a.trigger, trigger_value: a.trigger_value || '', action: a.action, action_value: a.action_value || '', project_id: a.project_id || '', active: a.active !== false });
    setEditingId(a.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (editingId) updateMut.mutate({ id: editingId, data: form });
    else createMut.mutate(form);
  };

  const triggerInfo = (key) => TRIGGERS.find(t => t.key === key) || TRIGGERS[0];
  const hasTriggerValue = (t) => ['task_status_changed', 'project_status_changed', 'task_due_date'].includes(t);
  const hasActionValue = (a) => a !== 'send_notification' || true;

  const activeCount = automations.filter(a => a.active !== false).length;

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Automações"
        actions={
          isAdmin && (
            <Button size="sm" className="gap-1.5" onClick={openNew}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Automação</span>
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold">{automations.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Total de automações</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-emerald-600">{activeCount}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Ativas</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-heading font-bold text-primary">
                {automations.reduce((acc, a) => acc + (a.runs || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Execuções totais</div>
            </Card>
          </div>

          {/* Empty */}
          {!isLoading && automations.length === 0 && (
            <Card className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold mb-2">Sem automações ainda</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                Automatize tarefas repetitivas. Quando algo acontece, faça algo automaticamente.
              </p>
              {isAdmin && (
                <Button size="sm" className="gap-1.5" onClick={openNew}>
                  <Plus className="w-4 h-4" /> Criar automação
                </Button>
              )}
            </Card>
          )}

          {/* List */}
          <div className="space-y-3">
            {automations.map(a => {
              const tInfo = triggerInfo(a.trigger);
              const TIcon = tInfo.icon;
              const isActive = a.active !== false;
              const project = projects.find(p => p.id === a.project_id);

              return (
                <Card key={a.id} className={cn("p-4 transition-opacity", !isActive && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", tInfo.bg)}>
                      <TIcon className={cn("w-5 h-5", tInfo.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{a.name}</h4>
                        {!isActive && <Badge variant="secondary" className="text-xs shrink-0">Pausada</Badge>}
                        {project && <Badge variant="outline" className="text-xs shrink-0">{project.name}</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className={cn("font-medium", tInfo.color)}>{tInfo.label}</span>
                        {a.trigger_value && <><ChevronRight className="w-3 h-3" /><span>"{a.trigger_value}"</span></>}
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-medium text-foreground">
                          {ACTIONS.find(ac => ac.key === a.action)?.label || a.action}
                        </span>
                        {a.action_value && <span className="text-muted-foreground">"{a.action_value}"</span>}
                      </div>
                      {a.runs > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">{a.runs} execuções</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={isActive}
                        onCheckedChange={(v) => toggleMut.mutate({ id: a.id, active: v })}
                      />
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMut.mutate(a.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={close}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Automação' : 'Nova Automação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Notificar quando tarefa concluída" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Projeto (opcional)</Label>
              <Select value={form.project_id || 'all'} onValueChange={v => setForm(f => ({ ...f, project_id: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/50 rounded-xl space-y-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gatilho — QUANDO</p>
              <Select value={form.trigger} onValueChange={v => setForm(f => ({ ...f, trigger: v, trigger_value: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasTriggerValue(form.trigger) && (
                <div className="space-y-1">
                  <Label className="text-xs">{TRIGGER_VALUE_LABEL[form.trigger] || 'Valor'}</Label>
                  {['task_status_changed', 'project_status_changed'].includes(form.trigger) ? (
                    <Select value={form.trigger_value} onValueChange={v => setForm(f => ({ ...f, trigger_value: v }))}>
                      <SelectTrigger><SelectValue placeholder="Qualquer status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Qualquer status</SelectItem>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder="Ex: 1" value={form.trigger_value}
                      onChange={e => setForm(f => ({ ...f, trigger_value: e.target.value }))} />
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-primary/5 rounded-xl space-y-3 border border-primary/20">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Ação — FAZER</p>
              <Select value={form.action} onValueChange={v => setForm(f => ({ ...f, action: v, action_value: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map(a => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasActionValue(form.action) && (
                <div className="space-y-1">
                  <Label className="text-xs">{ACTION_VALUE_LABEL[form.action] || 'Valor'}</Label>
                  {form.action === 'change_status' ? (
                    <Select value={form.action_value} onValueChange={v => setForm(f => ({ ...f, action_value: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : form.action === 'assign_user' ? (
                    <Select value={form.action_value} onValueChange={v => setForm(f => ({ ...f, action_value: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione usuário" /></SelectTrigger>
                      <SelectContent>
                        {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder={form.action === 'send_email' ? 'email@exemplo.com' : 'Mensagem'}
                      value={form.action_value}
                      onChange={e => setForm(f => ({ ...f, action_value: e.target.value }))} />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <Label className="text-sm">Ativa</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={close}>Cancelar</Button>
                <Button onClick={handleSave}>{editingId ? 'Salvar' : 'Criar'}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}