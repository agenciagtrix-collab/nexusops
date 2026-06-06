import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import ChatAgentHeader from '@/components/ai-agents/ChatAgentHeader';
import ChatProjectPanel from '@/components/ai-agents/ChatProjectPanel';
import ChatMessageBubble from '@/components/ai-agents/ChatMessageBubble';
import ChatInputBar from '@/components/ai-agents/ChatInputBar';
import AgentSwitcher from '@/components/ai-agents/AgentSwitcher';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PanelRight, PanelRightClose, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function buildPrompt(agent, question, projectContext, memories, history) {
  const toneMap = {
    formal: 'formal e profissional', friendly: 'amigável e acessível',
    technical: 'técnico e preciso', direct: 'direto e objetivo', consultative: 'consultivo e estratégico'
  };
  let prompt = '';
  if (agent.prompt_base) prompt += `${agent.prompt_base}\n\n`;
  prompt += `Seu nome é "${agent.name}". Você é especialista em ${agent.speciality}.\n`;
  prompt += `Tom de comunicação: ${toneMap[agent.communication_tone] || 'consultivo'}.\n\n`;
  if (agent.objective) prompt += `OBJETIVO: ${agent.objective}\n\n`;
  if (agent.prompt_behavior) prompt += `COMO RESPONDER: ${agent.prompt_behavior}\n\n`;
  if (agent.prompt_limitations) prompt += `TÓPICOS QUE NÃO DEVE ABORDAR: ${agent.prompt_limitations}\n\n`;
  if (agent.prompt_rules) prompt += `REGRAS OBRIGATÓRIAS: ${agent.prompt_rules}\n\n`;
  if (projectContext) {
    prompt += `--- CONTEXTO DO PROJETO ---\n`;
    prompt += `Projeto: ${projectContext.project?.name || 'N/A'}\n`;
    if (projectContext.project?.description) prompt += `Descrição: ${projectContext.project.description}\n`;
    if (projectContext.project?.status) prompt += `Status: ${projectContext.project.status}\n`;
    if (projectContext.project?.due_date) prompt += `Entrega: ${projectContext.project.due_date}\n`;
    if (projectContext.tasks?.length) {
      const done = projectContext.tasks.filter(t => t.status === 'done').length;
      const total = projectContext.tasks.length;
      const overdue = projectContext.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
      const inProgress = projectContext.tasks.filter(t => t.status === 'in_progress');
      prompt += `Tarefas: ${done}/${total} concluídas, ${inProgress.length} em andamento\n`;
      if (overdue.length) prompt += `Tarefas atrasadas: ${overdue.length} (${overdue.map(t => t.title).join(', ')})\n`;
      const unassigned = projectContext.tasks.filter(t => !t.assignee_ids?.length);
      if (unassigned.length) prompt += `Sem responsável: ${unassigned.length}\n`;
    }
    if (projectContext.memories?.length) {
      prompt += `\nMemórias do projeto:\n`;
      projectContext.memories.forEach(m => { prompt += `[${m.memory_type}] ${m.content}\n`; });
    }
    prompt += `---\n\n`;
  }
  if (memories?.length) {
    prompt += `--- MEMÓRIAS DO AGENTE ---\n`;
    memories.slice(0, 10).forEach(m => { prompt += `[${m.memory_type}] ${m.content}\n`; });
    prompt += `---\n\n`;
  }
  if (history?.length) {
    prompt += `--- HISTÓRICO RECENTE ---\n`;
    history.slice(-8).forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Usuário' : agent.name}: ${msg.content}\n`;
    });
    prompt += `---\n\n`;
  }
  prompt += `Pergunta atual: ${question}`;
  return prompt;
}

const QUICK_SUGGESTIONS = [
  { label: 'Analisar Projeto', prompt: 'Faça uma análise completa do estado atual deste projeto, identificando pontos fortes, riscos e oportunidades de melhoria.' },
  { label: 'Identificar Riscos', prompt: 'Identifique todos os riscos potenciais deste projeto, classifique por severidade e sugira ações mitigadoras para cada um.' },
  { label: 'Próximos Passos', prompt: 'Com base no contexto atual do projeto, quais são os 5 próximos passos mais importantes que a equipe deve executar?' },
  { label: 'Gargalos', prompt: 'Analise o fluxo de trabalho atual e identifique os principais gargalos que estão impactando a entrega do projeto.' },
  { label: 'Plano de Ação', prompt: 'Crie um plano de ação detalhado para colocar este projeto de volta nos trilhos, com tarefas, responsáveis e prazos sugeridos.' },
  { label: 'Resumo Executivo', prompt: 'Gere um resumo executivo deste projeto para apresentar à diretoria, incluindo status, progresso, riscos e projeção de entrega.' },
];

