import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, X, Link2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DependencySelector({ projectId, currentTaskId, value = [], onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }, 'title', 200),
    enabled: !!projectId,
  });

  const available = tasks.filter(t =>
    t.id !== currentTaskId &&
    !value.includes(t.id) &&
    (!search || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedTasks = value.map(id => tasks.find(t => t.id === id)).filter(Boolean);

  const add = (task) => {
    onChange([...value, task.id]);
    setSearch('');
  };

  const remove = (id) => {
    onChange(value.filter(v => v !== id));
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Link2 className="w-4 h-4" /> Dependências
      </Label>
      <p className="text-xs text-muted-foreground">Esta tarefa só pode iniciar após as dependências estarem concluídas.</p>

      {/* Selected deps */}
      {selectedTasks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTasks.map(t => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full"
            >
              <Link2 className="w-3 h-3" />
              {t.title.slice(0, 30)}{t.title.length > 30 ? '…' : ''}
              <button type="button" onClick={() => remove(t.id)}>
                <X className="w-3 h-3 hover:text-destructive" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Blocked warning */}
      {selectedTasks.some(t => t.status !== 'done') && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>{selectedTasks.filter(t => t.status !== 'done').length}</strong> dependência(s) ainda não concluída(s). Esta tarefa pode estar bloqueada.
          </span>
        </div>
      )}

      {/* Search to add */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar tarefas para adicionar como dependência..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {open && available.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden shadow-md bg-card max-h-40 overflow-y-auto">
          {available.slice(0, 8).map(t => (
            <button
              key={t.id}
              type="button"
              onMouseDown={() => add(t)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 transition-colors flex items-center gap-2"
            >
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0",
                t.status === 'done' ? 'bg-green-500' : 'bg-amber-400'
              )} />
              <span className="truncate">{t.title}</span>
              <span className="ml-auto text-muted-foreground shrink-0">{t.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}