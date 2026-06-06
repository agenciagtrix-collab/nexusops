import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Save, Play, Share2, Settings, Plus, Wand2, FileText,
} from 'lucide-react';
import { ReactFlowProvider } from 'reactflow';
import ReactFlowCanvas from '@/components/flows/ReactFlowCanvas';
import BlockPaletteV2 from '@/components/flows/BlockPaletteV2';
import DynamicPropertiesPanel from '@/components/flows/DynamicPropertiesPanel';
import FlowSimulator from '@/components/flows/FlowSimulator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

export default function FlowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [flow, setFlow] = useState({
    name: 'Novo Fluxo',
    description: '',
    type: 'journey',
    status: 'draft',
    nodes: [],
    edges: [],
    startNode: null,
  });

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFromNodeId, setConnectFromNodeId] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const blockEmojis = {
    start: '▶️', text: '📝', question: '❓', email: '✉️', phone: '📱',
    number: '🔢', date: '📅', single_choice: '⭕', multiple_choice: '☑️',
    condition: '❓', split: '🔀', ai_ask: '💬', create_project: '📋',
    create_client: '👤', send_email: '✉️', show_result: '🎉', end: '⏹️',
  };

  const { data: existingFlow } = useQuery({
    queryKey: ['flow', id],
    queryFn: () => (id ? base44.entities.Flow.get(id) : null),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingFlow) {
      setFlow(existingFlow);
    }
  }, [existingFlow]);

  const handleAddBlock = (e) => {
    const blockType = e.dataTransfer.getData('blockType');
    const blockLabel = e.dataTransfer.getData('blockLabel');

    if (!blockType) return;

    e.preventDefault();

    // Get canvas position relative to canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const newNode = {
      id: `node-${Date.now()}`,
      type: blockType,
      label: blockLabel,
      position: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      data: {},
    };

    setFlow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  const handleNodesChange = (changes) => {
    setFlow(prev => {
      const updatedNodes = [...prev.nodes];
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          const nodeIndex = updatedNodes.findIndex(n => n.id === change.id);
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: change.position,
            };
          }
        }
      });
      return { ...prev, nodes: updatedNodes };
    });
  };

  const handleEdgesChange = (changes) => {
    setFlow(prev => {
      let updatedEdges = [...(prev.edges || [])];
      changes.forEach(change => {
        if (change.type === 'add') {
          updatedEdges.push(change.item);
        } else if (change.type === 'remove') {
          updatedEdges = updatedEdges.filter(e => e.id !== change.id);
        }
      });
      return { ...prev, edges: updatedEdges };
    });
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== selectedNodeId),
      edges: prev.edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId),
    }));
    setSelectedNodeId(null);
  };

  const handleEdgeCreate = (sourceId, targetId) => {
    setFlow(prev => {
      const edgeExists = prev.edges?.some(e => e.source === sourceId && e.target === targetId);
      if (edgeExists) return prev;

      return {
        ...prev,
        edges: [...(prev.edges || []), {
          id: `edge-${Date.now()}`,
          source: sourceId,
          target: targetId,
          label: ''
        }],
      };
    });
    setIsConnecting(false);
    setConnectFromNodeId(null);
  };

  const handleDeleteEdge = (edgeId) => {
    setFlow(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== edgeId),
    }));
  };

  const handleSave = async () => {
    try {
      if (id) {
        await base44.entities.Flow.update(id, flow);
      } else {
        const created = await base44.entities.Flow.create(flow);
        navigate(`/flows/${created.id}/edit`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
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
        setFlow(prev => ({
          ...prev,
          nodes: response.data.nodes,
          edges: response.data.edges,
        }));
        setShowAIGenerator(false);
        setAiPrompt('');
      } else {
        setAiError('Resposta inválida da IA. Tente novamente com uma descrição mais detalhada.');
      }
    } catch (error) {
      setAiError(`Erro: ${error.message || 'Não foi possível gerar o fluxo. Tente novamente.'}`);
      console.error('Erro ao gerar com IA:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const selectedNode = flow.nodes?.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Block Palette */}
      <div className="w-64 flex flex-col border-r border-border">
        <BlockPaletteV2 />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border bg-card shadow-sm">
          <div className="flex-1 max-w-md">
            <Input
              value={flow.name}
              onChange={(e) => setFlow(prev => ({ ...prev, name: e.target.value }))}
              className="font-semibold text-base"
              placeholder="Nome do Fluxo"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{flow.nodes?.length || 0} blocos</span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowSimulator(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Testar
            </Button>

            <Button
              onClick={() => setShowAIGenerator(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Gerar IA
            </Button>

            <Button
              onClick={handleSave}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>

            <Button
              onClick={() => navigate('/flows')}
              variant="outline"
              size="sm"
            >
              ← Voltar
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 relative"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={handleAddBlock}
        >
          <ReactFlowProvider>
            <ReactFlowCanvas
              nodes={(flow.nodes || []).map(n => ({
                id: n.id,
                data: { ...n.data, label: n.label, type: n.type, emoji: blockEmojis[n.type] },
                position: n.position || { x: 0, y: 0 },
                type: 'flowBlock',
              }))}
              edges={flow.edges || []}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              selectedNodeId={selectedNodeId}
              onNodeSelect={setSelectedNodeId}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={handleDeleteEdge}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Right Sidebar - Dynamic Properties Panel */}
      <div className="flex flex-col border-l border-border h-full bg-card">
        {selectedNodeId ? (
          <DynamicPropertiesPanel
            selectedNode={selectedNode}
            onUpdate={(updatedNode) => {
              setFlow(prev => ({
                ...prev,
                nodes: prev.nodes.map(n =>
                  n.id === selectedNodeId ? updatedNode : n
                ),
              }));
            }}
            onClose={() => setSelectedNodeId(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
            Selecione um bloco para editar
          </div>
        )}
      </div>

      {/* AI Generator Dialog */}
      {showAIGenerator && (
        <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Gerar Fluxo com IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Descreva seu fluxo</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Crie um fluxo de briefing para uma agência de marketing com perguntas sobre serviços, orçamento e timeline"
                  rows={5}
                  className="w-full p-3 border rounded-lg text-sm"
                  disabled={aiLoading}
                />
              </div>
              {aiError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {aiError}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setShowAIGenerator(false);
                    setAiError(null);
                  }}
                  variant="outline"
                  disabled={aiLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateWithAI}
                  className="gap-2"
                  disabled={aiLoading || !aiPrompt.trim()}
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Flow Simulator */}
      {showSimulator && (
        <FlowSimulator
          nodes={flow.nodes}
          edges={flow.edges}
          onClose={() => setShowSimulator(false)}
          highlightedNodeId={highlightedNodeId}
          onNodeHighlight={setHighlightedNodeId}
        />
      )}
    </div>
  );
}