import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Check, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TaskCard from '@/components/tasks/TaskCard';

const GROUP_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#94a3b8'];

export default function TaskGroupManager({ projectId, tasks = [], users = [], onTaskClick, onAddTask }) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState({});
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ['task-groups', projectId],
    queryFn: () => base44.entities.TaskGroup.filter({ project_id: projectId }, 'order', 50),
    enabled: !!projectId,
  });

  const createGroup = useMutation({
    mutationFn: (data) => base44.entities.TaskGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-groups', projectId] });
      setNewGroupName('');
      setShowNewGroup(false);
      toast.success('Grupo criado!');
    },
  });

  const updateGroup = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-groups', projectId] });
      setEditingGroupId(null);
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (id) => base44.entities.TaskGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-groups', projectId] });
      toast.success('Grupo removido.');
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Digite um nome para o grupo');
      return;
    }
    createGroup.mutate({
      name: newGroupName.trim(),
      project_id: projectId,
      order: groups.length + 1,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
    });
  };

  const handleRenameGroup = (group) => {
    updateGroup.mutate({ id: group.id, data: { name: editingName.trim() } });
  };

  const toggleCollapse = (groupId) => {
    setCollapsed(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Tasks without a group
  const ungroupedTasks = tasks.filter(t => !t.group_id || !groups.find(g => g.id === t.group_id));

  return (
    <div className="space-y-4">
      {/* Grouped tasks */}
      {groups.map((group) => {
        const groupTasks = tasks.filter(t => t.group_id === group.id);
        const isCollapsed = collapsed[group.id];
        const isEditing = editingGroupId === group.id;

        return (
          <div key={group.id} className="rounded-xl border border-border/60 overflow-hidden">
            {/* Group header */}
            <div
              className="group flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => !isEditing && toggleCollapse(group.id)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color || '#94a3b8' }} />

              {isEditing ? (
                <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                  <Input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    className="h-7 text-sm flex-1 max-w-xs"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameGroup(group);
                      if (e.key === 'Escape') setEditingGroupId(null);
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRenameGroup(group)}>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingGroupId(null)}>
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold flex-1" style={{ color: group.name ? 'inherit' : 'var(--muted-foreground)' }}>
                    {group.name || '(Sem nome)'}
                  </span>
                  <span className="text-xs text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded-full">
                    {groupTasks.length}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity ml-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => { setEditingGroupId(group.id); setEditingName(group.name); }}
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => deleteGroup.mutate(group.id)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                  <button className="p-0.5 hover:bg-muted rounded" onClick={e => { e.stopPropagation(); toggleCollapse(group.id); }}>
                    {isCollapsed
                      ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                </>
              )}
            </div>

            {/* Group tasks */}
            {!isCollapsed && (
              <div className="p-3 space-y-2 bg-background">
                {groupTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhuma tarefa neste grupo</p>
                ) : (
                  groupTasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={onTaskClick} users={users} />
                  ))
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onAddTask?.(undefined, group.id)}
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar tarefa
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {/* Ungrouped tasks */}
      {ungroupedTasks.length > 0 && (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => toggleCollapse('__ungrouped')}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 shrink-0" />
            <span className="text-sm font-semibold flex-1 text-muted-foreground">Sem grupo</span>
            <span className="text-xs text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded-full">
              {ungroupedTasks.length}
            </span>
            {collapsed['__ungrouped']
              ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </div>
          {!collapsed['__ungrouped'] && (
            <div className="p-3 space-y-2 bg-background">
              {ungroupedTasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} users={users} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New group form */}
      {showNewGroup ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-primary/40 bg-primary/5">
          <Input
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Nome do grupo..."
            className="h-8 text-sm flex-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateGroup();
              if (e.key === 'Escape') { setShowNewGroup(false); setNewGroupName(''); }
            }}
          />
          <Button size="sm" onClick={handleCreateGroup} disabled={createGroup.isPending} className="h-8 gap-1">
            <Check className="w-3.5 h-3.5" /> Criar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowNewGroup(false); setNewGroupName(''); }} className="h-8">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
          onClick={() => setShowNewGroup(true)}
        >
          <Plus className="w-4 h-4" /> Adicionar Grupo
        </Button>
      )}
    </div>
  );
}