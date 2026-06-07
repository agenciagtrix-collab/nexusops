import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import FormVisualBlockNode from './FormVisualBlockNode';

const nodeTypes = {
  formBlock: FormVisualBlockNode,
};

export default function FormVisualCanvas({
  nodes,
  edges,
  selectedNodeId,
  onChange,
  onDropBlock,
  onSelectNode,
}) {
  const flowNodes = useMemo(() => nodes.map(node => ({
    id: node.id,
    type: 'formBlock',
    position: node.position,
    selected: node.id === selectedNodeId,
    data: {
      ...node.data,
      type: node.type,
      label: node.label,
    },
  })), [nodes, selectedNodeId]);

  const flowEdges = useMemo(() => edges.map(edge => ({
    ...edge,
    animated: edge.animated ?? false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    labelStyle: { fill: '#cbd5e1', fontSize: 12 },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
  })), [edges]);

  const [internalNodes, setInternalNodes, handleNodesChange] = useNodesState(flowNodes);
  const [internalEdges, setInternalEdges, handleEdgesChange] = useEdgesState(flowEdges);

  React.useEffect(() => {
    setInternalNodes(flowNodes);
  }, [flowNodes, setInternalNodes]);

  React.useEffect(() => {
    setInternalEdges(flowEdges);
  }, [flowEdges, setInternalEdges]);

  const emitNodes = useCallback((nextFlowNodes) => {
    const nextNodes = nextFlowNodes.map(flowNode => {
      const sourceNode = nodes.find(node => node.id === flowNode.id);
      return {
        ...sourceNode,
        position: flowNode.position,
      };
    }).filter(Boolean);
    onChange({ nodes: nextNodes, edges });
  }, [edges, nodes, onChange]);

  const emitEdges = useCallback((nextFlowEdges) => {
    const nextEdges = nextFlowEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
    }));
    onChange({ nodes, edges: nextEdges });
  }, [nodes, onChange]);

  const onNodesChangeInternal = useCallback((changes) => {
    handleNodesChange(changes);
    setInternalNodes(current => {
      const next = current.map(node => {
        const change = changes.find(item => item.id === node.id && item.type === 'position' && item.position);
        return change ? { ...node, position: change.position } : node;
      }).filter(node => !changes.some(item => item.id === node.id && item.type === 'remove'));
      emitNodes(next);
      return next;
    });
  }, [emitNodes, handleNodesChange, setInternalNodes]);

  const onEdgesChangeInternal = useCallback((changes) => {
    handleEdgesChange(changes);
    setInternalEdges(current => {
      const next = current.filter(edge => !changes.some(item => item.id === edge.id && item.type === 'remove'));
      emitEdges(next);
      return next;
    });
  }, [emitEdges, handleEdgesChange, setInternalEdges]);

  const onConnect = useCallback((connection) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source,
      target: connection.target,
      label: '',
    };
    const nextEdges = addEdge(newEdge, edges);
    onChange({ nodes, edges: nextEdges });
  }, [edges, nodes, onChange]);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const blockType = event.dataTransfer.getData('formBlockType');
    if (!blockType) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    onDropBlock(blockType, {
      x: event.clientX - bounds.left - 110,
      y: event.clientY - bounds.top - 40,
    });
  }, [onDropBlock]);

  return (
    <div
      className="h-full w-full bg-slate-950"
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
    >
      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onNodeClick={(event, node) => {
          event.stopPropagation();
          onSelectNode(node.id);
        }}
        onPaneClick={() => onSelectNode(null)}
        fitView
        minZoom={0.35}
        maxZoom={1.8}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#334155" gap={18} size={1} />
        <Controls className="!border-slate-800 !bg-slate-900 !text-slate-100" />
        <MiniMap
          className="!border !border-slate-800 !bg-slate-900"
          nodeColor="#6d5dfc"
          maskColor="rgba(2, 6, 23, 0.65)"
        />
      </ReactFlow>
    </div>
  );
}
