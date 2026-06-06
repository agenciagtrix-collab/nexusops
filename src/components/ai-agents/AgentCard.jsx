import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, Edit2, Trash2, Copy, MoreVertical, Star,
  CheckCircle, XCircle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const HIERARCHY_CONFIG = {
  global:       { label: 'Global',       cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  organization: { label: 'Organização',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  project:      { label: 'Projeto',      cls: 'bg-green-50 text-green-700 border-green-200' },
};

const CATEGORY_CONFIG = {
  strategy:   { label: 'Estratégico', cls: 'bg-violet-50 text-violet-700' },
  legal:      { label: 'Jurídico',    cls: 'bg-red-50 text-red-700' },
  financial:  { label: 'Financeiro',  cls: 'bg-emerald-50 text-emerald-700' },
  marketing:  { label: 'Marketing',   cls: 'bg-pink-50 text-pink-700' },
  pmo:        { label: 'PMO',         cls: 'bg-blue-50 text-blue-700' },
  sales:      { label: 'Vendas',      cls: 'bg-orange-50 text-orange-700' },
  technical:  { label: 'Técnico',     cls: 'bg-cyan-50 text-cyan-700' },
  hr:         { label: 'RH',          cls: 'bg-yellow-50 text-yellow-700' },
  operations: { label: 'Operações',   cls: 'bg-gray-50 text-gray-700' },
  design:     { label: 'Design',      cls: 'bg-indigo-50 text-indigo-700' },
  custom:     { label: 'Personalizado', cls: 'bg-muted text-muted-foreground' },
};

export default function AgentCard({ agent, onEdit, onChat, onDuplicate, onDelete }) {
  const hierarchy = HIERARCHY_CONFIG[agent.hierarchy_level] || HIERARCHY_CONFIG.organization;
  const category = CATEGORY_CONFIG[agent.category] || CATEGORY_CONFIG.custom;
  const isActive = agent.status === 'active';

  return (
    <Card className={cn(
      "p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group",
      !isActive && "opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-medium flex-shrink-0 shadow-sm"
            style={{ backgroundColor: agent.avatar_color || '#6366f1' }}
          >
            {agent.avatar_emoji || '🤖'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground leading-tight">{agent.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{agent.speciality}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isActive
            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
            : <XCircle className="w-4 h-4 text-muted-foreground" />
          }
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit}><Edit2 className="w-3.5 h-3.5 mr-2" />Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="w-3.5 h-3.5 mr-2" />Duplicar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                <Trash2 className="w-3.5 h-3.5 mr-2" />Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge className={cn("text-[10px] border", hierarchy.cls)}>{hierarchy.label}</Badge>
        <Badge className={cn("text-[10px] border-0", category.cls)}>{category.label}</Badge>
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{agent.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />
          {agent.conversation_count || 0} conversas
        </span>
        {(agent.project_ids?.length || 0) > 0 && (
          <span>{agent.project_ids.length} projeto(s)</span>
        )}
        {agent.is_proactive && (
          <span className="flex items-center gap-1 text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Proativo
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs" onClick={onChat} disabled={!isActive}>
          <MessageSquare className="w-3.5 h-3.5" /> Conversar
        </Button>
        <Button variant="outline" size="sm" className="h-8 px-3" onClick={onEdit}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}