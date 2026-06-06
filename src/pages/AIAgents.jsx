import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import AgentCard from '@/components/ai-agents/AgentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Plus, Search, Sparkles, MessageSquare, AlertTriangle,
  Brain, Users, Zap, BarChart2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HIERARCHY_LABELS = {
  global: { label: 'Global', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  organization: { label: 'Organização', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  project: { label: 'Projeto', color: 'text-green-600 bg-green-50 border-green-200' },
};

const SEVERITY_COLORS = {
  low: 'bg-blue-50 border-blue-200 text-blue-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  critical: 'bg-red-50 border-red-200 text-red-700',
};

export default function AIAgents() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('biblioteca');
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => base44.entities.AIAgent.list('-created_date', 100),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => base44.entities.AIAgentConversation.list('-last_message_at', 30),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['ai-alerts'],
    queryFn: () => base44.entities.AIAgentAlert.filter({ status: 'active' }, '-created_date', 30),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => base44.entities.Project.list('name', 100),
  });

  const deleteAgent = useMutation({
    mutationFn: (id) => base44.entities.AIAgent.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ai-agents'] }); toast.success('Agente removido'); },
  });

  const duplicateAgent = useMutation({
    mutationFn: async (agent) => {
      const { id, created_date, updated_date, ...data } = agent;
      return base44.entities.AIAgent.create({ ...data, name: `${data.name} (Cópia)`, conversation_count: 0 });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['ai-agents'] }); toast.success('Agente duplicado!'); },
  });

  const dismissAlert = useMutation({
    mutationFn: (id) => base44.entities.AIAgentAlert.update(id, { status: 'dismissed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-alerts'] }),
  });

  const filtered = agents.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.speciality?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'all' || a.hierarchy_level === filterLevel;
    return matchSearch && matchLevel;
  });

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const projectsLinked = [...new Set(agents.flatMap(a => a.project_ids || []))].length;

  const TABS = [
    { key: 'visao-geral', label: 'Visão Geral', icon: BarChart2 },
    { key: 'biblioteca', label: 'Biblioteca', icon: Bot, count: agents.length },
    { key: 'conversas', label: 'Conversas', icon: MessageSquare, count: conversations.length },
    { key: 'alertas', label: 'Alertas', icon: AlertTriangle, count: alerts.length },
  ];

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title=""
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/ai-agents/chat')}>
              <MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Nova Conversa</span>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/ai-agents/new')}>
              <Plus className="w-4 h-4" /> Novo Agente
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Central de Agentes IA</h1>
              <p className="text-sm text-muted-foreground">Especialistas virtuais integrados aos seus projetos</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-semibold">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* VISÃO GERAL */}
          {activeTab === 'visao-geral' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Agentes Ativos', value: activeAgents, icon: Bot, color: 'text-violet-600 bg-violet-50' },
                  { label: 'Conversas', value: conversations.length, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Projetos Atendidos', value: projectsLinked, icon: Users, color: 'text-green-600 bg-green-50' },
                  { label: 'Alertas Ativos', value: alerts.length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
                ].map(stat => (
                  <Card key={stat.label} className="p-4 flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold font-heading">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(HIERARCHY_LABELS).map(([level, config]) => {
                  const lvlAgents = agents.filter(a => a.hierarchy_level === level && a.status === 'active');
                  return (
                    <Card key={level} className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={cn("text-xs border", config.color)}>{config.label}</Badge>
                        <span className="text-2xl font-bold">{lvlAgents.length}</span>
                      </div>
                      <div className="space-y-2">
                        {lvlAgents.slice(0, 4).map(agent => (
                          <div key={agent.id} className="flex items-center gap-2 text-sm">
                            <span>{agent.avatar_emoji || '🤖'}</span>
                            <span className="truncate text-foreground">{agent.name}</span>
                          </div>
                        ))}
                        {lvlAgents.length === 0 && <p className="text-xs text-muted-foreground">Nenhum agente neste nível</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="w-full mt-3 text-xs"
                        onClick={() => { setActiveTab('biblioteca'); setFilterLevel(level); }}>
                        Ver todos
                      </Button>
                    </Card>
                  );
                })}
              </div>

              {conversations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Últimas Conversas</h3>
                  <div className="space-y-2">
                    {conversations.slice(0, 5).map(conv => {
                      const project = projects.find(p => p.id === conv.project_id);
                      return (
                        <Card key={conv.id} className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/ai-agents/chat/${conv.id}`)}>
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                            conv.mode === 'council' ? "bg-violet-100" : "bg-blue-100")}>
                            {conv.mode === 'council' ? <Sparkles className="w-4 h-4 text-violet-600" /> : <MessageSquare className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title || 'Conversa sem título'}</p>
                            <p className="text-xs text-muted-foreground">
                              {conv.mode === 'council' ? 'Conselho' : 'Chat'}
                              {project && ` · ${project.name}`}
                            </p>
                          </div>
                          {conv.last_message_at && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {format(parseISO(conv.last_message_at), "dd/MM", { locale: ptBR })}
                            </span>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BIBLIOTECA */}
          {activeTab === 'biblioteca' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar agentes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <div className="flex items-center gap-1.5">
                  {['all', 'global', 'organization', 'project'].map(level => (
                    <button key={level} onClick={() => setFilterLevel(level)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        filterLevel === level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}>
                      {level === 'all' ? 'Todos' : HIERARCHY_LABELS[level]?.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <Bot className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Nenhum agente encontrado</p>
                    <p className="text-sm text-muted-foreground">Crie seu primeiro agente especialista</p>
                  </div>
                  <Button onClick={() => navigate('/ai-agents/new')} className="gap-2">
                    <Plus className="w-4 h-4" /> Criar Agente
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(agent => (
                    <AgentCard key={agent.id} agent={agent}
                      onEdit={() => navigate(`/ai-agents/${agent.id}/edit`)}
                      onChat={() => navigate(`/ai-agents/chat?agent=${agent.id}`)}
                      onDuplicate={() => duplicateAgent.mutate(agent)}
                      onDelete={() => deleteAgent.mutate(agent.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONVERSAS */}
          {activeTab === 'conversas' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{conversations.length} conversa(s)</p>
                <Button size="sm" className="gap-1.5" onClick={() => navigate('/ai-agents/chat')}>
                  <Plus className="w-4 h-4" /> Nova Conversa
                </Button>
              </div>
              {conversations.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const project = projects.find(p => p.id === conv.project_id);
                  return (
                    <Card key={conv.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/ai-agents/chat/${conv.id}`)}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        conv.mode === 'council' ? "bg-violet-100" : "bg-blue-100")}>
                        {conv.mode === 'council' ? <Sparkles className="w-5 h-5 text-violet-600" /> : <MessageSquare className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{conv.title || 'Conversa sem título'}</p>
                        <p className="text-xs text-muted-foreground">
                          {conv.mode === 'council' ? '🏛️ Conselho de Especialistas' : '💬 Chat Individual'}
                          {project && ` · ${project.name}`}
                          {conv.message_count > 0 && ` · ${conv.message_count} msg`}
                        </p>
                      </div>
                      {conv.last_message_at && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {format(parseISO(conv.last_message_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* ALERTAS */}
          {activeTab === 'alertas' && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-16">
                  <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum alerta ativo</p>
                  <p className="text-xs text-muted-foreground mt-1">Ative o modo proativo nos agentes para monitorar projetos</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <Card key={alert.id} className={cn("p-4 border", SEVERITY_COLORS[alert.severity] || 'bg-muted border-border text-foreground')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold">{alert.title}</p>
                          <p className="text-xs mt-0.5 opacity-80">{alert.description}</p>
                          {alert.suggested_action && (
                            <p className="text-xs mt-1.5 font-medium">💡 {alert.suggested_action}</p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => dismissAlert.mutate(alert.id)} className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}