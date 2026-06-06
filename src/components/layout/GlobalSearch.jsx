import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, Building2, CheckSquare, X, LayoutTemplate, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const RECENT_KEY = 'projetix_recent_searches';

export default function GlobalSearch({ onClose }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

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
      .map(p => ({
        type: 'project', icon: FolderKanban, label: p.name,
        sub: p.code ? `Projeto · ${p.code}` : 'Projeto',
        color: 'text-primary', bg: 'bg-primary/10',
        path: `/projects/${p.id}`,
      })),
    ...clients
      .filter(c => c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        type: 'client', icon: Building2, label: c.name,
        sub: c.company ? `Cliente · ${c.company}` : 'Cliente',
        color: 'text-emerald-600', bg: 'bg-emerald-50',
        path: `/clients/${c.id}`,
      })),
    ...tasks
      .filter(t => t.title?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => {
        const proj = projects.find(p => p.id === t.project_id);
        return {
          type: 'task', icon: CheckSquare, label: t.title,
          sub: proj ? `Tarefa · ${proj.name}` : 'Tarefa',
          color: 'text-amber-600', bg: 'bg-amber-50',
          path: `/projects/${t.project_id}`,
        };
      }),
  ];

  // Keyboard navigation
  useEffect(() => { setCursor(0); }, [q]);

  const handleKeyDown = useCallback((e) => {
    const list = q.length >= 2 ? results : [];
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, list.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && list[cursor]) { handleSelect(list[cursor]); }
  }, [results, cursor, q]);

  const saveRecent = (label, path) => {
    const updated = [{ label, path }, ...recentSearches.filter(r => r.path !== path)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const handleSelect = (item) => {
    saveRecent(item.label, item.path);
    navigate(item.path);
    onClose();
  };

  const typeLabels = {
    project: { label: 'Projetos', filter: r => r.type === 'project' },
    client: { label: 'Clientes', filter: r => r.type === 'client' },
    task: { label: 'Tarefas', filter: r => r.type === 'task' },
  };

  // Group results by type
  const grouped = Object.entries(typeLabels)
    .map(([key, { label, filter }]) => ({ key, label, items: results.filter(filter) }))
    .filter(g => g.items.length > 0);

  let flatIndex = 0;
  const groups = grouped.map(g => ({
    ...g,
    items: g.items.map(item => ({ ...item, _idx: flatIndex++ })),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden border border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar projetos, tarefas, clientes..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground hidden sm:inline">Esc</kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {q.length < 2 ? (
            recentSearches.length > 0 ? (
              <div className="py-2">
                <p className="px-4 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Buscas recentes
                </p>
                {recentSearches.map((r, i) => (
                  <button key={i} onClick={() => { navigate(r.path); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                Digite pelo menos 2 caracteres para buscar
              </div>
            )
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              Nenhum resultado para "<strong>{query}</strong>"
            </div>
          ) : (
            <div className="py-2">
              {groups.map(group => (
                <div key={group.key}>
                  <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </p>
                  {group.items.map((r) => {
                    const Icon = r.icon;
                    const isActive = cursor === r._idx;
                    return (
                      <button
                        key={r._idx}
                        onClick={() => handleSelect(r)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left",
                          isActive ? "bg-primary/10" : "hover:bg-muted/60"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", r.bg)}>
                          <Icon className={cn("w-4 h-4", r.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.sub}</p>
                        </div>
                        {isActive && <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">↵</kbd>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground bg-muted/30">
          <span className="flex items-center gap-1">
            <kbd className="bg-background border border-border rounded px-1">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-background border border-border rounded px-1">↵</kbd> selecionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-background border border-border rounded px-1">Esc</kbd> fechar
          </span>
        </div>
      </div>
    </div>
  );
}