import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Send, Loader2, Plus, Bot, User, Sparkles, Brain,
  ChevronDown, MessageSquare, X, FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/lib/AuthContext';

// Utility: build full prompt for agent + project context
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
      prompt += `Tarefas: ${done}/${total} concluídas\n`;
      const overdue = projectContext.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');
      if (overdue.length) prompt += `Tarefas atrasadas: ${overdue.length}\n`;
      const unassigned = projectContext.tasks.filter(t => !t.assignee_ids?.length);
      if (unassigned.length) prompt += `Tarefas sem responsável: ${unassigned.length}\n`;
    }
    prompt += `---\n\n`;
  }

  if (memories?.length) {
    prompt += `--- MEMÓRIAS IMPORTANTES ---\n`;
    memories.slice(0, 10).forEach(m => { prompt += `[${m.memory_type}] ${m.content}\n`; });
    prompt += `---\n\n`;
  }

  if (history?.length) {
    prompt += `--- HISTÓRICO RECENTE ---\n`;
    history.slice(-6).forEach(msg => {
      prompt += `${msg.role === 'user' ? 'Usuário' : agent.name}: ${msg.content}\n`;
    });
    prompt += `---\n\n`;
  }

  prompt += `Pergunta atual: ${question}`;
  return prompt;
}

