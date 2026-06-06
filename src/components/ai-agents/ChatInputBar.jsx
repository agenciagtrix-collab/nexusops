import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Loader2, Sparkles, Users2, FolderOpen, Paperclip,
  Database, Mic, ChevronDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatInputBar({
  input, onInputChange, onSend, thinking, disabled,
  isCouncilMode, agentCount, onToggleCouncil, onOpenAgentSwitcher, hasProject,
  onAttachFile, onInsertContext,
}) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const [showActions, setShowActions] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onAttachFile) onAttachFile(file);
    e.target.value = '';
  };

  const CONTEXT_ACTIONS = [
    { label: 'Inserir Contexto do Projeto', icon: FolderOpen, action: () => onInsertContext?.('project'), disabled: !hasProject },
    { label: 'Inserir Dados de Tarefas', icon: Database, action: () => onInsertContext?.('tasks'), disabled: !hasProject },
    { label: 'Anexar Arquivo', icon: Paperclip, action: () => fileRef.current?.click(), disabled: false },
  ];

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      {/* Quick action toolbar */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        {/* Agent selector */}
        <button
          onClick={onOpenAgentSwitcher}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Users2 className="w-3.5 h-3.5" /> Agente
        </button>

        {/* Council toggle */}
        <button
          onClick={onToggleCouncil}
          disabled={agentCount < 2}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors",
            isCouncilMode
              ? "border-violet-300 bg-violet-50 text-violet-700 font-medium"
              : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            agentCount < 2 && "opacity-40 cursor-not-allowed"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isCouncilMode ? 'Conselho Ativo' : 'Conselho'}
          {agentCount < 2 && <span className="text-[10px] opacity-70">(2+ agentes)</span>}
        </button>

        {/* Context actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowActions(s => !s)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors",
              showActions ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Paperclip className="w-3.5 h-3.5" />
            Ações
            <ChevronDown className={cn("w-3 h-3 transition-transform", showActions && "rotate-180")} />
          </button>

          {showActions && (
            <div className="absolute bottom-full mb-1.5 left-0 w-52 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
              {CONTEXT_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => { action.action(); setShowActions(false); }}
                    disabled={action.disabled}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Context active indicator */}
        {hasProject && (
          <div className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Contexto ativo
          </div>
        )}

        {/* Keyboard hint */}
        <div className="ml-auto text-[10px] text-muted-foreground hidden sm:flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono">Enter</kbd> enviar
          <span className="text-muted-foreground/50">·</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px] font-mono">⇧ Enter</kbd> nova linha
        </div>
      </div>

      {/* Input area */}
      <div className={cn(
        "flex items-end gap-2 rounded-xl border bg-background transition-all",
        disabled ? "opacity-50" : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
      )}>
        <Textarea
          ref={textareaRef}
          placeholder={
            disabled ? "Selecione um agente para começar..." :
            isCouncilMode ? "Faça uma pergunta ao conselho de especialistas..." :
            "Faça sua pergunta ao especialista..."
          }
          rows={2}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0 px-4 py-3 text-sm placeholder:text-muted-foreground"
          disabled={thinking || disabled}
        />
        <div className="p-2 flex items-center gap-1.5">
          <Button
            onClick={onSend}
            disabled={!input.trim() || thinking || disabled}
            size="icon"
            className={cn(
              "h-9 w-9 rounded-lg transition-all flex-shrink-0",
              isCouncilMode ? "bg-violet-600 hover:bg-violet-700" : "bg-primary hover:bg-primary/90"
            )}
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  );
}