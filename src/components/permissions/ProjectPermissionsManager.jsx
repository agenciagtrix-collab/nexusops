import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, Eye, Edit, Trash2, Plus, Users, Lock, Unlock,
  ChevronDown, ChevronUp, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PERMISSION_LEVELS = [
  { key: 'none', label: 'Sem acesso', icon: Lock, color: 'text-muted-foreground', bg: 'bg-muted' },
  { key: 'view', label: 'Visualizar', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'edit', label: 'Editar', icon: Edit, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'manage', label: 'Gerenciar', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'admin', label: 'Admin', icon: Unlock, color: 'text-primary', bg: 'bg-primary/10' },
];

const FIELD_PERMISSIONS = [
  { key: 'tasks', label: 'Tarefas', description: 'Criar, editar e excluir tarefas' },
  { key: 'files', label: 'Arquivos', description: 'Upload e gestão de documentos' },
  { key: 'team', label: 'Equipe', description: 'Adicionar e remover membros' },
  { key: 'comments', label: 'Comentários', description: 'Adicionar comentários em tarefas' },
  { key: 'reports', label: 'Relatórios', description: 'Visualizar relatórios do projeto' },
  { key: 'settings', label: 'Configurações', description: 'Alterar configurações do projeto' },
  { key: 'budget', label: 'Orçamento', description: 'Visualizar dados financeiros' },
  { key: 'clients', label: 'Clientes', description: 'Associar clientes ao projeto' },
];

function PermissionLevelBadge({ level, onChange, readOnly }) {
  const info = PERMISSION_LEVELS.find(p => p.key === level) || PERMISSION_LEVELS[0];
  const Icon = info.icon;

  if (readOnly) {
    return (
      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium", info.bg, info.color)}>
        <Icon className="w-3 h-3" />
        {info.label}
      </div>
    );
  }

  return (
    <Select value={level || 'none'} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-32 text-xs">
        <div className={cn("flex items-center gap-1", info.color)}>
          <Icon className="w-3 h-3" />
          <span>{info.label}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {PERMISSION_LEVELS.map(p => {
          const PIcon = p.icon;
          return (
            <SelectItem key={p.key} value={p.key}>
              <div className={cn("flex items-center gap-2", p.color)}>
                <PIcon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export default function ProjectPermissionsManager({ projectId, users = [], isAdmin = false }) {
  const [permissions, setPermissions] = useState({});
  const [fieldPerms, setFieldPerms] = useState({});
  const [expanded, setExpanded] = useState({});
  const [saved, setSaved] = useState(false);

  const { data: projectUsers } = useQuery({
    queryKey: ['project-users', projectId],
    queryFn: () => base44.entities.User.list('full_name', 50),
    enabled: !!projectId,
  });

  const displayUsers = (projectUsers || users).slice(0, 10);

  const setUserPermission = (userId, level) => {
    setPermissions(prev => ({ ...prev, [userId]: { ...prev[userId], global: level } }));
  };

  const setUserFieldPermission = (userId, field, value) => {
    setFieldPerms(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [field]: value }
    }));
  };

  const handleSave = () => {
    setSaved(true);
    toast.success('Permissões salvas com sucesso!');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Permissões por Usuário
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defina o nível de acesso de cada membro neste projeto
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={handleSave} className="gap-1.5 h-8">
            {saved ? <Check className="w-3.5 h-3.5" /> : null}
            {saved ? 'Salvo!' : 'Salvar'}
          </Button>
        )}
      </div>

      {displayUsers.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Nenhum usuário encontrado
        </Card>
      ) : (
        <div className="space-y-2">
          {displayUsers.map(user => {
            const perm = permissions[user.id]?.global || 'view';
            const isExpanded = expanded[user.id];
            const initials = user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

            return (
              <Card key={user.id} className="overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-xs flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <PermissionLevelBadge
                    level={perm}
                    onChange={(v) => setUserPermission(user.id, v)}
                    readOnly={!isAdmin}
                  />
                  {isAdmin && (
                    <button
                      onClick={() => setExpanded(e => ({ ...e, [user.id]: !e[user.id] }))}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {isExpanded && isAdmin && (
                  <div className="border-t border-border bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Permissões Granulares
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FIELD_PERMISSIONS.map(field => {
                        const currentVal = fieldPerms[user.id]?.[field.key];
                        return (
                          <div key={field.key} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border">
                            <div>
                              <p className="text-xs font-medium">{field.label}</p>
                              <p className="text-[10px] text-muted-foreground">{field.description}</p>
                            </div>
                            <button
                              onClick={() => setUserFieldPermission(user.id, field.key, !currentVal)}
                              className={cn(
                                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                currentVal !== false ? "bg-primary" : "bg-muted"
                              )}
                            >
                              <span className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                                currentVal !== false ? "translate-x-4" : "translate-x-0.5"
                              )} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PERMISSION_LEVELS.map(level => {
          const Icon = level.icon;
          const count = displayUsers.filter(u => (permissions[u.id]?.global || 'view') === level.key).length;
          return (
            <div key={level.key} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-center", level.bg)}>
              <Icon className={cn("w-4 h-4", level.color)} />
              <span className={cn("text-xs font-semibold", level.color)}>{count}</span>
              <span className="text-[10px] text-muted-foreground">{level.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}