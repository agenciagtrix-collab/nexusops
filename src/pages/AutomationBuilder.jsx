import React, { useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Zap, Plus, ArrowDown, Play, Pause, Trash2, Save, ChevronRight,
  Bell, Mail, RefreshCw, UserCheck, FolderPlus, Clock, CheckSquare,
  GitBranch, AlertCircle, Edit, X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

const TRIGGER_BLOCKS = [
  { key: 'task_created', label: 'Tarefa Criada', icon: Plus, color: '#22c55e', category: 'Tarefas' },
  { key: 'task_status_changed', label: 'Status Alterado', icon: RefreshCw, color: '#6366f1', category: 'Tarefas' },
  { key: 'task_due_date', label: 'Tarefa Vencendo', icon: Clock, color: '#f59e0b', category: 'Tarefas' },
  { key: 'task_assigned', label: 'Tarefa Atribuída', icon: UserCheck, color: '#8b5cf6', category: 'Tarefas' },
  { key: 'task_completed', label: 'Tarefa Concluída', icon: CheckSquare, color: '#14b8a6', category: 'Tarefas' },
  { key: 'project_created', label: 'Projeto Criado', icon: FolderPlus, color: '#0ea5e9', category: 'Projetos' },
  { key: 'project_status_changed', label: 'Status do Projeto', icon: RefreshCw, color: '#f97316', category: 'Projetos' },
];

const ACTION_BLOCKS = [
  { key: 'send_notification', label: 'Enviar Notificação', icon: Bell, color: '#6366f1' },
  { key: 'send_email', label: 'Enviar E-mail', icon: Mail, color: '#0ea5e9' },
  { key: 'change_status', label: 'Alterar Status', icon: RefreshCw, color: '#f59e0b' },
  { key: 'assign_user', label: 'Atribuir Usuário', icon: UserCheck, color: '#8b5cf6' },
  { key: 'create_task', label: 'Criar Tarefa', icon: Plus, color: '#22c55e' },
  { key: 'move_to_group', label: 'Mover p/ Grupo', icon: GitBranch, color: '#14b8a6' },
];

const STATUS_OPTIONS = [
  { key: 'todo', label: 'A Fazer' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'review', label: 'Em Revisão' },
  { key: 'done', label: 'Concluído' },
  { key: 'cancelled', label: 'Cancelado' },
];

function FlowBlock({ block, type, onRemove, config, onChange, users = [], isReadOnly }) {
  const info = type === 'trigger'
    ? TRIGGER_BLOCKS.find(t => t.key === block) || TRIGGER_BLOCKS[0]
    : ACTION_BLOCKS.find(a => a.key === block) || ACTION_BLOCKS[0];
  const Icon = info.icon;

  return (
    <div className="relative">
      <div
        className="rounded-xl border-2 p-4 space-y-3"
        style={{ borderColor: info.color + '40', backgroundColor: info.color + '08' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: info.color + '20' }}>
              <Icon className="w-4 h-4" style={{ color: info.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {type === 'trigger' ? '⚡ Quando' : '▶ Então'}
              </p>
              <p className="text-sm font-semibold">{info.label}</p>
            </div>
          </div>
          {!isReadOnly && onRemove && (
            <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Config */}
        {!isReadOnly && onChange && (
          <div className="space-y-2">
            {block === 'task_status_changed' || block === 'project_status_changed' ? (
              <div>
                <Label className="text-xs text-muted-foreground">Quando status for</Label>
                <Select value={config?.trigger_value || ''} onValueChange={v => onChange({ trigger_value: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Qualquer status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : block === 'task_due_date' ? (
              <div>
                <Label className="text-xs text-muted-foreground">Dias antes do vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  className="h-8 text-xs mt-1"
                  placeholder="Ex: 1"
                  value={config?.trigger_value || ''}
                  onChange={e => onChange({ trigger_value: e.target.value })}
                />
              </div>
            ) : block === 'send_email' ? (
              <div>
                <Label className="text-xs text-muted-foreground">E-mail destino</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  placeholder="email@exemplo.com"
                  value={config?.action_value || ''}
                  onChange={e => onChange({ action_value: e.target.value })}
                />
              </div>
            ) : block === 'send_notification' ? (
              <div>
                <Label className="text-xs text-muted-foreground">Mensagem</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  placeholder="Digite a mensagem..."
                  value={config?.action_value || ''}
                  onChange={e => onChange({ action_value: e.target.value })}
                />
              </div>
            ) : block === 'change_status' ? (
              <div>
                <Label className="text-xs text-muted-foreground">Novo status</Label>
                <Select value={config?.action_value || ''} onValueChange={v => onChange({ action_value: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : block === 'assign_user' ? (
              <div>
                <Label className="text-xs text-muted-foreground">Usuário</Label>
                <Select value={config?.action_value || ''} onValueChange={v => onChange({ action_value: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : block === 'create_task' ? (
              <div>
                <Label className="text-xs text-muted-foreground">Título da nova tarefa</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  placeholder="Ex: Revisar entregável"
                  value={config?.action_value || ''}
                  onChange={e => onChange({ action_value: e.target.value })}
                />
              </div>
            ) : null}

            {config?.trigger_value && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-emerald-500" />
                Configurado
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockPicker({ type, onSelect, onClose }) {
  const blocks = type === 'trigger' ? TRIGGER_BLOCKS : ACTION_BLOCKS;
  const categories = [...new Set(blocks.map(b => b.category || 'Geral'))].filter(Boolean);

  return (
    <div className="absolute z-50 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {type === 'trigger' ? 'Escolha o Gatilho' : 'Escolha a Ação'}
        </p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      {categories.map(cat => (
        <div key={cat}>
          {cat !== 'Geral' && (
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{cat}</p>
          )}
          <div className="grid grid-cols-1 gap-1">
            {blocks.filter(b => (b.category || 'Geral') === cat).map(block => {
              const Icon = block.icon;
              return (
                <button
                  key={block.key}
                  onClick={() => { onSelect(block.key); onClose(); }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: block.color + '20' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: block.color }} />
                  </div>
                  <span className="text-sm font-medium">{block.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AutomationBuilder() {
  const { onMenuToggle } = useOutletContext();
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();
  const [mode, setMode] = useState('list'); // list | builder
  const [editingId, setEditingId] = useState(null);

  // Builder state
  const [name, setName] = useState('');
  const [triggerBlock, setTriggerBlock] = useState(null);
  const [actionBlocks, setActionBlocks] = useState([]);
  const [blockConfigs, setBlockConfigs] = useState({});
  const [projectId, setProjectId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); resetBuilder(); toast.success('Automação criada!'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Automation.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); resetBuilder(); toast.success('Automação salva!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Automation.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automations'] }); toast.success('Automação excluída'); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => base44.entities.Automation.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  });

  const resetBuilder = () => {
    setMode('list');
    setEditingId(null);
    setName('');
    setTriggerBlock(null);
    setActionBlocks([]);
    setBlockConfigs({});
    setProjectId('');
    setIsActive(true);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setName(a.name);
    setTriggerBlock(a.trigger);
    setActionBlocks([a.action]);
    setBlockConfigs({
      trigger: { trigger_value: a.trigger_value || '' },
      action_0: { action_value: a.action_value || '' },
    });
    setProjectId(a.project_id || '');
    setIsActive(a.active !== false);
    setMode('builder');
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Nome obrigatório'); return; }
    if (!triggerBlock) { toast.error('Adicione um gatilho'); return; }
    if (actionBlocks.length === 0) { toast.error('Adicione pelo menos uma ação'); return; }

    const data = {
      name,
      trigger: triggerBlock,
      trigger_value: blockConfigs.trigger?.trigger_value || '',
      action: actionBlocks[0],
      action_value: blockConfigs.action_0?.action_value || '',
      project_id: projectId || '',
      active: isActive,
    };

    if (editingId) updateMut.mutate({ id: editingId, data });
    else createMut.mutate(data);
  };

  const triggerCategories = [...new Set(TRIGGER_BLOCKS.map(t => t.category || 'Geral'))].filter(Boolean);
  const activeCount = automations.filter(a => a.active !== false).length;

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title="Automações"
        actions={
          isAdmin && (
            <div className="flex items-center gap-2">
              {mode === 'builder' && (
                <Button variant="outline" size="sm" onClick={resetBuilder}>Cancelar</Button>
              )}
              <Button
                size="sm"
                className="gap-1.5"
                onClick={mode === 'builder' ? handleSave : () => setMode('builder')}
              >
                {mode === 'builder' ? (
                  <><Save className="w-4 h-4" /> Salvar Automação</>
                ) : (
                  <><Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova Automação</span></>
                )}
              </Button>
            </div>
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

          {/* Builder Mode */}
          {mode === 'builder' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Canvas */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Nome da automação..."
                        className="font-semibold border-0 px-0 text-base focus-visible:ring-0 h-auto"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Trigger */}
                    <div className="relative">
                      {triggerBlock ? (
                        <FlowBlock
                          block={triggerBlock}
                          type="trigger"
                          onRemove={() => setTriggerBlock(null)}
                          config={blockConfigs.trigger}
                          onChange={cfg => setBlockConfigs(prev => ({ ...prev, trigger: { ...prev.trigger, ...cfg } }))}
                          users={users}
                        />
                      ) : (
                        <button
                          onClick={() => setShowTriggerPicker(true)}
                          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Zap className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-muted-foreground">⚡ Adicionar Gatilho</p>
                            <p className="text-xs text-muted-foreground">Quando isso acontecer...</p>
                          </div>
                        </button>
                      )}
                      {showTriggerPicker && (
                        <BlockPicker
                          type="trigger"
                          onSelect={setTriggerBlock}
                          onClose={() => setShowTriggerPicker(false)}
                        />
                      )}
                    </div>

                    {/* Connector */}
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-px h-4 bg-border" />
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                        <div className="w-px h-4 bg-border" />
                      </div>
                    </div>

                    {/* Actions */}
                    {actionBlocks.map((action, idx) => (
                      <React.Fragment key={idx}>
                        <FlowBlock
                          block={action}
                          type="action"
                          onRemove={() => setActionBlocks(prev => prev.filter((_, i) => i !== idx))}
                          config={blockConfigs[`action_${idx}`]}
                          onChange={cfg => setBlockConfigs(prev => ({ ...prev, [`action_${idx}`]: { ...prev[`action_${idx}`], ...cfg } }))}
                          users={users}
                        />
                        {idx < actionBlocks.length - 1 && (
                          <div className="flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-px h-4 bg-border" />
                              <ArrowDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}

                    {/* Add action */}
                    <div className="relative">
                      <button
                        onClick={() => setShowActionPicker(true)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-muted-foreground">▶ Adicionar Ação</p>
                          <p className="text-xs text-muted-foreground">Então fazer isso...</p>
                        </div>
                      </button>
                      {showActionPicker && (
                        <BlockPicker
                          type="action"
                          onSelect={(key) => setActionBlocks(prev => [...prev, key])}
                          onClose={() => setShowActionPicker(false)}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Settings Panel */}
              <div className="space-y-4">
                <Card className="p-4 space-y-4">
                  <h4 className="font-semibold text-sm">Configurações</h4>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Projeto (opcional)</Label>
                    <Select value={projectId || 'all'} onValueChange={v => setProjectId(v === 'all' ? '' : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os projetos</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Automação ativa</p>
                      <p className="text-xs text-muted-foreground">Executar automaticamente</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </Card>

                {/* Preview */}
                {triggerBlock && actionBlocks.length > 0 && (
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <h4 className="font-semibold text-xs text-primary uppercase tracking-wide mb-3">Preview</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {TRIGGER_BLOCKS.find(t => t.key === triggerBlock)?.label}
                      </Badge>
                      <ChevronRight className="w-3 h-3" />
                      {actionBlocks.map((a, i) => (
                        <Badge key={i} className="text-xs bg-primary/20 text-primary border-primary/30">
                          {ACTION_BLOCKS.find(ab => ab.key === a)?.label}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* List Mode */}
          {mode === 'list' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-heading font-bold">{automations.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Total</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-heading font-bold text-emerald-600">{activeCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Ativas</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-heading font-bold text-primary">
                    {automations.reduce((acc, a) => acc + (a.runs || 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Execuções</div>
                </Card>
              </div>

              {!isLoading && automations.length === 0 && (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">Construtor Visual de Automações</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Crie fluxos de trabalho automatizados com o construtor visual. Arraste blocos de gatilhos e ações para criar automações poderosas.
                  </p>
                  {isAdmin && (
                    <Button size="sm" className="gap-1.5" onClick={() => setMode('builder')}>
                      <Plus className="w-4 h-4" /> Criar primeira automação
                    </Button>
                  )}
                </Card>
              )}

              <div className="space-y-3">
                {automations.map(a => {
                  const tInfo = TRIGGER_BLOCKS.find(t => t.key === a.trigger) || TRIGGER_BLOCKS[0];
                  const aInfo = ACTION_BLOCKS.find(ab => ab.key === a.action) || ACTION_BLOCKS[0];
                  const TIcon = tInfo.icon;
                  const AIcon = aInfo.icon;
                  const isActive = a.active !== false;
                  const project = projects.find(p => p.id === a.project_id);

                  return (
                    <Card key={a.id} className={cn("p-4 transition-all hover:shadow-md", !isActive && "opacity-60")}>
                      <div className="flex items-start gap-3">
                        {/* Flow preview */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: tInfo.color + '15' }}>
                            <TIcon className="w-4.5 h-4.5" style={{ color: tInfo.color }} />
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: aInfo.color + '15' }}>
                            <AIcon className="w-4.5 h-4.5" style={{ color: aInfo.color }} />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm truncate">{a.name}</h4>
                            {!isActive && <Badge variant="secondary" className="text-xs shrink-0">Pausada</Badge>}
                            {project && <Badge variant="outline" className="text-xs shrink-0">{project.name}</Badge>}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                            <span className="font-medium" style={{ color: tInfo.color }}>{tInfo.label}</span>
                            {a.trigger_value && <><ChevronRight className="w-3 h-3" /><span>"{a.trigger_value}"</span></>}
                            <ChevronRight className="w-3 h-3" />
                            <span className="font-medium" style={{ color: aInfo.color }}>{aInfo.label}</span>
                            {a.action_value && <span>"{a.action_value}"</span>}
                          </div>
                          {a.runs > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-semibold">{a.runs}</span> execuções
                              {a.last_run && ` · Última: ${new Date(a.last_run).toLocaleDateString('pt-BR')}`}
                            </p>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteMut.mutate(a.id)}
                              >
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
            </>
          )}
        </div>
      </div>
    </>
  );
}