import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Maximize2, MousePointer2, Move, Plus, Trash2 } from 'lucide-react';
import FormVisualNode from './FormVisualNode';

const nodeTypes = { formVisual: FormVisualNode };

function toReactFlowNode(block, selectedBlockId) {
  return {
    id: block.id,
    type: 'formVisual',
    position: block.position || { x: 0, y: 0 },
    selected: block.id === selectedBlockId,
    data: { block },
  };
}

export default function FormVisualCanvas({ blocks, edges, selectedBlockId, onBlocksChange, onEdgesChange, onSelectBlock, onAddBlock, onDeleteSelected }) {
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const nodes = useMemo(() => blocks.map(block => toReactFlowNode(block, selectedBlockId)), [blocks, selectedBlockId]);

  const handleNodesChange = useCallback((changes) => {
    const nextNodes = applyNodeChanges(changes, nodes);
    onBlocksChange(blocks.map(block => {
      const next = nextNodes.find(node => node.id === block.id);
      return next ? { ...block, position: next.position } : block;
    }));
  }, [blocks, nodes, onBlocksChange]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(applyEdgeChanges(changes, edges));
  }, [edges, onEdgesChange]);

  const handleConnect = useCallback((connection) => {
    const existing = edges.some(edge => edge.source === connection.source && edge.target === connection.target);
    if (existing) return;
    onEdgesChange(addEdge({ ...connection, id: `edge-${Date.now()}`, type: 'smoothstep', animated: false }, edges));
  }, [edges, onEdgesChange]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const rawBlock = event.dataTransfer.getData('application/x-form-block');
    if (!rawBlock) return;
    const template = JSON.parse(rawBlock);
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    onAddBlock(template, position);
  }, [onAddBlock, screenToFlowPosition]);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#0b1120]"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={(_, node) => onSelectBlock(node.id)}
        onPaneClick={() => onSelectBlock(null)}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode={['Backspace', 'Delete']}
        className="form-visual-flow"
      >
        <Background color="rgba(148,163,184,0.22)" gap={18} size={1} />
        <Controls className="!border !border-white/10 !bg-slate-950/90 !shadow-xl [&_button]:!border-white/10 [&_button]:!bg-slate-950 [&_button]:!text-slate-200" />
        <MiniMap
          pannable
          zoomable
          className="!bottom-6 !left-6 !right-auto !h-32 !w-56 !rounded-xl !border !border-white/10 !bg-slate-950/90 !shadow-2xl"
          nodeColor={(node) => {
            const category = node.data?.block?.category;
            if (category === 'start') return '#22c55e';
            if (category === 'logic') return '#3b82f6';
            if (category === 'action') return '#f59e0b';
            if (category === 'ai') return '#d946ef';
            if (category === 'result') return '#f43f5e';
            return '#8b5cf6';
          }}
        />
      </ReactFlow>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_28%)]" />

      <div className="absolute left-1/2 top-6 z-10 flex -translate-x-1/2 items-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/85 text-slate-200 shadow-2xl backdrop-blur">
        <button className="flex h-11 items-center gap-2 border-r border-white/10 px-4 text-sm text-violet-300">
          <MousePointer2 className="h-4 w-4" /> Editor
        </button>
        <button className="flex h-11 items-center gap-2 border-r border-white/10 px-4 text-sm text-slate-400">
          <Move className="h-4 w-4" /> Mover
        </button>
        <button onClick={() => zoomOut()} className="h-11 border-r border-white/10 px-4 text-lg text-slate-300 hover:bg-white/10">−</button>
        <button onClick={() => fitView({ padding: 0.25 })} className="flex h-11 items-center gap-2 border-r border-white/10 px-4 text-sm text-slate-300 hover:bg-white/10">
          <Maximize2 className="h-4 w-4" /> Ajustar
        </button>
        <button onClick={() => zoomIn()} className="h-11 px-4 text-lg text-slate-300 hover:bg-white/10">+</button>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
        <Button type="button" size="sm" variant="secondary" className="border border-white/10 bg-slate-950/90 text-slate-100 hover:bg-slate-900" onClick={onDeleteSelected} disabled={!selectedBlockId}>
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
        <Button type="button" size="sm" className="bg-violet-600 text-white hover:bg-violet-500" onClick={() => onAddBlock({ kind: 'short_text', typeLabel: 'Campo de Texto', label: 'Nova pergunta', icon: 'T', category: 'input', description: 'Resposta curta em texto' }, { x: 120, y: 120 })}>
          <Plus className="h-4 w-4" /> Pergunta
        </Button>
      </div>

      {isDraggingOver && (
        <div className="pointer-events-none absolute inset-6 z-20 rounded-2xl border-2 border-dashed border-violet-400/70 bg-violet-500/10" />
      )}
    </div>
  );
}
