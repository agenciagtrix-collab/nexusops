import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Loader2, Sparkles, Users2, FolderOpen, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatInputBar({
  input, onInputChange, onSend, thinking, disabled,
  isCouncilMode, agentCount, onToggleCouncil, onOpenAgentSwitcher, hasProject,
}) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      {/* Quick action toolbar */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <button
          onClick={onOpenAgentSwitcher}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Users2 className="w-3.5 h-3.5" /> Agente
        </button>

        <button
          onClick={onToggleCouncil}
          disabled={agentCount < 2}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors",
            isCouncilMode
              ? "border-violet-300 bg-violet-50 text-violet-700"
              : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            agentCount < 2 && "opacity-40 cursor-not-allowed"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isCouncilMode ? 'Conselho Ativo' : 'Conselho'}
        </button>

        {hasProject && (
          <div className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Contexto ativo
          </div>
        )}

        <div className="ml-auto text-[10px] text-muted-foreground hidden sm:block">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px]">Enter</kbd> enviar · <kbd className="px-1.5 py-0.5 bg-muted rounded text-[9px]">Shift+Enter</kbd> nova linha
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
            "Faça sua pergunta..."
          }
          rows={2}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0 px-4 py-3 text-sm placeholder:text-muted-foreground"
          disabled={thinking || disabled}
        />
        <div className="p-2">
          <Button
            onClick={onSend}
            disabled={!input.trim() || thinking || disabled}
            size="icon"
            className={cn(
              "h-9 w-9 rounded-lg transition-all",
              isCouncilMode ? "bg-violet-600 hover:bg-violet-700" : "bg-primary hover:bg-primary/90"
            )}
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}