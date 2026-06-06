import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function FlowSimulator({ nodes, edges, onClose, highlightedNodeId, onNodeHighlight }) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [responses, setResponses] = useState({});
  const [executedNodes, setExecutedNodes] = useState([]);
  const [output, setOutput] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const MAX_ITERATIONS = 100;
  const executedNodesRef = useRef([]);

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {});

  const edgeMap = edges.reduce((acc, edge) => {
    if (!acc[edge.source]) acc[edge.source] = [];
    acc[edge.source].push(edge);
    return acc;
  }, {});

  const startNode = nodes.find(n => n.type === 'start');

  const handleStart = () => {
    setIsRunning(true);
    setCurrentNodeId(startNode?.id);
    executedNodesRef.current = [startNode?.id];
    setExecutedNodes([startNode?.id]);
    setResponses({});
    setOutput('Fluxo iniciado...\n');
    onNodeHighlight(startNode?.id);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentNodeId(null);
    executedNodesRef.current = [];
    setExecutedNodes([]);
    setResponses({});
    setOutput('');
    onNodeHighlight(null);
  };

  const handleNext = () => {
    if (!currentNodeId) return;

    // Check for infinite loops
    if (executedNodesRef.current.length >= MAX_ITERATIONS) {
      setOutput(prev => prev + '\n❌ Erro: Número máximo de iterações atingido. Possível loop infinito detectado.');
      setIsRunning(false);
      return;
    }

    const currentNode = nodeMap[currentNodeId];
    const nextEdges = edgeMap[currentNodeId] || [];

    // Get next node
    let nextNodeId = null;
    if (currentNode.type === 'condition') {
      // Simple condition logic
      const value = responses[currentNodeId] || currentInput;
      nextNodeId = nextEdges.length > 0 ? nextEdges[0].target : null;
    } else {
      nextNodeId = nextEdges.length > 0 ? nextEdges[0].target : null;
    }

    if (nextNodeId) {
      const nextNode = nodeMap[nextNodeId];
      setCurrentNodeId(nextNodeId);
      executedNodesRef.current.push(nextNodeId);
      setExecutedNodes(prev => [...prev, nextNodeId]);
      
      // Update output
      setOutput(prev => {
        let newOutput = prev;
        if (nextNode.type === 'show_result') {
          newOutput += `\n✓ Resultado: ${nextNode.data?.message || nextNode.label}`;
        } else if (nextNode.type === 'end') {
          newOutput += `\n✓ Fluxo finalizado`;
        } else {
          newOutput += `\n→ ${nextNode.label}`;
        }
        return newOutput;
      });

      // Store response if input was provided
      if (currentInput && currentNode.type.includes('question') || currentNode.type === 'text') {
        setResponses(prev => ({
          ...prev,
          [currentNodeId]: currentInput
        }));
        setCurrentInput('');
      }

      onNodeHighlight(nextNodeId);

      // Auto-proceed for non-input nodes
      if (!['text', 'question', 'email', 'phone', 'number', 'date'].includes(nextNode.type)) {
        setTimeout(() => handleNext(), 500);
      }
    } else {
      setOutput(prev => prev + '\n✓ Fluxo finalizado');
      setIsRunning(false);
    }
  };

  const handleSubmitInput = () => {
    if (currentInput.trim()) {
      handleNext();
    }
  };

  const currentNode = nodeMap[currentNodeId];
  const isInputNode = currentNode && ['text', 'question', 'email', 'phone', 'number', 'date', 'single_choice', 'multiple_choice'].includes(currentNode.type);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Simulador de Fluxo</h2>
            <p className="text-xs text-muted-foreground">Teste o fluxo em tempo real</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          {/* Current Block Info */}
          {currentNode && (
            <div className="mb-4 p-3 bg-accent rounded-lg">
              <div className="text-xs text-muted-foreground">Bloco atual</div>
              <div className="font-semibold">{currentNode.label}</div>
              {currentNode.data?.question && (
                <div className="text-sm mt-2">{currentNode.data.question}</div>
              )}
            </div>
          )}

          {/* Output */}
          <div className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-4 overflow-y-auto font-mono text-sm mb-4 border border-border">
            {output || 'Clique em "Iniciar" para começar...'}
          </div>

          {/* Input for questions */}
          {isInputNode && isRunning && (
            <div className="space-y-2 mb-4">
              {currentNode.type === 'single_choice' || currentNode.type === 'multiple_choice' ? (
                <div className="space-y-2">
                  {currentNode.data?.options?.map((option, idx) => (
                    <Button
                      key={idx}
                      onClick={() => {
                        setCurrentInput(option);
                        setTimeout(() => handleNext(), 300);
                      }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitInput()}
                    placeholder={currentNode.data?.placeholder || 'Digite sua resposta...'}
                    className="flex-1"
                  />
                  <Button onClick={handleSubmitInput} className="gap-1">
                    <ChevronRight className="w-4 h-4" />
                    Enviar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {!isRunning ? (
              <Button onClick={handleStart} className="gap-2 flex-1">
                <Play className="w-4 h-4" />
                Iniciar Simulação
              </Button>
            ) : (
              <>
                <Button onClick={() => setIsRunning(false)} variant="outline" className="gap-2">
                  <Pause className="w-4 h-4" />
                  Pausar
                </Button>
                {!isInputNode && (
                  <Button onClick={handleNext} className="gap-2 flex-1">
                    <ChevronRight className="w-4 h-4" />
                    Próximo Passo
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Resetar
            </Button>
          </div>
        </div>

        {/* Footer - Info */}
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex gap-4">
          <div>Blocos executados: {executedNodes.length}</div>
          <div>Blocos totais: {nodes.length}</div>
        </div>
      </Card>
    </div>
  );
}