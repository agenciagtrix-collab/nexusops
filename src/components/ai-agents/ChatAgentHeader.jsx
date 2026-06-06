import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown, CheckCircle2, Database, Brain, FolderOpen, ChevronRight, Users2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONTEXT = [
  { key: 'projeto', label: 'Projeto' },
  { key: 'tarefas', label: 'Tarefas' },
  { key: 'cronograma', label: 'Cronograma' },
  { key: 'arquivos', label: 'Arquivos' },
  { key: 'historico', label: 'Histórico' },
  { key: 'memorias', label: 'Memórias' },
];

export default function ChatAgentHeader({
  agent, agents, isCouncilMode, project, hasMemory, contextCount = [],
  onSwitchAgent, projects, selectedProjectId, onSelectProject,
}) {
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  if (!agent && !isCouncilMode) {
    return (
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <Brain className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Nenhum agente selecionado</p>
        </div>
        <Button size="sm" variant="outline" onClick={onSwitchAgent} className="gap-1.5 text-xs">
          <Users2 className="w-3.5 h-3.5" /> Selecionar Agente
        </Button>
      </div>
    );
  }

  const displayAgent = isCouncilMode ? null : agent;

  return (
    <div className="border-b border-border bg-card">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Avatar(s) */}
        {isCouncilMode ? (
          <div className="flex -space-x-2">
            {agents.slice(0, 4).map((a, i) => (
              <div key={a.id}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base border-2 border-background shadow-sm"
                style={{ backgroundColor: a.avatar_color || '#6366f1', zIndex: 10 - i }}>
                {a.avatar_emoji || '🤖'}
              </div>
            ))}
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center border-2 border-background">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0"
            style={{ backgroundColor: displayAgent?.avatar_color || '#6366f1' }}>
            {displayAgent?.avatar_emoji || '🤖'}
          </div>
        )}

        {/* Agent Info */}
        <div className="flex-1 min-w-0">
          {isCouncilMode ? (
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">Conselho de Especialistas</p>
                <Badge className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                  {agents.length} agentes
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {agents.map(a => a.name).join(' · ')}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">{displayAgent?.name}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{displayAgent?.speciality}</p>
            </div>
          )}
        </div>

        {/* Context chips */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Project chip */}
          <div className="relative">
            <button
              onClick={() => setShowProjectPicker(s => !s)}
              className={cn(
                "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                selectedProjectId
                  ? "border-primary/30 bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <FolderOpen className="w-3 h-3" />
              <span className="max-w-[120px] truncate">{project?.name || 'Projeto'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showProjectPicker && (
              <div className="absolute top-full mt-1 right-0 w-64 bg-card border border-border rounded-xl shadow-lg z-50 py-1.5 max-h-60 overflow-y-auto">
                <button
                  onClick={() => { onSelectProject(''); setShowProjectPicker(false); }}
                  className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors",
                    !selectedProjectId && "text-primary font-medium")}
                >
                  Nenhum projeto
                </button>
                {projects.map(p => (
                  <button key={p.id}
                    onClick={() => { onSelectProject(p.id); setShowProjectPicker(false); }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors",
                      selectedProjectId === p.id && "text-primary font-medium bg-primary/5")}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Memory chip */}
          <div className={cn("flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border",
            hasMemory ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
            <Brain className="w-3 h-3" />
            Memória {hasMemory ? 'Ativa' : 'Vazia'}
          </div>

          {/* Context count chips */}
          {contextCount.slice(0, 2).map(c => (
            <div key={c} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <CheckCircle2 className="w-3 h-3" />
              {c}
            </div>
          ))}
        </div>

        <Button size="sm" variant="outline" onClick={onSwitchAgent} className="gap-1.5 text-xs flex-shrink-0">
          <Users2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trocar</span>
        </Button>
      </div>

      {/* Context bar for mobile */}
      {selectedProjectId && (
        <div className="md:hidden px-4 pb-2 flex items-center gap-2 overflow-x-auto">
          {contextCount.map(c => (
            <div key={c} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap flex-shrink-0">
              <CheckCircle2 className="w-2.5 h-2.5" />{c}
            </div>
          ))}
          {hasMemory && (
            <div className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap flex-shrink-0">
              <Brain className="w-2.5 h-2.5" />Memória
            </div>
          )}
        </div>
      )}
    </div>
  );
}