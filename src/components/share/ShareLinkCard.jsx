import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Globe, Copy, Check, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
  BarChart3, List, ArrowRight, GitBranch, Calendar, Users, FileText, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const VISIBILITY_OPTIONS = [
  { key: 'show_dashboard',  label: 'Dashboard',        icon: BarChart3 },
  { key: 'show_progress',   label: 'Progresso',         icon: BarChart3 },
  { key: 'show_tasks',      label: 'Tarefas',           icon: List },
  { key: 'show_next_steps', label: 'Próximos Passos',   icon: ArrowRight },
  { key: 'show_timeline',   label: 'Timeline',          icon: GitBranch },
  { key: 'show_due_dates',  label: 'Datas',             icon: Calendar },
  { key: 'show_assignees',  label: 'Responsáveis',      icon: Users },
  { key: 'show_files',      label: 'Arquivos',          icon: FileText },
];

function getPortalUrl(token) {
  return `${window.location.origin}/share/${token}`;
}

export default function ShareLinkCard({ share, onRevoke, onReactivate, onDelete, onUpdate }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localSettings, setLocalSettings] = useState(share.visibility_settings || {});
  const [savingSettings, setSavingSettings] = useState(false);
  const url = getPortalUrl(share.token);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVis = (key) => {
    const next = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(next);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await onUpdate({ visibility_settings: localSettings });
    setSavingSettings(false);
    toast.success('Configurações salvas');
    setExpanded(false);
  };

  const isActive = share.is_active;

  return (
    <div className={cn(
      "rounded-xl border transition-all overflow-hidden",
      isActive ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-70"
    )}>
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-foreground">{share.label || 'Link do Cliente'}</p>
              <Badge variant={isActive ? 'success' : 'secondary'} className="text-[10px]">
                {isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {share.client_name && (
              <p className="text-xs text-muted-foreground mt-0.5">Para: <span className="font-medium">{share.client_name}</span>
                {share.client_email && ` · ${share.client_email}`}
              </p>
            )}
          </div>

          {/* Access count badge */}
          <div className="flex-shrink-0 text-right">
            <p className="text-lg font-bold text-foreground">{share.access_count || 0}</p>
            <p className="text-[10px] text-muted-foreground">acesso(s)</p>
          </div>
        </div>

        {/* URL row */}
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 mb-3">
          <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{url}</span>
          <button onClick={copy} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {share.last_accessed && (
              <span>Último acesso: {format(parseISO(share.last_accessed), "dd/MM/yyyy", { locale: ptBR })}</span>
            )}
            {share.expires_at && (
              <span>Expira: {format(parseISO(share.expires_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                onClick={() => setExpanded(e => !e)}
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Fechar' : 'Configurar'}
              </Button>
            )}
            {isActive ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={onRevoke}
              >
                Desativar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                onClick={onReactivate}
              >
                <RotateCcw className="w-3 h-3" /> Reativar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable visibility settings */}
      {expanded && isActive && (
        <div className="border-t border-border bg-muted/40 px-4 py-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            O que este link permite visualizar?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {VISIBILITY_OPTIONS.map(({ key, label, icon: Icon }) => {
              const on = !!localSettings[key];
              return (
                <button
                  key={key}
                  onClick={() => handleToggleVis(key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors text-left",
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground bg-card hover:bg-muted"
                  )}
                >
                  {on ? <Eye className="w-3 h-3 flex-shrink-0" /> : <EyeOff className="w-3 h-3 flex-shrink-0" />}
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setExpanded(false)} className="h-8 text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveSettings} disabled={savingSettings} className="h-8 text-xs">
              {savingSettings ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}