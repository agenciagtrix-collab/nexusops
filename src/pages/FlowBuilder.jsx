import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Save, Play, Share2, Settings, Wand2, ChevronLeft, Globe,
  BarChart2, Link2, Layers,
} from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import FlowBuilderCanvas from '@/components/flows/FlowBuilderCanvas';
import FlowBlockPalette from '@/components/flows/FlowBlockPalette';
import FlowNodeInspector from '@/components/flows/FlowNodeInspector';
import FlowSimulator from '@/components/flows/FlowSimulator';
import FlowPublishDialog from '@/components/flows/FlowPublishDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'editor', label: 'Editor', icon: Layers },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'integrations', label: 'Integrações', icon: Link2 },
  { id: 'results', label: 'Resultados', icon: BarChart2 },
  { id: 'publish', label: 'Publicar', icon: Globe },
];

export default function FlowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('editor');
  const [flow, setFlow] = useState({
    name: 'Novo Fluxo',
    description: '',
    type: 'journey',
    status: 'draft',
    nodes: [],
    edges: [],
    startNode: null,
    settings: { showProgress: true, allowGoBack: true, language: 'pt-BR' },
    integrations: {},
  });

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const { data: existingFlow } = useQuery({
    queryKey: ['flow', id],
    queryFn: () => (id ? base44.entities.Flow.get(id) : null),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingFlow) setFlow(existingFlow);
  }, [existingFlow]);

  const selectedNode = flow.nodes?.find(n => n.id === selectedNodeId);

  const handleNodeUpdate = useCallback((updatedNode) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === updatedNode.id ? updatedNode : n),
    }));
  }, []);

  const handleNodesChange = useCallback((nodes) => {
    setFlow(prev => ({ ...prev, nodes }));
  }, []);

  const handleEdgesChange = useCallback((edges) => {
    setFlow(prev => ({ ...prev, edges }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (id) {
        await base44.entities.Flow.update(id, flow);
      } else {
        const created = await base44.entities.Flow.create(flow);
        navigate(`/flows/${created.id}/edit`, { replace: true });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await base44.functions.invoke('generateFlowWithAI', {
        prompt: aiPrompt,
        flowType: flow.type,
      });
      if (response?.data?.nodes && response?.data?.edges) {
        setFlow(prev => ({ ...prev, nodes: response.data.nodes, edges: response.data.edges }));
        setShowAIGenerator(false);
        setAiPrompt('');
      } else {
        setAiError('Resposta inválida da IA. Tente novamente.');
      }
    } catch (err) {
      setAiError(`Erro: ${err.message || 'Não foi possível gerar o fluxo.'}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-white overflow-hidden">
      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-white/10 bg-[#0f1117] shrink-0 z-20">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/flows')}
            className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5 px-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Fluxos</span>
          </Button>

          <div className="w-px h-5 bg-white/10" />

          {isEditingName ? (
            <input
              autoFocus
              value={flow.name}
              onChange={e => setFlow(p => ({ ...p, name: e.target.value }))}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
              className="bg-white/10 border border-white/20 rounded-md px-2 py-1 text-sm font-semibold text-white focus:outline-none focus:border-primary w-56"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-semibold text-white hover:text-primary transition-colors truncate max-w-xs"
              title="Clique para renomear"
            >
              {flow.name}
            </button>
          )}

          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {flow.status === 'draft' ? 'Rascunho' : 'Publicado'}
          </span>
        </div>

        {/* Center — tabs */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAIGenerator(true)}
            className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
          >
            <Wand2 className="w-4 h-4" />
            <span className="hidden sm:inline">Gerar IA</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSimulator(true)}
            className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
          >
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Testar</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs h-8"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>

          <Button
            size="sm"
            onClick={() => setShowPublish(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs h-8"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Publicar</span>
          </Button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'editor' && (
          <>
            {/* Block Palette */}
            <FlowBlockPalette />

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden">
              <ReactFlowProvider>
                <FlowBuilderCanvas
                  nodes={flow.nodes || []}
                  edges={flow.edges || []}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  selectedNodeId={selectedNodeId}
                  onNodeSelect={setSelectedNodeId}
                />
              </ReactFlowProvider>
            </div>

            {/* Node Inspector */}
            {selectedNode && (
              <FlowNodeInspector
                node={selectedNode}
                onUpdate={handleNodeUpdate}
                onClose={() => setSelectedNodeId(null)}
                onDelete={() => {
                  setFlow(prev => ({
                    ...prev,
                    nodes: prev.nodes.filter(n => n.id !== selectedNodeId),
                    edges: prev.edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId),
                  }));
                  setSelectedNodeId(null);
                }}
              />
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <FlowSettingsTab flow={flow} onChange={setFlow} />
        )}

        {activeTab === 'integrations' && (
          <FlowIntegrationsTab flow={flow} onChange={setFlow} />
        )}

        {activeTab === 'results' && (
          <FlowResultsTab flowId={id} />
        )}

        {activeTab === 'publish' && (
          <FlowPublishTab flow={flow} flowId={id} />
        )}
      </div>

      {/* AI Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-lg bg-[#1a1d27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              Gerar Fluxo com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ex: Crie um fluxo de briefing para agência com perguntas sobre serviço, orçamento e timeline"
              rows={5}
              disabled={aiLoading}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary resize-none"
            />
            {aiError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {aiError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowAIGenerator(false)} disabled={aiLoading}
                className="text-white/60 hover:text-white hover:bg-white/10">
                Cancelar
              </Button>
              <Button onClick={handleGenerateWithAI} disabled={aiLoading || !aiPrompt.trim()}
                className="bg-primary hover:bg-primary/90 gap-2">
                {aiLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Gerando...</>
                ) : (
                  <><Wand2 className="w-4 h-4" />Gerar</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showSimulator && (
        <FlowSimulator nodes={flow.nodes} edges={flow.edges} onClose={() => setShowSimulator(false)} />
      )}

      {showPublish && id && (
        <FlowPublishDialog flow={flow} open={showPublish} onOpenChange={setShowPublish} />
      )}
    </div>
  );
}

// ── Inline sub-tabs ──

function FlowSettingsTab({ flow, onChange }) {
  const update = (key, val) => onChange(prev => ({ ...prev, settings: { ...prev.settings, [key]: val } }));
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0f1117]">
      <div className="max-w-xl mx-auto space-y-6">
        <h2 className="text-lg font-semibold text-white">Configurações do Fluxo</h2>
        <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-5">
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Nome</label>
            <input value={flow.name} onChange={e => onChange(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-white/60 block mb-1.5">Descrição</label>
            <textarea value={flow.description || ''} onChange={e => onChange(p => ({ ...p, description: e.target.value }))}
              rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">Barra de progresso</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={flow.settings?.showProgress ?? true} onChange={e => update('showProgress', e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">Permitir voltar</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={flow.settings?.allowGoBack ?? true} onChange={e => update('allowGoBack', e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowIntegrationsTab({ flow, onChange }) {
  const update = (key, val) => onChange(prev => ({ ...prev, integrations: { ...prev.integrations, [key]: val } }));
  const items = [
    { key: 'createClient', label: 'Criar Cliente', desc: 'Ao finalizar, cria um novo cliente no sistema' },
    { key: 'createProject', label: 'Criar Projeto', desc: 'Ao finalizar, cria um projeto automaticamente' },
    { key: 'createTasks', label: 'Criar Tarefas', desc: 'Gera tarefas a partir das respostas' },
    { key: 'triggerAutomation', label: 'Disparar Automação', desc: 'Aciona uma automação ao concluir' },
    { key: 'triggerAgent', label: 'Acionar Agente IA', desc: 'Envia respostas para análise por agente' },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0f1117]">
      <div className="max-w-xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-white">Integrações</h2>
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
            <div>
              <div className="text-sm font-medium text-white">{item.label}</div>
              <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input type="checkbox" checked={flow.integrations?.[item.key] ?? false} onChange={e => update(item.key, e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowResultsTab({ flowId }) {
  const { data: responses = [] } = useQuery({
    queryKey: ['flow-responses', flowId],
    queryFn: () => flowId ? base44.entities.FlowResponse.filter({ flow_id: flowId }) : [],
    enabled: !!flowId,
  });
  const completed = responses.filter(r => r.status === 'completed').length;
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0f1117]">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-white">Resultados</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: responses.length },
            { label: 'Completos', value: completed },
            { label: 'Taxa', value: responses.length ? `${Math.round(completed / responses.length * 100)}%` : '0%' },
          ].map(m => (
            <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <div className="text-xs text-white/50 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
        {!flowId && <p className="text-white/40 text-sm">Salve o fluxo para ver resultados.</p>}
      </div>
    </div>
  );
}

function FlowPublishTab({ flow, flowId }) {
  const { data: publishes = [] } = useQuery({
    queryKey: ['flow-publishes', flowId],
    queryFn: () => flowId ? base44.entities.FlowPublish.filter({ flow_id: flowId }) : [],
    enabled: !!flowId,
  });
  const pub = publishes[0];
  const link = pub ? `${window.location.origin}/flow/${pub.link_token}` : null;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0f1117]">
      <div className="max-w-xl mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-white">Publicação</h2>
        {pub ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-sm text-emerald-400 font-medium">Publicado</span>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Link público</label>
              <div className="flex gap-2">
                <input readOnly value={link} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none" />
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(link)}
                  className="text-white/60 hover:text-white hover:bg-white/10">Copiar</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-sm text-white/50">
              {flowId ? 'Este fluxo ainda não foi publicado. Use o botão "Publicar" no topo.' : 'Salve o fluxo primeiro para publicar.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}