import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot, Plus, MessageSquare, Sparkles, AlertTriangle, Brain,
  X, Link2, CheckCircle, XCircle, Zap, MemoryStick,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AddMemoryModal from '@/components/ai-agents/AddMemoryModal';

const SEVERITY_CONFIG = {
  low:      { cls: 'bg-blue-50 border-blue-200 text-blue-700',    dot: 'bg-blue-400' },
  medium:   { cls: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400' },
  high:     { cls: 'bg-orange-50 border-orange-200 text-orange-700', dot: 'bg-orange-400' },
  critical: { cls: 'bg-red-50 border-red-200 text-red-700',       dot: 'bg-red-400' },
};

export default function ProjectAITab({ project, tasks = [], users = [] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [activeSection, setActiveSection] = useState('agents');

  const { data: allAgents = [] } = useQuery({
    queryKey: ['ai-agents-active'],
    queryFn: () => base44.entities.AIAgent.filter({ status: 'active' }),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['ai-alerts-project', project.id],
    queryFn: () => base44.entities.AIAgentAlert.filter({ project_id: project.id, status: 'active' }, '-created_date', 20),
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['ai-memories-project', project.id],
    queryFn: () => base44.entities.AIAgentMemory.filter({ project_id: project.id }, '-created_date', 20),
  });

  const updateProject = useMutation({
    mutationFn: (data) => base44.entities.Project.update(project.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', project.id] }),
  });

  const dismissAlert = useMutation({
    mutationFn: (id) => base44.entities.AIAgentAlert.update(id, { status: 'dismissed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-alerts-project', project.id] }),
  });

  const deleteMemory = useMutation({
    mutationFn: (id) => base44.entities.AIAgentMemory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-memories-project', project.id] }),
  });

  const linkedAgentIds = project.agent_ids || [];
  const linkedAgents = allAgents.filter(a => linkedAgentIds.includes(a.id));
  const availableToLink = allAgents.filter(a => !linkedAgentIds.includes(a.id));

  const linkAgent = (agentId) => {
    const newIds = [...linkedAgentIds, agentId];
    updateProject.mutate({ agent_ids: newIds });
    toast.success('Agente vinculado ao projeto!');
  };

  const unlinkAgent = (agentId) => {
    const newIds = linkedAgentIds.filter(id => id !== agentId);
    updateProject.mutate({ agent_ids: newIds });
    toast.success('Agente desvinculado');
  };

  const analyzeProject = async () => {
    const proactiveAgents = linkedAgents.filter(a => a.is_proactive);
    if (proactiveAgents.length === 0) {
      toast.error('Nenhum agente proativo vinculado. Ative o modo proativo em algum agente.');
      return;
    }

    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
    const unassigned = tasks.filter(t => !t.assignee_ids?.length);

    const prompt = `Você é ${proactiveAgents[0].name}, especialista em ${proactiveAgents[0].speciality}.

Analise o seguinte projeto e identifique riscos e alertas importantes:

Projeto: ${project.name}
Status: ${project.status}
Progresso: ${doneTasks}/${tasks.length} tarefas concluídas
Tarefas atrasadas: ${overdue.length}
Tarefas sem responsável: ${unassigned.length}
Data de entrega: ${project.due_date || 'Não definida'}

Gere uma análise estruturada identificando riscos. Responda em JSON com o seguinte formato:
{
  "alerts": [
    {
      "alert_type": "overdue_tasks|risk_detected|bottleneck|deadline_risk|unassigned_tasks",
      "severity": "low|medium|high|critical",
      "title": "...",
      "description": "...",
      "suggested_action": "..."
    }
  ]
}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          alerts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                alert_type: { type: 'string' },
                severity: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                suggested_action: { type: 'string' },
              }
            }
          }
        }
      }
    });

    const alertsData = res?.alerts || [];
    await Promise.all(alertsData.map(alert =>
      base44.entities.AIAgentAlert.create({
        ...alert,
        agent_id: proactiveAgents[0].id,
        project_id: project.id,
        status: 'active',
      })
    ));

    queryClient.invalidateQueries({ queryKey: ['ai-alerts-project', project.id] });
    queryClient.invalidateQueries({ queryKey: ['ai-alerts'] });
    toast.success(`Análise concluída! ${alertsData.length} alertas gerados.`);
  };

  const SECTIONS = [
    { key: 'agents', label: 'Agentes Vinculados', count: linkedAgents.length, icon: Bot },
    { key: 'alerts', label: 'Alertas', count: alerts.length, icon: AlertTriangle },
    { key: 'memory', label: 'Memória', count: memories.length, icon: Brain },
  ];

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">Agentes IA</p>
            <p className="text-xs text-muted-foreground">{linkedAgents.length} agente(s) neste projeto</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={analyzeProject}>
            <Zap className="w-3.5 h-3.5" /> Analisar Riscos
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={linkedAgents.length === 0}
            onClick={() => navigate(`/ai-agents/chat?agent=${linkedAgents[0]?.id}`)}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Iniciar Conversa
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-border">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                activeSection === s.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <Icon className="w-3.5 h-3.5" />
              {s.label}
              {s.count > 0 && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{s.count}</span>}
            </button>
          );
        })}
      </div>

      {/* AGENTS */}
      {activeSection === 'agents' && (
        <div className="space-y-4">
          {linkedAgents.length === 0 && !showLinkPanel ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <Bot className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">Nenhum agente vinculado</p>
              <p className="text-xs text-muted-foreground">Vincule especialistas para obter insights sobre este projeto</p>
              <Button size="sm" className="gap-2" onClick={() => setShowLinkPanel(true)}>
                <Plus className="w-4 h-4" /> Vincular Agente
              </Button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                {linkedAgents.map(agent => (
                  <div key={agent.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: agent.avatar_color || '#6366f1' }}>
                      {agent.avatar_emoji || '🤖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.speciality}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2"
                          onClick={() => navigate(`/ai-agents/chat?agent=${agent.id}`)}>
                          <MessageSquare className="w-3 h-3" /> Conversar
                        </Button>
                        {agent.is_proactive && (
                          <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Proativo</Badge>
                        )}
                      </div>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                      onClick={() => unlinkAgent(agent.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 border-dashed w-full"
                onClick={() => setShowLinkPanel(s => !s)}>
                <Plus className="w-4 h-4" /> Vincular mais agentes
              </Button>
            </>
          )}

          {showLinkPanel && (
            <Card className="p-4 border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Agentes disponíveis</p>
                <button onClick={() => setShowLinkPanel(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {availableToLink.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Todos os agentes já estão vinculados.</p>
              ) : (
                <div className="space-y-2">
                  {availableToLink.map(agent => (
                    <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{ backgroundColor: agent.avatar_color || '#6366f1' }}>
                        {agent.avatar_emoji || '🤖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{agent.speciality}</p>
                      </div>
                      <Button size="sm" className="h-7 text-xs gap-1 px-3" onClick={() => linkAgent(agent.id)}>
                        <Link2 className="w-3 h-3" /> Vincular
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs"
                onClick={() => navigate('/ai-agents/new')}>
                <Plus className="w-3.5 h-3.5" /> Criar novo agente
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ALERTS */}
      {activeSection === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium">Nenhum alerta ativo</p>
              <p className="text-xs text-muted-foreground">Use "Analisar Riscos" para que os agentes proativos monitorem este projeto</p>
            </div>
          ) : (
            alerts.map(alert => {
              const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
              return (
                <div key={alert.id} className={cn("p-4 rounded-xl border", sev.cls)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", sev.dot)} />
                      <div>
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="text-xs mt-0.5 opacity-80">{alert.description}</p>
                        {alert.suggested_action && (
                          <p className="text-xs mt-1.5 font-medium">💡 {alert.suggested_action}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => dismissAlert.mutate(alert.id)} className="opacity-60 hover:opacity-100 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MEMORY */}
      {activeSection === 'memory' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowMemoryModal(true)}>
              <Plus className="w-3.5 h-3.5" /> Adicionar Memória
            </Button>
          </div>
          {memories.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium">Nenhuma memória registrada</p>
              <p className="text-xs text-muted-foreground">Registre decisões, marcos e contextos importantes</p>
            </div>
          ) : (
            memories.map(mem => (
              <div key={mem.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card group">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  mem.importance === 'high' ? 'bg-red-400' : mem.importance === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className="text-[10px] bg-muted text-muted-foreground border-0">{mem.memory_type}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {mem.created_date && format(parseISO(mem.created_date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{mem.content}</p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all flex-shrink-0"
                  onClick={() => deleteMemory.mutate(mem.id)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {showMemoryModal && (
        <AddMemoryModal
          projectId={project.id}
          agents={linkedAgents}
          onClose={() => setShowMemoryModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['ai-memories-project', project.id] });
            setShowMemoryModal(false);
          }}
        />
      )}
    </div>
  );
}