import React, { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FlowBlockNode from './FlowBlockNode';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const nodeTypes = {
  flowBlock: FlowBlockNode,
};

export default function ReactFlowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  selectedNodeId,
  onNodeSelect,
  onDeleteNode,
  onDeleteEdge,
}) {
  const [nodes, setNodes, onNodesChangeFn] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeFn] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const canvasRef = useRef(null);

  // Sync external changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChangeFn(changes);
      onNodesChange(changes);
    },
    [onNodesChangeFn, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeFn(changes);
      onEdgesChange(changes);
    },
    [onEdgesChangeFn, onEdgesChange]
  );

  const handleConnect = useCallback(
    (connection) => {
      const newEdge = {
        id: `edge-${Date.now()}`,
        source: connection.source,
        target: connection.target,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      onEdgesChange([{ type: 'add', item: newEdge }]);
    },
    [setEdges, onEdgesChange]
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      event.stopPropagation();
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      onDeleteNode();
    }
  }, [selectedNodeId, onDeleteNode]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode="Delete"
      >
        <Background color="#ccc" gap={16} />
        <Controls showInteractive={true} />
      </ReactFlow>

      {/* Custom Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 flex gap-1 border border-border">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleFitView}
            title="Fit view"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px bg-border" />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDeleteSelected}
            disabled={!selectedNodeId}
            title="Delete selected node"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Info */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-white/80 dark:bg-slate-800/80 px-3 py-2 rounded-lg">
        <div>Nodes: {nodes.length}</div>
        <div>Connections: {edges.length}</div>
      </div>
    </div>
  );
}