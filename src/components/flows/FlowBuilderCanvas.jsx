import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FlowBuilderNode from './FlowBuilderNode';

const nodeTypes = { flowBlock: FlowBuilderNode };

const BLOCK_COLORS = {
  start: '#22c55e',
  question: '#6366f1',
  text: '#3b82f6',
  text_input: '#6366f1',
  multiple_choice: '#8b5cf6',
  single_choice: '#a855f7',
  file_upload: '#0ea5e9',
  condition: '#f59e0b',
  split: '#f97316',
  wait: '#94a3b8',
  end: '#ef4444',
  create_project: '#f59e0b',
  create_client: '#f59e0b',
  create_task: '#f59e0b',
  send_email: '#ec4899',
  send_whatsapp: '#10b981',
  notification: '#06b6d4',
  ai_ask: '#10b981',
  ai_analyze: '#10b981',
};

function toRFNodes(nodes) {
  return (nodes || []).map(n => ({
    id: n.id,
    type: 'flowBlock',
    position: n.position || { x: 100, y: 100 },
    data: {
      ...n,
      color: BLOCK_COLORS[n.type] || '#6366f1',
    },
    selected: false,
  }));
}

function fromRFNodes(rfNodes, originalNodes) {
  return rfNodes.map(rn => {
    const orig = (originalNodes || []).find(n => n.id === rn.id) || {};
    return { ...orig, id: rn.id, position: rn.position };
  });
}

export default function FlowBuilderCanvas({
  nodes: externalNodes,
  edges: externalEdges,
  onNodesChange: propagateNodes,
  onEdgesChange: propagateEdges,
  selectedNodeId,
  onNodeSelect,
}) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(toRFNodes(externalNodes));
  const [edges, setEdges, handleEdgesChange] = useEdgesState(externalEdges || []);
  const { fitView, screenToFlowPosition } = useReactFlow();

  useEffect(() => { setNodes(toRFNodes(externalNodes)); }, [externalNodes]);
  useEffect(() => { setEdges(externalEdges || []); }, [externalEdges]);

  const onConnect = useCallback((connection) => {
    const edge = { id: `e-${Date.now()}`, ...connection, style: { stroke: '#6366f1', strokeWidth: 2 } };
    setEdges(eds => {
      const next = addEdge(edge, eds);
      propagateEdges(next);
      return next;
    });
  }, [setEdges, propagateEdges]);

  const onNodesChangeHandler = useCallback((changes) => {
    handleNodesChange(changes);
    setNodes(nds => {
      propagateNodes(fromRFNodes(nds, externalNodes));
      return nds;
    });
  }, [handleNodesChange, setNodes, propagateNodes, externalNodes]);

  const onEdgesChangeHandler = useCallback((changes) => {
    handleEdgesChange(changes);
    setEdges(eds => {
      propagateEdges(eds);
      return eds;
    });
  }, [handleEdgesChange, setEdges, propagateEdges]);

  const onNodeClick = useCallback((_, node) => {
    onNodeSelect(node.id);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType');
    const blockLabel = e.dataTransfer.getData('blockLabel');
    if (!blockType) return;

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode = {
      id: `node-${Date.now()}`,
      type: blockType,
      label: blockLabel,
      position,
      data: { label: blockLabel },
      config: {},
    };

    const rfNode = {
      id: newNode.id,
      type: 'flowBlock',
      position,
      data: { ...newNode, color: BLOCK_COLORS[blockType] || '#6366f1' },
    };

    setNodes(nds => {
      const next = [...nds, rfNode];
      propagateNodes(fromRFNodes(next, [...(externalNodes || []), newNode]));
      return next;
    });
  }, [screenToFlowPosition, setNodes, propagateNodes, externalNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChangeHandler}
      onEdgesChange={onEdgesChangeHandler}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      nodeTypes={nodeTypes}
      fitView
      deleteKeyCode="Delete"
      style={{ background: '#0f1117' }}
      defaultEdgeOptions={{ style: { stroke: '#6366f1', strokeWidth: 2 }, animated: true }}
    >
      <Background color="#ffffff08" gap={24} variant={BackgroundVariant.Dots} />
      <Controls
        style={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
        className="[&>button]:bg-transparent [&>button]:text-white/60 [&>button:hover]:bg-white/10 [&>button]:border-white/10"
      />
      <MiniMap
        style={{ background: '#13151f', border: '1px solid rgba(255,255,255,0.08)' }}
        nodeColor={n => n.data?.color || '#6366f1'}
        maskColor="rgba(0,0,0,0.6)"
      />
    </ReactFlow>
  );
}