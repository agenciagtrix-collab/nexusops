import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Save, Play, Share2, Settings, Plus, Wand2, FileText, Trash2,
} from 'lucide-react';
import FlowCanvas from '@/components/flows/FlowCanvas';
import BlockPalette from '@/components/flows/BlockPalette';
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
  const [aiPrompt, setAiPrompt] = useState('');

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

  const handleNodeDrag = (nodeId, newPos) => {
    setFlow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, position: newPos } : n
      ),
    }));
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

    try {
      const response = await base44.functions.invoke('generateFlowWithAI', {
        prompt: aiPrompt,
        flowType: flow.type,
      });

      if (response.data?.nodes && response.data?.edges) {
        setFlow(prev => ({
          ...prev,
          ...response.data,
          nodes: response.data.nodes,
          edges: response.data.edges,
        }));
      }

      setShowAIGenerator(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Erro ao gerar com IA:', error);
    }
  };

  const selectedNode = flow.nodes?.find(n => n.id === selectedNodeId);

  return (
    <div className="flex h-screen bg-background">
      {/* Palette */}
      <div className="w-64 flex flex-col border-r border-border">
        <BlockPalette onBlockAdd={handleAddBlock} />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card">
          <div className="flex-1">
            <Input
              value={flow.name}
              onChange={(e) => setFlow(prev => ({ ...prev, name: e.target.value }))}
              className="font-semibold text-lg"
              placeholder="Nome do Fluxo"
            />
          </div>

          <Button
            onClick={() => setShowAIGenerator(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Gerar com IA
          </Button>

          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <Button
            onClick={handleSave}
            size="sm"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </Button>

          <Button
            onClick={() => navigate('/flows')}
            variant="outline"
            size="sm"
          >
            Voltar
          </Button>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 relative"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleAddBlock}
        >
          <FlowCanvas
            nodes={flow.nodes}
            edges={flow.edges}
            onNodeSelect={setSelectedNodeId}
            onNodeDrag={handleNodeDrag}
          />
        </div>
      </div>

      {/* Node Inspector */}
      {selectedNode && (
        <div className="w-72 border-l border-border bg-card overflow-y-auto">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedNode.label}</h3>
                <p className="text-xs text-muted-foreground">{selectedNode.type}</p>
              </div>
              <Button
                onClick={handleDeleteNode}
                variant="ghost"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Input
              placeholder="Rótulo do bloco"
              value={selectedNode.label}
              onChange={(e) =>
                setFlow(prev => ({
                  ...prev,
                  nodes: prev.nodes.map(n =>
                    n.id === selectedNodeId ? { ...n, label: e.target.value } : n
                  ),
                }))
              }
            />
          </div>

          <div className="p-4 space-y-4">
            {/* Type-specific config */}
            {['email', 'phone', 'text', 'textarea'].includes(selectedNode.type) && (
              <div>
                <label className="text-xs font-medium">Placeholder</label>
                <Input
                  placeholder="Dica para o usuário"
                  value={selectedNode.data?.placeholder || ''}
                  onChange={(e) =>
                    setFlow(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n =>
                        n.id === selectedNodeId
                          ? { ...n, data: { ...n.data, placeholder: e.target.value } }
                          : n
                      ),
                    }))
                  }
                  className="mt-1 text-sm"
                />
              </div>
            )}

            {['single_choice', 'multiple_choice', 'dropdown'].includes(selectedNode.type) && (
              <div>
                <label className="text-xs font-medium">Opções (uma por linha)</label>
                <textarea
                  value={selectedNode.data?.options?.join('\n') || ''}
                  onChange={(e) =>
                    setFlow(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n =>
                        n.id === selectedNodeId
                          ? { ...n, data: { ...n.data, options: e.target.value.split('\n') } }
                          : n
                      ),
                    }))
                  }
                  rows={3}
                  className="w-full p-2 text-sm border rounded-lg"
                  placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedNode.data?.required || false}
                onChange={(e) =>
                  setFlow(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n =>
                      n.id === selectedNodeId
                        ? { ...n, data: { ...n.data, required: e.target.checked } }
                        : n
                    ),
                  }))
                }
              />
              Campo Obrigatório
            </label>
          </div>
        </div>
      )}

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
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowAIGenerator(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateWithAI}
                  className="gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Gerar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}