import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import {
  Settings, Shield, Bell, Palette, Plus, Trash2, Save,
  Globe, CheckSquare, Tag, AlertCircle, Users, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_STATUSES = [
  { key: 'todo', name: 'A Fazer', color: '#94a3b8' },
  { key: 'in_progress', name: 'Em Andamento', color: '#6366f1' },
  { key: 'review', name: 'Em Revisão', color: '#f59e0b' },
  { key: 'done', name: 'Concluído', color: '#22c55e' },
  { key: 'cancelled', name: 'Cancelado', color: '#ef4444' },
];

const DEFAULT_PRIORITIES = [
  { key: 'low', name: 'Baixa', color: '#22c55e' },
  { key: 'medium', name: 'Média', color: '#f59e0b' },
  { key: 'high', name: 'Alta', color: '#ef4444' },
  { key: 'urgent', name: 'Urgente', color: '#dc2626' },
  { key: 'critical', name: 'Crítica', color: '#7f1d1d' },
];

const PRESET_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#ec4899','#94a3b8','#0ea5e9'];

function ColorDot({ color, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("w-6 h-6 rounded-full border-2 transition-all", selected ? "border-foreground scale-110" : "border-transparent")}
      style={{ backgroundColor: color }}
    />
  );
}

function StatusEditor({ statuses, setStatuses }) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const add = () => {
    if (!newName.trim()) return;
    setStatuses(prev => [...prev, { key: newName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now(), name: newName.trim(), color: newColor }]);
    setNewName('');
  };

  const remove = (key) => setStatuses(prev => prev.filter(s => s.key !== key));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {statuses.map(s => (
          <div key={s.key} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm flex-1 font-medium">{s.name}</span>
            <Badge variant="secondary" className="text-[10px]">{s.key}</Badge>
            <button onClick={() => remove(s.key)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <div className="flex gap-1">
          {PRESET_COLORS.map(c => (
            <ColorDot key={c} color={c} selected={newColor === c} onClick={() => setNewColor(c)} />
          ))}
        </div>
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do status" className="flex-1 h-8 text-sm" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button size="sm" variant="outline" onClick={add} className="h-8 gap-1"><Plus className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

const tabs = [
  { key: 'general', label: 'Geral', icon: Settings },
  { key: 'statuses', label: 'Status', icon: CheckSquare },
  { key: 'priorities', label: 'Prioridades', icon: Tag },
  { key: 'security', label: 'Segurança', icon: Shield },
  { key: 'notifications', label: 'Notificações', icon: Bell },
];

const notificationItems = [
  { key: 'new_task', label: 'Nova tarefa criada no projeto' },
  { key: 'task_assigned', label: 'Tarefa atribuída a mim' },
  { key: 'task_overdue', label: 'Tarefa vencida detectada' },
  { key: 'project_updated', label: 'Projeto atualizado' },
  { key: 'comment_added', label: 'Novo comentário em tarefa' },
  { key: 'member_added', label: 'Novo membro adicionado' },
];

export default function SettingsPage() {
  const { onMenuToggle } = useOutletContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [priorities, setPriorities] = useState(DEFAULT_PRIORITIES);
  const [notifications, setNotifications] = useState(
    notificationItems.reduce((acc, n) => ({ ...acc, [n.key]: true }), {})
  );
  const [general, setGeneral] = useState({
    company_name: '',
    timezone: 'America/Sao_Paulo',
    date_format: 'DD/MM/YYYY',
    week_start: 'monday',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  if (!isAdmin) {
    return (
      <>
        <TopBar onMenuToggle={onMenuToggle} title="Configurações" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-8 text-center max-w-sm">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-heading font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-sm text-muted-foreground">Apenas administradores podem acessar as configurações.</p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar onMenuToggle={onMenuToggle} title="Configurações" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:w-48 shrink-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full text-left",
                      activeTab === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* General */}
              {activeTab === 'general' && (
                <Card className="p-6 space-y-5">
                  <h3 className="font-heading font-semibold">Configurações Gerais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Empresa / Workspace</Label>
                      <Input value={general.company_name} onChange={e => setGeneral(g => ({ ...g, company_name: e.target.value }))} placeholder="Minha Empresa" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Fuso Horário</Label>
                      <Input value={general.timezone} onChange={e => setGeneral(g => ({ ...g, timezone: e.target.value }))} placeholder="America/Sao_Paulo" />
                    </div>
                    <div className="space-y-2">
                      <Label>Formato de Data</Label>
                      <div className="flex gap-2">
                        {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(f => (
                          <button key={f} onClick={() => setGeneral(g => ({ ...g, date_format: f }))}
                            className={cn("px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                              general.date_format === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                            )}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Início da Semana</Label>
                      <div className="flex gap-2">
                        {[{ key: 'sunday', label: 'Domingo' }, { key: 'monday', label: 'Segunda' }].map(d => (
                          <button key={d.key} onClick={() => setGeneral(g => ({ ...g, week_start: d.key }))}
                            className={cn("px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                              general.week_start === d.key ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                            )}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success('Configurações salvas!')} className="gap-1.5">
                      <Save className="w-4 h-4" /> Salvar
                    </Button>
                  </div>
                </Card>
              )}

              {/* Statuses */}
              {activeTab === 'statuses' && (
                <Card className="p-6 space-y-4">
                  <div>
                    <h3 className="font-heading font-semibold">Status de Tarefas</h3>
                    <p className="text-sm text-muted-foreground mt-1">Configure os status padrão disponíveis em toda a plataforma. Cada projeto pode sobrescrever com status próprios.</p>
                  </div>
                  <StatusEditor statuses={statuses} setStatuses={setStatuses} />
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success('Status salvos!')} className="gap-1.5">
                      <Save className="w-4 h-4" /> Salvar Status
                    </Button>
                  </div>
                </Card>
              )}

              {/* Priorities */}
              {activeTab === 'priorities' && (
                <Card className="p-6 space-y-4">
                  <div>
                    <h3 className="font-heading font-semibold">Prioridades</h3>
                    <p className="text-sm text-muted-foreground mt-1">Configure os níveis de prioridade disponíveis na plataforma.</p>
                  </div>
                  <div className="space-y-2">
                    {priorities.map(p => (
                      <div key={p.key} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-sm flex-1 font-medium">{p.name}</span>
                        <button onClick={() => setPriorities(prev => prev.filter(x => x.key !== p.key))} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">Alterar prioridades pode afetar tarefas existentes. Certifique-se de migrar os dados antes de remover prioridades em uso.</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success('Prioridades salvas!')} className="gap-1.5">
                      <Save className="w-4 h-4" /> Salvar
                    </Button>
                  </div>
                </Card>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <Card className="p-6 space-y-4">
                    <h3 className="font-heading font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Níveis de Acesso</h3>
                    <div className="space-y-3">
                      {[
                        { role: 'super_admin', label: 'Super Administrador', desc: 'Acesso total à plataforma, incluindo configurações globais e gerenciamento de admins.', color: 'bg-purple-100 text-purple-700' },
                        { role: 'admin', label: 'Administrador', desc: 'Pode criar projetos, equipes, clientes e gerenciar usuários comuns.', color: 'bg-primary/10 text-primary' },
                        { role: 'user', label: 'Usuário', desc: 'Pode visualizar projetos autorizados, atualizar tarefas atribuídas e inserir comentários.', color: 'bg-slate-100 text-slate-600' },
                      ].map(r => (
                        <div key={r.role} className="flex items-start gap-3 p-4 rounded-xl border border-border">
                          <Badge variant="secondary" className={cn("text-xs shrink-0 mt-0.5", r.color)}>{r.label}</Badge>
                          <p className="text-sm text-muted-foreground">{r.desc}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-6 space-y-3">
                    <h3 className="font-heading font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Política de Segurança</h3>
                    {[
                      { label: 'Exigir autenticação em 2 fatores', desc: 'Todos os usuários devem configurar 2FA para acessar a plataforma.' },
                      { label: 'Sessão máxima de 8 horas', desc: 'Usuários são deslogados automaticamente após 8 horas de inatividade.' },
                      { label: 'Log de acesso ativado', desc: 'Todas as ações são registradas para auditoria.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <button
                          className="relative inline-flex h-5 w-9 items-center rounded-full bg-primary"
                          onClick={() => toast.info('Em breve')}
                        >
                          <span className="inline-block h-4 w-4 translate-x-4 transform rounded-full bg-white shadow" />
                        </button>
                      </div>
                    ))}
                  </Card>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <Card className="p-6 space-y-4">
                  <h3 className="font-heading font-semibold">Notificações da Plataforma</h3>
                  <p className="text-sm text-muted-foreground">Configure quais eventos geram notificações para os usuários.</p>
                  <div className="space-y-3">
                    {notificationItems.map(item => (
                      <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                        <span className="text-sm">{item.label}</span>
                        <button
                          onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${notifications[item.key] ? 'bg-primary' : 'bg-muted'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifications[item.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success('Notificações salvas!')} className="gap-1.5">
                      <Save className="w-4 h-4" /> Salvar
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}