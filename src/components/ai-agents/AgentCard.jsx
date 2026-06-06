import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, Edit2, Trash2, Copy, MoreVertical,
  CheckCircle2, XCircle, Zap, Brain,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const HIERARCHY_CONFIG = {
  global:       { label: 'Global',      cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  organization: { label: 'Organização', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  project:      { label: 'Projeto',     cls: 'bg-green-50 text-green-700 border-green-200' },
};

const CATEGORY_CONFIG = {
  strategy:   { label: 'Estratégia',    cls: 'bg-violet-100 text-violet-700',  accent: '#8b5cf6' },
  legal:      { label: 'Jurídico',      cls: 'bg-red-100 text-red-700',        accent: '#ef4444' },
  financial:  { label: 'Financeiro',    cls: 'bg-emerald-100 text-emerald-700',accent: '#10b981' },
  marketing:  { label: 'Marketing',     cls: 'bg-pink-100 text-pink-700',      accent: '#ec4899' },
  pmo:        { label: 'PMO',           cls: 'bg-blue-100 text-blue-700',      accent: '#3b82f6' },
  sales:      { label: 'Vendas',        cls: 'bg-orange-100 text-orange-700',  accent: '#f97316' },
  technical:  { label: 'Técnico',       cls: 'bg-cyan-100 text-cyan-700',      accent: '#06b6d4' },
  hr:         { label: 'RH',            cls: 'bg-yellow-100 text-yellow-700',  accent: '#eab308' },
  operations: { label: 'Operações',     cls: 'bg-gray-100 text-gray-700',      accent: '#6b7280' },
  design:     { label: 'Design',        cls: 'bg-indigo-100 text-indigo-700',  accent: '#6366f1' },
  custom:     { label: 'Personalizado', cls: 'bg-muted text-muted-foreground', accent: '#6b7280' },
};

export default function AgentCard({ agent, onEdit, onChat, onDuplicate, onDelete }) {
  const hierarchy = HIERARCHY_CONFIG[agent.hierarchy_level] || HIERARCHY_CONFIG.organization;
  const category = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.custom;
  const isActive = agent.status === 'active';

  return (
    <Card className={cn(
      "relative overflow-hidden flex flex-col gap-0 p-0 hover:shadow-lg transition-all duration-200 group border-border",
      !isActive && "opacity-60"
    )}>
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: agent.avatar_color || category.accent || '#6366f1' }} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                style={{ backgroundColor: agent.avatar_color || '#6366f1' }}
              >
                {agent.avatar_emoji || '🤖'}
              </div>
              {/* Online status dot */}
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                isActive ? "bg-emerald-500" : "bg-muted"
              )} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">{agent.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{agent.speciality}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-muted">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}><Edit2 className="w-3.5 h-3.5 mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}><Copy className="w-3.5 h-3.5 mr-2" />Duplicar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category + Hierarchy badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={cn("text-[10px] border-0 px-2", category.cls)}>{category.label}</Badge>
          <Badge className={cn("text-[10px] border", hierarchy.cls)}>{hierarchy.label}</Badge>
          {agent.is_proactive && (
            <Badge className="text-[10px] border-0 bg-amber-100 text-amber-700 flex items-center gap-1 px-2">
              <Zap className="w-2.5 h-2.5" />Proativo
            </Badge>
          )}
        </div>

        {/* Description */}
        {agent.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{agent.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {agent.conversation_count || 0} conversa{agent.conversation_count !== 1 ? 's' : ''}
          </span>
          {(agent.project_ids?.length || 0) > 0 && (
            <span className="flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" />
              {agent.project_ids.length} projeto{agent.project_ids.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Button
            size="sm"
            className="flex-1 gap-1.5 h-8 text-xs"
            onClick={onChat}
            disabled={!isActive}
            style={isActive ? { backgroundColor: agent.avatar_color || undefined } : undefined}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Conversar
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}