export default function AIAgentChat() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const { id: conversationId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const bottomRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedAgentId = urlParams.get('agent');

  const [selectedAgentIds, setSelectedAgentIds] = useState(preSelectedAgentId ? [preSelectedAgentId] : []);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [input, setInput] = useState('');
  const [isCouncilMode, setIsCouncilMode] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId || null);
  const [councilProgress, setCouncilProgress] = useState([]);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [showAgentSwitcher, setShowAgentSwitcher] = useState(false);
  const [showMobileContext, setShowMobileContext] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ['ai-agents-active'],
    queryFn: () => base44.entities.AIAgent.filter({ status: 'active' }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => base44.entities.Project.list('name', 100),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['ai-messages', currentConvId],
    queryFn: () => base44.entities.AIAgentMessage.filter({ conversation_id: currentConvId }, 'created_date', 100),
    enabled: !!currentConvId,
    refetchInterval: thinking ? 1500 : false,
  });

  const { data: projectTasks = [] } = useQuery({
    queryKey: ['tasks-context', selectedProjectId],
    queryFn: () => base44.entities.Task.filter({ project_id: selectedProjectId }, '-created_date', 100),
    enabled: !!selectedProjectId,
  });

  const { data: projectData } = useQuery({
    queryKey: ['project-context', selectedProjectId],
    queryFn: () => base44.entities.Project.filter({ id: selectedProjectId }).then(r => r[0]),
    enabled: !!selectedProjectId,
  });

  const { data: projectMemories = [] } = useQuery({
    queryKey: ['memories-project', selectedProjectId],
    queryFn: () => base44.entities.AIAgentMemory.filter({ project_id: selectedProjectId }, '-created_date', 20),
    enabled: !!selectedProjectId,
  });

  const { data: agentMemories = [] } = useQuery({
    queryKey: ['agent-memories', selectedAgentIds[0], selectedProjectId],
    queryFn: () => base44.entities.AIAgentMemory.filter({
      agent_id: selectedAgentIds[0],
      ...(selectedProjectId ? { project_id: selectedProjectId } : {}),
    }),
    enabled: !!selectedAgentIds[0],
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['ai-alerts-chat', selectedProjectId],
    queryFn: () => base44.entities.AIAgentAlert.filter({ project_id: selectedProjectId, status: 'active' }, '-created_date', 10),
    enabled: !!selectedProjectId,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, councilProgress, thinking]);

  const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectContext = selectedProjectId ? { project: projectData, tasks: projectTasks, memories: projectMemories } : null;

  const getOrCreateConversation = async () => {
    if (currentConvId) return currentConvId;
    const agent = selectedAgents[0];
    const conv = await base44.entities.AIAgentConversation.create({
      title: `Conversa com ${agent?.name || 'Agente'}`,
      agent_ids: selectedAgentIds,
      project_id: selectedProjectId || null,
      user_id: user?.id,
      mode: isCouncilMode ? 'council' : 'single',
      status: 'active',
      message_count: 0,
      last_message_at: new Date().toISOString(),
    });
    setCurrentConvId(conv.id);
    return conv.id;
  };

  const saveMessage = async (convId, role, content, agentId, agentName, agentEmoji, agentColor) => {
    return base44.entities.AIAgentMessage.create({
      conversation_id: convId, agent_id: agentId || null, role, content,
      agent_name: agentName || null, agent_emoji: agentEmoji || null, agent_color: agentColor || null,
    });
  };

  const handleSend = async (overrideInput) => {
    const question = (overrideInput || input).trim();
    if (!question || thinking || selectedAgentIds.length === 0) return;
    setInput('');
    setThinking(true);
    setCouncilProgress([]);

    const convId = await getOrCreateConversation();
    await saveMessage(convId, 'user', question, null, user?.full_name || 'Você', '👤', '#6b7280');
    queryClient.invalidateQueries({ queryKey: ['ai-messages', convId] });

    if (isCouncilMode && selectedAgents.length > 1) {
      const agentResponses = [];
      for (const agent of selectedAgents) {
        setCouncilProgress(prev => {
          const existing = prev.find(p => p.agent.id === agent.id);
          if (existing) return prev.map(p => p.agent.id === agent.id ? { ...p, status: 'thinking' } : p);
          return [...prev, { agent, status: 'thinking' }];
        });
        const prompt = buildPrompt(agent, question, projectContext, agentMemories, messages);
        const res = await base44.integrations.Core.InvokeLLM({ prompt });
        const reply = typeof res === 'string' ? res : res?.response || 'Sem resposta';
        agentResponses.push({ agent, reply });
        await saveMessage(convId, 'assistant', reply, agent.id, agent.name, agent.avatar_emoji, agent.avatar_color);
        setCouncilProgress(prev => prev.map(p => p.agent.id === agent.id ? { ...p, status: 'done', reply } : p));
      }

      setCouncilProgress(prev => [...prev, { agent: { name: 'Parecer Consolidado do Conselho', avatar_emoji: '🏛️', avatar_color: '#7c3aed', id: 'council' }, status: 'thinking' }]);
      const consolidatePrompt = `Você é um sintetizador de consultas estratégicas executivas.
Analise as seguintes respostas de especialistas para a pergunta: "${question}"

${agentResponses.map(ar => `### ${ar.agent.name} (${ar.agent.speciality}):\n${ar.reply}`).join('\n\n')}

Gere um PARECER CONSOLIDADO estruturado com:
## Síntese
[Pontos de convergência entre os especialistas]

## Divergências
[Onde os especialistas discordaram e por quê]

## Recomendação Final
[Decisão clara e objetiva]

## Riscos Identificados
[Lista de riscos]

## Próximos Passos
[Lista numerada de ações concretas]

Seja executivo, direto e decisivo.`;

      const consolidated = await base44.integrations.Core.InvokeLLM({ prompt: consolidatePrompt, model: 'claude_sonnet_4_6' });
      const consolidatedText = typeof consolidated === 'string' ? consolidated : consolidated?.response || '';
      await saveMessage(convId, 'assistant', consolidatedText, null, 'Parecer Consolidado', '🏛️', '#7c3aed');
      setCouncilProgress(prev => prev.map(p => p.agent.id === 'council' ? { ...p, status: 'done', reply: consolidatedText } : p));
    } else {
      const agent = selectedAgents[0];
      const prompt = buildPrompt(agent, question, projectContext, agentMemories, messages);
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const reply = typeof res === 'string' ? res : res?.response || 'Sem resposta';
      await saveMessage(convId, 'assistant', reply, agent.id, agent.name, agent.avatar_emoji, agent.avatar_color);
    }

    await base44.entities.AIAgentConversation.update(convId, {
      message_count: messages.length + 2,
      last_message_at: new Date().toISOString(),
    }).catch(() => {});

    queryClient.invalidateQueries({ queryKey: ['ai-messages', convId] });
    queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    setThinking(false);
    setCouncilProgress([]);
  };

  const primaryAgent = selectedAgents[0];
  const hasMessages = messages.length > 0;

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title=""
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ai-agents')} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Central IA
            </Button>
            <Button
              variant="ghost" size="sm"
              className={cn("gap-1.5", showContextPanel ? "text-primary bg-primary/5" : "text-muted-foreground")}
              onClick={() => setShowContextPanel(s => !s)}
            >
              {showContextPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
              <span className="hidden sm:inline">Contexto</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* AGENT SWITCHER SIDEBAR */}
        {showAgentSwitcher && (
          <AgentSwitcher
            agents={agents}
            selectedIds={selectedAgentIds}
            isCouncilMode={isCouncilMode}
            onSelect={(id) => {
              if (isCouncilMode) {
                setSelectedAgentIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
              } else {
                setSelectedAgentIds([id]);
                setShowAgentSwitcher(false);
              }
            }}
            onToggleCouncil={() => setIsCouncilMode(s => !s)}
            onClose={() => setShowAgentSwitcher(false)}
          />
        )}

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Agent Header */}
          <ChatAgentHeader
            agent={primaryAgent}
            agents={selectedAgents}
            isCouncilMode={isCouncilMode}
            project={selectedProject}
            hasMemory={agentMemories.length > 0}
            contextCount={[
              !!selectedProjectId && 'Projeto',
              projectTasks.length > 0 && `${projectTasks.length} Tarefas`,
              projectMemories.length > 0 && `${projectMemories.length} Memórias`,
            ].filter(Boolean)}
            onSwitchAgent={() => setShowAgentSwitcher(s => !s)}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-background">
            {!hasMessages && councilProgress.length === 0 && !thinking ? (
              /* Welcome / Setup State */
              <div className="h-full flex flex-col items-center justify-center px-6 py-12">
                {!primaryAgent ? (
                  <div className="text-center space-y-5 max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto shadow-lg">
                      <Users2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Selecione um Especialista</h2>
                      <p className="text-sm text-muted-foreground mt-1">Clique em "Trocar Agente" para escolher com quem conversar</p>
                    </div>
                    <Button onClick={() => setShowAgentSwitcher(true)} className="gap-2">
                      <Users2 className="w-4 h-4" /> Escolher Agente
                    </Button>
                  </div>
                ) : (
                  <div className="w-full max-w-xl space-y-6">
                    {/* Agent intro card */}
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg border-4 border-background"
                        style={{ backgroundColor: primaryAgent.avatar_color || '#6366f1' }}>
                        {primaryAgent.avatar_emoji || '🤖'}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{primaryAgent.name}</h2>
                        <p className="text-sm text-muted-foreground">{primaryAgent.speciality}</p>
                        {primaryAgent.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{primaryAgent.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Quick suggestions */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 text-center">Sugestões Rápidas</p>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_SUGGESTIONS.map(s => (
                          <button
                            key={s.label}
                            onClick={() => handleSend(s.prompt)}
                            className="text-left px-3 py-2.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
                          >
                            <p className="text-xs font-medium text-foreground group-hover:text-primary">{s.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{s.prompt.substring(0, 50)}...</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-5 space-y-5 max-w-3xl mx-auto">
                {messages.map(msg => (
                  <ChatMessageBubble key={msg.id} message={msg} user={user} />
                ))}

                {/* Council progress */}
                {councilProgress.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm border-2 border-background"
                      style={{ backgroundColor: item.agent.avatar_color || '#7c3aed' }}>
                      {item.agent.avatar_emoji || '🤖'}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{item.agent.name}</span>
                        {item.status === 'thinking' && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" /> Analisando...
                          </span>
                        )}
                      </div>
                      {item.status === 'done' ? (
                        <div className={cn("px-4 py-3 rounded-2xl rounded-tl-sm text-sm border",
                          item.agent.id === 'council'
                            ? "bg-violet-50 border-violet-200"
                            : "bg-card border-border"
                        )}>
                          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            components={{
                              p: ({ children }) => <p className="my-1 leading-relaxed text-sm">{children}</p>,
                              ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                              ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                              li: ({ children }) => <li className="my-0.5">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground border-b pb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                            }}>
                            {item.reply}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Single agent thinking */}
                {thinking && councilProgress.length === 0 && (
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: primaryAgent?.avatar_color || '#6366f1' }}>
                      {primaryAgent?.avatar_emoji || '🤖'}
                    </div>
                    <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-card border border-border">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input Bar */}
          <ChatInputBar
            input={input}
            onInputChange={setInput}
            onSend={() => handleSend()}
            thinking={thinking}
            disabled={selectedAgentIds.length === 0}
            isCouncilMode={isCouncilMode}
            agentCount={selectedAgents.length}
            onToggleCouncil={() => setIsCouncilMode(s => !s)}
            onOpenAgentSwitcher={() => setShowAgentSwitcher(true)}
            hasProject={!!selectedProjectId}
            onInsertContext={(type) => {
              if (type === 'project' && projectData) {
                setInput(prev => prev + `\n[Contexto: Projeto "${projectData.name}" - Status: ${projectData.status || 'N/A'}, Progresso: ${projectTasks.length > 0 ? Math.round((projectTasks.filter(t=>t.status==='done').length/projectTasks.length)*100) : 0}%]`);
              } else if (type === 'tasks' && projectTasks.length > 0) {
                const done = projectTasks.filter(t=>t.status==='done').length;
                const overdue = projectTasks.filter(t=>t.due_date && new Date(t.due_date)<new Date() && t.status!=='done').length;
                setInput(prev => prev + `\n[Tarefas: ${projectTasks.length} total, ${done} concluídas, ${overdue} atrasadas]`);
              }
            }}
          />
        </div>

        {/* CONTEXT PANEL — Desktop */}
        {showContextPanel && (
          <div className="hidden md:flex">
            <ChatProjectPanel
              project={projectData}
              tasks={projectTasks}
              memories={projectMemories}
              alerts={alerts}
              agents={selectedAgents}
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onClose={() => setShowContextPanel(false)}
            />
          </div>
        )}

        {/* CONTEXT PANEL — Mobile Drawer */}
        {showContextPanel && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowContextPanel(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] flex">
              <ChatProjectPanel
                project={projectData}
                tasks={projectTasks}
                memories={projectMemories}
                alerts={alerts}
                agents={selectedAgents}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                onClose={() => setShowContextPanel(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}