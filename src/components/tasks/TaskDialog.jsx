import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, X, MessageSquare, Clock, RefreshCw, Link2, GitMerge, Paperclip } from 'lucide-react';
import DependencySelector from '@/components/tasks/DependencySelector';
import TaskHistoryTab from '@/components/tasks/TaskHistoryTab';
import TaskAttachments from '@/components/tasks/TaskAttachments';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import CommentSection from '@/components/tasks/CommentSection';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const defaultStatuses = [
  { name: 'A Fazer', key: 'todo' },
  { name: 'Em Andamento', key: 'in_progress' },
  { name: 'Em Revisão', key: 'review' },
  { name: 'Concluído', key: 'done' },
];

export default function TaskDialog({ open, onClose, task, projectId, statuses, onSave, users = [] }) {
  const isEdit = !!task?.id;

  const { data: taskGroups = [] } = useQuery({
    queryKey: ['task-groups', projectId],
    queryFn: () => base44.entities.TaskGroup.filter({ project_id: projectId }, 'order', 50),
    enabled: !!projectId,
  });

  const { data: allProjectTasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }, 'title', 200),
    enabled: !!projectId,
  });

  const [form, setForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium',
    start_date: '', due_date: '', estimated_hours: '', assignee_ids: [],
    tags: [], checklist: [], project_id: projectId,
  });

  const pendingDeps = (form.dependencies || [])
    .map(id => allProjectTasks.find(t => t.id === id))
    .filter(t => t && t.status !== 'done');
  const statusList = statuses?.length > 0
    ? statuses.map(s => ({ name: s.name, key: s.name.toLowerCase().replace(/\s/g, '_'), color: s.color }))
    : defaultStatuses;

  // Normalize status value to match the statusList keys when project has custom statuses
  const getStatusKey = (val) => {
    if (!val) return statusList[0]?.key || 'todo';
    const match = statusList.find(s => s.key === val || s.name === val);
    return match ? match.key : val;
  };

  const [newCheckItem, setNewCheckItem] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [logHours, setLogHours] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        start_date: task.start_date || '',
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours || '',
        logged_hours: task.logged_hours || '',
        assignee_ids: task.assignee_ids || [],
        tags: task.tags || [],
        checklist: task.checklist || [],
        subtasks: task.subtasks || [],
        is_recurring: task.is_recurring || false,
        recurrence_rule: task.recurrence_rule || '',
        attachments: task.attachments || [],
        group_id: task.group_id || '',
        project_id: projectId,
      });
    } else {
      setForm({
        title: '', description: '', status: 'todo', priority: 'medium',
        start_date: '', due_date: '', estimated_hours: '', assignee_ids: [],
        tags: [], checklist: [], subtasks: [], logged_hours: '', attachments: [], group_id: '', project_id: projectId,
      });
    }
    setActiveTab('details');
  }, [task, projectId, open]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    updateField('checklist', [...form.checklist, { text: newCheckItem, done: false }]);
    setNewCheckItem('');
  };

  const toggleCheckItem = (index) => {
    const updated = [...form.checklist];
    updated[index].done = !updated[index].done;
    updateField('checklist', updated);
  };

  const removeCheckItem = (index) => {
    updateField('checklist', form.checklist.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (!newTag.trim() || form.tags.includes(newTag.trim())) return;
    updateField('tags', [...form.tags, newTag.trim()]);
    setNewTag('');
  };

  const saveForm = () => {
    if (!form.title.trim()) { toast.error('Título é obrigatório'); return; }
    if ((form.status === 'done') && pendingDeps.length > 0) {
      toast.error(`Dependências pendentes: ${pendingDeps.map(t => t.title).join(', ')} precisam ser concluídas primeiro.`);
      return;
    }
    onSave({
      ...form,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined,
      logged_hours: form.logged_hours ? Number(form.logged_hours) : undefined,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveForm();
  };

  const handleRecurrenceChange = (value) => {
    setForm(prev => ({ ...prev, is_recurring: value !== '', recurrence_rule: value }));
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    updateField('subtasks', [...(form.subtasks || []), { text: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (index) => {
    const updated = [...form.subtasks];
    updated[index].done = !updated[index].done;
    updateField('subtasks', updated);
  };

  const removeSubtask = (index) => {
    updateField('subtasks', form.subtasks.filter((_, i) => i !== index));
  };

  const handleLogHours = () => {
    const h = parseFloat(logHours);
    if (!h || h <= 0) return;
    const current = parseFloat(form.logged_hours) || 0;
    updateField('logged_hours', current + h);
    setLogHours('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`w-full grid mb-4 ${isEdit ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="extras">Checklist</TabsTrigger>
            <TabsTrigger value="time" className="gap-1">
              <Clock className="w-3 h-3" /> Tempo
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-1">
              <Paperclip className="w-3 h-3" /> Anexos
            </TabsTrigger>
            <TabsTrigger value="deps" className="gap-1">
              <GitMerge className="w-3 h-3" /> Deps
            </TabsTrigger>
            {isEdit && (
              <TabsTrigger value="history" className="gap-1">
                <RefreshCw className="w-3 h-3" /> Histórico
              </TabsTrigger>
            )}
          </TabsList>

        <TabsContent value="details" className="mt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="O que precisa ser feito?" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Detalhes da tarefa..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={getStatusKey(form.status)} onValueChange={v => updateField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusList.map(s => (
                    <SelectItem key={s.key} value={s.key}>
                      <div className="flex items-center gap-2">
                        {s.color && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />}
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => updateField('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={form.start_date} onChange={e => updateField('start_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Entrega</Label>
              <Input type="date" value={form.due_date} onChange={e => updateField('due_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horas Estimadas</Label>
              <Input type="number" value={form.estimated_hours} onChange={e => updateField('estimated_hours', e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Group selector */}
          {taskGroups.length > 0 && (
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={form.group_id || ''} onValueChange={v => updateField('group_id', v === '__none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Sem grupo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sem grupo</SelectItem>
                  {taskGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Responsáveis</Label>
            <Select onValueChange={(v) => {
              if (!form.assignee_ids.includes(v)) updateField('assignee_ids', [...form.assignee_ids, v]);
            }}>
              <SelectTrigger><SelectValue placeholder="Adicionar responsável" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.assignee_ids.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.assignee_ids.map(uid => {
                  const user = users.find(u => u.id === uid);
                  return (
                    <span key={uid} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {user?.full_name || 'Usuário'}
                      <button type="button" onClick={() => updateField('assignee_ids', form.assignee_ids.filter(id => id !== uid))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
            <Button type="submit" className="gap-1.5">
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
        </TabsContent>

        {/* Tab: Checklist & Tags */}
        <TabsContent value="extras" className="mt-0 space-y-4">
          {/* Subtarefas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Subtarefas</Label>
            <div className="flex gap-2">
              <Input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Nova subtarefa" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }} />
              <Button type="button" variant="outline" size="sm" onClick={addSubtask}><Plus className="w-4 h-4" /></Button>
            </div>
            {(form.subtasks || []).length > 0 && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{form.subtasks.filter(s => s.done).length}/{form.subtasks.length} concluídas</span>
                  <span>{Math.round((form.subtasks.filter(s => s.done).length / form.subtasks.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.round((form.subtasks.filter(s => s.done).length / form.subtasks.length) * 100)}%` }} />
                </div>
                <div className="space-y-1.5">
                  {form.subtasks.map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <Checkbox checked={sub.done} onCheckedChange={() => toggleSubtask(i)} />
                      <span className={`text-sm flex-1 ${sub.done ? 'line-through text-muted-foreground' : ''}`}>{sub.text}</span>
                      <button type="button" onClick={() => removeSubtask(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Adicionar tag" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Adicionar</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => updateField('tags', form.tags.filter(t => t !== tag))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label>Checklist</Label>
            <div className="flex gap-2">
              <Input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} placeholder="Novo item" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }} />
              <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.checklist.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {form.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <Checkbox checked={item.done} onCheckedChange={() => toggleCheckItem(i)} />
                    <span className={`text-sm flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                    <button type="button" onClick={() => removeCheckItem(i)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recorrência */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Recorrência</Label>
            <Select value={form.recurrence_rule || ''} onValueChange={handleRecurrenceChange}>
              <SelectTrigger><SelectValue placeholder="Sem recorrência" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Sem recorrência</SelectItem>
                <SelectItem value="Diariamente">Diariamente</SelectItem>
                <SelectItem value="Semanalmente">Semanalmente</SelectItem>
                <SelectItem value="Quinzenalmente">Quinzenalmente</SelectItem>
                <SelectItem value="Mensalmente">Mensalmente</SelectItem>
                <SelectItem value="Trimestralmente">Trimestralmente</SelectItem>
                <SelectItem value="Anualmente">Anualmente</SelectItem>
              </SelectContent>
            </Select>
            {form.is_recurring && (
              <p className="text-xs text-primary flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Esta tarefa se repetirá {(form.recurrence_rule || '').toLowerCase()} após ser concluída.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
            <Button type="button" className="gap-1.5" onClick={saveForm}>
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Tempo */}
        <TabsContent value="time" className="mt-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/40 rounded-xl text-center">
              <div className="text-2xl font-bold text-primary">{form.estimated_hours || 0}h</div>
              <div className="text-xs text-muted-foreground mt-1">Estimado</div>
            </div>
            <div className="p-4 bg-muted/40 rounded-xl text-center">
              <div className="text-2xl font-bold">{parseFloat(form.logged_hours || 0).toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground mt-1">Executado</div>
            </div>
          </div>

          {form.estimated_hours > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso de horas</span>
                <span>{Math.min(100, Math.round(((parseFloat(form.logged_hours) || 0) / form.estimated_hours) * 100))}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((parseFloat(form.logged_hours) || 0) / form.estimated_hours) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Registrar Horas</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.25"
                min="0.25"
                value={logHours}
                onChange={e => setLogHours(e.target.value)}
                placeholder="Ex: 1.5"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleLogHours} className="shrink-0">
                + Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Informe as horas trabalhadas nesta tarefa</p>
          </div>

          <div className="space-y-2">
            <Label>Horas Estimadas</Label>
            <Input
              type="number"
              value={form.estimated_hours}
              onChange={e => updateField('estimated_hours', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
            <Button type="button" className="gap-1.5" onClick={saveForm}>
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Attachments */}
        <TabsContent value="attachments" className="mt-0 space-y-4">
          <TaskAttachments
            attachments={form.attachments || []}
            onChange={(v) => updateField('attachments', v)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
            <Button type="button" className="gap-1.5" onClick={saveForm}>
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Dependencies */}
        <TabsContent value="deps" className="mt-0 space-y-4">
          {pendingDeps.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <span className="shrink-0">⚠️</span>
              <span><strong>{pendingDeps.length}</strong> dependência(s) pendente(s). Não será possível concluir esta tarefa até que sejam finalizadas.</span>
            </div>
          )}
          <DependencySelector
            projectId={projectId}
            currentTaskId={task?.id}
            value={form.dependencies || []}
            onChange={v => updateField('dependencies', v)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
            <Button type="button" className="gap-1.5" onClick={saveForm}>
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </TabsContent>

        {/* Tab: History */}
        {isEdit && (
          <TabsContent value="history" className="mt-0">
            <TaskHistoryTab taskId={task?.id} />
          </TabsContent>
        )}

        </Tabs>

        {/* Comments — only shown for existing tasks */}
        {isEdit && task?.id && (
          <>
            <Separator className="my-4" />
            <CommentSection taskId={task.id} projectId={projectId} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}