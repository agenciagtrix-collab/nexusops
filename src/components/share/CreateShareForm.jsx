import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Eye, EyeOff, Link2, Loader2, BarChart3, List, ArrowRight,
  GitBranch, Calendar, Users, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEFAULT_VISIBILITY = {
  show_progress: true,
  show_tasks: true,
  show_assignees: false,
  show_due_dates: true,
  show_files: false,
  show_timeline: true,
  show_next_steps: true,
  show_dashboard: true,
};

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

export default function CreateShareForm({ projectId, onCreated }) {
  const [form, setForm] = useState({
    label: '',
    client_name: '',
    client_email: '',
    expires_at: '',
    visibility_settings: { ...DEFAULT_VISIBILITY },
  });
  const [loading, setLoading] = useState(false);

  const toggleVis = (key) => {
    setForm(f => ({
      ...f,
      visibility_settings: { ...f.visibility_settings, [key]: !f.visibility_settings[key] },
    }));
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload = {
        project_id: projectId,
        label: form.label || 'Link do Cliente',
        client_name: form.client_name,
        client_email: form.client_email,
        visibility_settings: form.visibility_settings,
      };
      if (form.expires_at) payload.expires_at = new Date(form.expires_at).toISOString();

      const res = await base44.functions.invoke('generateShareToken', payload);
      const token = res.data?.token;
      if (token) {
        navigator.clipboard.writeText(getPortalUrl(token));
        toast.success('Link criado e copiado para a área de transferência!');
      }
      onCreated();
    } catch (e) {
      toast.error('Erro ao gerar link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-xs mb-1 block text-muted-foreground">Rótulo do link</Label>
          <Input
            placeholder="Ex: Acesso — João Silva"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block text-muted-foreground">Nome do cliente</Label>
          <Input
            placeholder="Nome do contato"
            value={form.client_name}
            onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block text-muted-foreground">Email do cliente</Label>
          <Input
            placeholder="email@cliente.com"
            type="email"
            value={form.client_email}
            onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs mb-1 block text-muted-foreground">Expiração (opcional)</Label>
          <Input
            type="date"
            value={form.expires_at}
            onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
          />
        </div>
      </div>

      {/* Visibility toggles */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Seções visíveis no portal
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VISIBILITY_OPTIONS.map(({ key, label, icon: Icon }) => {
            const on = form.visibility_settings[key];
            return (
              <button
                key={key}
                onClick={() => toggleVis(key)}
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
      </div>

      <Button className="w-full gap-2" onClick={handleCreate} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
        Gerar e Copiar Link
      </Button>
    </div>
  );
}