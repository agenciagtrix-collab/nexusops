import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, Building2, CheckSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name', 100),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-updated_date', 300),
  });

  const q = query.trim().toLowerCase();

  const results = q.length < 2 ? [] : [
    ...projects
      .filter(p => p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(p => ({ type: 'project', icon: FolderKanban, label: p.name, sub: p.code || 'Projeto', color: 'text-primary', path: `/projects/${p.id}` })),
    ...clients
      .filter(c => c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({ type: 'client', icon: Building2, label: c.name, sub: c.company || 'Cliente', color: 'text-emerald-600', path: `/clients/${c.id}` })),
    ...tasks
      .filter(t => t.title?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(t => ({ type: 'task', icon: CheckSquare, label: t.title, sub: 'Tarefa', color: 'text-amber-600', path: `/projects/${t.project_id}` })),
  ];

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar projetos, tarefas, clientes..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {q.length < 2 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado para "<strong>{query}</strong>"
            </div>
          ) : (
            <div className="py-2">
              {results.map((r, i) => {
                const Icon = r.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(r.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0")}>
                      <Icon className={cn("w-4 h-4", r.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
          <span>↑↓ navegar</span>
          <span>↵ selecionar</span>
          <span>Esc fechar</span>
        </div>
      </div>
    </div>
  );
}