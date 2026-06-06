import React from 'react';
import { cn } from '@/lib/utils';

const PERMISSIONS = [
  { key: 'projects',      label: 'Projetos',          emoji: '📁' },
  { key: 'tasks',         label: 'Tarefas',            emoji: '✅' },
  { key: 'subtasks',      label: 'Subtarefas',         emoji: '📌' },
  { key: 'comments',      label: 'Comentários',        emoji: '💬' },
  { key: 'files',         label: 'Arquivos',           emoji: '📎' },
  { key: 'clients',       label: 'Clientes',           emoji: '🏢' },
  { key: 'timelines',     label: 'Cronogramas',        emoji: '📅' },
  { key: 'history',       label: 'Histórico',          emoji: '🕐' },
  { key: 'teams',         label: 'Equipes',            emoji: '👥' },
  { key: 'reports',       label: 'Relatórios',         emoji: '📊' },
  { key: 'metrics',       label: 'Indicadores',        emoji: '📈' },
  { key: 'contracts',     label: 'Contratos',          emoji: '📝' },
  { key: 'financials',    label: 'Financeiro',         emoji: '💰' },
  { key: 'client_portal', label: 'Portal do Cliente',  emoji: '🌐' },
];

export default function PermissionsGrid({ selected = [], onChange }) {
  const toggle = (key) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const selectAll = () => onChange(PERMISSIONS.map(p => p.key));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selected.length} de {PERMISSIONS.length} permissões ativas
        </p>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-primary hover:underline">Selecionar todas</button>
          <span className="text-muted-foreground text-xs">·</span>
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground hover:underline">Limpar</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PERMISSIONS.map(perm => {
          const isSelected = selected.includes(perm.key);
          return (
            <button
              key={perm.key}
              onClick={() => toggle(perm.key)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="text-base">{perm.emoji}</span>
              <span className="text-sm font-medium">{perm.label}</span>
              {isSelected && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}