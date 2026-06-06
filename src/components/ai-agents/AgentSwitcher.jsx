import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG = {
  strategy:   { label: 'Estratégia',  emoji: '♟️', cls: 'bg-violet-50 text-violet-700' },
  legal:      { label: 'Jurídico',    emoji: '⚖️', cls: 'bg-red-50 text-red-700' },
  financial:  { label: 'Financeiro',  emoji: '💰', cls: 'bg-emerald-50 text-emerald-700' },
  marketing:  { label: 'Marketing',   emoji: '📢', cls: 'bg-pink-50 text-pink-700' },
  pmo:        { label: 'PMO',         emoji: '📋', cls: 'bg-blue-50 text-blue-700' },
  sales:      { label: 'Vendas',      emoji: '🎯', cls: 'bg-orange-50 text-orange-700' },
  technical:  { label: 'Técnico',     emoji: '💻', cls: 'bg-cyan-50 text-cyan-700' },
  hr:         { label: 'RH',          emoji: '👥', cls: 'bg-yellow-50 text-yellow-700' },
  operations: { label: 'Operações',   emoji: '⚙️', cls: 'bg-gray-50 text-gray-700' },
  design:     { label: 'Design',      emoji: '🎨', cls: 'bg-indigo-50 text-indigo-700' },
  custom:     { label: 'Custom',      emoji: '🤖', cls: 'bg-muted text-muted-foreground' },
};

export default function AgentSwitcher({ agents, selectedIds, isCouncilMode, onSelect, onToggleCouncil, onClose }) {
  const categories = [...new Set(agents.map(a => a.category))];

  return (
    <div className="w-72 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden" style={{ backgroundColor: 'hsl(var(--card))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-xs font-bold text-foreground">Especialistas</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCouncil}
            className={cn(
              "flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors",
              isCouncilMode ? "border-violet-300 bg-violet-50 text-violet-700" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <Sparkles className="w-3 h-3" />
            Conselho
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isCouncilMode && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-violet-50 border border-violet-200" style={{ backgroundColor: 'rgb(245 243 255)' }}>
          <p className="text-[11px] text-violet-700 font-medium">Modo Conselho ativo — selecione múltiplos especialistas</p>
          <p className="text-[10px] text-violet-500 mt-0.5">Cada agente responderá separadamente e depois haverá síntese</p>
          {selectedIds.length > 0 && (
            <p className="text-[11px] text-violet-700 font-semibold mt-1">{selectedIds.length} agente(s) selecionado(s)</p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {agents.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-muted-foreground">Nenhum agente ativo</p>
          </div>
        ) : (
          agents.map(agent => {
            const isSelected = selectedIds.includes(agent.id);
            const cat = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.custom;

            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-muted/50 border-b border-border/50 last:border-0",
                  isSelected && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <div className="flex-shrink-0 relative">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                    style={{ backgroundColor: agent.avatar_color || '#6366f1' }}
                  >
                    {agent.avatar_emoji || '🤖'}
                  </div>
                  {agent.status === 'active' ? (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                  ) : (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-muted border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn("text-sm font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                      {agent.name}
                    </p>
                    {isSelected && !isCouncilMode && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{agent.speciality}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge className={cn("text-[10px] border-0 px-1.5 py-0", cat.cls)}>{cat.label}</Badge>
                    {agent.conversation_count > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MessageSquare className="w-2.5 h-2.5" /> {agent.conversation_count}
                      </span>
                    )}
                  </div>
                </div>

                {isCouncilMode && (
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-border"
                  )}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {isCouncilMode && selectedIds.length >= 2 && (
        <div className="p-3 border-t border-border">
          <Button size="sm" className="w-full gap-1.5 bg-violet-600 hover:bg-violet-700" onClick={onClose}>
            <Sparkles className="w-4 h-4" /> Iniciar Conselho ({selectedIds.length})
          </Button>
        </div>
      )}
    </div>
  );
}