import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, Plus, X, Save, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const FIELDS = [
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'priority', label: 'Prioridade', type: 'select' },
  { key: 'due_date', label: 'Data de Entrega', type: 'date_rel' },
  { key: 'assignee_ids', label: 'Responsável', type: 'user' },
  { key: 'tags', label: 'Tags', type: 'text' },
  { key: 'title', label: 'Título', type: 'text' },
  { key: 'estimated_hours', label: 'Horas Est.', type: 'number' },
];

const OPERATORS = {
  text: [
    { key: 'contains', label: 'Contém' },
    { key: 'not_contains', label: 'Não contém' },
    { key: 'equals', label: 'É igual a' },
  ],
  select: [
    { key: 'equals', label: 'É' },
    { key: 'not_equals', label: 'Não é' },
  ],
  date_rel: [
    { key: 'overdue', label: 'Atrasada' },
    { key: 'today', label: 'Hoje' },
    { key: 'this_week', label: 'Esta semana' },
    { key: 'next_week', label: 'Próxima semana' },
    { key: 'before', label: 'Antes de' },
    { key: 'after', label: 'Depois de' },
  ],
  number: [
    { key: 'gt', label: 'Maior que' },
    { key: 'lt', label: 'Menor que' },
    { key: 'equals', label: 'Igual a' },
  ],
  user: [
    { key: 'includes', label: 'Inclui' },
    { key: 'not_includes', label: 'Não inclui' },
    { key: 'empty', label: 'Sem responsável' },
  ],
};

const STATUS_OPTIONS = [
  { key: 'todo', label: 'A Fazer' },
  { key: 'in_progress', label: 'Em Andamento' },
  { key: 'review', label: 'Em Revisão' },
  { key: 'done', label: 'Concluído' },
];

const PRIORITY_OPTIONS = [
  { key: 'low', label: 'Baixa' },
  { key: 'medium', label: 'Média' },
  { key: 'high', label: 'Alta' },
  { key: 'urgent', label: 'Urgente' },
  { key: 'critical', label: 'Crítica' },
];

function applyFilters(tasks, filters, logic = 'and') {
  if (!filters.length) return tasks;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  const endOfNextWeek = new Date(endOfWeek); endOfNextWeek.setDate(endOfWeek.getDate() + 7);

  const check = (task, f) => {
    const val = task[f.field];
    switch (f.field) {
      case 'title':
        if (f.operator === 'contains') return task.title?.toLowerCase().includes(f.value?.toLowerCase());
        if (f.operator === 'not_contains') return !task.title?.toLowerCase().includes(f.value?.toLowerCase());
        if (f.operator === 'equals') return task.title?.toLowerCase() === f.value?.toLowerCase();
        break;
      case 'tags':
        if (f.operator === 'contains') return task.tags?.some(t => t.toLowerCase().includes(f.value?.toLowerCase()));
        if (f.operator === 'not_contains') return !task.tags?.some(t => t.toLowerCase().includes(f.value?.toLowerCase()));
        break;
      case 'status':
        if (f.operator === 'equals') return task.status === f.value;
        if (f.operator === 'not_equals') return task.status !== f.value;
        break;
      case 'priority':
        if (f.operator === 'equals') return (task.priority || 'medium') === f.value;
        if (f.operator === 'not_equals') return (task.priority || 'medium') !== f.value;
        break;
      case 'due_date': {
        const d = task.due_date ? new Date(task.due_date) : null;
        if (!d && f.operator !== 'overdue') return false;
        if (f.operator === 'overdue') return d && d < today && task.status !== 'done';
        if (f.operator === 'today') return d && d.toDateString() === today.toDateString();
        if (f.operator === 'this_week') return d && d >= today && d <= endOfWeek;
        if (f.operator === 'next_week') return d && d > endOfWeek && d <= endOfNextWeek;
        if (f.operator === 'before') return d && f.value && d < new Date(f.value);
        if (f.operator === 'after') return d && f.value && d > new Date(f.value);
        break;
      }
      case 'assignee_ids':
        if (f.operator === 'empty') return !task.assignee_ids?.length;
        if (f.operator === 'includes') return task.assignee_ids?.includes(f.value);
        if (f.operator === 'not_includes') return !task.assignee_ids?.includes(f.value);
        break;
      case 'estimated_hours': {
        const hours = Number(task.estimated_hours);
        const fv = Number(f.value);
        if (f.operator === 'gt') return hours > fv;
        if (f.operator === 'lt') return hours < fv;
        if (f.operator === 'equals') return hours === fv;
        break;
      }
    }
    return true;
  };

  return tasks.filter(task => {
    const results = filters.map(f => check(task, f));
    return logic === 'and' ? results.every(Boolean) : results.some(Boolean);
  });
}

