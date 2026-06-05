import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const defaultStatuses = [
  { name: 'A Fazer', key: 'todo' },
  { name: 'Em Andamento', key: 'in_progress' },
  { name: 'Em Revisão', key: 'review' },
  { name: 'Concluído', key: 'done' },
];

export default function TaskDialog({ open, onClose, task, projectId, statuses, onSave, users = [] }) {
  const isEdit = !!task?.id;
  const statusList = statuses?.length > 0
    ? statuses.map(s => ({ name: s.name, key: s.name.toLowerCase().replace(/\s/g, '_') }))
    : defaultStatuses;

  const [form, setForm] = useState({
    title: '', description: '', status: 'todo', priority: 'medium',
    start_date: '', due_date: '', estimated_hours: '', assignee_ids: [],
    tags: [], checklist: [], project_id: projectId,
  });

  const [newCheckItem, setNewCheckItem] = useState('');
  const [newTag, setNewTag] = useState('');

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
        assignee_ids: task.assignee_ids || [],
        tags: task.tags || [],
        checklist: task.checklist || [],
        project_id: projectId,
      });
    } else {
      setForm({
        title: '', description: '', status: 'todo', priority: 'medium',
        start_date: '', due_date: '', estimated_hours: '', assignee_ids: [],
        tags: [], checklist: [], project_id: projectId,
      });
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Título é obrigatório'); return; }
    onSave({ ...form, estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
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
              <Select value={form.status} onValueChange={v => updateField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusList.map(s => <SelectItem key={s.key} value={s.key}>{s.name}</SelectItem>)}
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

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
            <Button type="submit" className="gap-1.5">
              <Save className="w-4 h-4" />
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}