export default function AIAgentChat() {
  const { onMenuToggle } = useOutletContext();
  const navigate = useNavigate();
  const { id: conversationId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedAgentId = urlParams.get('agent');

  const [selectedAgentIds, setSelectedAgentIds] = useState(preSelectedAgentId ? [preSelectedAgentId] : []);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [input, setInput] = useState('');
  const [isCouncilMode, setIsCouncilMode] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId || null);
  const [councilProgress, setCouncilProgress] = useState([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(!preSelectedAgentId);

  const { data: agents = [] } = useQuery({
    queryKey: ['ai-agents-active'],
    queryFn: () => base44.entities.AIAgent.filter({ status: 'active' }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-mini'],
    queryFn: () => base44.entities.Project.list('name', 100),
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['ai-messages', currentConvId],
    queryFn: () => base44.entities.AIAgentMessage.filter({ conversation_id: currentConvId }, 'created_date', 100),
    enabled: !!currentConvId,
  });

  // Load project context (tasks, etc.) when project is selected
  const { data: projectTasks = [] } = useQuery({
    queryKey: ['tasks-context', selectedProjectId],
    queryFn: () => base44.entities.Task.filter({ project_id: selectedProjectId }, '-created_date', 50),
    enabled: !!selectedProjectId,
  });

  const { data: projectData } = useQuery({
    queryKey: ['project-context', selectedProjectId],
    queryFn: async () => {
      const [projectsResult] = await Promise.all([
        base44.entities.Project.filter({ id: selectedProjectId }),
      ]);
      return projectsResult[0];
    },
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, councilProgress]);

  const selectedAgents = agents.filter(a => selectedAgentIds.includes(a.id));
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectContext = selectedProjectId ? { project: projectData, tasks: projectTasks } : null;

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
    const msg = await base44.entities.AIAgentMessage.create({
      conversation_id: convId,
      agent_id: agentId || null,
      role,
      content,
      agent_name: agentName || null,
      agent_emoji: agentEmoji || null,
      agent_color: agentColor || null,
    });
    return msg;
  };

  const handleSend = async () => {
    if (!input.trim() || thinking || selectedAgentIds.length === 0) return;
    const question = input.trim();
    setInput('');
    setThinking(true);
    setCouncilProgress([]);

    const convId = await getOrCreateConversation();
    await saveMessage(convId, 'user', question, null, user?.full_name, '👤', '#6b7280');
    queryClient.invalidateQueries({ queryKey: ['ai-messages', convId] });

    if (isCouncilMode && selectedAgents.length > 1) {
      // Council mode: ask each agent separately then consolidate
      const agentResponses = [];
      for (const agent of selectedAgents) {
        setCouncilProgress(prev => [...prev, { agent, status: 'thinking' }]);
        const prompt = buildPrompt(agent, question, projectContext, agentMemories, messages);
        const res = await base44.integrations.Core.InvokeLLM({ prompt });
        const reply = typeof res === 'string' ? res : res?.response || 'Sem resposta';
        agentResponses.push({ agent, reply });
        await saveMessage(convId, 'assistant', reply, agent.id, agent.name, agent.avatar_emoji, agent.avatar_color);
        setCouncilProgress(prev => prev.map(p => p.agent.id === agent.id ? { ...p, status: 'done', reply } : p));
      }

      // Consolidate
      setCouncilProgress(prev => [...prev, { agent: { name: 'Síntese do Conselho', avatar_emoji: '🏛️', avatar_color: '#7c3aed' }, status: 'thinking' }]);
      const consolidatePrompt = `Você é um sintetizador de consultas estratégicas. 
Analise as seguintes respostas de especialistas para a pergunta: "${question}"

${agentResponses.map(ar => `[${ar.agent.name} - ${ar.agent.speciality}]: ${ar.reply}`).join('\n\n')}

Gere uma CONCLUSÃO CONSOLIDADA que:
1. Resuma os pontos de convergência
2. Aponte as divergências importantes
3. Forneça uma recomendação final clara e objetiva
4. Liste os próximos passos sugeridos

Seja direto e decisivo.`;

      const consolidated = await base44.integrations.Core.InvokeLLM({ prompt: consolidatePrompt, model: 'claude_sonnet_4_6' });
      const consolidatedText = typeof consolidated === 'string' ? consolidated : consolidated?.response || '';
      await saveMessage(convId, 'assistant', consolidatedText, null, 'Conclusão do Conselho', '🏛️', '#7c3aed');
      setCouncilProgress(prev => prev.map(p => p.agent.name === 'Síntese do Conselho' ? { ...p, status: 'done', reply: consolidatedText } : p));

    } else {
      // Single agent
      const agent = selectedAgents[0];
      const prompt = buildPrompt(agent, question, projectContext, agentMemories, messages);
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const reply = typeof res === 'string' ? res : res?.response || 'Sem resposta';
      await saveMessage(convId, 'assistant', reply, agent.id, agent.name, agent.avatar_emoji, agent.avatar_color);
    }

    // Update conversation stats
    await base44.entities.AIAgentConversation.update(convId, {
      message_count: messages.length + 2,
      last_message_at: new Date().toISOString(),
    }).catch(() => {});

    queryClient.invalidateQueries({ queryKey: ['ai-messages', convId] });
    queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    setThinking(false);
    setCouncilProgress([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const showSetup = !currentConvId && messages.length === 0;

  return (
    <>
      <TopBar
        onMenuToggle={onMenuToggle}
        title=""
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/ai-agents')} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Central IA
            </Button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Config Bar */}
        <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 flex-wrap">
          {/* Agent selector */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {selectedAgents.length === 0 ? (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
              ) : selectedAgents.slice(0, 3).map(a => (
                <div key={a.id}
                  className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-sm"
                  style={{ backgroundColor: a.avatar_color || '#6366f1' }}>
                  {a.avatar_emoji || '🤖'}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAgentPicker(s => !s)}
              className="text-sm font-medium text-foreground hover:text-primary flex items-center gap-1"
            >
              {selectedAgents.length === 0 ? 'Selecionar agente' : selectedAgents.map(a => a.name).join(', ')}
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Project context */}
          <button
            onClick={() => setShowProjectPicker(s => !s)}
            className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors",
              selectedProject ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {selectedProject ? selectedProject.name : 'Contexto: Nenhum projeto'}
          </button>

          {/* Council toggle */}
          <button
            onClick={() => setIsCouncilMode(s => !s)}
            disabled={selectedAgents.length < 2}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors",
              isCouncilMode ? "border-violet-300 bg-violet-50 text-violet-700" : "border-border text-muted-foreground hover:bg-muted",
              selectedAgents.length < 2 && "opacity-40 cursor-not-allowed"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Conselho {selectedAgents.length < 2 && '(selecione 2+ agentes)'}
          </button>
        </div>

        {/* Agent Picker Panel */}
        {showAgentPicker && (
          <div className="border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Agentes Disponíveis {isCouncilMode && '(multi-seleção para conselho)'}
              </p>
              <button onClick={() => setShowAgentPicker(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {agents.map(agent => {
                const isSelected = selectedAgentIds.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      if (isCouncilMode) {
                        setSelectedAgentIds(ids => isSelected ? ids.filter(i => i !== agent.id) : [...ids, agent.id]);
                      } else {
                        setSelectedAgentIds([agent.id]);
                        setShowAgentPicker(false);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors",
                      isSelected ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                    )}
                  >
                    <span>{agent.avatar_emoji}</span>
                    <span>{agent.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Picker Panel */}
        {showProjectPicker && (
          <div className="border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selecionar Projeto como Contexto</p>
              <button onClick={() => setShowProjectPicker(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedProjectId(''); setShowProjectPicker(false); }}
                className={cn("px-3 py-1.5 rounded-lg border text-sm", !selectedProjectId ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted")}
              >
                Nenhum projeto
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProjectId(p.id); setShowProjectPicker(false); }}
                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm", selectedProjectId === p.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted")}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {showSetup && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading">
                  {selectedAgents.length > 0
                    ? isCouncilMode ? '🏛️ Conselho de Especialistas' : `Conversar com ${selectedAgents[0]?.name}`
                    : 'Selecione um agente acima'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAgents.length > 0
                    ? selectedProject
                      ? `Contexto ativo: ${selectedProject.name}`
                      : 'Faça sua pergunta abaixo'
                    : 'Escolha um ou mais especialistas para iniciar'}
                </p>
              </div>
              {isCouncilMode && selectedAgents.length >= 2 && (
                <div className="flex gap-3">
                  {selectedAgents.map(a => (
                    <div key={a.id} className="text-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-1"
                        style={{ backgroundColor: a.avatar_color }}>
                        {a.avatar_emoji}
                      </div>
                      <p className="text-xs font-medium">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{a.speciality}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5 shadow-sm"
                    style={{ backgroundColor: msg.agent_color || '#6366f1' }}>
                    {msg.agent_emoji || '🤖'}
                  </div>
                )}
                <div className={cn("max-w-[80%] space-y-1", isUser && "items-end flex flex-col")}>
                  {!isUser && msg.agent_name && (
                    <p className="text-[11px] font-semibold text-muted-foreground px-1">{msg.agent_name}</p>
                  )}
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm",
                    isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"
                  )}>
                    {isUser ? (
                      <p className="leading-relaxed">{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                        components={{
                          p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="my-0.5">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">
                    {msg.created_date && format(parseISO(msg.created_date), "HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Council progress */}
          {councilProgress.map((item, i) => (
            <div key={i} className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5 shadow-sm"
                style={{ backgroundColor: item.agent.avatar_color || '#7c3aed' }}>
                {item.agent.avatar_emoji || '🤖'}
              </div>
              <div className="max-w-[80%] space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground px-1">{item.agent.name}</p>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border text-sm">
                  {item.status === 'thinking' ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analisando...</span>
                    </div>
                  ) : (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {item.reply || ''}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}

          {thinking && councilProgress.length === 0 && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm"
                style={{ backgroundColor: selectedAgents[0]?.avatar_color || '#6366f1' }}>
                {selectedAgents[0]?.avatar_emoji || '🤖'}
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analisando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border bg-card">
          {selectedAgentIds.length === 0 && (
            <p className="text-xs text-center text-amber-600 mb-2">Selecione pelo menos um agente para iniciar</p>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder={isCouncilMode ? "Faça uma pergunta ao conselho de especialistas..." : "Faça sua pergunta ao agente..."}
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none pr-4 text-sm"
                disabled={thinking || selectedAgentIds.length === 0}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || thinking || selectedAgentIds.length === 0}
              size="icon"
              className="h-[72px] w-10 flex-shrink-0"
            >
              {thinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </>
  );
}