export { applyFilters };

export default function AdvancedFilters({ filters, onChange, logic, onLogicChange, users = [], statuses = [] }) {
  const [open, setOpen] = useState(false);

  const activeCount = filters.length;

  const addFilter = () => {
    onChange([...filters, { id: Date.now(), field: 'status', operator: 'equals', value: '' }]);
  };

  const removeFilter = (id) => onChange(filters.filter(f => f.id !== id));

  const updateFilter = (id, key, val) => {
    onChange(filters.map(f => {
      if (f.id !== id) return f;
      const updated = { ...f, [key]: val };
      if (key === 'field') {
        const fieldDef = FIELDS.find(fd => fd.key === val);
        const ops = OPERATORS[fieldDef?.type || 'text'];
        updated.operator = ops[0]?.key || 'equals';
        updated.value = '';
      }
      return updated;
    }));
  };

  const clearAll = () => onChange([]);

  const getValueInput = (f) => {
    const fieldDef = FIELDS.find(fd => fd.key === f.field);
    const noValue = ['overdue', 'today', 'this_week', 'next_week', 'empty'].includes(f.operator);
    if (noValue) return null;

    if (f.field === 'status') {
      const opts = statuses?.length
        ? statuses.map(s => ({ key: s.name.toLowerCase().replace(/\s/g, '_'), label: s.name }))
        : STATUS_OPTIONS;
      return (
        <Select value={f.value} onValueChange={v => updateFilter(f.id, 'value', v)}>
          <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue placeholder="Valor" /></SelectTrigger>
          <SelectContent>{opts.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (f.field === 'priority') {
      return (
        <Select value={f.value} onValueChange={v => updateFilter(f.id, 'value', v)}>
          <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue placeholder="Valor" /></SelectTrigger>
          <SelectContent>{PRIORITY_OPTIONS.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (f.field === 'assignee_ids') {
      return (
        <Select value={f.value} onValueChange={v => updateFilter(f.id, 'value', v)}>
          <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue placeholder="Usuário" /></SelectTrigger>
          <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (fieldDef?.type === 'date_rel') {
      return (
        <Input type="date" className="h-7 text-xs w-[130px]" value={f.value}
          onChange={e => updateFilter(f.id, 'value', e.target.value)} />
      );
    }
    return (
      <Input placeholder="Valor" className="h-7 text-xs w-[120px]" value={f.value}
        onChange={e => updateFilter(f.id, 'value', e.target.value)} />
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5 h-8", activeCount > 0 && "border-primary text-primary bg-primary/5")}>
          <Filter className="w-3.5 h-3.5" />
          Filtros
          {activeCount > 0 && (
            <Badge className="h-4 w-4 p-0 text-[10px] flex items-center justify-center bg-primary text-primary-foreground rounded-full">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[520px] p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Filtros Avançados</h4>
            <div className="flex items-center gap-2">
              {filters.length > 1 && (
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  {['and', 'or'].map(l => (
                    <button key={l}
                      onClick={() => onLogicChange?.(l)}
                      className={cn("text-xs px-2 py-1 rounded-md transition-colors font-medium",
                        logic === l ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                      )}>
                      {l === 'and' ? 'E' : 'OU'}
                    </button>
                  ))}
                </div>
              )}
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive">
                  Limpar tudo
                </button>
              )}
            </div>
          </div>

          {filters.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              Nenhum filtro ativo. Adicione condições para filtrar tarefas.
            </p>
          )}

          <div className="space-y-2">
            {filters.map((f, i) => {
              const fieldDef = FIELDS.find(fd => fd.key === f.field);
              const ops = OPERATORS[fieldDef?.type || 'text'] || [];
              return (
                <div key={f.id} className="flex items-center gap-2 flex-wrap">
                  {i > 0 && (
                    <span className="text-xs font-medium text-muted-foreground w-6 text-center">
                      {logic === 'and' ? 'E' : 'OU'}
                    </span>
                  )}
                  {i === 0 && <span className="text-xs text-muted-foreground w-6">Se</span>}

                  <Select value={f.field} onValueChange={v => updateFilter(f.id, 'field', v)}>
                    <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{FIELDS.map(fd => <SelectItem key={fd.key} value={fd.key}>{fd.label}</SelectItem>)}</SelectContent>
                  </Select>

                  <Select value={f.operator} onValueChange={v => updateFilter(f.id, 'operator', v)}>
                    <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{ops.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>

                  {getValueInput(f)}

                  <button onClick={() => removeFilter(f.id)} className="text-muted-foreground hover:text-destructive ml-auto">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="gap-1.5 w-full text-xs" onClick={addFilter}>
            <Plus className="w-3.5 h-3.5" /> Adicionar condição
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}